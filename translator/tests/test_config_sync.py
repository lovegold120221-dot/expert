"""Config synchronization test.

Verifies that constants shared between the frontend (src/lib/config.ts) and
the Python agent (translator/src/config.py) stay in sync. A drift here would
cause subtle bugs — e.g. the agent listening for a different `lang` attribute
key than the frontend sets, or the retranslation model being retired in one
place but not the other.

This test reads the TypeScript file as text and regex-extracts the constant
values, so it doesn't need a JS runtime — it just guards against accidental
edits in one place without the other.
"""

from __future__ import annotations

import re
from pathlib import Path

from config import (
    EBURON_RETRANSLATION_MODEL,
    NATIVE_LANG,
    PARTICIPANT_LANG_ATTR,
)

# Path to the frontend config file, relative to the translator/ root.
FRONTEND_CONFIG = Path(__file__).resolve().parents[2] / "src" / "lib" / "config.ts"


def _extract_ts_constant(text: str, name: str) -> str | None:
    """Extract a string constant value from a TS source file."""
    match = re.search(rf'export\s+const\s+{name}\s*=\s*["\']([^"\']+)["\']', text)
    return match.group(1) if match else None


def test_frontend_config_file_exists():
    """The frontend config file must exist for sync checking."""
    assert FRONTEND_CONFIG.exists(), f"{FRONTEND_CONFIG} not found"


def test_native_lang_in_sync():
    """NATIVE_LANG must match between frontend and agent."""
    text = FRONTEND_CONFIG.read_text()
    frontend_val = _extract_ts_constant(text, "NATIVE_LANG")
    assert frontend_val == NATIVE_LANG, (
        f"NATIVE_LANG drift: frontend={frontend_val!r}, agent={NATIVE_LANG!r}"
    )


def test_participant_lang_attr_in_sync():
    """PARTICIPANT_LANG_ATTR must match between frontend and agent."""
    text = FRONTEND_CONFIG.read_text()
    frontend_val = _extract_ts_constant(text, "PARTICIPANT_LANG_ATTR")
    assert frontend_val == PARTICIPANT_LANG_ATTR, (
        f"PARTICIPANT_LANG_ATTR drift: frontend={frontend_val!r}, "
        f"agent={PARTICIPANT_LANG_ATTR!r}"
    )


def test_eburon_text_model_in_sync():
    """EBURON_TEXT_MODEL (frontend) must match EBURON_RETRANSLATION_MODEL (agent)
    since they serve the same purpose (one-shot text translation via REST)."""
    text = FRONTEND_CONFIG.read_text()
    frontend_val = _extract_ts_constant(text, "EBURON_TEXT_MODEL")
    assert frontend_val == EBURON_RETRANSLATION_MODEL, (
        f"Text model drift: frontend={frontend_val!r}, "
        f"agent={EBURON_RETRANSLATION_MODEL!r}"
    )
