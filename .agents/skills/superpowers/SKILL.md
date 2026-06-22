---
name: superpowers
version: "1.0.0"
description: "Superpowers — Agentic skills framework & software development methodology. ⭐226k stars, MIT. Jesse Vincent's complete methodology for coding agents: brainstorming → writing-plans → subagent-driven-development → test-driven-development → requesting-code-review → finishing-a-development-branch. Works on Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Factory Droid, Copilot CLI. Use when: setting up agent development workflow, enforcing TDD, structured brainstorming, multi-agent parallel development."
argument-hint: 'superpowers setup workflow | superpowers brainstorming | superpowers TDD | superpowers subagent development'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "⚡"
    tags: [methodology, tdd, brainstorming, subagents, code-review, development-workflow, skills-framework, multi-agent]
    repo: https://github.com/obra/superpowers
    homepage: https://github.com/obra/superpowers
    stars: 226000
    license: MIT
    author: Jesse Vincent (Prime Radiant)
---

# ⚡ Superpowers — Agentic Development Methodology

**⭐226,000 stars | MIT | Jesse Vincent | 441 commits**

A complete software development methodology for coding agents. Not just skills — a philosophy. The agent steps back, asks what you're really building, writes a spec, plans implementation, dispatches subagents, enforces TDD, reviews code, and ships. Works across 7+ coding agents.

## The Workflow

```
brainstorming → writing-plans → subagent-driven-development
                                    ↓
                              test-driven-development
                                    ↓
                            requesting-code-review
                                    ↓
                         finishing-a-development-branch
```

## Core Skills

| # | Skill | What it does |
|---|-------|-------------|
| 1 | `brainstorming` | Socratic design refinement. Asks questions, explores alternatives, presents design in digestible chunks. Saves design doc |
| 2 | `using-git-worktrees` | Creates isolated workspace on new branch, verifies clean test baseline |
| 3 | `writing-plans` | Breaks work into bite-sized tasks (2-5 min each). Exact file paths, code, verification steps |
| 4 | `subagent-driven-development` | Fresh subagent per task with two-stage review: spec compliance, then code quality |
| 5 | `test-driven-development` | RED-GREEN-REFACTOR. Write failing test, watch it fail, write minimal code, watch it pass |
| 6 | `requesting-code-review` | Reviews against plan. Critical issues block progress |
| 7 | `finishing-a-development-branch` | Verifies tests, presents merge/PR options, cleans up |

## Also Includes

- `systematic-debugging` — 4-phase root cause process
- `verification-before-completion` — Ensure it's actually fixed
- `executing-plans` — Batch execution with checkpoints
- `dispatching-parallel-agents` — Concurrent subagent workflows
- `receiving-code-review` — Responding to feedback
- `writing-skills` — Create new skills following best practices

## Installation by Agent

| Agent | Install Command |
|-------|----------------|
| Claude Code | `/plugin install superpowers@claude-plugins-official` |
| Codex CLI | `/plugins` → search "superpowers" → Install |
| OpenCode | Fetch instructions from `obra/superpowers/.opencode/INSTALL.md` |
| Cursor | `/add-plugin superpowers` |
| Gemini CLI | `gemini extensions install https://github.com/obra/superpowers` |
| Factory Droid | `droid plugin install superpowers@superpowers` |
| Copilot CLI | `copilot plugin install superpowers@superpowers-marketplace` |

## Philosophy

- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Complexity reduction** — Simplicity as primary goal
- **Evidence over claims** — Verify before declaring success

## When to Use

- Setting up a rigorous agent development workflow
- Enforcing TDD with coding agents
- Multi-subagent parallel development
- Structured brainstorming before coding
- Any agent that "just jumps into code" needs this
