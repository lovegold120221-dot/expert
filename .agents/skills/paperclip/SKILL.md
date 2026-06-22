---
name: paperclip
version: "1.0.0"
description: "Paperclip — The app for managing AI agents at work. ⭐70.2k stars, MIT. 'If OpenClaw is an employee, Paperclip is the company.' Orchestrates teams of AI agents with org charts, budgets, governance, goal alignment. BYO agent (Claude Code, Codex, Cursor, OpenClaw, Bash, HTTP). Ticketing system, heartbeat scheduling, cost control. Use when: managing multiple AI agents, running autonomous AI companies, orchestrating agent teams with budgets."
argument-hint: 'paperclip setup agent company | paperclip manage AI agents | paperclip orchestrate agent team'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "📎"
    tags: [agent-orchestration, multi-agent, org-chart, budget, governance, task-management, autonomous, heartbeat, company]
    repo: https://github.com/paperclipai/paperclip
    homepage: https://paperclip.ing
    stars: 70200
    license: MIT
---

# 📎 Paperclip — Manage AI Agents at Work

**⭐70,200 stars | MIT | 2,718 commits**

> "If OpenClaw is an employee, Paperclip is the company."

Open-source orchestration for teams of AI agents. It looks like a task manager. Under the hood: org charts, budgets, governance, goal alignment, and agent coordination. Run AI companies, not piles of scripts.

## Quick Start

```bash
npx paperclipai onboard --yes
# Server starts at http://localhost:3100
# Embedded PostgreSQL — no setup needed

# Or manual:
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
pnpm install && pnpm dev
```

## Core Concepts

| Concept | What it does |
|---------|-------------|
| **Company** | Top-level organization. Complete data isolation |
| **Org Chart** | Hierarchies, roles, titles, reporting lines |
| **Agents** | Claude Code, Codex, Cursor, OpenClaw, Bash, HTTP bots |
| **Goals** | Business objectives → projects → tasks |
| **Heartbeats** | Scheduled agent wake-ups with budget enforcement |
| **Budgets** | Monthly token/cost caps per agent. Hard stops |
| **Governance** | Approvals, policies, pause/terminate, audit log |
| **Tickets** | Atomic checkout, execution locks, blocker deps |

## Bring Your Own Agent

Any agent, any runtime. If it can receive a heartbeat, it's hired:
- Claude Code, Codex, Cursor, Gemini, Bash agents
- OpenClaw (HTTP/webhook bots)
- Custom adapters via plugin system

## Key Features

- **Atomic execution** — Task checkout + budget enforcement prevent double-work and runaway spend
- **Persistent agent state** — Agents resume context across heartbeats
- **Goal-aware execution** — Every task carries full goal ancestry (company→project→task)
- **Cost control** — Token/cost tracking by company, agent, project, provider, model
- **Multi-company** — One deployment, many companies, complete data isolation
- **Scheduled routines** — Cron, webhook, and API triggers for recurring work
- **Mobile ready** — Monitor and manage from anywhere

## What Paperclip is NOT

- ❌ A chatbot — agents have jobs, not chat windows
- ❌ An agent framework — doesn't tell you how to build agents
- ❌ A workflow builder — no drag-and-drop pipelines
- ❌ A prompt manager — agents bring their own prompts

## When to Use

- Running multiple autonomous AI agents simultaneously
- Coordinating agent teams toward business goals
- Need budget enforcement and cost tracking for AI agents
- Managing AI companies from a single dashboard
- Recurring automated agent tasks (customer support, social, reports)
- Don't want to babysit 20 Claude Code terminals
