# Global Skill Pack Instructions

These instructions apply to agents consuming this repo as a skill source.

## Skill Loading Protocol

1. Start with `.agents/skills/INDEX.md` for routing. Do not read every `SKILL.md` preemptively.
2. Select the minimal skill set that matches the user request.
3. Read each selected `SKILL.md` from top to bottom before using it.
4. Follow progressive disclosure:
   - Open only referenced files needed for the selected task.
   - Resolve relative paths from the selected skill directory.
   - Prefer bundled scripts, templates, and assets when they exist.
5. If multiple skills match, state the order you will use them and why.
6. If a skill is missing required credentials, tools, or runtime state, report the exact blocker and continue with the safest fallback.

## Trigger Rules

Use a skill when the user names it directly or the task clearly matches the `description` in the skill front matter.

Common examples:

- Local/model runtime work: `edge-ollama`, `edge-vllm`, `edge-llama-cpp`, `edge-transformers-js`.
- Browser or machine interaction: `browser-use`, `machine-access`, `screenshot`, `macbook`.
- App creation: `full-app-development`, `autonomous-app-generator`, `skill-orchestrator`.
- Debugging and quality: `systematic-debugging`, `test-driven-development`, `requesting-code-review`, `final-quality-check-agent`.
- Cloud/Azure work: `azure-prepare`, `azure-deploy`, `azure-diagnostics`, `azure-cost`, `microsoft-foundry`.
- Media/video workflows: `ai-video-generation`, `ai-video-production`, `showcase-production-director`.

## Global Install

Run `scripts/install-global-skills.sh` from the repo root to sync `.agents/skills` into `~/.agents/skills` and configure OpenCode to read both this repo and the global path.

Canonical source repository:

```text
https://github.com/lovegold120221-dot/eburonhub-skills.git
```
