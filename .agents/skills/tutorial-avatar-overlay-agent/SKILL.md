---
name: tutorial-avatar-overlay-agent
version: "1.0.0"
description: "Creates a small rounded talking-head avatar video overlay for long-form YouTube tutorial and app showcase videos. Uses SadTalker as the primary talking-head generator with LivePortrait fallback. The avatar appears as a PiP overlay during intros, explanations, tips, recaps, and transitions. The screen recording remains the main footage. This agent runs as the 8.5th step in the showcase-production-director workforce, producing avatar video segments that the remotion-editor-agent composits into the final edit."
---

# Tutorial Avatar Overlay Agent

Creates a small rounded talking-head avatar video that appears occasionally as a picture-in-picture overlay inside long-form YouTube tutorial or app showcase videos. The screen recording remains the primary footage — the avatar is a supporting element.

## Input

| Input | Source | Format |
|-------|--------|--------|
| Avatar image | Generated via MFLUX/FLUX.1-schnell, or user-provided | PNG/JPG, square preferred, 512×512+ |
| Narration audio | Voice-caption-agent or user-provided | WAV/MP3, 16kHz+ |
| Script text | Tutorial script from tutorial-script-agent | `.md` or `.txt` |
| Storyboard | Storyboard from storyboard-agent | `.md` with timestamped scenes |
| Video target format | From showcase-production-director or user | 1920×1080, 30fps, MP4 |

## Output Files

All saved under the project root:

| File | Purpose |
|------|---------|
| `./assets/avatar/avatar.png` | The source avatar image (generated or provided) |
| `./assets/voiceover/avatar-line.wav` | Narration audio segment for the avatar |
| `./out/avatar/avatar-talking.mp4` | Final talking-head video from SadTalker/LivePortrait |
| `./out/avatar/avatar-talking-cropped.mp4` | Cropped face/shoulders version |
| `./metadata/avatar/avatar-generation.json` | Full metadata for the avatar generation |
| `./metadata/avatar/avatar-overlay-plan.json` | Timing and positioning plan for overlay segments |

## Folder Structure

```
assets/
├── avatar/              ← avatar source images
├── voiceover/           ← narration audio segments
out/
├── avatar/              ← generated talking-head videos
metadata/
├── avatar/              ← generation metadata, overlay plan
```

## Model Selection

### Primary: SadTalker (default)

**SadTalker** (⭐ 13.9k, CVPR 2023, Apache 2.0) — takes a single portrait image + audio and generates a talking-head video with realistic 3D motion coefficients, head pose, and lip sync.

- Repo: `github.com/OpenTalker/SadTalker`
- Local: expected at `~/SadTalker/` or `./models/SadTalker/`
- Best for: professional, stable talking-head with good lip-sync
- Enhancer support: GFPGAN for face restoration

### Fallback: LivePortrait

**LivePortrait** (⭐ 18.6k, by Kuaishou Technology / Kling AI Research) — efficient portrait animation with stitching and retargeting control. Better facial motion, expression, and head movement than SadTalker.

- Repo: `github.com/KlingAIResearch/LivePortrait`
- Local: expected at `~/LivePortrait/` or `./models/LivePortrait/`
- macOS: supports Apple Silicon (slower than NVIDIA, use `PYTORCH_ENABLE_MPS_FALLBACK=1`)
- Best for: more natural motion, stronger expressions, portrait video editing

### Advanced: MuseTalk

Use only when a strong NVIDIA/CUDA GPU is available (remote or local). Not recommended for Mac-local workflows.

- Requires: CUDA GPU with 8GB+ VRAM
- Best for: high-quality real-time lip-sync
- Do NOT attempt on macOS Apple Silicon

## SadTalker Generation Pipeline

### 1. Generate or Obtain Avatar Image

#### Option A: Generate Fictional Avatar (Recommended — No Permission Needed)

Use `local-image-gen` skill with MFLUX or FLUX.1-schnell to create a fictional branded avatar:

```bash
# Example using MFLUX (from local-image-gen skill)
python -m mflux.generate \
  --prompt "professional friendly brand spokesperson avatar, caucasian woman in her 30s, blonde hair, blue blazer, clean background, corporate style, high quality portrait, soft lighting, neutral expression, 8k" \
  --seed 42 \
  --steps 25 \
  --guidance 4.0 \
  --width 768 \
  --height 768 \
  --output ./assets/avatar/avatar.png
```

