# OpenCode Deployment

This repo ships a project-level OpenCode configuration in `opencode.json`.

## Default Provider

- Provider: `ollama`
- Endpoint: `http://127.0.0.1:11434/v1`
- Default model: `ollama/eburon/alpha:latest`

The config intentionally does not include API keys, auth tokens, or machine-specific OpenCode state. Credentials remain in each user's normal OpenCode auth store.

## Skill Paths

OpenCode is configured to load skills from:

1. `./.agents/skills` - the committed skill source tree in this repo.
2. `~/.agents/skills` - the user's global skill directory.

Run `scripts/install-global-skills.sh` to install this repo's skill pack into the global directory for OpenCode, Codex, Claude Code, Gemini CLI, Cursor, and other CLI agents that can read `SKILL.md` files.

## Verification

```bash
opencode debug config
opencode models ollama
```

The resolved config should include `model: "ollama/eburon/alpha:latest"` and the model list should include `ollama/eburon/alpha:latest`.
