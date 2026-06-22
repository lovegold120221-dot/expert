---
name: gstack-suite
version: "1.0.0"
description: "gstack — Garry Tan's (YC CEO) AI engineering team. ⭐110k stars, MIT. 23 opinionated specialist skills + 8 power tools that turn Claude Code into a virtual engineering squad: CEO, Designer, Eng Manager, Release Engineer, QA, Security Officer. Think→Plan→Build→Review→Test→Ship→Reflect sprint pipeline. 810× productivity gain. Use when the user asks to: run AI-driven sprints, set up structured agent workflows, do CEO/design/eng reviews, QA test sites, ship code with guardrails."
argument-hint: 'gstack-suite run sprint | gstack-suite office-hours | gstack-suite plan review | gstack-suite ship'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🏭"
    tags: [sprint, ceo-review, design-review, qa, ship, code-review, security-audit, workflow, team, yc]
    repo: https://github.com/garrytan/gstack
    homepage: https://github.com/garrytan/gstack
    stars: 110000
    license: MIT
    author: Garry Tan (YC President & CEO)
---

# 🏭 gstack — Your AI Engineering Team

**⭐110,000 stars | MIT | Garry Tan (YC President & CEO)**

23 specialist skills that turn your coding agent into a full engineering organization with CEO, designer, eng manager, QA lead, security officer, and release engineer. Garry Tan's personal setup — the exact tooling behind his 810× productivity claim.

## The Sprint Pipeline

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

## Key Skills

### 🧠 Think & Plan
| Skill | Role |
|-------|------|
| `/office-hours` | YC Office Hours — 6 forcing questions |
| `/plan-ceo-review` | CEO/Founder — 4 scope modes |
| `/plan-eng-review` | Eng Manager — architecture lock-in |
| `/plan-design-review` | Senior Designer — 0-10 rating |
| `/plan-devex-review` | DX Lead — developer experience |
| `/design-consultation` | Design Partner — full design system |
| `/autoplan` | Auto-review pipeline (CEO→design→eng) |

### 🎨 Design
| Skill | Role |
|-------|------|
| `/design-shotgun` | "Show me options" — 4-6 AI mockup variants |
| `/design-html` | Production HTML from mockups (Pretext) |
| `/design-review` | Designer's eye QA + atomic fixes |

### 🔧 Build & Review
| Skill | Role |
|-------|------|
| `/review` | Staff Engineer — pre-landing PR review |
| `/codex` | Second opinion from Codex CLI |
| `/cso` | Chief Security Officer — OWASP+STRIDE |
| `/investigate` | Root-cause debugger |

### 🧪 Test
| Skill | Role |
|-------|------|
| `/qa` | QA Lead — test, find, fix, re-verify |
| `/qa-only` | Bug report without code changes |
| `/browse` | Real browser with eyes (~100ms/cmd) |

### 🚀 Ship & Monitor
| Skill | Role |
|-------|------|
| `/ship` | Release Engineer — tests, PR, deploy |
| `/land-and-deploy` | Merge → CI → verify production |
| `/canary` | Post-deploy monitoring |
| `/benchmark` | Performance regression detection |
| `/document-release` | Auto-update all project docs |

### 🛡️ Safety
| Skill | Role |
|-------|------|
| `/careful` | Destructive command warnings |
| `/freeze` | Restrict edits to one directory |
| `/guard` | Full safety (careful+freeze) |

## Install (30 seconds)

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

Works on 10 agents: Claude Code, Codex, OpenCode, Cursor, Factory, Slate, Kiro, Hermes, GBrain.

## When to Use

- Structured AI-driven development sprints
- CEO/design/engineering plan reviews
- Automated QA testing in real browsers
- Production-safe shipping with guardrails
- Security audits (OWASP Top 10 + STRIDE)
- Keeping docs in sync with code
