---
name: hermes-agent
version: "1.0.0"
description: "Hermes Agent — The self-improving AI agent that grows with you. ⭐192k stars, MIT. Built by Nous Research. Unique learning loop: creates skills from experience, improves them during use, builds user profiles across sessions. Runs anywhere (local, Docker, SSH, Modal, Daytona, Termux). Telegram/Discord/Slack/WhatsApp/Signal/CLI. Works with any model. OpenClaw migration built-in. Use when: setting up personal AI agent, migrating from OpenClaw, running agent on mobile (Termux), self-improving agent with memory."
argument-hint: 'hermes-agent setup personal AI | hermes-agent migrate from OpenClaw | hermes-agent run on mobile'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "☤"
    tags: [self-improving, agent, nous-research, skills, memory, multi-platform, telegram, discord, openclaw-migration]
    repo: https://github.com/NousResearch/hermes-agent
    homepage: https://hermes-agent.nousresearch.com
    stars: 192000
    license: MIT
    author: Nous Research
---

# ☤ Hermes Agent — The Agent That Grows With You

**⭐192,000 stars | MIT | Nous Research | 11,526 commits**

The only agent with a built-in learning loop. Creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions.

## Quick Install

```bash
# Linux, macOS, WSL2, Termux
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

# Windows (PowerShell)
iex (irm https://hermes-agent.nousresearch.com/install.ps1)

# Start chatting
hermes
```

## Key Differentiators

- **Self-improving loop** — Autonomous skill creation after complex tasks. Skills self-improve during use
- **Cross-session memory** — FTS5 session search + LLM summarization for recall
- **User profiling** — [Honcho](https://github.com/plastic-labs/honcho) dialectic user modeling
- **Runs anywhere** — Local, Docker, SSH, Singularity, Modal, Daytona, Termux (Android)
- **All messaging platforms** — Telegram, Discord, Slack, WhatsApp, Signal, Email
- **Any model** — Nous Portal, OpenRouter (200+), OpenAI, Anthropic, NVIDIA NIM, Kimi, MiniMax, HuggingFace
- **Scheduled automations** — Built-in cron with platform delivery
- **Parallel subagents** — Spawn isolated workers for parallel workstreams

## OpenClaw Migration

```bash
hermes claw migrate              # Interactive (full preset)
hermes claw migrate --dry-run    # Preview what gets imported
```

Imports SOUL.md, memories, skills, API keys, messaging config, TTS assets, workspace instructions.

## Key Commands

```bash
hermes              # Interactive CLI
hermes model        # Choose provider and model
hermes tools        # Configure enabled tools
hermes gateway      # Start messaging gateway
hermes setup        # Full setup wizard
hermes setup --portal  # Setup with Nous Portal
hermes update       # Update to latest
hermes doctor       # Diagnose issues
```

## Terminal Backends

Local, Docker, SSH, Singularity, Modal, Daytona. Daytona and Modal offer serverless persistence — hibernates when idle, costs nearly nothing.

## When to Use

- Personal AI agent that learns and improves over time
- Migrating from OpenClaw (built-in migration tools)
- Running AI agent across all messaging platforms
- Mobile AI agent (Termux on Android)
- Cron-scheduled autonomous tasks
- Multi-provider flexibility (no model lock-in)
