## TASK-20260623-153000: Alias LLM/Service Branding

### START RECORD
- STATUS: STARTED
- Start time: 2026-06-23T15:30:00Z
- User request: Alias all LLM models/services to "eburon-ai-services" and hide from DevTools
- Last known state: none
- Preservation constraints: preserve functionality, preserve real API model names (server-side only)
- Files/directories to inspect: `src/`, `translator/`, `electron/`
- Success criteria: Build passes, all 42 tests pass, no "Gemini" in DevTools/frontend bundles

### TODO
- [x] Alias agent dispatch name (token/route.ts, breakout/route.ts, agent.py)
- [x] Alias manifest.json LLM strings
- [x] Alias config.ts constant names (GEMINI_* → EBURON_*)
- [x] Alias error messages across all API routes
- [x] Rename gemini-fetch.ts → eburon-fetch.ts + internal function
- [x] Python agent full rename (config.py, session.py, router.py, audio.py, agent.py)
- [x] Rename pyproject.toml, .env.example, env var fallback pattern
- [x] Self-host MediaPipe model to remove storage.googleapis.com
- [x] Rebrand Electron dialogs (Ollama → Eburon AI local runtime)
- [x] Update AGENTS.md documentation references
- [x] Update tests for renamed classes/constants
- [x] Run validation: pnpm build + pytest + ruff

### FINAL REPORT
- STATUS: COMPLETED
- End time: 2026-06-23T16:00:00Z
- Files changed: 30+ files across frontend, backend, agent, and electron
- Validation performed: `pnpm build` success, `uv run pytest` (42/42 tests pass), `ruff check/format` pass
- CSS/UI preservation: UI untouched
- Real data/API credential check: Real API keys/model values preserved; only branding aliased
- Known issues: None
- Next step: Await user request for next task.