Prompt rules for avatar generation:
- Describe a "brand spokesperson" or "fictional presenter" — not a real person
- Use descriptors like "illustration style" or "3D render" to avoid photorealism concerns
- Specify clothing that fits the app/tutorial brand (blazer, polo, branded merch)
- Keep face front-facing or near-frontal for best SadTalker results
- Resolution: at least 512×512, prefer 768×768 or higher
- Avoid: glasses that cover eyes, extreme shadows on face, tilted heads, animals

#### Option B: User-Provided Image

Use a provided avatar image. The user must confirm they have rights to the image.

```bash
cp /path/to/user-avatar.png ./assets/avatar/avatar.png
```

#### Option C: ComfyUI Advanced Generation

Use `comfyui-workflows` skill for advanced avatar creation (inpainting outfits, LoRA for consistent brand style).

### 2. Prepare Narration Audio

The voice-caption-agent produces the full narration. Extract the segments where the avatar should appear:

```bash
# Extract a specific segment from the full narration
ffmpeg -i ./assets/voiceover/narration.mp3 \
  -ss 00:00:05 -to 00:00:20 \
  -acodec pcm_s16le -ar 16000 \
  ./assets/voiceover/avatar-line.wav
```

Audio requirements for SadTalker:
- Format: WAV preferred, 16kHz sample rate
- Length: 5–20 seconds per segment
- Mono channel
- Normalize before generation:
  ```bash
  ffmpeg -i ./assets/voiceover/avatar-line.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 ./assets/voiceover/avatar-line-norm.wav
  ```

### 3. Run SadTalker Inference

```bash
cd ~/SadTalker

python inference.py \
  --driven_audio /path/to/project/assets/voiceover/avatar-line.wav \
  --source_image /path/to/project/assets/avatar/avatar.png \
  --result_dir /path/to/project/out/avatar \
  --still \
  --enhancer gfpgan \
  --preprocess full
```

Argument guide:
| Flag | Purpose |
|------|---------|
| `--still` | Natural full-body/portrait video (less head bob) |
| `--enhancer gfpgan` | Face restoration for clean output |
| `--preprocess full` | Full image preprocessing (crop, align, resize) |
| `--batch_size 2` | Reduce VRAM usage if needed |
| `--size 256` | Output face size (256 is default, 512 available) |

Expected output: `./out/avatar/<timestamp>.mp4`

Rename to standard name:
```bash
mv ./out/avatar/*.mp4 ./out/avatar/avatar-talking.mp4
```

### 4. LivePortrait Fallback (If SadTalker Output Is Weak)

If SadTalker produces poor lip-sync, frozen expression, or weird artifacts:

```bash
cd ~/LivePortrait

PYTORCH_ENABLE_MPS_FALLBACK=1 python inference.py \
  -s /path/to/project/assets/avatar/avatar.png \
  -d /path/to/project/assets/voiceover/avatar-line.wav \
  --flag_crop_driving_video
```

LivePortrait expects a video as driving input. Convert audio to a minimal driving video first if needed:

```bash
# Create a static image with audio as a "driving video"
ffmpeg -loop 1 -i ./assets/avatar/avatar.png \
  -i ./assets/voiceover/avatar-line.wav \
  -c:v libx264 -c:a aac -shortest \
  ./assets/avatar/driving-static.mp4

# Run LivePortrait with the static driving video
PYTORCH_ENABLE_MPS_FALLBACK=1 python inference.py \
  -s ./assets/avatar/avatar.png \
  -d ./assets/avatar/driving-static.mp4
```

Expected output: `./animations/s6--d0_concat.mp4`

Extract just the face animation (first track):
```bash
# Extract the middle-generated face-only output
# Check the animations/ folder for the latest .mp4
ffmpeg -i ./animations/s6--d0_concat.mp4 -vf "crop=iw/3:ih:iw/3:0" ./out/avatar/avatar-talking.mp4
```

On macOS Apple Silicon, expect LivePortrait to be ~20× slower than a RTX 4090. Plan accordingly.

### 5. Crop and Prepare the Avatar Video

Crop the talking-head to face + shoulders for overlay use:

```bash
# Detect face region with ffmpeg, crop tight
# Approximate crop for a standard portrait (adjust for your output)
ffmpeg -i ./out/avatar/avatar-talking.mp4 \
  -vf "crop=iw/2:ih*0.7:iw/4:ih*0.1" \
  -c:v libx264 -preset medium -crf 18 \
  ./out/avatar/avatar-talking-cropped.mp4
```

