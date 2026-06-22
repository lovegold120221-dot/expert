---
name: video-editing-assembly
version: "1.0.0"
description: "Final video editing and assembly using Remotion as the video editor brain and FFmpeg as the media operations engine. Composites images, video clips, B-roll, text overlays, captions, transitions, audio (voiceover + music), and exports platform-ready MP4 files. Saves final videos to ./out/final. Use when the user asks to: edit a video, assemble clips into a video, add text overlays, add captions, add transitions between clips, mix audio with video, export a final MP4, create a YouTube video from assets, add B-roll to footage, resize/crop video for platforms, or finish a video project."
---

# Video Editing & Assembly

Final video editing and assembly using **Remotion** as the video editor brain and **FFmpeg** as the media operations engine. Composites everything from the content creator pipeline into platform-ready videos.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Source      │     │  Remotion   │     │  FFmpeg     │
│  Assets      │────▶│  Compose    │────▶│  Finalize   │
│              │     │             │     │             │
│  • Images    │     │  • Scenes   │     │  • Transcode │
│  • Videos    │     │  • Text     │     │  • Platform  │
│  • Audio     │     │  • Captions │     │  • Optimize  │
│  • B-roll    │     │  • Transit. │     │  • Package   │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                    ./out/final/           ./out/final/
                    (draft renders)       (final MP4)
```

## Two-Engine Setup

```bash
# Remotion — video compositing brain
npm init -y
npm install remotion @remotion/cli @remotion/transitions @remotion/renderer

# FFmpeg — media operations engine
brew install ffmpeg ffprobe

# Verify
npx remotion --version
ffmpeg -version
```

## Pipeline: Source Assets → Final Video

### Step 1: Organize Source Assets

```
project/
├── assets/
│   ├── images/              # Free stock images + generated images
│   │   ├── intro-bg.jpg
│   │   ├── scene-1.jpg
│   │   └── ...
│   └── videos/              # Free stock videos + generated clips
│       ├── b-roll-office.mp4
│       ├── generated-pan.mp4
│       └── ...
├── audio/
│   ├── voiceover.mp3         # TTS narration
│   ├── background-music.mp3   # Background track
│   └── sfx/                  # Sound effects
├── metadata/                 # Source metadata
└── out/
    ├── images/
    ├── videos/
    └── final/                # ← Final MP4 output
```

### Step 2: Compose with Remotion

```bash
# Create Remotion project (if not exists)
npx create-video@latest final-edit --template blank
cd final-edit
npm install
npx skills add remotion-dev/skills

