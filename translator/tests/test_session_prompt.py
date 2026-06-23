"""Unit tests for EburonSession._build_setup_payload across voice-echo modes.

Pure-logic tests: no LiveKit connectivity, no WebSocket API calls. We construct a
bare EburonSession (skipping __init__) and inspect the payload it would send.

These exist so the prompt engineering for "echo the original voice" is locked
in: any change that weakens the voice-preservation behavior will fail these
tests before reaching production.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

# Make `src/` importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from config import (
    CONTENT_TYPE_CINEMATIC_FAITHFUL,
    CONTENT_TYPE_MOVIE,
    ORBIT_VOICE_ECHO_ASSIGNED,
    ORBIT_VOICE_ECHO_CLONE,
    ORBIT_VOICE_ECHO_OFF,
)
from session import EburonSession


def _bare_session(
    *,
    target_lang: str = "es",
    voice_echo: str = ORBIT_VOICE_ECHO_CLONE,
    content_type: str = "normal",
    available_voices=None,
    glossary=None,
    segment_history=None,
    conversation_id: str = "abc123",
):
    """Build an EburonSession without calling __init__.

    The setup-payload builder only reads these attributes.
    """
    s = EburonSession.__new__(EburonSession)
    s._available_voices = available_voices or [
        ("Kore", "Firm assertive female"),
        ("Orus", "Firm authoritative male"),
    ]
    s._glossary = glossary or []
    s._content_type = content_type
    s._segment_history = segment_history or []
    s._target_lang = target_lang
    s._conversation_id = conversation_id
    s._voice_echo = voice_echo
    return s


def _setup_payload(session) -> dict:
    return session._build_setup_payload()


def _instruction_text(payload: dict) -> str:
    return payload["setup"]["systemInstruction"]["parts"][0]["text"]


def _translation_config(payload: dict) -> dict:
    return payload["setup"]["generationConfig"]["translationConfig"]


# --- voice_echo=clone (default) --------------------------------------------


def test_clone_mode_keeps_echo_target_language_enabled():
    """echoTargetLanguage must stay True in clone mode - that's the API flag
    that makes Gemini preserve source voice characteristics in the target lang.
    """
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_CLONE)
    tc = _translation_config(_setup_payload(s))
    assert tc["targetLanguageCode"] == "es"
    assert tc["echoTargetLanguage"] is True


def test_clone_mode_prompt_mentions_voice_preservation():
    """The clone prompt must explicitly demand preservation of pitch, range,
    vocal effort, breathiness, and emotional tone."""
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_CLONE)
    text = _instruction_text(_setup_payload(s))
    for phrase in (
        "preserve",
        "pitch",
        "voice",
        "timbre",
        "speaker identity",
    ):
        assert phrase.lower() in text.lower(), f"clone prompt missing: {phrase!r}"


def test_clone_mode_does_not_assign_from_voice_pool():
    """In clone mode the model should NOT pick from the voice pool by speaker
    appearance order - it should just preserve whatever voice the source has.
    """
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_CLONE)
    text = _instruction_text(_setup_payload(s))
    head = text.split("AVAILABLE VOICE POOL:")[0]
    assert "Voice 1" not in head


def test_clone_mode_emphasizes_emotion_carryover():
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_CLONE)
    text = _instruction_text(_setup_payload(s))
    assert "emotion" in text.lower()
    assert "whisper" in text.lower() or "shout" in text.lower()


def test_clone_mode_strips_region_prefix_from_target_lang():
    """For nl-BE we send nl to the API and put the dialect hint in the
    prompt - the test verifies the prompt gets the region-flavor note."""
    s = _bare_session(target_lang="nl-BE", voice_echo=ORBIT_VOICE_ECHO_CLONE)
    payload = _setup_payload(s)
    assert _translation_config(payload)["targetLanguageCode"] == "nl"
    assert "Flemish" in _instruction_text(payload)


# --- voice_echo=assigned ----------------------------------------------------


def test_assigned_mode_uses_voice_pool():
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_ASSIGNED)
    text = _instruction_text(_setup_payload(s))
    assert "AVAILABLE VOICE POOL" in text
    assert "first speaker uses the first voice" in text.lower()


def test_assigned_mode_keeps_echo_target_language_enabled():
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_ASSIGNED)
    tc = _translation_config(_setup_payload(s))
    assert tc["echoTargetLanguage"] is True


# --- voice_echo=off ---------------------------------------------------------


def test_off_mode_uses_voice_pool_for_consistency():
    """Off mode picks a stable voice from the pool so each speaker sounds
    the same across the session, but doesn't try to echo the original."""
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_OFF)
    text = _instruction_text(_setup_payload(s))
    assert "AVAILABLE VOICE POOL" in text
    assert "preserve the original speaker" not in text.lower()


