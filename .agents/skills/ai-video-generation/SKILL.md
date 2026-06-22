---
name: ai-video-generation
description: "AI video generation using 100+ t2v/i2v/lipsync models via Muapi API and Open Generative AI. Use when the user asks to: generate AI video from text, animate a still image into video, create lip-sync talking head from portrait+audio, generate cinematic AI video, produce AI video content, create AI short films, use Kling/Sora/Veo/Wan/Seedance/Hailuo/Runway to make video. Also applies to: text-to-video generation, image-to-video animation, AI video prompt engineering, AI video scene planning, lip-sync video creation, AI video model selection, AI video API integration, video generation workflow optimization. Reference: github.com/lovegold120221-dot/Open-Generative-AI — 100+ models, Muapi API, and production prompt engineering."
---

# AI Video Generation

Comprehensive AI video generation patterns using 100+ text-to-video, image-to-video, and lip-sync models via the Muapi API and Open Generative AI platform.

## Video Generation API Pattern (Muapi)

All video models follow a consistent two-step pattern:

```
POST /api/v1/{model-endpoint}   → returns request_id
GET  /api/v1/predictions/{request_id}/result  → poll until status=completed
```

### Authentication

- **Header**: `x-api-key: YOUR_MUAPI_KEY`
- **Base URL**: `https://api.muapi.ai`
- Get a key: https://muapi.ai/access-keys

### Text-to-Video Request

```bash
# Step 1: Submit
curl -X POST https://api.muapi.ai/api/v1/{model-endpoint} \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{
    "prompt": "Cinematic drone shot over a misty mountain range at sunrise",
    "aspect_ratio": "16:9",
    "duration": 5,
    "resolution": "720p"
  }'

# Step 2: Poll (replace REQUEST_ID)
curl https://api.muapi.ai/api/v1/predictions/REQUEST_ID/result \
  -H "x-api-key: YOUR_KEY"
```

### Image-to-Video Request

```bash
curl -X POST https://api.muapi.ai/api/v1/{model-endpoint} \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{
    "prompt": "A serene lake at sunset, gentle ripples",
    "image_url": "https://hosted-image-url.jpg",
    "aspect_ratio": "16:9",
    "duration": 5
  }'
```

### File Upload

```bash
curl -X POST https://api.muapi.ai/api/v1/upload_file \
  -H "x-api-key: YOUR_KEY" \
  -F "file=@/path/to/image.jpg"
# Returns: {"url": "https://..."}
```

### Lip-Sync Request

```bash
# Portrait image + audio → talking video
curl -X POST https://api.muapi.ai/api/v1/{lipsync-endpoint} \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{
    "image_url": "https://portrait.jpg",
    "audio_url": "https://voiceover.mp3",
    "prompt": "A person speaking naturally",
    "resolution": "720p"
  }'
```

## Model Catalog

### Text-to-Video (40+ models)

| Model | ID | Durations | Resolutions | ARs |
|-------|-----|-----------|-------------|-----|
| Kling 3.0 Pro | `kling-v3.0-pro-t2v` | 5/10s | 720p/1080p | 16:9, 9:16, 1:1 |
| Kling 3.0 Std | `kling-v3.0-std-t2v` | 5/10s | 720p/1080p | 16:9, 9:16, 1:1 |
| Kling v2.1 | `kling-v2.1-std-t2v` | 5/10s | 720p/1080p | 16:9, 9:16 |
| Sora 2.0 | `sora-v2-t2v` | 5/10/15s | 480p/720p/1080p | 16:9, 9:16, 1:1 |
| Veo 3.1 | `veo3-t2v` | 5/8s | 720p/1080p | 16:9, 9:16 |
| Veo 3.0 | `veo3-t2v-lite` | 5/8s | 720p | 16:9, 9:16 |
| Wan 2.6 | `wan2.6-t2v` | 5s | 480p/720p | 16:9, 9:16 |
| Wan 2.2 | `wan2.2-t2v` | 5s | 480p/720p | 16:9, 9:16 |
| Seedance 2.0 | `seedance-v2.0-t2v` | 5/10/15s | 480p/720p | 16:9, 9:16, 4:3, 3:4 |
| Seedance Pro | `seedance-pro-t2v` | 3-12s | 480p/720p/1080p | 16:9, 9:16, 1:1, 4:3 |
| Seedance Lite | `seedance-lite-t2v` | 3-12s | 480p/720p/1080p | 16:9, 9:16, 1:1, 4:3 |
| Hailuo 2.3 Pro | `hailuo-2.3-pro-t2v` | 5/10s | 720p/1080p | 16:9, 9:16, 1:1 |
| Hailuo 2.3 Std | `hailuo-2.3-standard-t2v` | 5/10s | 720p/1080p | 16:9, 9:16, 1:1 |
| Runway Gen-3 | `runway-gen3-t2v` | 5/10s | 720p | 16:9, 9:16 |
| MiniMax Hailuo 02 | `minimax-hailuo-02-t2v` | 5/10s | 720p/1080p | 16:9, 9:16, 1:1 |
| Grok Imagine | `grok-imagine-t2v` | 6/10/15s | 720p/1080p | 9:16, 16:9, 2:3, 3:2, 1:1 |
| CogVideoX | `cogvideox-t2v` | 5s | 480p/720p | 16:9, 9:16, 1:1 |
| Pika | `pika-t2v` | 3/5s | 480p/720p | 16:9, 9:16, 1:1 |

