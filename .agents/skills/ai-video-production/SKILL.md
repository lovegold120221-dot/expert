---
name: ai-video-production
description: "Full AI video production pipeline — voiceover TTS, music generation, sound effects, Remotion compositing, timing sync, cloud GPU rendering, watermark removal, scene chaining, and upscaling. Use when the user asks to: create a full video production pipeline, generate voiceover for video, add background music to video, compose AI-generated music for scenes, sync audio timing with video scenes, chain video clips with continuity, build video with Remotion, remove watermarks from video, upscale video, set up cloud GPU rendering for video, create talking head from portrait+audio, produce a complete video from script to render. Reference: github.com/lovegold120221-dot/claude-code-video-toolkit — production video toolkit with templates, tools, and cloud GPU infrastructure."
---

# AI Video Production Pipeline

End-to-end AI video production — from voiceover and music to Remotion compositing, timing sync, cloud GPU rendering, and final export.

## Production Workflow Overview

```
SCRIPT → VOICEOVER → SCENE IMAGES/VIDEOS → MUSIC + SFX → COMPOSITE → TIMING SYNC → RENDER
```

## Voiceover Generation

### ElevenLabs (Production Quality)

```bash
# Prerequisites
pip install elevenlabs python-dotenv
echo "ELEVENLABS_API_KEY=your_key" >> .env
echo "ELEVENLABS_VOICE_ID=your_voice_id" >> .env

# Single file
python tools/voiceover.py --script VOICEOVER-SCRIPT.md --output public/audio/voiceover.mp3

# Per-scene mode (recommended) — generates one .mp3 per .txt file
python tools/voiceover.py --scene-dir public/audio/scenes --json

# Per-scene + concatenate for SadTalker
python tools/voiceover.py --scene-dir public/audio/scenes --concat public/audio/voiceover-all.mp3 --json
```

**Settings**: stability=0.85 (consistent), similarity=0.95 (close to original), style=0.0 (neutral), speed=1.0

### Qwen3-TTS (Free, Self-Hosted)

```bash
# Requires RunPod endpoint (--setup first time)
python tools/qwen3_tts.py --setup

# Generate
python tools/voiceover.py --provider qwen3 --speaker Ryan --scene-dir public/audio/scenes --json

# With emotion/tone control
python tools/voiceover.py --provider qwen3 --tone warm --scene-dir public/audio/scenes --json
python tools/voiceover.py --provider qwen3 --instruct "Speak warmly" --script script.txt --output out.mp3

# Voice clone mode
python tools/voiceover.py --provider qwen3 --ref-audio ref.wav --ref-text "transcript" --scene-dir public/audio/scenes --json
```

**Qwen3-TTS Speakers**: Ryan, Aiden, Vivian, Serena, Uncle_Fu, Dylan, Eric, Ono_Anna, Sohee

**Tone Presets**: warm, professional, energetic, calm, authoritative, friendly

## Music Generation (ACE-Step 1.5)

### Scene Presets for Video Production

| Preset | Vibe | BPM | Key | Best For |
|--------|------|-----|-----|----------|
| `corporate-bg` | Subtle, professional | 110 | C Major | Background for demos |
| `upbeat-tech` | Energetic, inspiring | 128 | G Major | Product launches, intros |
| `ambient` | Calm, reflective | 72 | D Major | Overview slides, narration |
| `dramatic` | Cinematic, epic | 90 | D Minor | Problem statement, reveals |
| `tension` | Dark, ominous | 85 | A Minor | Problem/setup phase |
| `hopeful` | Bright, optimistic | 120 | C Major | Solution reveal, resolution |
| `cta` | Punchy, motivating | 135 | E Major | Call to action, ending |
| `lofi` | Relaxed, chill | 85 | F Major | Screen recordings, coding |

### Usage

