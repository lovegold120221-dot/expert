---
name: screen-recording-agent
version: "1.0.0"
description: "Records real app footage from browser, macOS, Windows, desktop, or screen share. Saves raw clips to ./assets/screen-recordings/, ./assets/browser-recordings/, ./assets/mac-recordings/, or ./assets/windows-recordings/. If recording is impossible, uses screenshots with animated zoom, pan, cursor overlay, and callouts via the remotion-editor-agent. Fourth step in the showcase-production-director workforce."
---

# Screen Recording Agent

Records real app footage according to the shot list. This is the most critical step — real recordings are what make this a tutorial, not a slideshow.

## Input

- Shot list from `screen-capture-planner-agent` (`./metadata/shot-list.md`)

## Recording Methods (in priority order)

### 1. macOS QuickTime Player (Best for macOS)

```bash
# Open QuickTime Player
open -a "QuickTime Player"

# New Screen Recording
# File → New Screen Recording → Options → Record selected portion
# Set to 1920×1080
```

**Recommended settings**:
- Record selected portion (window or area)
- Show mouse clicks (enabled)
- Microphone: off (narration added later)
- Quality: Maximum

### 2. OBS Studio (Best for cross-platform + overlays)

```bash
# Install OBS
brew install --cask obs

# Settings for tutorial recording:
# Video → Base resolution: 1920×1080
# Video → FPS: 30
# Output → Recording quality: Indistinguishable quality
# Output → Recording format: MP4
```

**OBS tips**: 
- Use "Display Capture" source for full screen
- Use "Window Capture" for single app (hides other windows)
- Add "Cursor" filter for highlighted cursor
- Use "Audio Output Capture" at minimum volume (for context, replaced by narration later)

### 3. Browser DevTools Recorder (Best for web apps)

```bash
# Chrome DevTools Recorder
# Open DevTools (Cmd+Option+I) → Click "Recorder" tab
# → Create a new recording → Record
# Saves as JSON/Puppeteer script — can replay consistently
```

**Chrome Recorder**:
- Records exact interactions
- Can replay for consistent takes
- Export as video via Puppeteer + Remotion
- Best for: web apps where you need pixel-perfect repeating takes

### 4. Screenshot Fallback (Only When Recording Is Impossible)

If recording is genuinely impossible (no access, sandboxed environment, no permissions):

1. Take screenshots at 1920×1080
2. Save to `./assets/screen-recordings/` with scene ID
3. Add `_FALLBACK` suffix to filename
4. Document exactly which elements need zoom/cursor animation

The `remotion-editor-agent` will handle animation for fallbacks.

## Recording Quality Checklist

Before each take:

- [ ] Display set to 1920×1080 (not Retina 2x)
- [ ] 30 FPS confirmed
- [ ] Clean demo data loaded
- [ ] No visible bookmarks bar
- [ ] No visible extensions
- [ ] No notifications (Do Not Disturb ON)
- [ ] No microphone audio (will add narration later)
- [ ] App fully loaded and ready
- [ ] Cursor visible and standard size
- [ ] Recording area confirmed

## Recording Tips

**Per scene**:
- Record 2-3 takes of each scene (choose the best in editing)
- Pause 2 seconds before first click and 2 seconds after last action
- Move cursor smoothly — no teleporting
- Use keyboard shortcuts where they're faster (Cmd+N, Cmd+S, etc.)
- If you make a mistake, pause 3s, then restart the action (editors can cut around it)

**Cursor**:
- Avoid hover-highlighting random elements
- Keep cursor movement purposeful and smooth
- If showing a dropdown or hover state, move slowly to the trigger

**Data safety**:
```markdown
Replace all real data with demo data:
- Emails:     demo@example.com or firstname.lastname@demo.org
- Names:      Jane Doe, John Smith (fictional)
- Companies:  Acme Corp, Demo Inc.
- API Keys:   sk-demo-xxxxxxxxxxxxxxxx
- Passwords:  Use a single demo password like "Demo123!"
- Credit cards: 4242 4242 4242 4242 (test card)
- Phone:      (555) 000-0000
```

## File Output

Save each clip to:

```
./assets/screen-recordings/scene-01-preview.mp4
./assets/screen-recordings/scene-02-dashboard-overview.mp4
./assets/screen-recordings/scene-03-starting-point.mp4
...
```

With corresponding metadata in `./metadata/screen-captures/`:

```json
{
  "scene_id": "scene-01-preview",
  "filename": "assets/screen-recordings/scene-01-preview.mp4",
  "duration_seconds": 35.0,
  "resolution": {"width": 1920, "height": 1080},
  "fps": 30,
  "recording_method": "quicktime",
  "takes": 2,
  "selected_take": 2,
  "demo_data_used": "demo@example.com",
  "pii_checked": true,
  "fallback": false,
  "recorded_at": "2026-06-20T12:00:00Z",
  "notes": "Best take. Cursor movement smooth, no mistakes."
}
```

## Handoff

Pass all recorded clips and their metadata to `free-media-source-agent` (to source supplementary material if needed) and then to `storyboard-agent`.

## Prohibited

- ❌ No screen recordings containing real emails, passwords, API keys, tokens, or customer data
- ❌ No screen recordings with notifications popping up
- ❌ No recordings below 1920×1080
- ❌ No skipping recording and going straight to screenshots

## Related Skills

- `screen-capture-planner-agent` — Input: shot list
- `storyboard-agent` — Next step
- `remotion-editor-agent` — Handles fallback animation
- `showcase-production-director` — Master orchestrator
