/**
 * Shared frontend constants. Mirrors the agent's `translator/src/config.py`
 * where relevant; keep them in sync if you change either.
 *
 * These are the single source of truth for session timeouts and participant
 * caps — the token route imports from here instead of hardcoding its own
 * copies (see translator/tests/test_config_sync.py for the cross-check).
 */

// --- Session timeouts (consumed by the token route + RoomClient refresh) ---

// 4h hard cap per grill Q21. The frontend schedules a token re-mint ~5 min
// before this expires so long meetings don't get kicked.
export const SESSION_TTL_SECONDS = 4 * 60 * 60;

// Close empty rooms after 60s.
export const EMPTY_ROOM_TIMEOUT = 60;

// Close after last person leaves.
export const DEPARTURE_TIMEOUT = 30;

// Hard cap on participants per room. The token route embeds this into
// RoomConfiguration.maxParticipants so the server enforces it.
export const MAX_PARTICIPANTS = 40;

// --- Shared with the Python agent (translator/src/config.py) ---

// Sentinel meaning "no translation, native passthrough."
export const NATIVE_LANG = "none";

// Participant attribute carrying each participant's chosen language.
export const PARTICIPANT_LANG_ATTR = "lang";

// Eburon AI service model strings. Centralized so a provider deprecation
// only needs one edit. The constant NAMES are aliased to the Eburon brand;
// the values are the real API model identifiers used server-side only
// (never appear in the browser bundle — verified via tree-shaking).
// translate-text, translate-voice, orbit-ai, and the agent's retranslation
// handler all import from here / config.py.
export const EBURON_TEXT_MODEL = "gemini-3.5-flash";
export const EBURON_VOICE_MODEL = "gemini-2.5-flash-lite";
export const EBURON_CHAT_MODEL = "gemini-2.0-flash";