```bash
# Install
pip install requests python-dotenv
echo "ACEMUSIC_API_KEY=your_key" >> .env  # Free key: https://acemusic.ai/api-key

# Scene preset
python tools/music_gen.py --preset corporate-bg --duration 60 --output bg.mp3
python tools/music_gen.py --preset tension --duration 20 --output problem-music.mp3
python tools/music_gen.py --preset hopeful --duration 15 --output solution-music.mp3

# With BPM/key control
python tools/music_gen.py --prompt "Upbeat electronic" --duration 30 --bpm 128 --key "G Major" --output intro.mp3

# Generate 4 variations, pick the best
python tools/music_gen.py --prompt "Upbeat tech" --duration 30 --variations 4 --output variations.mp3

# With brand style hints
python tools/music_gen.py --preset cta --brand digital-samba --duration 15 --output cta.mp3

# Vocal music with lyrics
python tools/music_gen.py --prompt "Indie pop" --lyrics "Hello world\nWe build together" --duration 30 --output jingle.mp3

# Cover / style transfer
python tools/music_gen.py --cover --reference theme.mp3 --prompt "Same style, longer" --duration 90 --output extended.mp3

# Stem extraction
python tools/music_gen.py --extract vocals --input mixed.mp3 --output vocals.mp3
```

## Sound Effects

```bash
# Generate SFX using ElevenLabs
python tools/sfx.py --preset whoosh --output sfx/whoosh.mp3
```

## Timing Sync (Audio → Scene Duration)

After generating per-scene voiceover audio, actual durations often differ from estimates. This tool automates the feedback loop:

```bash
# Dry run (compare only)
python tools/sync_timing.py

# Apply timing updates to Remotion config (creates .bak)
python tools/sync_timing.py --apply

# Custom padding
python tools/sync_timing.py --apply --padding 1.5

# Machine-readable JSON output
python tools/sync_timing.py --json
```

**Recommended audio levels**:
- Narration: -6dB to -15dB
- Sound effects: -14dB to -20dB
- Background music: -18dB to -20dB

## Audio-anchored Timeline Strategy

For precise timing, generate audio FIRST, then anchor all visual timing to it:

1. Write voiceover script with time estimates per scene
2. Generate per-scene audio with `tools/voiceover.py --scene-dir`
3. Measure actual durations
4. Set video scene durations to match audio (or use `sync_timing.py --apply`)
5. Generate visuals to fit the locked timeline
6. Compose with music at -18dB ducked under voiceover

## Scene Chaining (LTX-2)

Chain video clips where each scene uses the last frame of the previous as input — seamless visual flow:

```bash
# Chain 10 scenes from a directory of images
python tools/chain_video.py \
  --scenes-dir projects/myproject/public/images/scenes/ \
  --output-dir projects/myproject/public/videos/chain/ \
  --prompt "Cinematic transition, flowing camera movement"

# Per-scene prompts from JSON
python tools/chain_video.py \
  --scenes-dir images/ --output-dir videos/ \
  --prompts-file scenes.json

# Resume from existing clip
python tools/chain_video.py \
  --first-clip output/chain-04.mp4 \
  --output-dir output/ --start 5 --end 30
```

## Cloud GPU Infrastructure

### Modal (Default)

```bash
# Setup
pip install modal
modal setup

# Env vars
echo "MODAL_TOKEN_ID=..." >> .env
echo "MODAL_TOKEN_SECRET=..." >> .env

# Deploy services (one time per service)
modal deploy docker/modal-ltx2/app.py
modal deploy docker/modal-qwen3-tts/app.py
modal deploy docker/modal-flux2/app.py

# Set endpoint URLs
echo "MODAL_LTX2_ENDPOINT_URL=..." >> .env
echo "MODAL_QWEN3_TTS_ENDPOINT_URL=..." >> .env
```

### RunPod (Alternative)

```bash
echo "RUNPOD_API_KEY=..." >> .env

# Setup per tool
python tools/music_gen.py --setup          # ACE-Step endpoint
python tools/qwen3_tts.py --setup          # Qwen3-TTS endpoint
python tools/sadtalker.py --setup          # SadTalker endpoint
```