For automated face detection cropping:
```bash
# Use ffmpeg's cropdetect filter on a sample frame
ffmpeg -i ./out/avatar/avatar-talking.mp4 -vframes 1 -vf "cropdetect=24:2" -f null - 2>&1 | grep crop
```

## Avatar Overlay Rules (For Remotion)

These rules must be communicated to the `remotion-editor-agent` for compositing.

### Visual Style

| Property | Default | Notes |
|----------|---------|-------|
| Shape | Circular mask (or rounded-rectangle) | Use CSS `border-radius: 50%` or a circle clip |
| Width | 260px | Range: 220px–320px for 1920×1080 |
| Border | 2px solid white + 4px soft shadow | Helps the avatar pop off the screen |
| Entrance | 0.3s fade-in + slight scale-up (0.9→1.0) | Keep it subtle |
| Exit | 0.3s fade-out + slight scale-down (1.0→0.9) | Keep it subtle |
| Position | Bottom-right (default) | 48px margin from right and bottom edges |
| Z-index | Above screen recording, below captions | Critical: captions must layer above avatar |
| Opacity | 100% when active | Do not ghost the avatar |

### Positioning

Default: bottom-right corner. Use JavaScript in Remotion:

```tsx
// Default position
const AVATAR_SIZE = 260; // px
const MARGIN = 48; // px
const style = {
  position: 'absolute',
  right: `${MARGIN}px`,
  bottom: `${MARGIN + 80}px`, // 80px for caption area
  width: `${AVATAR_SIZE}px`,
  height: `${AVATAR_SIZE}px`,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  objectFit: 'cover',
  zIndex: 10,
};
```

### Safety Margins

- **48px minimum** from all screen edges
- **80px minimum** from the bottom (caption space)
- **Must not cover**: buttons, navigation, forms, code blocks, data tables, notifications, user avatars, profile photos, sensitive data fields
- If the app UI has elements in the bottom-right, move the avatar to bottom-left or top-right

### When to Show vs. Hide Avatar

The avatar appears only during these sections of a 10–15 minute tutorial:

| Section | Avatar | Why |
|---------|--------|-----|
| 0:00–0:30 Intro | Optional | Brand face establishes connection |
| 0:30–1:15 Promise/Overview | ✅ Show | Avatar explains what the viewer will learn |
| Feature walkthroughs | ❌ Hide | Screen recording is the star; avatar distracts |
| Key concept explanation | ✅ Show (5–15s) | Avatar adding personal emphasis |
| Tips section | ✅ Show (5–20s) | Avatar as "helpful colleague" |
| Recap section | ✅ Show (10–20s) | Avatar summarizing key points |
| CTA (call to action) | ✅ Show (5–10s) | Personal ask to like/subscribe |
| Technical demo / code | ❌ Hide | Avatar would cover text |
| Form filling | ❌ Hide | Avatar might cover form fields |

### Avatar Segment Timing

Keep avatar segments short — 5 to 20 seconds each. The avatar should complement, not dominate.
Total avatar screen time: 60–120 seconds across a 10–15 minute video (~10–15%).

### Remotion Composition Pattern

```tsx
// AvatarOverlay component — placed AFTER screen recording, BEFORE captions
const AvatarOverlay: React.FC<{
  avatarVideo: string;
  startFrame: number;
  endFrame: number;
  size?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
}> = ({ avatarVideo, startFrame, endFrame, size = 260, position = 'bottom-right' }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 10, endFrame - 10, endFrame], [0, 1, 1, 0]);
  const scale = interpolate(frame, [startFrame, startFrame + 10], [0.9, 1.0]);

  const posStyle = position === 'bottom-right' ? { right: 48, bottom: 128 }
    : position === 'bottom-left' ? { left: 48, bottom: 128 }
    : { right: 48, top: 80 };

  return (
    <div style={{
      position: 'absolute', ...posStyle,
      width: size, height: size,
      borderRadius: '50%', overflow: 'hidden',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      opacity, transform: `scale(${scale})`,
      zIndex: 10,
    }}>
      <Video src={avatarVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
};
```

### Audio Rules

- The avatar's audio IS the main narration — do not create a second audio track
- The avatar speaks only when the narrator is speaking
- If there is a voiceover track, the avatar lip-syncs to it
- Normalize the audio segment before SadTalker input (see step 2)
- If the avatar appears during a section with background music only (no voiceover), the avatar should not be shown — audio must be present for lip-sync

