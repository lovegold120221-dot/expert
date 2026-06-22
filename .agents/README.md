# Eburon Hub Skills

Canonical source repository: https://github.com/lovegold120221-dot/eburonhub-skills.git

This directory is a portable skill pack for CLI agents. A skill is a directory containing `SKILL.md` plus optional `references/`, `scripts/`, `templates/`, `assets/`, or source files.

## Install Globally

```bash
scripts/install-global-skills.sh
```

By default, the installer syncs `.agents/skills` into `~/.agents/skills` and merges the OpenCode model/skill path settings into `~/.config/opencode/opencode.json`.

## Use From Any CLI Agent

1. Scan `.agents/skills/INDEX.md` first. It lists every skill name, when to use it, and detected source links.
2. Match the user's request to a skill by explicit name, trigger phrase, or domain.
3. Read the selected skill's `SKILL.md` completely before acting.
4. If `SKILL.md` points to relative files, resolve them from that skill directory and read only the files relevant to the task.
5. Prefer skill-provided scripts/templates/assets over recreating them.
6. Do not load the whole catalog into context. Use the index for routing and load full skill files only after a match.

## When To Use Skills

Use a skill when:

- The user names it directly, for example `$edge-ollama` or `use browser-use`.
- The request matches the skill description in `.agents/skills/INDEX.md`.
- The task involves a specialized workflow, external tool, deployment target, media pipeline, cloud provider, testing strategy, or agent orchestration pattern already covered by a skill.

Do not use a skill when:

- The task is a tiny local edit that is already fully clear.
- The skill is unrelated or would add process without reducing risk.
- The skill requires credentials or external state that are not present and the user did not ask to configure them.

## Source Policy

This repo mirrors skill source files and excludes local dependency/build artifacts such as `node_modules/`, `dist/`, nested `.git/`, compiled native binaries, archives, and large generated media. The goal is to keep the source pack reviewable and safe to commit while preserving the instructions, scripts, references, and templates needed by agents.
