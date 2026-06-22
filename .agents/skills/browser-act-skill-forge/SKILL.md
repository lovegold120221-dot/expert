---
name: browser-act-skill-forge
description: "Forges reusable Skill packages (SKILL.md + scripts) from website exploration via browser-act — no re-exploration later. Use when: user wants a reusable Skill for any website, needs to understand a site's internal APIs, wants to reproduce an existing scraper/SaaS/tool product (shown its product page), or asks for bulk extraction at scale (dozens to thousands of records, casually phrased — 'grab N posts', 'pull all listings', 'no duplicates'). Unlike browser-act: reusable, not one-off. Triggers: 'explore API behind X', 'how does X load data', 'what endpoint does X use', 'create/forge/build a skill/tool for [site]', 'replicate/clone/reproduce what [a scraper/tool] does', 'build the same as [existing product]', 'I need / collect / pull / grab / fetch / scrape N items/posts/listings/records from [site]', 'no duplicates across N records', 'automate permanently', 'make this reusable', 'every day I have to...', 'monitor [site]', 'browser-act-skill-forge', 'forging a skill'. Also applies to: need to regularly extract data from a site, build a custom scraper, create a reusable web data tool, generate a social media monitoring skill, turn manual browser tasks into automated skills."
---

# BrowserAct Skill Forge

Turns any website's data extraction or operation needs into Agent-callable capabilities. User describes what data to get or what action to perform on which site; this Skill automatically explores implementation paths (API endpoints first, DOM fallback when no API), then generates deploy-ready Skill packages (SKILL.md + Python scripts) after verification. Explore once, reuse forever.

## Install Prerequisites

Make sure `browser-act` is installed and working first:

```bash
uv tool install browser-act-cli --python 3.12
browser-act --version
```

## The Skill Forge Workflow

```
Phase 1 (Requirements) → Phase 2 (Explore Site/API) → Phase 3 (Generate Skill) → Delivery (Test + Install + Execute)
```

### Phase 1 — Requirements Analysis

1. Identify: core objective, target site, execution intent, output directory
2. For vague requests → research candidate sites via web search
3. Decompose into independent capabilities
4. Confirm execution plan with user

### Phase 2 — Capability Exploration

Read the exploration reference based on type:
- **Extraction** → API endpoints first (fetch reproduction), then UI trigger + Network capture, then DOM extraction
- **Operation** → UI interaction flow mapping

**Priority**: API endpoints > Network capture > DOM extraction > AI workflow

### Phase 3 — Skill Generation

For each verified capability:
1. **Encapsulate JS** into `scripts/{feature-name}.py` (argparse + f-string JS)
2. **Verify** end-to-end: `python script.py {params}` → `eval "$(python script.py {params})"`
3. **Generate** SKILL.md per template with capability components, enum parameters, pagination

### Delivery Flow

1. Automated testing of all components
2. Install the Skill
3. Report results to user
4. Execute the user's original task (if execution intent was identified)

## Key Principles

- **Operational boundary = what user can manually do in browser** (copy-paste equivalence)
- **All data stays local** — traffic inspection, HAR, extraction on user's machine
- **Data access through browser only** — never through third-party APIs or scraping platforms
- **Partial success counts as success** — inform user about uncovered parts
- **Exploration cap**: 100 tool call steps maximum
- **Error handling**: deterministic failure = one attempt; transient failure = one retry

## Output Structure

```
output/{skill-name}/{site-slug}-{capability-slug}/
├── SKILL.md
└── scripts/
    └── {feature-name}.py
```

## Experience Notes

Path: `{working-directory}/browser-act-skill-forge-memories/forge.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: Append unexpected situations and conclusions.