## Editing Pipeline (Complete)

```
Step 1: Generate or obtain avatar image
        → ./assets/avatar/avatar.png
        + ./metadata/avatar/avatar-source.json

Step 2: Extract narration audio segment
        → ./assets/voiceover/avatar-line.wav
        (normalized to -16 LUFS)

Step 3: Generate talking-head video
        SadTalker (primary):
          python inference.py --driven_audio ... --source_image ... --result_dir ... --still --enhancer gfpgan
        LivePortrait (fallback):
          PYTORCH_ENABLE_MPS_FALLBACK=1 python inference.py -s ... -d ...
        → ./out/avatar/avatar-talking.mp4

Step 4: Crop to face+shoulders
        → ./out/avatar/avatar-talking-cropped.mp4

Step 5: Create overlay plan
        → ./metadata/avatar/avatar-overlay-plan.json
        (timestamps, positions, size for each appearance)

Step 6: Hand off to remotion-editor-agent
        - avatar-talking-cropped.mp4
        - avatar-overlay-plan.json
        → Composited into final tutorial video
```

## Integration with Showcase Workforce

This agent fits as the **8.5th step** in the `showcase-production-director` workflow, running after `voice-caption-agent` (which produces the narration that the avatar lip-syncs to) and before `remotion-editor-agent` (which composites the avatar overlay into the final video).

Workflow position:
```
1.  app-intake-and-brief-agent
2.  tutorial-script-agent
3.  screen-capture-planner-agent
4.  screen-recording-agent
5.  free-media-source-agent
6.  local-visual-generation-agent
7.  storyboard-agent
8.  voice-caption-agent              ← narration audio created here
8.5 tutorial-avatar-overlay-agent     ← avatar created here (this agent)
9.  remotion-editor-agent            ← composites avatar into final video
10. final-quality-check-agent
```

When invoked by the director:
- The agent receives the narration audio and script from steps 8 and 2
- It generates the avatar image and talking-head video
- It produces the overlay plan JSON
- It passes all outputs to the remotion-editor-agent (step 9)

## Metadata: avatar-generation.json

```json
{
  "avatar": {
    "source": "generated | user-provided",
    "generation_prompt": "professional friendly brand spokesperson avatar, ...",
    "generation_model": "MFLUX | FLUX.1-schnell | ComfyUI",
    "seed": 42,
    "source_image_path": "./assets/avatar/avatar.png",
    "width": 768,
    "height": 768
  },
  "audio": {
    "source": "./assets/voiceover/avatar-line.wav",
    "duration_seconds": 15.0,
    "sample_rate": 16000,
    "normalized": true,
    "loudness_target": "-16 LUFS"
  },
  "generation": {
    "model": "SadTalker | LivePortrait",
    "model_version": "v0.0.2-rc | main",
    "command": "python inference.py --driven_audio ...",
    "enhancer": "gfpgan",
    "duration_seconds": 12.3,
    "output_path": "./out/avatar/avatar-talking.mp4",
    "cropped_path": "./out/avatar/avatar-talking-cropped.mp4",
    "face_size": 256,
    "preprocess": "full",
    "still_mode": true
  },
  "overlay": {
    "segments": [
      {
        "name": "intro",
        "start_time": "0:00",
        "end_time": "0:15",
        "duration_seconds": 15,
        "position": "bottom-right",
        "size_px": 260,
        "shape": "circle",
        "entrance": "fade-in 0.3s + scale-up",
        "exit": "fade-out 0.3s + scale-down"
      }
    ],
    "total_avatar_time_seconds": 45,
    "total_video_duration_seconds": 720,
    "avatar_percentage": 6.25
  },
  "consent": {
    "real_person_used": false,
    "consent_obtained": false,
    "note": "Fictional AI-generated avatar — no real person depicted"
  }
}
```

## Metadata: avatar-overlay-plan.json

```json
{
  "avatar_video_path": "./out/avatar/avatar-talking-cropped.mp4",
  "segments": [
    {
      "id": "avatar-01",
      "label": "Intro promise",
      "start_time": "00:00:00.000",
      "end_time": "00:00:15.000",
      "position": "bottom-right",
      "size_px": 260,
      "shape": "circle",
      "overlay_z_index": 10,
      "narration_audio": "./assets/voiceover/avatar-line-intro.wav"
    }
  ]
}
```

