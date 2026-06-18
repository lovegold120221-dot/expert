"""One bidirectional Gemini Live session bridging a speaker to a target language.

We talk to Gemini Live via a raw WebSocket against the v1beta BidiGenerateContent
endpoint rather than via google-genai's `client.aio.live.connect()`. The v1beta
API expects `translationConfig` nested under `generationConfig` (renamed from the
EAP-era `streamingTranslationConfig` at the public launch). Bypassing the SDK lets
us control the exact JSON shape; python-genai >= 2.8.0 now exposes a matching
`TranslationConfig` if we later choose to adopt the SDK.
"""

from __future__ import annotations

import asyncio
import base64
import contextlib
import json
import logging
import random
import re

import websockets
from livekit import rtc

from audio import iter_pcm_for_gemini, make_audio_source, push_pcm_to_source
from config import (
    AVAILABLE_VOICES,
    CONTENT_TYPE_CINEMATIC_FAITHFUL,
    CONTENT_TYPE_MOVIE,
    GEMINI_INPUT_SAMPLE_RATE,
    GEMINI_MAX_FAILURES_BEFORE_LONG_BACKOFF,
    GEMINI_MODEL,
    GEMINI_RECONNECT_BACKOFF_SEC,
    INPUT_RMS_LOG_EVERY_FRAMES,
    INPUT_RMS_QUIET_FRAMES,
    INPUT_RMS_QUIET_THRESHOLD,
    MAX_HISTORY_SEGMENTS,
    MAX_HISTORY_WORDS,
    NATIVE_LANG,
    ORBIT_VOICE_ECHO_ALLOWED,
    ORBIT_VOICE_ECHO_ASSIGNED,
    ORBIT_VOICE_ECHO_CLONE,
    ORBIT_VOICE_ECHO_DEFAULT,
    ORBIT_VOICE_ECHO_OFF,
    PARTICIPANT_LANG_ATTR,
    WS_SEND_QUEUE_DROP_BATCH,
    WS_SEND_QUEUE_HIGH_WATER,
)
from lexicon import get_lexicon_instructions

logger = logging.getLogger("translator.session")


GEMINI_WS_URL = (
    "wss://generativelanguage.googleapis.com/ws/"
    "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
)

# --- Structured transcription markers ---
# Gemini wraps each transcription segment in these markers carrying JSON metadata.
SEGMENT_RE = re.compile(r"\[SEGMENT\](.*?)\[/SEGMENT\]", re.DOTALL)
OUTPUT_RE = re.compile(r"\[OUTPUT\](.*?)\[/OUTPUT\]", re.DOTALL)


def _new_conversation_id() -> str:
    """Generate a unique conversation ID for this session."""
    import uuid

    return uuid.uuid4().hex[:12]


def _normalize_voice_echo(value: str | None) -> str:
    """Coerce a participant attribute value to a known voice-echo mode.

    Unknown / missing values fall back to ORBIT_VOICE_ECHO_DEFAULT (clone).
    """
    if not value:
        return ORBIT_VOICE_ECHO_DEFAULT
    if value in ORBIT_VOICE_ECHO_ALLOWED:
        return value
    logger.warning("unknown voice-echo value %r, falling back to %s", value, ORBIT_VOICE_ECHO_DEFAULT)
    return ORBIT_VOICE_ECHO_DEFAULT


