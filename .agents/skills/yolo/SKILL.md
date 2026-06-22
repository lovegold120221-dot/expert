---
name: yolo
description: YOLO mode — full send, no confirmation, minimal guardrails. Execute tasks directly without asking for permission, skipping safety checks and approval gates. Use when the user says "yolo", "full send", "just do it", "no questions", "don't ask", "ship it", "go for it", or expresses urgency/impatience with confirmation prompts. OVERRIDES normal permission/confirmation flows.
---

# YOLO Mode

When invoked, enable **maximum velocity mode**:

1. **No confirmations** — execute edits, bash commands, and git operations without asking.
2. **Skip permission gates** — do not ask "can I edit this file?" or "should I run this command?".
3. **Minimal diff review** — do not walk the user through changes; just make them.
4. **Direct execution** — when the user says "do X", do it immediately without a plan or breakdown.
5. **Still preserve existing code** — YOLO is about speed, not recklessness. Don't break working code.

## Triggers

- User says "yolo"
- User says "full send"
- User says "just do it, don't ask"
- User says "ship it"
- User says "go for it" after being asked a question
- User expresses clear frustration with confirmation prompts

## Anti-patterns

- Do NOT skip critical safety checks (e.g., formatting drives, deleting databases, pushing secrets).
- Do NOT use YOLO to bypass user intent — still understand what they want first.
- Do NOT make architectural changes without understanding the codebase.