## Safety Rules (Hard Constraints)

| Rule | Enforcement |
|------|-------------|
| ❌ Do not clone or animate a real person without explicit written permission | Check `consent.real_person_used` and `consent.consent_obtained` in metadata |
| ✅ Prefer fictional AI-generated avatars | Default generation path uses MFLUX with "brand spokesperson" prompt |
| ❌ Do not imply the avatar is a real human | Add a small "AI Avatar" label overlay if needed (check with producer) |
| ❌ No celebrity, politician, employee, customer, or private-person likeness | Verify generated face does not match known individuals |
| ❌ Avatar must not cover: buttons, forms, nav, code, data, sensitive info | Remotion compositing must check storyboard for element positions |
| ❌ Avatar must not play during technical walkthrough sections | Storyboard marks these sections; overlay plan must respect them |
| ✅ Keep avatar segments short (5–20s) | Hard limit: never exceed 30 seconds per continuous avatar appearance |
| ✅ Total avatar time: 60–120s in a 10–15 min video | Monitor in overlay plan metadata |

## Troubleshooting

### SadTalker produces frozen face / no movement
- Ensure the audio file is valid WAV, 16kHz, mono
- Try removing `--still` flag (allows more head movement)
- Try without `--enhancer gfpgan` (enhancer can smooth out motion)
- Fall back to LivePortrait

### SadTalker crashes with OOM
- Reduce `--batch_size` to 1
- Use `--size 256` instead of 512
- Close other GPU/MPS-using applications

### LivePortrait is extremely slow on macOS
- Expected: ~20× slower than RTX 4090
- Use short audio segments (5–10 seconds max)
- Only use LivePortrait for key segments where SadTalker fails
- Consider using faster settings (smaller crop, no concatenation)

### Avatar video has weird aspect ratio
- Ensure source image is square (1:1 ratio)
- Crop the output to square before overlay:
  ```bash
  ffmpeg -i avatar-talking.mp4 -vf "crop=min(iw\,ih):min(iw\,ih)" avatar-talking-square.mp4
  ```

### Lip-sync is off
- Ensure audio was normalized before SadTalker input
- Try regenerating with a different preprocess mode (`--preprocess crop`)
- Check that audio sample rate is 16000 Hz (not 44100 or 48000)
- Fall back to LivePortrait for better expression sync

## Quick Start (Minimal Invocation)

```bash
# Full pipeline from the project root
mkdir -p assets/avatar assets/voiceover out/avatar metadata/avatar

# 1. Generate avatar
cp /path/to/avatar.png assets/avatar/avatar.png

# 2. Extract audio segment
ffmpeg -i assets/voiceover/narration.mp3 -ss 00:01:00 -to 00:01:15 \
  -acodec pcm_s16le -ar 16000 assets/voiceover/avatar-line.wav
ffmpeg -i assets/voiceover/avatar-line.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 assets/voiceover/avatar-line-norm.wav

# 3. Generate talking head (SadTalker)
cd ~/SadTalker
python inference.py \
  --driven_audio /path/to/project/assets/voiceover/avatar-line-norm.wav \
  --source_image /path/to/project/assets/avatar/avatar.png \
  --result_dir /path/to/project/out/avatar \
  --still --enhancer gfpgan --preprocess full

# 4. Rename and crop
cd /path/to/project
mv out/avatar/*.mp4 out/avatar/avatar-talking.mp4
ffmpeg -i out/avatar/avatar-talking.mp4 \
  -vf "crop=min(iw\,ih):min(iw\,ih)" out/avatar/avatar-talking-square.mp4

# 5. Output metadata
cat > metadata/avatar/avatar-generation.json << 'EOF'
{
  "avatar": { "source": "user-provided", "source_image_path": "./assets/avatar/avatar.png" },
  "audio": { "source": "./assets/voiceover/avatar-line-norm.wav", "duration_seconds": 15.0, "normalized": true },
  "generation": { "model": "SadTalker", "enhancer": "gfpgan", "output_path": "./out/avatar/avatar-talking-square.mp4" },
  "overlay": { "segments": [{"name": "explanation", "start_time": "1:00", "end_time": "1:15", "position": "bottom-right", "size_px": 260, "shape": "circle"}] },
  "consent": { "real_person_used": false, "consent_obtained": false, "note": "Fictional AI-generated avatar" }
}
EOF

echo "Avatar overlay ready: ./out/avatar/avatar-talking-square.mp4"
```
