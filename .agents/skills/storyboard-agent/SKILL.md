---
name: storyboard-agent
version: "1.0.0"
description: "Creates the precise editing timeline with timestamps, narration, screen clips, UI actions, zooms, callouts, captions, transitions, music cues, and edit notes. Takes input from tutorial-script-agent, screen-recording-agent, free-media-source-agent, and local-visual-generation-agent. Produces a storyboard.md that the remotion-editor-agent executes. Seventh step in the showcase-production-director workforce."
---

# Storyboard Agent

Creates the precise editing timeline that the `remotion-editor-agent` will execute. This is the bridge between planning and editing.

## Input

- Tutorial script (`./metadata/tutorial-script.md`)
- Shot list (`./metadata/shot-list.md`)
- Screen recordings (`./assets/screen-recordings/`)
- Free sourced media + metadata
- Generated media + metadata

## Output: Storyboard Timeline

Save as `./metadata/storyboard.md`:

```markdown
# Storyboard: [App Name]
- Total duration: [calculated] minutes
- FPS: 30
- Resolution: 1920×1080

---

## Scene 1: Preview Hook
**Time**: 0:00 → 0:30 (30s = 900 frames)
**Audio**: Narration starts at 0:00, quiet music throughout

| Time | Layer | Clip | Action | Edit |
|------|-------|------|--------|------|
| 0:00 | V1 | preview.mp4 | Play full screen | Crossfade in 0.5s |
| 0:00 | A1 | narration-track.mp3 | "Look at what we can build..." | Volume 1.0 |
| 0:00 | A2 | background-music.mp3 | Start low | Volume 0.15 |
| 0:05 | TX | Title overlay | "App Name — Full Tutorial" | Slide up, hold |

**Transitions**: Crossfade to Scene 2 at 0:28 (2s overlap)
**Notes**: This is the hook. Trim the preview clip to the most impressive 25s.

---

## Scene 2: Intro + Promise
**Time**: 0:30 → 1:15 (45s = 1350 frames)
**Audio**: Narration continues

| Time | Layer | Clip | Action | Edit |
|------|-------|------|--------|------|
| 0:30 | V1 | scene-02-dashboard-overview.mp4 | Play from start | Crossfade from Scene 1 |
| 0:30 | TX | Lower-third | "App Overview" | Slide in left |
| 0:45 | FX | Zoom | To dashboard header | 2x zoom over 3s |

...and so on for all 9 scenes.
```

## Scene Structure Template

Every scene in the storyboard should follow this structure:

```markdown
## Scene [N]: [Title]
**Time**: [start] → [end] ([duration] = [frames] frames)
**Audio**: [narration + music notes]

| Time | Layer | Clip | Action | Edit |
|------|-------|------|--------|------|
| [T] | V1 | [clip filename] | [play/trim/loop] | [transition in] |
| [T] | A1 | narration | [narration text summary] | [volume] |
| [T] | A2 | music | [crescendo/dip/mute] | [volume] |
| [T] | TX | [text content] | [animate in/out] | [style] |
| [T] | FX | [zoom/callout/highlight] | [target element] | [duration] |
| [T] | B1 | [b-roll clip] | [overlay position] | [opacity] |
```

**Layer key**:
- V1 = Main video layer (screen recording)
- V2 = Secondary video (B-roll, PIP)
- A1 = Narration
- A2 = Background music
- TX = Text overlay (titles, labels, captions)
- FX = Effect (zoom, cursor highlight, callout circle)
- B1 = B-roll / supplementary footage
- CAP = Captions / subtitles

## Timing Rules

1. **Narration drives timing** — Scene durations match the spoken audio
2. **Pacing** — No visual static > 8 seconds without a cut, zoom, or cursor movement
3. **Cursor** — In screen recordings, the cursor IS the visual guide. Keep it moving smoothly
4. **B-roll** — Max 5 seconds continuous without returning to the screen recording
5. **Transitions** — 0.5s crossfade between major sections, 0.2s cut between related clips
6. **Text** — 3-5s minimum on screen for readability. 2s for lower-thirds
7. **Zoom** — 2-3s to zoom in, 2-3s hold, 2-3s to zoom out

## Handoff

Pass the storyboard to `voice-caption-agent` for narration and caption creation, then to `remotion-editor-agent` for editing.

## Related Skills

- `tutorial-script-agent` — Input (what to say)
- `screen-recording-agent` — Input (what to show)
- `voice-caption-agent` — Next step
- `remotion-editor-agent` — Execution step
- `showcase-production-director` — Master orchestrator