# Place assets in project's public/ directory
cp -r ../assets/* public/
cp -r ../audio/* public/
```

#### Remotion Composition Template

```tsx
// src/Video.tsx — Full content creator template
import { AbsoluteFill, Sequence, Audio, Video, Img, useVideoConfig, spring, interpolate, useCurrentFrame, Series } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// --- Scene Components ---

const IntroScene: React.FC<{ title: string; bgImage: string }> = ({ title, bgImage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill>
      <Img src={bgImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <h1 style={{
          fontSize: 80, color: "white", fontFamily: "Arial, sans-serif",
          transform: `scale(${scale})`, opacity,
          textAlign: "center", maxWidth: "80%",
        }}>
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};

const TextOverlayScene: React.FC<{ text: string; bgImage: string; duration?: number }> = ({
  text, bgImage, duration = 90
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, duration - 15, duration], [0, 1, 1, 0]);

  return (
    <AbsoluteFill>
      <Img src={bgImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{
        position: "absolute", bottom: 100, left: 0, right: 0,
        textAlign: "center", opacity,
      }}>
        <div style={{
          display: "inline-block", padding: "16px 32px",
          background: "rgba(0,0,0,0.6)", borderRadius: 8,
          color: "white", fontSize: 36, fontFamily: "Arial, sans-serif",
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VideoClipScene: React.FC<{ src: string; label?: string }> = ({ src, label }) => {
  return (
    <AbsoluteFill>
      <Video src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {label && (
        <div style={{
          position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center",
        }}>
          <span style={{
            padding: "12px 24px", background: "rgba(0,0,0,0.6)", borderRadius: 6,
            color: "white", fontSize: 28, fontFamily: "Arial, sans-serif",
          }}>
            {label}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// --- Main Composition ---

export const FinalVideo: React.FC<{
  introTitle: string;
  introBg: string;
  scenes: Array<{ text: string; image: string; durationFrames: number }>;
  bRollClips: Array<{ src: string; label: string; durationFrames: number }>;
  outroBg: string;
  outroText: string;
  voiceover: string;
  music: string;
}> = ({ introTitle, introBg, scenes, bRollClips, outroBg, outroText, voiceover, music }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Audio Layer */}
      <Audio src={voiceover} volume={1.0} />
      <Audio src={music} volume={0.15} />

      {/* Intro */}
      <Sequence durationInFrames={3 * fps}>
        <IntroScene title={introTitle} bgImage={introBg} />
      </Sequence>

      {/* Main scenes with text overlays */}
      {scenes.map((scene, i) => (
        <Sequence
          key={`scene-${i}`}
          from={3 * fps + scenes.slice(0, i).reduce((a, s) => a + s.durationFrames, 0)}
          durationInFrames={scene.durationFrames}
        >
          <TextOverlayScene text={scene.text} bgImage={scene.image} duration={scene.durationFrames} />
        </Sequence>
      ))}

      {/* B-roll clips interleaved */}
      {bRollClips.map((clip, i) => (
        <Sequence
          key={`broll-${i}`}
          from={3 * fps + scenes.reduce((a, s) => a + s.durationFrames, 0) + 
            bRollClips.slice(0, i).reduce((a, c) => a + c.durationFrames, 0)}
          durationInFrames={clip.durationFrames}
        >
          <VideoClipScene src={clip.src} label={clip.label} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence
        from={3 * fps + scenes.reduce((a, s) => a + s.durationFrames, 0) +
          bRollClips.reduce((a, c) => a + c.durationFrames, 0)}
        durationInFrames={3 * fps}
      >
        <IntroScene title={outroText} bgImage={outroBg} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Step 3: Render Draft

```bash
# Draft render — fast, low quality for timing check
npx remotion render FinalVideo out/final/draft.mp4 --crf=28

# Check draft, adjust timing, then do final render
npx remotion render FinalVideo out/final/final-video.mp4 --crf=18 --preset=slow
```

## FFmpeg Post-Production Pipeline

After Remotion exports the composite, FFmpeg handles platform-specific finishing:

### Audio Mixing & Mastering

```bash
# Mix voiceover + background music with ducking
ffmpeg -i out/final/rendered-video.mp4 \
  -i audio/voiceover.mp3 \
  -i audio/background-music.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[voice];\
   [2:a]volume=0.15[music];\
   [voice][music]amix=inputs=2:duration=first:weights=1.0 0.15[out]" \
  -map 0:v -map "[out]" \
  -c:v copy -c:a aac -b:a 192k \
  out/final/video-mixed.mp4

# Normalize audio levels
ffmpeg -i out/final/video-mixed.mp4 \
  -af "loudnorm=I=-14:LRA=11:TP=-1.5" \
  -c:v copy \
  out/final/video-normalized.mp4
```

### Add Captions (SRT → Burn-in)

```bash
# Burn SRT subtitles into video
ffmpeg -i out/final/video.mp4 \
  -vf "subtitles=captions.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=40'" \
  -c:a copy \
  out/final/video-captioned.mp4
```

### Platform Export

```bash
# YouTube — 1080p, H.264 high quality
ffmpeg -i out/final/video.mp4 \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k -movflags +faststart \
  out/final/youtube.mp4

# YouTube Shorts / TikTok — vertical 9:16
ffmpeg -i out/final/video.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" \
  -c:v libx264 -crf 22 \
  -c:a aac -b:a 128k \
  out/final/shorts.mp4

# Instagram Reels — vertical, capped
ffmpeg -i out/final/video.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" \
  -c:v libx264 -crf 22 -t 90 \
  -c:a aac -b:a 128k \
  out/final/instagram-reel.mp4

# Twitter/X — 720p max for fast upload
ffmpeg -i out/final/video.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 -crf 22 \
  -c:a aac -b:a 128k \
  out/final/twitter.mp4

# GIF preview
ffmpeg -i out/final/video.mp4 \
  -vf "fps=10,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 out/final/preview.gif
```

### Video Resizing & Cropping

```bash
# Smart crop to 16:9 (center)
ffmpeg -i input.mp4 -vf "crop=ih*16/9:ih" -c:a copy out/cropped.mp4

# Resize to specific resolution (maintain aspect ratio, pad)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black" out/resized.mp4

# Trim to exact duration
ffmpeg -i input.mp4 -t 30 -c copy out/trimmed-30s.mp4

# Cut segment (from 10s to 20s)
ffmpeg -i input.mp4 -ss 10 -to 20 -c copy out/cut-segment.mp4
```

## Transition Effects (FFmpeg)

Use FFmpeg for scene transitions that supplement Remotion's built-in transitions:

```bash
# Crossfade between two video clips
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "\
    [0:v]settb=AVTB[v0];\
    [1:v]settb=AVTB[v1];\
    [v0][v1]xfade=transition=fade:duration=1:offset=4[v]" \
  -map "[v]" -map 0:a \
  out/transitioned.mp4

# Slide transition
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "\
    [0:v]settb=AVTB[v0];\
    [1:v]settb=AVTB[v1];\
    [v0][v1]xfade=transition=slideright:duration=0.5:offset=4[v]" \
  -map "[v]" out/slide-transition.mp4

# Concatenate multiple clips with fades
ffmpeg -f concat -safe 0 -i clips.txt -c copy out/concatenated.mp4
```

## Hardware-Accelerated Encoding

```bash
# Apple Silicon (VideoToolbox) — ~5x faster encoding
ffmpeg -i input.mp4 -c:v h264_videotoolbox \
  -b:v 5M -allow_sw 1 \
  -c:a aac -b:a 192k \
  out/final/video-hw.mp4

# NVIDIA GPU (NVENC)
ffmpeg -i input.mp4 -c:v h264_nvenc \
  -preset p7 -cq 20 \
  -c:a aac -b:a 192k \
  out/final/video-nvenc.mp4
```

## Complete Assembly Workflow

```bash
# ============================================================
# FULL CONTENT CREATOR ASSEMBLY PIPELINE
# ============================================================

# 1. Set up project
mkdir -p assets/images assets/videos audio out/final metadata workflows/comfyui

# 2. Source/generate all assets
#    → free-image-source skill  (download stock images)
#    → free-video-source skill  (download stock video clips)
#    → local-image-gen skill    (generate images if needed)
#    → local-video-gen skill    (generate video clips if needed)

# 3. Compose with Remotion
cd final-edit
npx remotion render FinalVideo ../out/final/draft.mp4 --crf=28

# 4. Iterate on draft — adjust timing, scenes, audio

# 5. Final render
npx remotion render FinalVideo ../out/final/master.mp4 --crf=18

# 6. Audio mastering
ffmpeg -i ../out/final/master.mp4 \
  -i ../audio/voiceover.mp3 \
  -i ../audio/music.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[voice];[2:a]volume=0.15[music];\
   [voice][music]amix=inputs=2:duration=first:weights=1.0 0.15[amix];\
   [amix]loudnorm=I=-14:LRA=11:TP=-1.5[audio]" \
  -map 0:v -map "[audio]" \
  -c:v copy -c:a aac -b:a 192k \
  ../out/final/master-mixed.mp4

# 7. Platform exports
ffmpeg -i ../out/final/master-mixed.mp4 -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k -movflags +faststart ../out/final/youtube.mp4
# ... (repeat for each platform)

# 8. Verify final
ffprobe ../out/final/youtube.mp4
```

## Metadata for Final Videos

Save as `./metadata/{final-filename}.json`:

```json
{
  "filename": "youtube.mp4",
  "project": "orbit-walkthrough-v4",
  "rendered_at": "2026-06-20T12:00:00Z",
  "engine": "remotion + ffmpeg",
  "remotion_composition": "FinalVideo",
  "duration_seconds": 390.3,
  "resolution": {"width": 1920, "height": 1080},
  "fps": 30,
  "codec": "h264",
  "audio_codec": "aac",
  "audio_bitrate": 192,
  "target_platform": "youtube",
  "assets_used": {
    "images": ["intro-bg.jpg", "scene-1.jpg", "..."],
    "videos": ["b-roll-office.mp4", "..."],
    "audio": ["voiceover.mp3", "background-music.mp3"]
  },
  "source_metadata_files": [
    "metadata/intro-bg.json",
    "metadata/b-roll-office.json"
  ]
}
```

## File Organization

```
project/
├── assets/
│   ├── images/              # Source images (stock + generated)
│   ├── videos/              # Source video clips (stock + generated)
├── audio/
│   ├── voiceover.mp3        # Narration audio
│   ├── background-music.mp3  # Background track
│   └── sfx/                 # Sound effects
├── metadata/                # Metadata for all sourced/generated assets
├── out/
│   ├── images/              # Generated images
│   ├── videos/              # Generated video clips
│   └── final/               # ← FINAL EDITED VIDEOS
│       ├── draft.mp4
│       ├── master.mp4
│       ├── youtube.mp4
│       ├── shorts.mp4
│       └── preview.gif
├── workflows/
│   └── comfyui/             # ComfyUI workflow JSONs
└── final-edit/              # Remotion project (optional, can be standalone)
    ├── src/Video.tsx
    ├── remotion.config.ts
    └── package.json
```

## Prohibited Actions

- ❌ No rev encoding without checking source file compatibility
- ❌ No overwriting final exports without versioning (use draft.mp4 → final-v1.mp4 → final-v2.mp4)
- ❌ No removing source assets after final render (keep them for re-renders)
- ❌ No using source files without corresponding metadata

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Audio out of sync | Frame rate mismatch | Verify all clips match project fps (30) |
| Remotion render crashes | Out of memory | `NODE_OPTIONS=--max-old-space-size=4096 npx remotion render` |
| Black frames in output | Missing asset path | Check paths in public/ are correct |
| FFmpeg encoder slow | Software encoding | Use `h264_videotoolbox` (Apple) or `h264_nvenc` (NVIDIA) |
| Large file size | High bitrate | Increase CRF (22-24 for web delivers) |
| Subtitles not showing | Font not found | Use Arial (cross-platform safe) |
| Transition looks wrong | Duration mismatch | Transition offset must be < clip duration |

## Related Skills

- `remotion-content-creator` — Remotion + FFmpeg architecture deep-dive (parent skill)
- `free-image-source` — Source free stock images for assets/
- `free-video-source` — Source free stock video for assets/
- `local-image-gen` — Generate images when stock isn't available
- `local-video-gen` — Generate video clips when stock isn't available
- `comfyui-workflows` — Advanced image/video processing workflows
- `ai-video-production` — Full AI pipeline with TTS, music gen, cloud GPU