## Talking Head (SadTalker)

Generate narrated talking head video from a portrait image + voiceover audio:

```bash
# Basic
python tools/sadtalker.py \
  --image portrait.png \
  --audio voiceover.mp3 \
  --preprocess full \
  --output talking.mp4

# With expression and size control
python tools/sadtalker.py \
  --image portrait.png \
  --audio voiceover.mp3 \
  --preprocess crop \
  --size 512 \
  --expression-scale 1.2 \
  --still \
  --output talking.mp4
```

## Watermark Removal

```bash
python tools/dewatermark.py \
  --input video.mp4 \
  --preset sora \
  --output clean.mp4 \
  --runpod

# Find watermark coordinates first
python tools/locate_watermark.py --input video.mp4 --grid --output-dir ./review/
```

## Image & Video Upscaling

```bash
python tools/upscale.py \
  --input photo.jpg \
  --output photo_4x.png \
  --scale 4 \
  --runpod
```

## Remotion Video Compositing

### Project Templates

| Template | Description | Best For |
|----------|-------------|----------|
| `sprint-review` | Sprint reviews with demos, stats, voiceover | Engineering demos |
| `sprint-review-v2` | Composable scenes with film-quality upgrades | Polished sprints |
| `product-demo` | Dark tech aesthetic, stats, CTA | Marketing videos |

### Setup

```bash
# Create project from template
cd projects/
mkdir my-video && cd my-video
npm init -y
npm install remotion @remotion/cli

# Start Remotion Studio
npx remotion studio
```

### Transitions

| Transition | Best For | Options |
|------------|----------|---------|
| Glitch | Tech demos, edgy reveals | intensity, slices, rgbShift |
| RGB Split | Modern tech, energetic | direction, displacement |
| Zoom Blur | CTAs, high-energy | direction, blurAmount |
| Light Leak | Celebrations, film aesthetic | temperature, direction |
| Clock Wipe | Time-related content | startAngle, direction |
| Pixelate | Retro/gaming themes | maxBlockSize, scanlines |
| Checkerboard | Playful reveals | gridSize, pattern (8 variants) |

### Compositing Components

| Component | Use |
|-----------|-----|
| `AnimatedBackground` | Floating shapes with variants (subtle, tech, warm, dark) |
| `SlideTransition` | Scene transitions (fade, zoom, slide-up, blur-fade) |
| `Label` | Floating label badge with optional JIRA reference |
| `Vignette` | Cinematic edge darkening overlay |
| `SplitScreen` | Side-by-side video comparison |
| `NarratorPiP` | Picture-in-picture presenter (works with SadTalker) |
| `FilmGrain` | SVG noise overlay for film texture |

## Brand Management

```bash
# Structure
brands/<name>/
├── brand.json    # Colors, fonts, personality, style
├── voice.json    # Voice ID for ElevenLabs or Qwen3 clone config
└── assets/       # Logos, images

# Use in music generation
python tools/music_gen.py --preset upbeat-tech --brand digital-samba --output bg.mp3
```

## Full Production Pipeline Example

```bash
# 1. Generate voiceover (per-scene)
python tools/voiceover.py --scene-dir projects/myvideo/public/audio/scenes/ --json

# 2. Sync timing
python tools/sync_timing.py --apply

# 3. Generate background music
python tools/music_gen.py --preset corporate-bg --duration 120 --output projects/myvideo/public/audio/bg.mp3

# 4. Render video (Remotion)
cd projects/myvideo && npx remotion render

# 5. Add music and audio mixing
python tools/addmusic.py \
  --input output/video.mp4 \
  --music public/audio/bg.mp3 \
  --music-volume -18 \
  --voiceover public/audio/voiceover.mp3 \
  --voiceover-volume -6 \
  --output final.mp4

# 6. (Optional) Upscale
python tools/upscale.py --input final.mp4 --output final_4k.mp4 --scale 4
```

## Experience Notes

Path: `{working-directory}/video-prod-memories/video-production.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
