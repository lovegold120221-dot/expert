---
name: showcase-production-director
version: "1.0.0"
description: "Master orchestrator for long-form YouTube app showcase and tutorial video production. Manages the full 11-agent workforce: assigns tasks, enforces quality, ensures real screen recordings are the main footage (not screenshots), and delivers a 10-15 minute 1920x1080 MP4 tutorial. Delegates to app-intake-and-brief-agent, tutorial-script-agent, screen-capture-planner-agent, screen-recording-agent, free-media-source-agent, local-visual-generation-agent, storyboard-agent, voice-caption-agent, remotion-editor-agent, and final-quality-check-agent. Trigger: 'create an app showcase video', 'create a tutorial video for our app', 'make a YouTube tutorial', 'produce an app walkthrough', or any request for a long-form tutorial video."
---

# Showcase Production Director

Master orchestrator for the **11-agent app-showcase workforce**. This is the entry point for any request to create a long-form YouTube tutorial or app showcase video.

## Default Goal

Create a **10-to-15-minute** YouTube tutorial/app showcase video using **real screen recordings** as the main footage. Screenshots are fallback only.

## Default Output

- Resolution: 1920×1080
- Frame rate: 30 FPS
- Duration: 10–15 minutes
- Final file: `./out/final/youtube-app-tutorial.mp4`
- All reports: `./metadata/`

## Default Chapters

| Time | Section |
|------|---------|
| 0:00 | Preview / strongest result |
| 0:30 | Intro and promise |
| 1:15 | App overview |
| 2:30 | Setup or starting point |
| 4:00 | Feature 1 walkthrough |
| 6:00 | Feature 2 walkthrough |
| 8:00 | Feature 3 walkthrough |
| 10:00 | Full workflow demo |
| 12:30 | Tips / best practices |
| 14:00 | Recap and CTA |

## The 11-Agent Workforce

```
showcase-production-director (YOU)
│
├── 1. app-intake-and-brief-agent
│     Understands the app → outputs production brief
│
├── 2. tutorial-script-agent
│     Writes timestamped YouTube script with narration + screen actions
│
├── 3. screen-capture-planner-agent
│     Creates detailed shot list for real screen recording
│
├── 4. screen-recording-agent
│     Records browser/macOS/Windows/screen-share footage
│
├── 5. free-media-source-agent
│     Finds free supporting images/videos (no API keys)
│
├── 6. local-visual-generation-agent
│     Generates support visuals locally (intro/outro/thumbnail/transitions)
│
├── 7. storyboard-agent
│     Creates editing timeline with timestamps + transitions + cues
│
├── 8. voice-caption-agent
│     Creates narration + SRT/VTT captions + lower-thirds
│
├── 9. remotion-editor-agent
│     Edits and renders with Remotion + FFmpeg
│
└── 10. final-quality-check-agent
      Reviews final video against quality checklist
```

## Default Workflow

```
Step  Agent                          Output
────  ─────────────────────────────  ──────────────────────────
  1   app-intake-and-brief-agent     production-brief.md
  2   tutorial-script-agent          tutorial-script.md (timestamped)
  3   screen-capture-planner-agent   shot-list.md
  4   screen-recording-agent         ./assets/screen-recordings/*.mp4
  5   free-media-source-agent        ./assets/source-images+videos/ + metadata
  6   local-visual-generation-agent  ./assets/generated-images+videos/ + metadata
  7   storyboard-agent               storyboard.md with precise timeline
  8   voice-caption-agent            narration.mp3 + captions.srt + captions.vtt
  9   remotion-editor-agent          ./out/final/youtube-app-tutorial.mp4
 10   final-quality-check-agent      qa-report.md
```

## When to Invoke

Invoke this skill when the user says:

- "Create an app showcase video"
- "Create a tutorial video for our app"
- "Make a YouTube tutorial for [app name]"
- "Produce an app walkthrough"
- "Record a demo of our product"
- "Make a getting started tutorial"
- "Create a feature overview video"

## Default Rule: Real Recordings First

This workforce defaults to **real screen recordings** as the primary footage. Screenshots are used **only** as fallback when recording is impossible. The `screen-capture-planner-agent` and `screen-recording-agent` are mandatory steps, not optional.

## Folder Structure

```
project/
├── assets/
│   ├── screen-recordings/      # Real recorded footage (primary)
│   ├── browser-recordings/     # Browser-based recordings
│   ├── mac-recordings/         # macOS native recordings
│   ├── windows-recordings/     # Windows recordings
│   ├── source-images/          # Free stock images
│   ├── source-videos/          # Free stock video clips
│   ├── generated-images/       # Locally generated images
│   ├── generated-videos/       # Locally generated video clips
│   ├── audio/                  # Audio assets
│   ├── music/                  # Background music
│   ├── voiceover/              # Narration audio
│   └── captions/               # SRT/VTT subtitle files
├── out/
│   ├── images/                 # Rendered stills
│   ├── videos/                 # Rendered clips
│   └── final/                  # ← FINAL EXPORT
├── metadata/
│   ├── source-assets/          # Metadata for stock assets
│   ├── generated-assets/       # Metadata for generated assets
│   ├── screen-captures/        # Metadata for screen recordings
│   ├── renders/                # Metadata for rendered outputs
│   └── qa/                     # QA reports
├── workflows/
│   └── comfyui/                # ComfyUI workflow JSONs
└── templates/
    ├── remotion/               # Remotion project templates
    ├── scripts/                # Reusable scripts
    └── storyboards/            # Storyboard templates
```

## Quality Gates

Before moving from one step to the next, verify:

1. **Brief → Script**: Brief clearly identifies 3 features, audience, goal, CTA
2. **Script → Shot List**: Script has timestamps, every timestamp has a screen action
3. **Shot List → Recording**: Every shot has a concrete recording plan (which browser, which data, which flow)
4. **Recording → Storyboard**: All critical clips exist and have correct duration
5. **Storyboard → Captions**: Timestamps in storyboard match audio timing
6. **Captions → Edit**: Captions timed to narration, no UI obstruction
7. **Edit → QA**: Video exists at 1920×1080, 30fps, proper length
8. **QA → Final**: QA report passes all checks

## Delegation

When executing this workflow, invoke each agent skill sequentially using the Task tool:

```
Task: showcase-production-director (this skill)
  → orchestrator, assigns work to each agent
  → verifies outputs before proceeding to next step
  → collects all outputs and metadata
  → returns final video + reports
```

Each agent skill contains its own detailed instructions. The director's job is workflow management and quality enforcement, not doing every task manually.

## Related Skills

- `app-intake-and-brief-agent` — App understanding & brief
- `tutorial-script-agent` — Timestamped YouTube script
- `screen-capture-planner-agent` — Shot list planning
- `screen-recording-agent` — Real screen recording
- `free-media-source-agent` — Free stock media sourcing
- `local-visual-generation-agent` — Local AI visual generation
- `storyboard-agent` — Editing timeline
- `voice-caption-agent` — Narration + captions
- `remotion-editor-agent` — Remotion + FFmpeg editing
- `final-quality-check-agent` — QA review
- `free-image-source` — Stock image sourcing (lower-level)
- `free-video-source` — Stock video sourcing (lower-level)
- `local-image-gen` — Local image generation (lower-level)
- `local-video-gen` — Local video generation (lower-level)
- `comfyui-workflows` — ComfyUI advanced workflows (lower-level)
- `video-editing-assembly` — Video assembly (lower-level)
