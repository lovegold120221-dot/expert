---
name: app-intake-and-brief-agent
version: "1.0.0"
description: "Understands the app, audience, features, use case, CTA, and video goal. Outputs a short production brief with top features, user benefits, required screens, and tutorial flow. First step in the showcase-production-director workforce. Use when asked to: analyze an app for a tutorial, create a production brief, define video goals and audience, list key features for a demo, or plan a tutorial structure."
---

# App Intake & Brief Agent

First step in the showcase production pipeline. Understands the app and produces a structured production brief.

## Input

Gather the following from the user (if not provided, ask):

- App name and URL
- One-sentence description
- Primary audience (developers, designers, general users, executives, etc.)
- Top 3-5 features to showcase
- What problem does the app solve?
- Desired CTA (sign up, download, learn more, buy, etc.)
- Any existing brand guidelines or style references
- Target platform (web, desktop, mobile)

## Output: Production Brief

Save as `./metadata/production-brief.md`:

```markdown
# Production Brief: [App Name]

## Overview
- **App**: [name]
- **URL**: [url]
- **Tagline**: [one-line description]
- **Audience**: [primary + secondary]
- **Video Goal**: [what should viewers do after watching]

## Top Features to Showcase
1. [Feature 1] — [benefit in one line]
2. [Feature 2] — [benefit in one line]
3. [Feature 3] — [benefit in one line]

## User Benefits
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

## Tutorial Flow
1. **Opening** — Hook with strongest result
2. **Intro** — What is this app and who is it for
3. **Start** — How to get started (signup/install/landing)
4. **Feature 1** — Walkthrough with real UI
5. **Feature 2** — Walkthrough with real UI
6. **Feature 3** — Walkthrough with real UI
7. **Full Workflow** — End-to-end demo
8. **Tips** — Pro tips and best practices
9. **CTA** — Recap and call to action

## Required Screens / Pages
- [ ] Login/signup page
- [ ] Dashboard/main landing
- [ ] Feature 1 page/section
- [ ] Feature 2 page/section
- [ ] Feature 3 page/section
- [ ] Settings/configuration (if relevant)
- [ ] Final result page

## Style Notes
- [brand colors, tone, visual preferences]

## Technical Requirements
- Record at 1920×1080, 30fps
- Clean demo data (no real emails, API keys, or PII)
- Browser: [Chrome/Safari/Firefox/Edge]
- Hide bookmarks bar if recording browser
- Use incognito/private mode for clean state
```

## Handoff

Pass the production brief to `tutorial-script-agent` as the input for script writing.

## Related Skills

- `tutorial-script-agent` — Next step: write the script
- `showcase-production-director` — Master orchestrator
