---
name: final-quality-check-agent
version: "1.0.0"
description: "Reviews the final tutorial video against a strict quality checklist. Checks: first 30 seconds are strong, app UI is readable, footage is real screen recording (not just screenshots), chapters are logical, pacing fits 10-15 minutes, private data is hidden, captions don't block UI, all external media has source metadata, all generated media has prompt/model metadata, and final export is 1920×1080 MP4 at 30fps. Produces a QA report. Tenth and final step in the showcase-production-director workforce."
---

# Final Quality Check Agent

Reviews the final video strictly against quality standards. This is the last gate before delivery.

## Input

- Final video: `./out/final/youtube-app-tutorial.mp4`
- Render metadata: `./metadata/renders/render-log.json`
- All source metadata in `./metadata/source-assets/`
- All generation metadata in `./metadata/generated-assets/`
- Screen capture metadata in `./metadata/screen-captures/`
- Storyboard: `./metadata/storyboard.md`

## QA Checklist

### 1. Technical Checks

Run with FFprobe:

```bash
ffprobe -v quiet -print_format json -show_format -show_streams \
  out/final/youtube-app-tutorial.mp4 > /tmp/qa-probe.json
```

```json
{
  "check": "Resolution is 1920×1080",
  "pass": true,
  "actual": "1920×1080"
}
```

| # | Check | Method | Pass/Fail |
|---|-------|--------|-----------|
| 1.1 | Resolution is 1920×1080 | FFprobe | |
| 1.2 | Frame rate is 30 FPS | FFprobe | |
| 1.3 | Duration is 10-15 minutes | FFprobe | |
| 1.4 | Codec is H.264 | FFprobe | |
| 1.5 | Audio codec is AAC | FFprobe | |
| 1.6 | File size is reasonable (< 2GB for 15min) | Stat | |
| 1.7 | File plays without corruption | FFmpeg error check | |

### 2. Content Checks

Manual review of the video:

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 2.1 | First 30 seconds are strong (hook exists) | | |
| 2.2 | App UI is readable (not too small, blurry, or cropped) | | |
| 2.3 | Footage is REAL screen recording, not screenshots | | |
| 2.4 | Screen recordings dominate > 80% of runtime | | |
| 2.5 | No static slideshow segments > 10s | | |
| 2.6 | Chapters follow logical order | | |
| 2.7 | Pacing fits 10-15 minute format | | |
| 2.8 | Private data is hidden (emails, API keys, tokens, PII) | | |
| 2.9 | Captions do not block important UI elements | | |
| 2.10 | Captions are synchronized with narration | | |
| 2.11 | Narration audio is clear and at correct volume | | |
| 2.12 | Music (if present) is at appropriate background level | | |
| 2.13 | Zooms/callouts highlight the right UI elements | | |
| 2.14 | Transitions between scenes are smooth | | |
| 2.15 | CTA is clear at the end | | |

### 3. Metadata Checks

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 3.1 | Every external image has source metadata | | |
| 3.2 | Every external video has source metadata | | |
| 3.3 | Every source metadata includes: source URL, creator, license, attribution | | |
| 3.4 | Every generated image has metadata (engine, model, prompt, seed) | | |
| 3.5 | Every generated video has metadata (engine, source image, prompt) | | |
| 3.6 | Screen capture metadata is complete (scene ID, duration, resolution) | | |
| 3.7 | Screen capture metadata notes if fallback (screenshot) was used | | |
| 3.8 | Render metadata is complete | | |

### 4. Directory Structure Check

```bash
ls ./assets/screen-recordings/  # Should have scene-*.mp4 files
ls ./assets/captions/           # Should have captions.srt, captions.json
ls ./out/final/                 # Should have youtube-app-tutorial.mp4
ls ./metadata/source-assets/    # Should have source metadata files
ls ./metadata/generated-assets/ # Should have generation metadata files
ls ./metadata/screen-captures/  # Should have recording metadata files
ls ./metadata/renders/          # Should have render metadata
```

## QA Report Format

Save as `./metadata/qa/qa-report.md`:

```markdown
# QA Report: [App Name] Tutorial
- Reviewed: [date]
- Video: ./out/final/youtube-app-tutorial.mp4
- Duration: [X] minutes ([Y] seconds)
- Reviewer: final-quality-check-agent

## Summary
- **Status**: PASS / FAIL / CONDITIONAL PASS
- **Technical**: [X]/7 passed
- **Content**: [X]/15 passed
- **Metadata**: [X]/8 passed

## Technical Results
| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | Resolution 1920×1080 | ✅ PASS | Actual: 1920×1080 |
| 1.2 | 30 FPS | ✅ PASS | Actual: 30 fps |
| ...

## Content Results
| # | Check | Result | Notes |
|---|-------|--------|-------|
| 2.1 | Strong first 30s | ✅ PASS | Preview clip shows app output immediately |
| 2.2 | UI readable | ⚠️ MINOR | Dashboard text is small at full screen, zoom added |
| ...

## Metadata Results
| # | Check | Result | Notes |
|---|-------|--------|-------|
| 3.1 | External images have metadata | ✅ PASS | 3 files, all have metadata |
| ...

## Issues Found
### Critical (must fix before release)
- [none]

### Minor (fix if time permits)
- Dashboard text is small at full-frame. Consider adding a 1.5x zoom on step 2.

## Recommendation
**PASS** — Video meets all quality standards. Ready for publication.
```

## Pass/Fail Thresholds

| Category | Pass | Conditional Pass | Fail |
|----------|------|-----------------|------|
| Technical | All 7 pass | 6/7 pass (non-critical) | Any critical failure |
| Content | ≥ 13/15 pass | 10-12/15 pass | < 10/15 pass |
| Metadata | All 8 pass | 6-7/8 pass | < 6/8 pass |

## Decision

- **PASS**: Deliver final video + QA report
- **CONDITIONAL PASS**: Deliver with minor issue notes and fix recommendations
- **FAIL**: Return to `showcase-production-director` with specific issues to address

## Handoff

Return to `showcase-production-director`:
- ✅ Final video: `./out/final/youtube-app-tutorial.mp4`
- ✅ QA report: `./metadata/qa/qa-report.md`
- ✅ All metadata organized in `./metadata/`

## Related Skills

- `showcase-production-director` — Receives the final QA report
- `remotion-editor-agent` — Handles fixes if QA fails
- `screen-recording-agent` — If re-recording needed