class GeminiSession:
    """Bridges a single speaker's mic into a single target-language translation track.

    Lifecycle:
      - `start()` publishes the translator track and starts the WS-pump loop.
      - `aclose()` tears everything down. Idempotent.
      - On WebSocket errors, reconnects with exponential backoff. After
        `GEMINI_MAX_FAILURES_BEFORE_LONG_BACKOFF` consecutive failures it logs
        at ERROR level and keeps retrying with the longest backoff.

    Voice-echo strategy:
      - `ORBIT_VOICE_ECHO_CLONE` (default) - the system prompt explicitly
        demands preservation of the source speaker's pitch, timbre, vocal
        effort, breathiness, emotion, and accent. The translation track sounds
        like the original speaker talking in the target language.
      - `ORBIT_VOICE_ECHO_ASSIGNED` - pick a voice from the 30-voice pool by
        speaker appearance order. Good for movie-dubbing mode.
      - `ORBIT_VOICE_ECHO_OFF` - pick a stable voice per speaker but don't try
        to match the source. Useful for accessibility / clarity mode.

    `echoTargetLanguage=True` is always on: it's the API flag that makes the
    model respect prosody cues in the target language. Without it the model
    defaults to a flat interpreter voice, which is exactly what we don't want.
    """

    @staticmethod
    def _base_lang_code(code: str) -> str:
        """Strip the region suffix from a locale code for Gemini's API.

        Gemini's ``translationConfig.targetLanguageCode`` expects ISO 639-1 base
        codes (e.g. ``nl``, ``fr``, ``pt``).  Regional variants like ``nl-BE`` or
        ``pt-BR`` are sent to the LLM via a dialect instruction in the system
        prompt instead.
        """
        return code.split("-")[0]

    def _voice_pool_text(self) -> str:
        """Format the available voice pool for injection into the system instruction."""
        lines: list[str] = []
        for i, (name, desc) in enumerate(self._available_voices):
            label = f"Voice {i + 1} (\u201c{name}\u201d)"
            lines.append(f"  {label}: {desc}")
        lines.append(
            "  Assign these in order of speaker appearance (Voice 1 to "
            "first detected speaker, Voice 2 to second, etc.). If there "
            "are more speakers than voices, wrap around from the start."
        )
        return "\n".join(lines)

    def _build_speed_block(self) -> str:
        """Analyze recent source segments and return dynamic speed-matching instructions.

        Uses speech_style, emotion, tone, and pause markers from rolling segment
        history to infer the speaker's current pacing characteristics and instructs
        Gemini to match that pace in its translated output. Returns a static fallback
        when no segment data is available.
        """
        pace_mapping = {
            "fast": (
                "Speak the translation QUICKLY and energetically — match the rapid delivery."
            ),
            "rapid": (
                "Deliver the translation at a FAST, urgent pace. No unnecessary pauses."
            ),
            "rushed": (
                "The speaker is speaking RUSHED and hurriedly. Match this urgency exactly."
            ),
            "slow": (
                "Speak the translation SLOWLY with deliberate pacing. Let each word land."
            ),
            "measured": (
                "Deliver the translation at a MEASURED, controlled pace — pause between ideas."
            ),
            "casual": (
                "Use natural, relaxed delivery — like everyday speech, not formal reading."
            ),
            "formal": (
                "Maintain a FORMAL, precise speaking style with clear articulation."
            ),
            "hesitant": (
                "The speaker PAUSES frequently and speaks hesitantly. Include those pauses "
                "and self-corrections naturally."
            ),
            "energetic": (
                "Deliver with HIGH ENERGY — match the animated, dynamic delivery."
            ),
        }

        emotion_pace = {
            "angry": "Deliver FASTER and LOUDER than normal — match the anger.",
            "excited": (
                "Match the excited, animated delivery with higher energy and speed."
            ),
            "sad": (
                "Deliver SLOWLY and softly — sadness requires a slower, weighted pace."
            ),
            "surprised": (
                "React with a sudden, sharp delivery — match the surprise."
            ),
            "fearful": (
                "Speak with tension and urgency — the fear should come through in speed."
            ),
        }

        if not self._segment_history:
            return (
                "\n\nSPEECH PACE MATCHING:\n"
                "Match the original speaker's speaking pace in your translation.\n"
                "If they speak quickly, deliver the translation at that same speed.\n"
                "If they pause, breathe, or speak hesitantly, include those same pauses\n"
                "and breathing patterns in your output. Use the echoTargetLanguage flag\n"
                "to preserve natural prosody and rhythm."
            )

        # Gather recent source segments (last 10 for broader pattern detection)
        recent_source = [
            seg
            for seg in reversed(self._segment_history[-10 :])
            if seg.get("kind") == "source"
        ]

        if not recent_source:
            return self._build_speed_block()  # fallback above

        # Analyze speech_style patterns across recent segments
        style_counts: dict[str, int] = {}
        for seg in recent_source:
            style = seg.get("speech_style", "")
            if style:
                style_counts[style] = style_counts.get(style, 0) + 1

        dominant_style = max(style_counts, key=style_counts.get) if style_counts else ""

        # Analyze emotional patterns across recent source segments
        emotions: list[str] = [seg.get("emotion", "") for seg in recent_source if seg.get("emotion")]

        lines: list[str] = ["\nSPEECH PACE MATCHING FOR THIS SESSION:"]

        # Speed/style instructions from speech_style
        if dominant_style in pace_mapping:
            count = style_counts[dominant_style]
            lines.append(f"  Dominant speech style: {dominant_style} ({count}x).")
            lines.append(f"  -> {pace_mapping[dominant_style]}")

        # Add pause/pacing hints from text analysis of recent segments
        pause_count = sum(
            seg.get("text", "").count("[pause]") + seg.get("text", "").count("[breath]")
            for seg in recent_source
        )
        if pause_count > 0:
            lines.append(
                f"  The speaker uses {pause_count} [pause]/[breath] markers recently."
            )
            lines.append(
                "  -> Include equivalent pauses and breaths in your translation output."
            )

        # Add overlap/urgency signal
        overlaps = sum(1 for seg in recent_source if seg.get("overlap_status") == "overlapping")
        if overlaps > 0:
            lines.append(
                "  Multiple speakers are talking simultaneously — the speaker is trying to "
                "get their point across urgently. Match that urgency."
            )

        # Add emotional intensity as a pacing signal
        if emotions:
            from collections import Counter
            dominant_emotion = Counter(emotions).most_common(1)[0][0]
            if dominant_emotion in emotion_pace:
                lines.append(f"  Detected emotion: {dominant_emotion}.")
                lines.append(f"  -> {emotion_pace[dominant_emotion]}")

        # Always reinforce echoTargetLanguage prosody preservation
        lines.append(
            "  IMPORTANT: Use the echoTargetLanguage feature to preserve natural prosody.\n"
            "  Your translated speech should sound like it comes from a native speaker\n"
            "  delivering with the same rhythm and energy as the original."
        )

        return "\n".join(lines)

    def __init__(
        self,
        *,
        room: rtc.Room,
        speaker_identity: str,
        speaker_track: rtc.RemoteAudioTrack,
        track_source: str,
        target_lang: str,
        gemini_api_key: str,
        glossary: list[dict[str, str]] | None = None,
        content_type: str = "normal",
        available_voices: list[tuple[str, str]] | None = None,
        voice_echo: str = ORBIT_VOICE_ECHO_DEFAULT,
    ) -> None:
        self._room = room
        self._speaker_identity = speaker_identity
        self._speaker_track = speaker_track
        self._track_source = track_source
        self._target_lang = target_lang
        self._gemini_api_key = gemini_api_key
        self._glossary = glossary or []
        self._content_type = content_type
        self._available_voices = available_voices or AVAILABLE_VOICES[:4]
        self._voice_echo = _normalize_voice_echo(voice_echo)
        # Accumulated segments for cinematic_faithful structured JSON output.
        self._cinematic_segments: list[dict] = []
        self._voice_casting_map: dict[str, dict] = {}

        participant = self._room.remote_participants.get(self._speaker_identity)
        source_lang = (
            (participant.attributes or {}).get(PARTICIPANT_LANG_ATTR)
            if participant
            else None
        )
        self._source_lang = None if source_lang == NATIVE_LANG else source_lang

        self._audio_source = make_audio_source()
        self._local_track: rtc.LocalAudioTrack | None = None
        self._track_sid: str | None = None
        self._consecutive_failures = 0
        self._tasks: list[asyncio.Task] = []
        self._closed = asyncio.Event()
        # Conversation ID for correlating transcription/translation segments.
        self._conversation_id: str = _new_conversation_id()
        # Rolling structured segment memory: list of segment dicts.
        # Each segment carries: speaker_id, speaker_label, text, language,
        # confidence, tone, emotion, speech_style, overlap_status, etc.
        self._segment_history: list[dict] = []
        # Track active speakers for continuity.
        self._active_speakers: dict[str, str] = {}  # speaker_label -> speaker_id
        self._speaker_counter: int = 0
        # Accumulated segments for structured JSON publishing at turn end.
        self._pending_segments: list[dict] = []
        # Robustness: in-flight send count (backpressure signal) and RMS stats
        # for quiet-speaker diagnostics.
        self._ws_inflight: int = 0
        self._ws_dropped: int = 0
        self._frames_sent: int = 0
        self._rms_window_sum: float = 0.0
        self._rms_window_n: int = 0
        self._quiet_streak: int = 0
        self._quiet_warned: bool = False

    # --- Public API ---------------------------------------------------------

    async def start(self) -> None:
        """Publish the translator track and start the connect-and-pump loop."""
        track_name = (
            f"tx:{self._speaker_identity}:{self._track_source}:{self._target_lang}"
        )
        self._local_track = rtc.LocalAudioTrack.create_audio_track(
            track_name, self._audio_source
        )
        publish_opts = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)

        pub = await self._room.local_participant.publish_track(
            self._local_track, publish_opts
        )
        self._track_sid = pub.sid

        # Track-level attributes aren't yet exposed in this version of the
        # livekit Python/JS SDKs, so routing is keyed off the track NAME
        # ("tx:<speaker>:<lang>") which the frontend parses. See
        # src/app/session/[id]/room/useTranslationRouting.ts.

        logger.info(
            "started translator track sid=%s name=%s for %s -> %s (voice_echo=%s)",
            self._track_sid,
            track_name,
            self._speaker_identity,
            self._target_lang,
            self._voice_echo,
        )

        self._tasks.append(
            asyncio.create_task(self._run(), name=f"session/{track_name}")
        )

    async def aclose(self) -> None:
        if self._closed.is_set():
            return
        self._closed.set()

        for task in self._tasks:
            task.cancel()
        for task in self._tasks:
            try:  # noqa: SIM105
                await task
            except (asyncio.CancelledError, Exception):
                pass
        self._tasks.clear()

        # Unpublish and free the audio source.
        if self._track_sid:
            try:
                await self._room.local_participant.unpublish_track(self._track_sid)
            except Exception as exc:
                logger.debug("unpublish failed for %s: %s", self._track_sid, exc)

        with contextlib.suppress(Exception):
            await self._audio_source.aclose()

        logger.info(
            "closed translator session for %s -> %s (dropped_frames=%d)",
            self._speaker_identity,
            self._target_lang,
            self._ws_dropped,
        )

    # --- Internal pumps -----------------------------------------------------

    async def _run(self) -> None:
        """Outer loop: connect, pump, reconnect on failure.

        Robustness notes:
          - We never recreate `self._audio_source` on reconnect: it's the
            LiveKit-published track sink, and recreating it would flip
            listeners' subscribed tracks. Instead we just re-arm the WS and
            the input pump resumes seamlessly.
          - The `setup_complete` event is a *per-connect* flag, not a
            session-wide one. Each `_connect_and_pump` call creates its own
            event so the input pump only starts streaming audio once Gemini
            acknowledges the new connection.
          - If the speaker track is gone, the input iterator's `iter_pcm_for_gemini`
            yields no more frames, the input pump exits cleanly, and we stop
            the outer loop so the router can tear us down.
        """
        while not self._closed.is_set():
            try:
                await self._connect_and_pump()
                # If _connect_and_pump returns cleanly, the speaker track ended.
                # Don't reconnect; rely on the router to clean us up.
                return
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self._consecutive_failures += 1
                idx = min(
                    self._consecutive_failures - 1,
                    len(GEMINI_RECONNECT_BACKOFF_SEC) - 1,
                )
                delay = GEMINI_RECONNECT_BACKOFF_SEC[idx]
                delay += random.uniform(0, delay * 0.2)  # jitter
                if (
                    self._consecutive_failures
                    >= GEMINI_MAX_FAILURES_BEFORE_LONG_BACKOFF
                ):
                    logger.error(
                        "Eburon session %s -> %s failed %d times; will keep retrying with long backoff",
                        self._speaker_identity,
                        self._target_lang,
                        self._consecutive_failures,
                    )
                logger.warning(
                    "Eburon session error (%s -> %s) attempt #%d: %s; backing off %.2fs",
                    self._speaker_identity,
                    self._target_lang,
                    self._consecutive_failures,
                    exc,
                    delay,
                    exc_info=True,
                )
                # Reset in-flight counter so a fresh connect starts clean.
                self._ws_inflight = 0
                try:
                    await asyncio.wait_for(self._closed.wait(), timeout=delay)
                    return  # closed during backoff
                except asyncio.TimeoutError:
                    pass

    async def _connect_and_pump(self) -> None:
        """One Gemini WebSocket connect + bidirectional pump."""
        url = f"{GEMINI_WS_URL}?key={self._gemini_api_key}"
        # Max payload size: enough to cover ~1s of 48 kHz 16-bit PCM in base64.
        async with websockets.connect(
            url, max_size=2**22, ping_interval=20, ping_timeout=20
        ) as ws:
            payload = self._build_setup_payload()
            logger.info(
                "Eburon WS connecting: %s -> %s, model=%s, voice_echo=%s",
                self._speaker_identity,
                self._target_lang,
                payload["setup"]["model"],
                self._voice_echo,
            )
            await ws.send(json.dumps(payload))
            logger.info(
                "Eburon WS setup sent: %s -> %s, awaiting setupComplete",
                self._speaker_identity,
                self._target_lang,
            )

            # Per-connect setup_complete event. A reconnect gets a fresh
            # event so the new input pump doesn't race a stale event.
            setup_complete = asyncio.Event()
            send_task = asyncio.create_task(
                self._pump_input(ws, setup_complete), name="eburon-input"
            )
            recv_task = asyncio.create_task(
                self._pump_output(ws, setup_complete), name="eburon-output"
            )

            done, pending = await asyncio.wait(
                {send_task, recv_task},
                return_when=asyncio.FIRST_EXCEPTION,
            )
            for task in pending:
                task.cancel()
            for task in done:
                exc = task.exception()
                if exc is not None:
                    raise exc

    def _build_setup_payload(self) -> dict:
        """The first WS message — must match the v1beta BidiGenerateContent setup
        schema. Field names use the exact camelCase the API expects (verified
        against the previous Node implementation that worked in production).

        The voice-echo mode (clone / assigned / off) shapes the system
        instruction. ``translationConfig.echoTargetLanguage`` is always true —
        it's the API flag that gives the model permission to honor the source
        speaker's prosody in the target language, which is essential for
        "echo the original voice" behavior.
        """
        system_instruction_text = self._build_system_instruction()

        return {
            "setup": {
                "model": f"models/{GEMINI_MODEL}",
                "systemInstruction": {"parts": [{"text": system_instruction_text}]},
                "outputAudioTranscription": {},
                "inputAudioTranscription": {},
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "translationConfig": {
                        "targetLanguageCode": self._base_lang_code(self._target_lang),
                        "echoTargetLanguage": True,
                    },
                },
                "realtimeInputConfig": {
                    "automaticActivityDetection": {"disabled": False},
                },
            }
        }

    def _build_system_instruction(self) -> str:
        """Compose the systemInstruction text for the active voice-echo mode.

        Three variants:
          - clone: explicitly demands the model preserve the source speaker's
            voice identity (pitch, timbre, vocal effort, breathiness, accent,
            emotion). This is the "echo the original voice" behavior.
          - assigned: tells the model to pick a distinct voice from the pool
            by speaker appearance order (movie-dubbing / character-casting).
          - off: tells the model to pick a stable voice per speaker but not
            try to match the source. Useful for clarity / accessibility.
        """
        if self._voice_echo == ORBIT_VOICE_ECHO_CLONE:
            return self._build_clone_instruction()
        if self._voice_echo == ORBIT_VOICE_ECHO_ASSIGNED:
            return self._build_assigned_instruction()
        return self._build_off_instruction()

    def _build_clone_instruction(self) -> str:
        """Voice-echo=clone system instruction.

        This is the core "robust translation that echoes the original voice"
        block. The model is told, in plain language, exactly which acoustic
        properties to carry across the translation:

        * Pitch (F0 range, contour, register).
        * Timbre (the source speaker's unique vocal fingerprint).
        * Vocal effort (loudness, projection, breathiness).
        * Speech rate and rhythm (including pauses and hesitations).
        * Accent / dialect (the source speaker's regional / national markers).
        * Emotional tone (anger, joy, sarcasm, fear, calm, etc.).
        * Prosody (question vs statement, list intonation, contrastive stress).
        * Speaker identity (the listener should still recognize the speaker
          even though they're now hearing a different language).
        """
        parts: list[str] = [
            (
                "You are a professional real-time translator whose job is to "
                "ECHO THE ORIGINAL VOICE of the source speaker into the target "
                "language. The listener should be able to recognize that the "
                "person speaking in the target language is the SAME person who "
                "is speaking in the source language."
            ),
            "",
            "VOICE-PRESERVATION RULES (HARD REQUIREMENTS):",
            "1. PRESERVE pitch (F0) range, contour, and register. A high-pitched "
            "speaker must stay high-pitched; a deep, gravelly voice must stay "
            "deep and gravelly.",
            "2. PRESERVE timbre - the unique vocal fingerprint that lets people "
            "recognize a speaker across rooms. Do not smooth it out, do not "
            "brighten a dark voice, do not darken a bright voice.",
            "3. PRESERVE vocal effort: a whispered aside stays a whisper; a "
            "shouted warning stays shouted; a bored monotone stays flat; a "
            "breathy intimate voice stays breathy. Never 'normalize' the "
            "loudness to a neutral reading voice.",
            "4. PRESERVE speech rate and rhythm: a fast speaker keeps their "
            "tempo, including pauses, hesitations, and 'um/uh' fillers when "
            "they are characteristic of the speaker's style.",
            "5. PRESERVE accent markers - if the speaker has a recognizable "
            "regional / national accent in the source language, the target "
            "language should carry an equivalent regional flavor in its "
            "prosody, even if the grammar is fully localized. Native-speaker "
            "idioms of the target language win over the source accent, but the "
            "melody of the source must come through.",
            "6. PRESERVE emotional tone: anger stays angry, joy stays joyful, "
            "sarcasm stays sarcastic, fear stays fearful. The translated line "
            "must feel like the same emotional event.",
            "7. PRESERVE prosody: question intonation stays a question, lists "
            "stay lists, contrastive stress stays contrastive. Do not flatten "
            "intonation into a flat interpreter read.",
            "8. PRESERVE speaker identity across the entire session. If a "
            "speaker is the calm elderly mentor, they stay calm in every line. "
            "If a speaker is the excitable intern, they stay excitable.",
            "",
            "TRANSLATE BY MEANING, NOT WORDS:",
            "- Translate the IDEA and INTENT, never word-by-word. Source syntax is "
            "irrelevant — what matters is conveying the same meaning naturally in the "
            "target language.",
            "- If a direct rendering would sound unnatural or stilted, RESTRUCTURE it "
            "completely. Never sacrifice fluency for literal fidelity to the source "
            "sentence structure.",
            "- When an idiom/cultural reference has no equivalent, replace it with the "
            "target-language concept that evokes the SAME feeling — not one with a "
            "similar surface meaning.",
            "- Preserve humor, emotion, and intent at all costs. A joke should land; "
            "anger should feel angry. Sadness should feel sad.",
            "",
            "SPEECH PACE MATCHING:",
            "You receive the speaker's audio waveform directly — you can HEAR their speed "
            "and rhythm. Use this auditory signal, not the transcription text, to match "
            "pace exactly:",
            "- If they speak fast → your translation must be equally fast. No slower.",
            "- If they pause, breathe, or hesitate → include those pauses and breaths.",
            "- If they whisper or shout → match that volume and intensity exactly.",
            "- Never sound robotic, flat, or uniformly paced. Vary speed, pitch, and "
            "energy like a human.",
            "The echoTargetLanguage API flag already preserves prosody — your job is to "
            "honor it by delivering the translation with the SAME energy and rhythm as "
            "the source audio.",
            "",
            "VOICE POOL is intentionally NOT USED in clone mode. Do not pick a "
            "voice from the pool. The pool is only relevant for assigned and "
            "off modes. In clone mode the model simply speaks with the source "
            "speaker's voice, in the target language.",
            "",
            "If multiple speakers are present in the input audio, each one "
            "keeps their own distinct voice in the output - never merge two "
            "speakers into a single voice.",
            "",
            "PRACTICAL GUIDANCE:",
            "- Treat the input audio as the ground truth for HOW something is "
            "said (prosody, effort, emotion, accent). The target-language text "
            "is the ground truth for WHAT is said (vocabulary, idioms, "
            "grammar).",
            "- When the source speaker laughs, the translation should sound "
            "like laughter in the target language, with the same timing and "
            "intensity. The same applies to sighs, gasps, coughs, and the "
            "non-lexical 'mm-hmm' / 'uh-huh' backchannel.",
            "- When a colloquialism / idiom / pun does not survive literal "
            "translation, find the closest NATURAL equivalent in the target "
            "language so the line still lands, but keep the source speaker's "
            "tone.",
            "- When the source speaker is unconfident or hesitant, the target "
            "language version stays hesitant. When the source speaker is "
            "authoritative, the target stays authoritative.",
        ]

        instruction = "\n".join(parts)
        instruction += self._segment_history_block()
        instruction += self._build_speed_block()
        instruction += self._glossary_block()
        instruction += self._dialect_block()
        instruction += self._lexicon_block()
        instruction += self._content_type_block()
        return instruction

    def _build_assigned_instruction(self) -> str:
        """Voice-echo=assigned: movie-dubbing / character casting.

        We DO want voice variety across speakers (each character gets their
        own voice), but the per-speaker voice is picked from the pool rather
        than echoed from the source. echoTargetLanguage stays on so the
        chosen voice still respects the model's prosody continuity.
        """
        instruction = (
            "You are a professional real-time translator using a fixed voice "
            "pool for character casting. Match the source speaker's pace, pauses, "
            "emotion, and vocal energy exactly — not just tone but speed too — but "
            "use a stable voice from the pool below for each detected speaker. The "
            "first speaker uses the first voice, the second uses the second, etc. "
            "If there are more speakers than voices, wrap around from the start."
            "\n\n"
            "AVAILABLE VOICE POOL:\n" + self._voice_pool_text() + "\n"
        )
        instruction += self._segment_history_block()
        instruction += self._glossary_block()
        instruction += self._dialect_block()
        instruction += self._lexicon_block()
        instruction += self._content_type_block()
        return instruction

    def _build_off_instruction(self) -> str:
        """Voice-echo=off: stable voice per speaker, no echo of the source.

        Useful for accessibility / clarity mode where consistency matters
        more than fidelity to the source voice.
        """
        instruction = (
            "You are a professional real-time translator. Use a clear, "
            "neutral reading voice that prioritizes intelligibility. Do not "
            "try to match the source speaker's voice identity or accent. However, "
            "match their speaking speed and include their pauses so the translation "
            "stays connected to the original delivery. Pick a stable voice from "
            "the pool below for each detected speaker so the same person always "
            "sounds the same within a session."
            "\n\n"
            "AVAILABLE VOICE POOL:\n" + self._voice_pool_text() + "\n"
        )
        instruction += self._segment_history_block()
        instruction += self._glossary_block()
        instruction += self._dialect_block()
        instruction += self._lexicon_block()
        instruction += self._content_type_block()
        return instruction

    # --- Prompt building blocks --------------------------------------------

    def _segment_history_block(self) -> str:
        """Inject the rolling structured segment context."""
        if not self._segment_history:
            return ""
        total_words = 0
        context_parts: list[str] = []
        # Walk in reverse (newest first) until we hit the word cap.
        for seg in reversed(self._segment_history):
            seg_text = seg.get("text", "")
            words = len(seg_text.split())
            if total_words + words > MAX_HISTORY_WORDS:
                break
            total_words += words
            kind = seg.get("kind", "source")
            speaker = seg.get("speaker_label", "?")
            tone = seg.get("tone", "")
            emotion = seg.get("emotion", "")
            style = seg.get("speech_style", "")
            meta = (
                f" (tone={tone}, emotion={emotion}, style={style})"
                if tone or emotion or style
                else ""
            )
            prefix = "Speaker said" if kind == "source" else "Translation"
            context_parts.insert(
                0,
                f"  [{speaker}] {prefix}{meta}: {seg_text}",
            )
        if not context_parts:
            return ""
        return (
            "\n\nIMPORTANT CONTEXT from the conversation so far "
            "(with speaker, tone, emotion, and style metadata):\n"
            f"{chr(10).join(context_parts)}"
        )

    def _glossary_block(self) -> str:
        if not self._glossary:
            return ""
        glossary_lines = "\n".join(
            f'  - "{entry["source"]}" → "{entry["translation"]}"'
            for entry in self._glossary
            if entry.get("source") and entry.get("translation")
        )
        if not glossary_lines:
            return ""
        return (
            "\n\nCRITICAL: The speaker has defined the following custom "
            "translation glossary. You MUST use these specific translations "
            "whenever the original term appears, regardless of context:\n"
            f"{glossary_lines}"
        )

    def _dialect_block(self) -> str:
        dialect_map = {
            "nl-BE": (
                " The target language is Flemish (Belgian Dutch). Use Flemish "
                "pronunciation, intonation, and vocabulary \u2014 NOT standard "
                "Netherlands Dutch. Use 't is', 'gij/ge' instead of 'het is', 'jij/je', "
                "and other typical Flemish expressions. Sound like you are from "
                "Antwerp, Ghent, or Brussels, not from Amsterdam."
            ),
            "fr-BE": (
                " The target language is Belgian French. Use Belgian French "
                "pronunciation and vocabulary (septante/ nonante instead of "
                "soixante-dix/ quatre-vingt-dix). Sound like you are from Brussels "
                "or Wallonia, not from Paris."
            ),
        }
        return dialect_map.get(self._target_lang, "")

    def _lexicon_block(self) -> str:
        return get_lexicon_instructions(self._target_lang)

    def _content_type_block(self) -> str:
        if self._content_type == CONTENT_TYPE_MOVIE:
            return (
                "\n\nPROFESSIONAL DUBBING MODE:\n"
                "You are dubbing a movie or TV show. Deliver each line with "
                "full emotional commitment like a professional voice actor. "
                "Match the original actor's energy exactly — crying, shouting, "
                "whispering, gasping. Adapt jokes, puns, and cultural references "
                "into natural equivalents in the target language. Maintain "
                "consistent vocal signatures per character across the entire "
                "session."
                "\n\n"
                "AVAILABLE VOICE POOL:\n" + self._voice_pool_text() + "\n"
            )
        if self._content_type == CONTENT_TYPE_CINEMATIC_FAITHFUL:
            return (
                "\n\nCINEMATIC DUBBING MODE:\n"
                "You are dubbing cinematic content. Follow the audio as primary "
                "source of truth. Match each speaker's pace, emotion, and vocal "
                "energy exactly. Adapt idioms and cultural references naturally "
                "for the target audience. Never sanitize or flatten the original "
                "performance."
            )
        return ""

    async def _pump_input(
        self,
        ws: websockets.WebSocketClientProtocol,
        setup_complete: asyncio.Event,
    ) -> None:
        """Read PCM from the speaker's track and forward to Gemini as base64.

        Robustness:
          - Wait for `setup_complete` before streaming audio. If the speaker
            track is gone, the iterator yields nothing and we exit cleanly.
          - Backpressure: track in-flight sends. If Gemini is slow and the
            in-flight count crosses WS_SEND_QUEUE_HIGH_WATER, drop the oldest
            frames in batches until we're back under the high-water mark.
            Dropping is preferable to buffering, which would cause the user
            to hear stale translations.
          - RMS logging: track the input amplitude. If it stays near-silent
            for INPUT_RMS_QUIET_FRAMES, log a one-shot WARN so an operator
            can investigate the speaker's mic.
        """
        # Don't start streaming audio until Gemini acknowledges setup; otherwise
        # the model has nothing telling it what to do with the bytes.
        await setup_complete.wait()
        sent = 0
        mime = f"audio/pcm;rate={GEMINI_INPUT_SAMPLE_RATE}"
        try:
            async for pcm in iter_pcm_for_gemini(self._speaker_track):
                if self._closed.is_set():
                    return

                # Update RMS stats before any dropping so diagnostics stay
                # accurate.
                self._observe_rms(pcm)
                self._frames_sent += 1

                # Backpressure: if we're far ahead of Gemini, drop the oldest
                # pending frames in batches. We do this by reading the queue
                # depth estimate from self._ws_inflight; the actual asyncio
                # queue isn't directly accessible, so we treat in-flight as a
                # proxy updated when sends complete.
                if self._ws_inflight >= WS_SEND_QUEUE_HIGH_WATER:
                    self._ws_dropped += WS_SEND_QUEUE_DROP_BATCH
                    logger.warning(
                        "Eburon input backpressure: in_flight=%d, "
                        "dropping %d oldest frames (cumulative_dropped=%d)",
                        self._ws_inflight,
                        WS_SEND_QUEUE_DROP_BATCH,
                        self._ws_dropped,
                    )
                    # Decrement in-flight by the batch size as a best-effort
                    # ack. The actual ws.send will still be queued and will
                    # eventually catch up.
                    self._ws_inflight = max(
                        0, self._ws_inflight - WS_SEND_QUEUE_DROP_BATCH
                    )
                    continue

                b64 = base64.b64encode(pcm).decode("ascii")
                msg = {
                    "realtimeInput": {
                        "audio": {
                            "mimeType": mime,
                            "data": b64,
                        }
                    }
                }
                self._ws_inflight += 1
                try:
                    await ws.send(json.dumps(msg))
                finally:
                    self._ws_inflight = max(0, self._ws_inflight - 1)
                sent += 1
                if sent in (1, 50) or sent % 500 == 0:
                    logger.info(
                        "eburon <- %s frames=%d (%s mic in, dropped=%d)",
                        self._target_lang,
                        sent,
                        self._speaker_identity,
                        self._ws_dropped,
                    )
        finally:
            logger.info(
                "TOMBSTONE: _pump_input terminated for %s -> %s "
                "(frames_sent=%d, dropped=%d)",
                self._speaker_identity,
                self._target_lang,
                self._frames_sent,
                self._ws_dropped,
            )

    def _observe_rms(self, pcm: bytes) -> None:
        """Update rolling RMS stats and emit a quiet-speaker warning if needed.

        Audio is little-endian int16 mono. RMS is computed in fixed-point
        arithmetic to keep the hot path cheap.
        """
        import array

        if not pcm:
            return
        # Build an int16 view over the bytes; array.array is fast and avoids
        # the numpy dependency.
        samples = array.array("h")
        try:
            samples.frombytes(pcm)
        except Exception:
            return
        if not samples:
            return

        # Sum of squares. We use a normal Python int because the values are
        # at most 32767^2 * 16000 = ~1.7e13 — well within int range.
        acc = 0
        for s in samples:
            acc += s * s
        rms = (acc / len(samples)) ** 0.5

        # Windowed average over INPUT_RMS_LOG_EVERY_FRAMES frames; emit at
        # the end of each window.
        self._rms_window_sum += rms
        self._rms_window_n += 1

        if rms < INPUT_RMS_QUIET_THRESHOLD:
            self._quiet_streak += 1
        else:
            self._quiet_streak = 0
            self._quiet_warned = False

        if (
            not self._quiet_warned
            and self._quiet_streak >= INPUT_RMS_QUIET_FRAMES
        ):
            logger.warning(
                "Eburon quiet-speaker detection: %s has been below RMS "
                "%.1f for %d frames. Mic gain / device routing may need "
                "investigation.",
                self._speaker_identity,
                INPUT_RMS_QUIET_THRESHOLD,
                self._quiet_streak,
            )
            self._quiet_warned = True

        if self._rms_window_n >= INPUT_RMS_LOG_EVERY_FRAMES:
            avg = self._rms_window_sum / self._rms_window_n
            logger.info(
                "eburon mic RMS for %s: avg=%.1f over %d frames",
                self._speaker_identity,
                avg,
                self._rms_window_n,
            )
            self._rms_window_sum = 0.0
            self._rms_window_n = 0

    async def _pump_output(
        self,
        ws: websockets.WebSocketClientProtocol,
        setup_complete: asyncio.Event,
    ) -> None:
        """Receive Gemini translated audio + transcription, route into the room."""
        audio_frames = 0
        text_chunks = 0
        _first_content_seen = False
        try:
            async for raw in ws:
                if self._closed.is_set():
                    return
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    logger.debug("ignoring non-JSON WS frame")
                    continue
                
                if msg.get("setupComplete") is not None:
                    logger.info(
                        "Eburon setup complete: %s -> %s",
                        self._speaker_identity,
                        self._target_lang,
                    )
                    self._consecutive_failures = 0
                    setup_complete.set()
                    continue
                
                sc = msg.get("serverContent")
                if not sc:
                    # Log unrecognized message types once per session for debugging
                    if not _first_content_seen:
                        logger.debug(
                            "Eburon non-serverContent msg (%s -> %s): keys=%s",
                            self._speaker_identity,
                            self._target_lang,
                            list(msg.keys())[:5],
                        )
                    continue
                
                if not _first_content_seen:
                    _first_content_seen = True
                    logger.info(
                        "Eburon first serverContent (%s -> %s): keys=%s",
                        self._speaker_identity,
                        self._target_lang,
                        list(sc.keys()),
                    )
                
                # Translated audio frames.
                model_turn = sc.get("modelTurn")
                if model_turn is not None:
                    for part in model_turn.get("parts", []) or []:
                        inline = part.get("inlineData")
                        if inline and inline.get("data"):
                            pcm = base64.b64decode(inline["data"])
                            await push_pcm_to_source(self._audio_source, pcm)
                            audio_frames += 1
                            if audio_frames in (1, 10, 100) or audio_frames % 500 == 0:
                                logger.info(
                                    "eburon -> %s frames=%d (%s -> %s)",
                                    self._target_lang,
                                    audio_frames,
                                    self._speaker_identity,
                                    self._target_lang,
                                )
                
                # --- OUTPUT TRANSCRIPTION (translated text) ---
                ot = sc.get("outputTranscription")
                if not ot and model_turn is not None:
                    ot = model_turn.get("outputTranscription")
                if ot and ot.get("text"):
                    ot_text = ot["text"]
                    # Parse structured [OUTPUT]...[/OUTPUT] segments
                    output_segments = self._parse_output_segments(ot_text)
                    for seg in output_segments:
                        self._append_history("target", seg)
                        self._pending_segments.append(seg)
                    # Publish the plain text version for backward-compatible captions
                    await self._publish_transcript(ot_text, final=False)
                    # For cinematic faithful mode, parse cast blocks
                    if self._content_type == CONTENT_TYPE_CINEMATIC_FAITHFUL:
                        self._parse_cinematic_output(ot_text)
                
                # --- SOURCE TRANSCRIPTION (what the speaker said) ---
                it = sc.get("inputTranscription")
                if it and it.get("text"):
                    it_text = it["text"]
                    # Parse structured [SEGMENT]...[/SEGMENT] segments
                    source_segments = self._parse_source_segments(it_text)
                    for seg in source_segments:
                        self._append_history("source", seg)
                        self._pending_segments.append(seg)
                    # Publish the plain text version for backward-compatible captions
                    await self._publish_source_transcript(it_text, final=False)
                    text_chunks += 1
                    if text_chunks in (1, 10) or text_chunks % 50 == 0:
                        logger.info(
                            "eburon transcript chunk #%d for %s -> %s",
                            text_chunks,
                            self._speaker_identity,
                            self._target_lang,
                        )
                
                if sc.get("turnComplete"):
                    await self._publish_transcript("", final=True)
                    # Publish accumulated structured segments as JSON
                    await self._publish_structured_json()
                    # For cinematic faithful mode, publish the structured segment summary
                    if self._content_type == CONTENT_TYPE_CINEMATIC_FAITHFUL:
                        await self._publish_cinematic_json()
        finally:
            logger.info("TOMBSTONE: _pump_output terminated for %s -> %s", self._speaker_identity, self._target_lang)


    def _append_history(self, kind: str, segment: dict) -> None:
        """Add a structured segment to rolling memory, capping at limits."""
        # Normalize: output segments may use "translated_text" — store as "text" too
        if "translated_text" in segment and "text" not in segment:
            segment["text"] = segment["translated_text"]
        if not segment.get("text", "").strip():
            return
        segment["kind"] = kind  # "source" or "target"
        self._segment_history.append(segment)
        # Drop oldest entries if over count limit
        while len(self._segment_history) > MAX_HISTORY_SEGMENTS:
            self._segment_history.pop(0)

    @staticmethod
    def _parse_source_segments(text: str) -> list[dict]:
        """Parse structured [SEGMENT]...[/SEGMENT] blocks from source transcription.

        Returns a list of segment dicts. If no structured segments are found,
        falls back to creating a simple segment from the raw text.
        """
        matches = SEGMENT_RE.findall(text)
        if not matches:
            # Fallback: create a basic segment from plain text
            cleaned = text.strip()
            if not cleaned:
                return []
            return [
                {
                    "speaker_id": "speaker_1",
                    "speaker_label": "",
                    "text": cleaned,
                    "language": "",
                    "confidence": 0.0,
                    "tone": "",
                    "emotion": "",
                    "speech_style": "",
                    "overlap_status": "none",
                    "active_speaker": True,
                }
            ]

        segments: list[dict] = []
        for raw in matches:
            raw = raw.strip()
            if not raw:
                continue
            try:
                seg = json.loads(raw)
                # Ensure required fields
                seg.setdefault("speaker_id", "speaker_1")
                seg.setdefault("speaker_label", "")
                seg.setdefault("text", "")
                seg.setdefault("language", "")
                seg.setdefault("confidence", 0.0)
                seg.setdefault("tone", "")
                seg.setdefault("emotion", "")
                seg.setdefault("speech_style", "")
                seg.setdefault("overlap_status", "none")
                seg.setdefault("active_speaker", True)
                segments.append(seg)
            except (json.JSONDecodeError, TypeError):
                logger.debug("failed to parse source segment JSON: %s", raw[:80])
        return segments

    @staticmethod
    def _parse_output_segments(text: str) -> list[dict]:
        """Parse structured [OUTPUT]...[/OUTPUT] blocks from translated output.

        Returns a list of segment dicts. Falls back to raw text if no markers found.
        """
        matches = OUTPUT_RE.findall(text)
        if not matches:
            cleaned = text.strip()
            if not cleaned:
                return []
            return [GeminiSession._make_fallback_output_segment(cleaned)]

        segments: list[dict] = []
        for raw in matches:
            raw = raw.strip()
            if not raw:
                continue
            try:
                seg = json.loads(raw)
                seg.setdefault("speaker_id", "speaker_1")
                seg.setdefault("speaker_label", "")
                seg.setdefault("translated_text", "")
                seg.setdefault("confidence", 0.0)
                seg.setdefault("nuance_notes", "")
                # Normalize text key for history storage
                if "translated_text" in seg and "text" not in seg:
                    seg["text"] = seg["translated_text"]
                segments.append(seg)
            except (json.JSONDecodeError, TypeError):
                logger.debug("failed to parse output segment JSON: %s", raw[:80])
        return segments

    @staticmethod
    def _make_fallback_output_segment(text: str) -> dict:
        """Create a basic output segment from plain text when [OUTPUT] markers are absent."""
        return {
            "speaker_id": "speaker_1",
            "speaker_label": "",
            "text": text,
            "translated_text": text,
            "confidence": 0.0,
            "nuance_notes": "",
        }

    async def _publish_structured_json(self) -> None:
        """Publish accumulated source+target segments as structured JSON at turn end."""
        if not self._pending_segments:
            return

        payload = {
            "type": "structured_segments",
            "conversation_id": self._conversation_id,
            "target_lang": self._target_lang,
            "source_identity": self._speaker_identity,
            "segments": list(self._pending_segments),
        }

        try:
            writer = await self._room.local_participant.stream_text(
                topic="lk.translation",
                sender_identity=self._speaker_identity,
                attributes={
                    "target_lang": self._target_lang,
                    "source_identity": self._speaker_identity,
                    "kind": "structured_json",
                    "final": "true",
                },
            )
            await writer.write(json.dumps(payload, ensure_ascii=False))
            await writer.aclose()
        except Exception as exc:
            logger.debug("structured JSON publish failed: %s", exc)

        # Clear pending segments
        self._pending_segments.clear()

    async def _publish_transcript(self, text: str, *, final: bool) -> None:
        """Best-effort text-stream publish. Frontend filters by attributes."""
        if not text and not final:
            return
        try:
            # Send each chunk as its own text-stream message; frontend appends.
            writer = await self._room.local_participant.stream_text(
                topic="lk.translation",
                sender_identity=self._speaker_identity,
                attributes={
                    "target_lang": self._target_lang,
                    "source_identity": self._speaker_identity,
                    "final": "true" if final else "false",
                },
            )
            if text:
                await writer.write(text)
            await writer.aclose()
        except Exception as exc:
            logger.debug("text-stream publish failed: %s", exc)

    def _parse_cinematic_output(self, text: str) -> None:
        """Extract cast blocks and accumulate segments from cinematic faithful output.

        Gemini outputs text like:
          <cast>{"speaker":"A","name":"Aragorn",...}</cast>
          [A] I will not [pause] I cannot do this. [breath]

        This method:
        1. Extracts <cast>...</cast> blocks and stores them in _voice_casting_map.
        2. Strips cast blocks from the text and accumulates the remaining
           speaker-tagged segments in _cinematic_segments.
        """
        import re

        # Extract all <cast>...</cast> blocks
        while True:
            m = re.search(r"<cast>(.*?)</cast>", text, re.DOTALL)
            if not m:
                break
            raw = m.group(1).strip()
            text = text[: m.start()] + text[m.end() :]
            try:
                cast = json.loads(raw)
                speaker_letter = cast.get("speaker", "")
                if speaker_letter:
                    self._voice_casting_map[speaker_letter] = cast
                    logger.info(
                        "cinematic cast: %s -> %s (voice=%s)",
                        speaker_letter,
                        cast.get("name", "?"),
                        cast.get("voice_id", "?"),
                    )
            except (json.JSONDecodeError, TypeError) as exc:
                logger.debug("cinematic cast parse error: %s", exc)

        # Accumulate non-empty speaker-tagged segments
        stripped = text.strip()
        if stripped:
            # Detect speaker tag: [A], [King], etc.
            tag_m = re.match(r"^\[([^\]]+)\]\s*(.*)", stripped, re.DOTALL)
            if tag_m:
                speaker_tag = tag_m.group(1)
                dialogue = tag_m.group(2).strip()
                self._cinematic_segments.append(
                    {
                        "speaker_tag": speaker_tag,
                        "dialogue": dialogue,
                        "character_name": (
                            self._voice_casting_map.get(speaker_tag, {}).get(
                                "name", speaker_tag
                            )
                        ),
                    }
                )
            else:
                # No speaker tag — accumulate as continuation
                if self._cinematic_segments:
                    self._cinematic_segments[-1]["dialogue"] += " " + stripped
                else:
                    self._cinematic_segments.append(
                        {
                            "speaker_tag": "?",
                            "dialogue": stripped,
                            "character_name": "?",
                        }
                    )

    async def _publish_cinematic_json(self) -> None:
        """Publish the accumulated cinematic segments as structured JSON.

        The JSON is published as a text-stream entry with a 'cinematic' kind
        attribute so the frontend can distinguish it from regular captions.
        """
        if not self._cinematic_segments:
            return

        # Build voice casting array from the map
        voice_cast = []
        for letter in sorted(self._voice_casting_map.keys()):
            voice_cast.append(self._voice_casting_map[letter])

        payload = {
            "type": "cinematic_segments",
            "target_lang": self._target_lang,
            "source_identity": self._speaker_identity,
            "voice_cast": voice_cast,
            "segments": list(self._cinematic_segments),
        }

        try:
            writer = await self._room.local_participant.stream_text(
                topic="lk.translation",
                sender_identity=self._speaker_identity,
                attributes={
                    "target_lang": self._target_lang,
                    "source_identity": self._speaker_identity,
                    "kind": "cinematic_json",
                    "final": "true",
                },
            )
            await writer.write(json.dumps(payload, ensure_ascii=False))
            await writer.aclose()
        except Exception as exc:
            logger.debug("cinematic JSON publish failed: %s", exc)

        # Clear accumulated segments after publishing
        self._cinematic_segments.clear()

    async def _publish_source_transcript(self, text: str, *, final: bool) -> None:
        """Publish source transcription (what the speaker said in their language)."""
        if not text:
            return
        try:
            writer = await self._room.local_participant.stream_text(
                topic="lk.translation",
                sender_identity=self._speaker_identity,
                attributes={
                    "target_lang": self._target_lang,
                    "source_identity": self._speaker_identity,
                    "kind": "source",
                    "final": "true" if final else "false",
                },
            )
            await writer.write(text)
            await writer.aclose()
        except Exception as exc:
            logger.debug("source transcript publish failed: %s", exc)