### Image-to-Video (60+ models)

| Model | ID | Durations | Resolutions | Notes |
|-------|-----|-----------|-------------|-------|
| Kling 3.0 Pro I2V | `kling-v3.0-pro-i2v` | 5/10s | 720p/1080p | High quality animation |
| Kling v2.1 I2V | `kling-v2.1-std-i2v` | 5/10s | 720p/1080p | Good quality/cost balance |
| Veo 3.1 I2V | `veo3-i2v` | 5/8s | 720p/1080p | Google's best |
| Runway I2V | `runway-gen3-i2v` | 5/10s | 720p | Fast and reliable |
| Wan 2.6 I2V | `wan2.6-i2v` | 5s | 480p/720p | Free tier available |
| Seedance 2.0 I2V | `seedance-v2.0-i2v` | 5/10/15s | 480p/720p | Up to 9 ref images |
| Midjourney v7 I2V | `midjourney-v7-i2v` | 5/10s | 720p/1080p | Artistic quality |
| Hunyuan I2V | `hunyuan-i2v` | 5s | 480p/720p | Open source |
| AI Video Effects | `ai-video-effects` | 5s | 480p/720p | 50+ effect presets |
| LTX 2.3 I2V | `ltx-2.3-i2v` | 5s | 480p/720p/1080p | Fast |

### Lip-Sync (9 models)

**Image + Audio → Video:**
| Model | ID | Resolutions | Prompt |
|-------|-----|-------------|--------|
| Infinite Talk | `infinitetalk-image-to-video` | 480p, 720p | Optional |
| Wan 2.2 Speech to Video | `wan2.2-speech-to-video` | 480p, 720p | Optional |
| LTX 2.3 Lipsync | `ltx-2.3-lipsync` | 480p, 720p, 1080p | Optional |
| LTX 2 19B Lipsync | `ltx-2-19b-lipsync` | 480p, 720p, 1080p | Optional |

**Video + Audio → Lipsync Video:**
| Model | ID | Notes |
|-------|-----|-------|
| Sync Lipsync | `sync-lipsync` | Fast |
| LatentSync | `latentsync-video` | High quality |
| Creatify Lipsync | `creatify-lipsync` | Commercial grade |
| Veed Lipsync | `veed-lipsync` | Production ready |
| Infinite Talk V2V | `infinitetalk-video-to-video` | Optional prompt |

### Video-to-Video (4 models)

| Model | ID | Description |
|-------|-----|-------------|
| Watermark Remover | `video-watermark-remover` | Remove logos, captions, text |
| Kling 2.6 Std Motion Control | `kling-v2.6-std-motion-control` | Camera + subject motion control |
| Kling 3.0 Std Motion Control | `kling-v3.0-std-motion-control` | Precise camera/subject movement |
| Kling 3.0 Pro Motion Control | `kling-v3.0-pro-motion-control` | Highest detail motion control |

## Video Prompt Engineering

### The 5-Part Cinematic Formula

For professional results, structure every video prompt with all five components:

```
[CINEMATOGRAPHY] + [SUBJECT] + [ACTION] + [CONTEXT] + [STYLE]
```

