---
name: screen-capture-planner-agent
version: "1.0.0"
description: "Creates a detailed shot list for real screen recording based on the tutorial script. Plans browser, macOS, Windows, desktop app, or screen-share capture. Screenshots are fallback only. Specifies: which app/browser to use, demo data to prepare, cursor behavior, pauses, and clean state requirements. Third step in the showcase-production-director workforce."
---

# Screen Capture Planner Agent

Creates a detailed shot list for real screen recording, based on the timestamped script.

## Input

- Tutorial script from `tutorial-script-agent` (`./metadata/tutorial-script.md`)

## Capture Rules

Every shot must specify:

| Field | Required | Example |
|-------|----------|---------|
| Scene ID | Yes | `scene-02-dashboard-overview` |
| Timestamp | Yes | `0:30 - 1:15` |
| Recording source | Yes | Browser (Chrome), macOS app, Windows app, screen share |
| URL or app path | Yes | `https://app.example.com/dashboard` |
| Demo data needed | Yes | "Login as demo@example.com / password123" |
| Actions | Yes | "Click sidebar 'Projects' → select 'Demo Project' → wait 2s → click 'Settings'" |
| Cursor behavior | Yes | "Smooth move to top-right, pause 1s, click" |
| Zoom target | If needed | "Zoom to settings gear icon" |
| Callout text | If needed | "Settings Panel — configure your preferences" |
| PII to hide | If present | "Replace real email with demo@example.com" |

## Required Clips

The shot list MUST plan for these 9 core clips:

```markdown
# Shot List: [App Name]

## scene-01-preview.mp4
- **Timestamp**: 0:00 - 0:30
- **Source**: Browser (Chrome incognito)
- **URL**: [app URL with most impressive result loaded]
- **Actions**: Gentle cursor movement over key elements, no clicks needed
- **Duration**: 30 seconds (can be trimmed)
- **Notes**: This is the hook. Show the most impressive output first.

## scene-02-dashboard-overview.mp4
- **Timestamp**: 0:30 - 1:15
- **Source**: Browser (Chrome incognito)
- **URL**: [app dashboard URL]
- **Actions**: Slow pan across dashboard sections
- **Duration**: 45 seconds
- **Callouts**: "Dashboard — Central Hub", "Quick Actions", "Navigation"

## scene-03-starting-point.mp4
- **Timestamp**: 1:15 - 2:30
- **Source**: Browser (Chrome incognito, fresh session)
- **URL**: [login or landing page]
- **Actions**: Type email → type password → click signup/login → land on empty state
- **Duration**: 75 seconds
- **Demo data**: demo@example.com
- **Caution**: Hide real email/password fields

## scene-04-feature-1.mp4
- **Timestamp**: 2:30 - 4:00
- **Source**: Browser (Chrome)
- **Actions**: [Feature 1 specific flow]
- **Duration**: 90 seconds
- **Zoom**: [specific button/element to zoom to]

## scene-05-feature-2.mp4
- **Timestamp**: 4:00 - 6:00
- **Source**: Browser (Chrome)
- **Actions**: [Feature 2 specific flow]
- **Duration**: 120 seconds

## scene-06-feature-3.mp4
- **Timestamp**: 6:00 - 8:00
- **Source**: Browser (Chrome)
- **Actions**: [Feature 3 specific flow]
- **Duration**: 120 seconds

## scene-07-full-workflow.mp4
- **Timestamp**: 8:00 - 10:30
- **Source**: Browser (Chrome, fresh session)
- **Actions**: Complete end-to-end workflow using all 3 features
- **Duration**: 150 seconds
- **Notes**: Record in one take, natural pace. Can be sped up later.

## scene-08-tips.mp4
- **Timestamp**: 10:30 - 12:00
- **Source**: Browser (Chrome)
- **Actions**: Show 3-5 pro tips, each with a short demo
- **Duration**: 90 seconds
- **Pacing**: Quick cuts between tips

## scene-09-recap-cta.mp4
- **Timestamp**: 12:00 - duration end
- **Source**: Static or minimal cursor
- **Actions**: None needed — this is overlay/text
- **Duration**: 60 seconds
- **Notes**: Can be a logo screen or a final app summary screen
```

## Recording Preparation Checklist

Before recording each clip, verify:

- [ ] Clean browser session (incognito/private mode)
- [ ] Bookmarks bar hidden (Cmd+Shift+B)
- [ ] Extensions hidden that might appear in recording
- [ ] Demo data ready (dummy accounts, sample content)
- [ ] No real emails, API keys, tokens, credentials visible
- [ ] No customer data or private info visible
- [ ] Screen resolution set to 1920×1080
- [ ] Recording area confirmed (full screen or windowed)
- [ ] Notifications silenced (Do Not Disturb mode)
- [ ] Microphone muted (audio will be narration, not live)
- [ ] Cursor size set to normal or slightly larger
- [ ] Target app fully loaded before starting record

## Fallback: Screenshots

If real screen recording is impossible for a particular scene:

1. Take a screenshot at 1920×1080
2. Note the exact element/area that needs animation
3. The `remotion-editor-agent` will add: Ken Burns zoom, cursor overlay, callout labels
4. Document in the shot list: "FALLBACK — screenshot with animated zoom + cursor"

## Output

Save as `./metadata/shot-list.md` and pass to `screen-recording-agent`.

## Related Skills

- `tutorial-script-agent` — Input source
- `screen-recording-agent` — Next step: do the recording
- `remotion-editor-agent` — Post-processing (if fallback needed)
- `showcase-production-director` — Master orchestrator