def test_off_mode_keeps_echo_target_language_enabled():
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_OFF)
    tc = _translation_config(_setup_payload(s))
    assert tc["echoTargetLanguage"] is True


# --- content-type interplay -------------------------------------------------


@pytest.mark.parametrize(
    "content_type,marker",
    [
        (CONTENT_TYPE_MOVIE, "PROFESSIONAL DUBBING MODE"),
        (CONTENT_TYPE_CINEMATIC_FAITHFUL, "CINEMATIC DUBBING MODE"),
    ],
)
def test_movie_and_cinematic_voice_echo_clone_prompts(content_type, marker):
    """Even in movie/cinematic mode, voice_echo=clone must keep the
    voice-preservation directive front and center."""
    s = _bare_session(voice_echo=ORBIT_VOICE_ECHO_CLONE, content_type=content_type)
    text = _instruction_text(_setup_payload(s))
    assert marker in text
    assert "preserve" in text.lower()


# --- glossary + segment-history interplay ----------------------------------


def test_glossary_is_included_regardless_of_voice_echo():
    s = _bare_session(
        voice_echo=ORBIT_VOICE_ECHO_CLONE,
        glossary=[{"source": "Eburon LLM", "translation": "Eburon LLM"}],
    )
    text = _instruction_text(_setup_payload(s))
    assert "Eburon LLM" in text


def test_segment_history_injects_voice_metadata():
    """When the rolling history has tone/emotion/style, those should appear
    in the prompt so the model has continuity for the voice across turns."""
    s = _bare_session(
        voice_echo=ORBIT_VOICE_ECHO_CLONE,
        segment_history=[
            {
                "kind": "source",
                "speaker_label": "Alice",
                "text": "I cannot believe this happened",
                "tone": "agitated",
                "emotion": "anger",
                "speech_style": "shouting",
            }
        ],
    )
    text = _instruction_text(_setup_payload(s))
    assert "Alice" in text
    assert "agitated" in text or "anger" in text


# --- payload shape ---------------------------------------------------------


def test_payload_keeps_required_setup_fields():
    """Defends against accidental removal of fields the v1beta BidiGenerate
    endpoint requires."""
    s = _bare_session()
    payload = _setup_payload(s)
    setup = payload["setup"]
    assert setup["model"] == "models/gemini-3.5-live-translate-preview"
    assert setup["outputAudioTranscription"] == {}
    assert setup["inputAudioTranscription"] == {}
    assert setup["generationConfig"]["responseModalities"] == ["AUDIO"]
    assert "translationConfig" in setup["generationConfig"]
    assert "realtimeInputConfig" in setup


def test_payload_is_json_serializable():
    """The whole setup payload must round-trip through json.dumps - Gemini's
    WebSocket accepts JSON only, and we never want a stray object slipping
    into a setup that would break serialization at runtime."""
    s = _bare_session(
        voice_echo=ORBIT_VOICE_ECHO_CLONE,
        content_type=CONTENT_TYPE_CINEMATIC_FAITHFUL,
        glossary=[{"source": "OK", "translation": "OK"}],
    )
    payload = _setup_payload(s)
    serialized = json.dumps(payload, ensure_ascii=False)
    roundtrip = json.loads(serialized)
    assert roundtrip == payload