**Example:**
```
"Low-angle tracking shot of a knight in silver armor
 walking through a misty ancient forest at dawn,
 cinematic 16mm film texture, volumetric lighting"
```

| Component | Examples |
|-----------|----------|
| **Cinematography** | drone shot, low-angle tracking shot, close-up, wide establishing shot, over-the-shoulder, POV, crane shot, Dutch angle, handheld, Steadicam |
| **Subject** | a wolf, a cyberpunk hacker, a vintage car, a woman in red dress, a floating island, a mechanical dragon |
| **Action** | walking through, running away from, gazing at, transforming into, soaring above, fighting against, dancing with |
| **Context** | misty ancient forest at dawn, neon-lit Tokyo alley at midnight, abandoned warehouse, tropical beach during golden hour, futuristic cityscape |
| **Style** | cinematic 16mm film texture, volumetric lighting, Blade Runner aesthetic, Studio Ghibli colors, hyper-realistic 8K, moody noir, vintage 1970s film grain |

### Advanced Prompt Tips

- **Be overly specific**: Don't say "a person" — specify clothing, hair color, age, expression, pose
- **Camera direction**: Always specify shot type and camera movement for cinematic feel
- **Lighting**: Include time of day, light source, quality (hard/soft), and color temperature
- **Consistency across scenes**: Repeat key character descriptions, locations, and lighting in EVERY prompt
- **Negative prompting**: Explicitly exclude unwanted elements ("blurry", "static", "distorted faces", "extra limbs")
- **Duration consideration**: Shorter prompts with stronger visual anchor work better for 3-5s clips; detailed narrative descriptions work for 10-15s

### Scene Transitions

| Technique | Description | Best For |
|-----------|-------------|----------|
| Direct cut | End one scene, start another | Fast pacing |
| Last-frame chaining | Use final frame of scene N as input for scene N+1 | Seamless visual flow |
| Establishing shot | Wide shot before cutting to scene | Spatial orientation |
| Motion continuity | Match camera movement direction across cuts | Smooth visual flow |
| Color match | End and start scenes with similar color palettes | Aesthetic coherence |

## Video Generation Workflow

### Step 1: Plan Scenes

Before generating anything, write a scene-by-scene plan:

```
Scene 01: Title card — 3s — static
Scene 02: Establishing drone shot of city — 5s
Scene 03: Close-up of character in cafe — 5s
Scene 04: Transition — sunset over skyline — 5s
Scene 05: Resolution — character walking away — 5s
```

### Step 2: Write Scene Prompts

For each scene, write a complete prompt using the 5-part formula. Be consistent with character names, locations, and style across all prompts.

### Step 3: Generate Preview Shots

Before generating full clips, preview 2-3 options for each scene. Keep the generation page open to retain previews (refreshing can lose them).

### Step 4: Generate Final Clips

Once scenes are locked, generate final clips at target resolution. Use higher-end models (Kling 3.0 Pro, Veo 3.1, Sora 2.0) for hero scenes and faster/cheaper models for transitions.

### Step 5: Post-Process

- Generate voiceover/audio AFTER video is assembled (timing sync)
- Generate background music AFTER clips are assembled (match beats to scenes)
- Add sound effects for immersion
- Adjust audio levels: narration -6 to -15db, SFX -14 to -20db, music -18 to -20db

### Step 6: Lock and Export

Once finalized, LOCK your media files to prevent accidental edits. Export at highest resolution available.

## Model Selection Guide

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Cinematic hero shot | Kling 3.0 Pro, Veo 3.1, Sora 2.0 | Best quality, motion coherence |
| Character animation | Kling I2V, Midjourney I2V | Character consistency |
| Social media short | Hailuo 2.3, MiniMax Hailuo 02 | Fast, good quality |
| Talking head / presentation | LTX 2.3 Lipsync, Infinite Talk | Lip-sync precision |
| Fast iteration / draft | Seedance Lite, CogVideoX | Cheap and quick |
| Artistic / stylized | Runway Gen-3, Wan 2.6 | Creative freedom |
| Image-to-video animation | Kling I2V, Veo I2V | Best motion from still |
| Video effects / edit | AI Video Effects, V2V Motion Control | Transform existing video |
| Watermark removal | Video Watermark Remover | Clean up sourced clips |

## Experience Notes

Path: `{working-directory}/video-gen-memories/video-generation.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
