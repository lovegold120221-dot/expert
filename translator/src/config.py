"""Constants for the translation agent."""

from __future__ import annotations

# --- Gemini Live ---

GEMINI_MODEL = "gemini-3.5-live-translate-preview"

# Gemini Live API audio formats.
GEMINI_INPUT_SAMPLE_RATE = 16000  # Gemini expects 16kHz mono PCM in
GEMINI_OUTPUT_SAMPLE_RATE = 24000  # Gemini emits 24kHz mono PCM out
AUDIO_CHANNELS = 1

# --- LiveKit ---

# Track attribute keys for translator-published tracks.
TRACK_ATTR_KIND = "kind"
TRACK_ATTR_SOURCE_IDENTITY = "source_identity"
TRACK_ATTR_TARGET_LANG = "target_lang"

# Marker value for the `kind` attribute on translator tracks.
TRANSLATION_TRACK_KIND = "translation"

# --- Translation Memory ---

# Max transcript entries kept in rolling context for session memory.
MAX_TRANSCRIPT_HISTORY = 30
# Max structured segments kept in rolling context.
MAX_HISTORY_SEGMENTS = 20
# Max words across all history entries before oldest are dropped.
MAX_HISTORY_WORDS = 600

# Participant attribute carrying each participant's chosen language.
PARTICIPANT_LANG_ATTR = "lang"

# Participant attribute key for glossary (JSON array of {source, translation}).
GLOSSARY_ATTR = "orbit_glossary"

# Content-type constants for participant's orbit_content_type attribute.
CONTENT_TYPE_NORMAL = "normal"
CONTENT_TYPE_MOVIE = "movie"
CONTENT_TYPE_CINEMATIC_FAITHFUL = "cinematic_faithful"

# Sentinel meaning "no translation, native passthrough."
NATIVE_LANG = "none"

# --- Voice echo strategy ---

# Participant attribute carrying the voice-echo mode for this speaker.
# Allowed values: ORBIT_VOICE_ECHO_CLONE / _ASSIGNED / _OFF.
ORBIT_VOICE_ECHO_ATTR = "orbit_voice_echo"

# "clone" (default) - preserve the original speaker's voice identity
# (pitch, timbre, vocal effort, breathiness, emotion). Uses
# translationConfig.echoTargetLanguage=True and a strong voice-mimic prompt.
ORBIT_VOICE_ECHO_CLONE = "clone"

# "assigned" - assign a distinct voice from AVAILABLE_VOICES by speaker
# appearance order (legacy multi-speaker behavior). Uses echoTargetLanguage
# too so the chosen voice still benefits from the model's prosody continuity.
ORBIT_VOICE_ECHO_ASSIGNED = "assigned"

# "off" - turn the voice-echo off. Pick a stable voice from the pool per
# speaker so each speaker sounds consistent within a session, but don't try
# to match the source's voice. Useful for accessibility / clarity mode.
ORBIT_VOICE_ECHO_OFF = "off"

# Default voice-echo mode applied when the participant attribute is missing
# or unparseable. clone = strongest user experience.
ORBIT_VOICE_ECHO_DEFAULT = ORBIT_VOICE_ECHO_CLONE

# Allowed set - guarded by the router; unknown values fall back to default.
ORBIT_VOICE_ECHO_ALLOWED: frozenset[str] = frozenset(
    {ORBIT_VOICE_ECHO_CLONE, ORBIT_VOICE_ECHO_ASSIGNED, ORBIT_VOICE_ECHO_OFF}
)

# --- Router behavior ---

# Debounce window for room state changes before reconciling sessions.
RECONCILE_DEBOUNCE_SEC = 0.25

# How long to keep a session warm after its last demand disappears
# (speaker mutes, or the last listener for a target language leaves).
SESSION_GRACE_SEC = 10.0

# --- Robustness tuning ---

# Periodic RMS log cadence (frames between logs). One frame ~20ms at 16kHz.
# 250 frames = ~5s; quiet speakers are surfaced to the operator here.
INPUT_RMS_LOG_EVERY_FRAMES = 250

# If the running RMS stays below this threshold for INPUT_RMS_QUIET_FRAMES
# in a row, we log a one-shot WARN so the operator can check the speaker's
# mic gain. Gemini Live still hears it, but downstream STT degrades.
INPUT_RMS_QUIET_THRESHOLD = 200.0
INPUT_RMS_QUIET_FRAMES = 1000  # ~20s of near-silence

# Backpressure guard: if the WebSocket send queue grows past this many
# pending messages we start dropping the oldest audio frames. We only do
# this when the consumer (Gemini) is the bottleneck - in normal operation
# the queue is 0-1 messages.
WS_SEND_QUEUE_HIGH_WATER = 32
WS_SEND_QUEUE_DROP_BATCH = 8

# --- Voice pool for multi-speaker translation ---

# When multiple speakers are detected in the input audio, the translator
# assigns each speaker a distinct voice from this pool. Each entry is a
# (voice_name, description) tuple describing the vocal character.
# The first voice is the default for the first detected speaker.
AVAILABLE_VOICES: list[tuple[str, str]] = [
    # Group 1
    ("Zephyr", "Bright — high energy, clear articulation, female"),
    ("Kore", "Firm — assertive, confident delivery, female"),
    ("Orus", "Firm — strong, authoritative tone, male"),
    ("Autonoe", "Bright — clear, vibrant expression, female"),
    ("Umbriel", "Easy-going — relaxed, conversational, male"),
    ("Erinome", "Clear — crisp, distinct articulation, female"),
    ("Laomedeia", "Upbeat — positive, energetic style, female"),
    ("Schedar", "Even — balanced, consistent tone, male"),
    ("Achird", "Friendly — warm, approachable tone, male"),
    ("Sadachbia", "Lively — spirited, animated delivery, female"),
    # Group 2
    ("Puck", "Upbeat — cheerful, enthusiastic tone, male"),
    ("Fenrir", "Excitable — energetic, animated expression, male"),
    ("Aoede", "Breezy — casual, relaxed delivery, female"),
    ("Enceladus", "Breathy — soft, airy quality, male"),
    ("Algieba", "Smooth — polished, fluid delivery, male"),
    ("Algenib", "Gravelly — rough, textured quality, male"),
    ("Achernar", "Soft — gentle, mellow tone, female"),
    ("Gacrux", "Mature — experienced, seasoned quality, female"),
    ("Zubenelgenubi", "Casual — informal, conversational, male"),
    ("Sadaltager", "Knowledgeable — informed, instructive, male"),
    # Group 3
    ("Charon", "Informative — educational, explanatory style, male"),
    ("Leda", "Youthful — young-sounding, fresh voice, female"),
    ("Callirrhoe", "Easy-going — laid-back, comfortable style, female"),
    ("Iapetus", "Clear — precise, well-articulated, male"),
    ("Despina", "Smooth — refined, elegant tone, female"),
    ("Rasalgethi", "Informative — educational, instructive, male"),
    ("Alnilam", "Firm — steady, resolute delivery, male"),
    ("Pulcherrima", "Forward — direct, straightforward style, female"),
    ("Vindemiatrix", "Gentle — soft, kind delivery, female"),
    ("Sulafat", "Warm — rich, comforting tone, female"),
]

# --- Gemini connection ---

# Exponential backoff schedule for reconnecting a failed Gemini session.
GEMINI_RECONNECT_BACKOFF_SEC = [0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 30.0]
GEMINI_MAX_FAILURES_BEFORE_LONG_BACKOFF = 5
