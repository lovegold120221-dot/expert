---
name: remotion-content-creator
version: "1.0.0"
description: "Content creator video production with Remotion as the video editor brain and FFmpeg as the media operations engine. Use when the user asks to: create video content programmatically, build a Remotion video project, render MP4 videos with React, automate video production, generate social media videos, create YouTube videos with code, build a video template system, use Remotion Agent Skills, compose video with FFmpeg, batch render videos, create parametric video templates, build a video generation app, do serverless video rendering with Remotion Lambda, generate captions with Whisper, add transitions between scenes, sync audio to video in Remotion, create data-driven videos, build a video editor UI, or produce content at scale programmatically. Also applies to: programmatic video creation, React-based video rendering, automated content production, video template systems, data-driven video generation, serverless video rendering, caption generation, scene transitions, audio-visual sync, batch video rendering. Reference: github.com/remotion-dev/remotion — the most popular programmatic video framework (126k+ stars)."
---

# Remotion Content Creator — Video Editor Brain + Media Operations Engine

Programmatic video production with **Remotion** as the compositing/reasoning brain and **FFmpeg** as the media operations engine. This is the de facto standard for AI-agent-driven video creation — 126k+ GitHub stars, #4 most-installed agent skill globally.

## Architecture: The Two-Engine Model

```
┌──────────────────────────────────────────────────┐
│              CONTENT CREATOR AI                   │
├──────────────────────┬───────────────────────────┤
│  REMOTION            │  FFMPEG                   │
│  (Video Editor Brain)│  (Media Operations Engine) │
├──────────────────────┼───────────────────────────┤
│  • React composition │  • Media decode/probe     │
│  • Scene timing      │  • Format conversion      │
│  • Text overlays     │  • Transcoding            │
│  • Transitions       │  • Audio extraction/mix   │
│  • Animation system  │  • Frame-level filters     │
│  • Caption rendering │  • Concatenation/splitting │
│  • 3D/Three.js       │  • GIF creation            │
│  • Parametric props  │  • Quality optimization    │
│  • Image sequences   │  • Watermark removal       │
│  • Lambda rendering  │  • FFprobe analysis        │
└──────────────────────┴───────────────────────────┘
```

## Quick Start

### 1. Project Scaffolding

```bash
# Create a new Remotion project (recommended: Blank + TailwindCSS + Skills)
npx create-video@latest my-video
cd my-video
npm install

# Install Remotion Agent Skills (28 rule files for AI coding agents)
npx skills add remotion-dev/skills

# Start the Studio preview
npm run dev

# Open a separate terminal for your coding agent
cd my-video
opencode  # or claude / codex
```

### 2. Install the FFmpeg Bridge

```bash
# Remotion uses FFmpeg internally for rendering, but for direct FFmpeg ops:
npm install @remotion/ffmpeg  # direct FFmpeg access in Node.js
npm install @remotion/renderer # programmatic rendering API
```

### 3. First Render

```bash
# Render all compositions to MP4
npx remotion render

# Render a specific composition
npx remotion render MyComposition out/video.mp4

# Render a still frame
npx remotion still MyComposition out/frame.png --frame=30

# Render with custom props
npx remotion render MyComposition out/video.mp4 --props '{"title": "Hello World"}'
```

## Remotion Project Structure

```
my-video/
├── src/
│   ├── Root.tsx              # Entry point — registers all compositions
│   ├── Video.tsx             # Main composition definition
│   ├── components/           # Reusable scene components
│   │   ├── Intro.tsx
│   │   ├── Scene.tsx
│   │   └── Outro.tsx
│   ├── assets/               # Static assets (images, video, fonts)
│   └── styles/
├── public/                   # Static served files
├── package.json
├── remotion.config.ts        # Remotion configuration
└── tsconfig.json
```

### Root Entry Point Pattern

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { MyVideo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={30 * 30} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Hello World",
        }}
      />
    </>
  );
};
```

### Composition Pattern

```tsx
// src/Video.tsx
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Intro } from "./components/Intro";
import { MainScene } from "./components/MainScene";
import { Outro } from "./components/Outro";

export const MyVideo: React.FC<{
  title: string;
}> = ({ title }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Sequence durationInFrames={5 * fps}>
        <Intro title={title} />
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={20 * fps}>
        <MainScene />
      </Sequence>
      <Sequence from={25 * fps} durationInFrames={5 * fps}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Content Creator Templates

### Template: YouTube Video (16:9, 1920×1080)

```tsx
// src/YouTubeVideo.tsx
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";

export const YouTubeVideo: React.FC<{
  title: string;
  scenes: Array<{
    text: string;
    image?: string;
    duration: number; // in seconds
  }>;
}> = ({ title, scenes }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f0f" }}>
      <Sequence durationInFrames={3 * fps}>
        {/* Intro card with title */}
        <IntroCard title={title} />
      </Sequence>
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={(3 + scenes.slice(0, i).reduce((a, s) => a + s.duration, 0)) * fps}
          durationInFrames={scene.duration * fps}
        >
          <SceneCard text={scene.text} image={scene.image} />
        </Sequence>
      ))}
      <Sequence
        from={(3 + scenes.reduce((a, s) => a + s.duration, 0)) * fps}
        durationInFrames={3 * fps}
      >
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Template: YouTube Short / TikTok (9:16, 1080×1920)

```tsx
// Root.tsx — register a portrait composition
<Composition
  id="Short"
  component={ShortVideo}
  durationInFrames={15 * 30} // 15 seconds
  fps={30}
  width={1080}
  height={1920}
/>

// Fast-paced, text-heavy, vertical
export const ShortVideo: React.FC<{ hook: string; body: string; cta: string }> = ({
  hook, body, cta,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {/* 0-2s: Hook text */}
    <Sequence durationInFrames={60}>
      <BigText text={hook} />
    </Sequence>
    {/* 2-12s: Body content */}
    <Sequence from={60} durationInFrames={300}>
      <ScrollingBody text={body} />
    </Sequence>
    {/* 12-15s: CTA */}
    <Sequence from={360} durationInFrames={90}>
      <BigText text={cta} color="#00ff88" />
    </Sequence>
  </AbsoluteFill>
);
```

### Template: Product Demo / Marketing

```tsx
export const ProductDemo: React.FC<{
  productName: string;
  screenshots: string[];
  features: string[];
  soundtrack: string;
}> = ({ productName, screenshots, features, soundtrack }) => (
  <AbsoluteFill>
    {/* Audio layer */}
    <Audio src={soundtrack} volume={0.3} />
    
    {/* Intro */}
    <Sequence durationInFrames={90}>
      <ProductTitle name={productName} />
    </Sequence>

    {/* Feature walkthrough with screenshots */}
    {features.map((feature, i) => (
      <Sequence key={i} from={90 + i * 150} durationInFrames={150}>
        <FeatureSlide
          feature={feature}
          screenshot={screenshots[i]}
          isActive={i === currentFeature}
        />
      </Sequence>
    ))}
  </AbsoluteFill>
);
```

## Animation System

### Physics-Based Animation (Spring)

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const AnimatedTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80, mass: 0.5 },
  });

  return (
    <h1
      style={{
        fontSize: 80,
        color: "white",
        transform: `scale(${scale})`,
      }}
    >
      {text}
    </h1>
  );
};
```

### Frame Interpolation

```tsx
import { interpolate, useCurrentFrame } from "remotion";

export const FadeInText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  
  const y = interpolate(frame, [0, 30], [50, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, color: "white" }}>
      {text}
    </div>
  );
};
```

## Transitions System

Remotion provides 7 built-in transition types via `@remotion/transitions`:

| Transition | Pattern | Best For |
|------------|---------|----------|
| **fade** | `transition.fade()` | General-purpose scene changes |
| **slide** | `transition.slide({ direction: "from-left" })` | Slideshows, presentations |
| **wipe** | `transition.wipe()` | Cinematic reveals |
| **flip** | `transition.flip()` | Dynamic, modern feel |
| **clock-wipe** | `transition.clockWipe()` | Time-themed content |
| **custom** | `transition.custom(({ progress }) => ...)` | Fully custom transitions |

### Transition Usage

```tsx
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

export const VideoWithTransitions: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <IntroScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: { damping: 20 } })}
      />
      <TransitionSeries.Sequence durationInFrames={120}>
        <MainScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-left" })}
        timing={springTiming({ config: { damping: 20 } })}
      />
      <TransitionSeries.Sequence durationInFrames={60}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

## Caption Generation (Whisper)

```bash
# Install Whisper for caption generation
npm install @remotion/install-whisper-cpp
npx remotion install whisper-cpp
```

```tsx
// Generate captions from audio
import { useWhisperCaption } from "@remotion/install-whisper-cpp";

export const CaptionedVideo: React.FC<{ audioSrc: string }> = ({ audioSrc }) => {
  const { captions } = useWhisperCaption(audioSrc);

  return (
    <AbsoluteFill>
      <Audio src={audioSrc} />
      {captions.map((caption, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            fontSize: 36,
            textAlign: "center",
            opacity: caption.timestamp < frame ? 1 : 0,
          }}
        >
          {caption.text}
        </div>
      ))}
    </AbsoluteFill>
  );
};
```

## FFmpeg Media Operations Engine

FFmpeg is the media operations engine that handles all heavy media lifting around Remotion compositing:

### Pre-Render: Media Preparation

```bash
# Probe source media
ffprobe -v quiet -print_format json -show_format source.mp4

# Transcode to Remotion-friendly format
ffmpeg -i source.mp4 -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p prepared.mp4

# Extract audio for caption generation
ffmpeg -i source.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav

# Create image sequence from video for frame-by-frame analysis
ffmpeg -i source.mp4 -vf fps=1 frames/frame_%04d.png

# Generate GIF preview
ffmpeg -i source.mp4 -vf "fps=10,scale=640:-1" preview.gif
```

### Post-Render: Media Finishing

```bash
# Mix voiceover + background music (ducking)
ffmpeg -i rendered.mp4 -i voiceover.wav -i music.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[voice];[2:a]volume=0.15[music];\
  [voice][music]amix=inputs=2:duration=first:weights=1.0 0.15[out]" \
  -map 0:v -map "[out]" -c:v copy -c:a aac -b:a 192k final.mp4

# Concatenate multiple rendered segments
ffmpeg -f concat -safe 0 -i segments.txt -c copy merged.mp4

# Add intro bumper
ffmpeg -i bumper.mp4 -i main_video.mp4 -filter_complex \
  "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" final.mp4

# Transcode for social media
ffmpeg -i final.mp4 -c:v libx264 -crf 22 -preset fast \
  -c:a aac -b:a 128k -movflags +faststart output_web.mp4

# Create platform-specific versions
ffmpeg -i final.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" youtube-short.mp4
```

### Pre-Render: Frame-Level Processing with FFmpeg Filters

For assets that need processing BEFORE they enter Remotion:

```bash
# Create Ken Burns zoom effect on still image
ffmpeg -loop 1 -i photo.jpg -vf "
  zoompan=z='if(eq(on,1),1.0,min(zoom+0.01,1.2))':
  x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':
  d=150:s=1920x1080:fps=30
" -c:v libx264 -t 5 zoomed.mp4

# Add text overlay with drawtext (if libfreetype is available)
ffmpeg -i input.mp4 -vf "
  drawtext=text='Hello':fontsize=48:fontcolor=white:
  x=(w-text_w)/2:y=h-th-100:box=1:boxcolor=black@0.5
" output.mp4

# Apply color grading
ffmpeg -i input.mp4 -vf "
  eq=brightness=0.05:contrast=1.1:saturation=1.2:gamma=1.0
" graded.mp4

# Speed ramp
ffmpeg -i input.mp4 -vf "
  setpts='if(eq(N,0),PTS,if(lte(N,30),PTS*0.5,PTS*2))'
" speedramp.mp4
```

## Data-Driven Video Generation

The true power of Remotion: generate hundreds of videos from data.

```tsx
// src/components/DataDrivenVideo.tsx
// Source: a list of personalized items
export const DataDrivenVideo: React.FC<{
  userName: string;
  userAvatar: string;
  stats: { label: string; value: number }[];
  seasonStart: number; // season frame start
}> = ({ userName, userAvatar, stats, seasonStart }) => (
  <AbsoluteFill>
    <Sequence durationInFrames={seasonStart}>
      <PersonalizedIntro name={userName} avatar={userAvatar} />
    </Sequence>
    <Sequence from={seasonStart} durationInFrames={stats.length * 30}>
      <SeasonStats stats={stats} />
    </Sequence>
    <Outro />
  </AbsoluteFill>
);
```

### Batch Rendering with Node.js

```ts
// batch-render.ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const bundleLocation = await bundle({
  entryPoint: "./src/index.ts",
  webpackOverride: (config) => config,
});

async function renderBatch(dataset: Array<{ id: string; props: object }>) {
  for (const item of dataset) {
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "DataDrivenVideo",
      inputProps: item.props,
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: `out/video-${item.id}.mp4`,
      inputProps: item.props,
    });

    console.log(`Rendered video-${item.id}.mp4`);
  }
}

// Render 1000 personalized videos
renderBatch(myUserData);
```

### Serverless Rendering (Remotion Lambda)

```bash
# Deploy Lambda rendering infrastructure
npx remotion lambda functions deploy
npx remotion lambda sites create ./src

# Render on Lambda
npx remotion lambda render MyVideo out/video.mp4 \
  --props '{"title": "Scalable Video"}'
```

```ts
// Programmatic Lambda rendering
import { renderMediaOnLambda } from "@remotion/lambda";

await renderMediaOnLambda({
  region: "us-east-1",
  functionName: "remotion-render",
  serveUrl: "https://your-bucket.s3.amazonaws.com/site/",
  composition: "MyVideo",
  inputProps: { title: "Serverless Video" },
  codec: "h264",
});
```

## Audio Integration

### Background Music + Voiceover

```tsx
import { Audio, Sequence, useVideoConfig } from "remotion";

export const AudioLayeredVideo: React.FC<{
  voiceover: string;
  music: string;
  musicVolume?: number;
}> = ({ voiceover, music, musicVolume = 0.15 }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background music — plays entire duration, volume ducks for voiceover */}
      <Audio src={music} volume={musicVolume} />
      
      {/* Voiceover — timed to scenes */}
      <Sequence durationInFrames={10 * fps}>
        <Audio src={voiceover} volume={1.0} />
        <VisualScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Audio Ducking Pattern

For professional audio where music automatically ducks under narration:

```tsx
// Dynamic volume based on whether voiceover is active
const getMusicVolume = (frame: number, voiceoverActive: boolean) => {
  if (voiceoverActive) return 0.08;
  return 0.2;
};
```

## Rendering Configurations

### Local Rendering

```bash
# Fast draft
npx remotion render MyVideo out/draft.mp4 --crf=28 --enforce-audio-track

# Production quality
npx remotion render MyVideo out/final.mp4 --crf=18 --preset=slow

# GIF
npx remotion render MyVideo out/animated.gif --codec=gif

# Image sequence
npx remotion render MyVideo out/frames/%04d.png --codec=prores

# Still frame
npx remotion still MyVideo out/thumbnail.png --frame=45
```

### Configurations for Different Platforms

```ts
// remotion.config.ts
import { Config } from "@remotion/cli/config";

// YouTube (16:9, high quality)
Config.setVideoImageFormat("jpeg");
Config.setQuality(100);
Config.setCodec("h264");
Config.setCrf(18);

// TikTok/Shorts (9:16, medium quality for fast upload)
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(22);

// Marketing (ProRes for post-production)
Config.setCodec("prores");
Config.setCrf(0);
```

### Docker / Cloud Run Rendering

```dockerfile
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
  ffmpeg \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npx", "remotion", "render", "MyVideo", "/output/video.mp4"]
```

## Content Creator Workflow

```
┌───────────────────────────────────────────────────────────────────┐
│                   CONTENT CREATOR PIPELINE                         │
├──────────┬──────────┬───────────┬──────────┬─────────┬───────────┤
│  IDEATE  │  PREPARE │  COMPOSE  │  RENDER  │  FINISH │  PUBLISH  │
├──────────┼──────────┼───────────┼──────────┼─────────┼───────────┤
│ Outline  │ Generat  │ Build     │ Draft    │ Audio   │ Export    │
│ script   │ e assets │ Remotion  │ render   │ mixing  │ for plat  │
│          │ (AI      │ component │ (fast)   │         │ form      │
│ Story-   │ images,  │ s         │          │ Color   │           │
│ board    │ voice-   │           │ Final    │ grading │ Upload    │
│          │ over,    │ Add       │ render   │         │           │
│ Design   │ music,   │ transitio │ (prod)   │ Caption │ Metadata  │
│ brief    │ stock)   │ ns        │          │ s       │ (title,   │
│          │          │           │ Lambda   │ Format  │ desc,     │
│          │ FFprobe  │ Paramete │ render   │ conver  │ tags)     │
│          │ analyze  │ rize      │ (scale)  │ sion    │           │
└──────────┴──────────┴───────────┴──────────┴─────────┴───────────┘
         │             │            │          │          │
         └──── FFmpeg ─┴── FFmpeg ──┴─ FFmpeg ─┴── FFmpeg ─┘
                      Media Operations Layer
```

## FFmpeg ↔ Remotion Integration Table

| Operation | Remotion (Brain) | FFmpeg (Engine) |
|-----------|-----------------|-----------------|
| Composition | `React components` | — |
| Timing | `Sequence`, `Series` | — |
| Animations | `spring()`, `interpolate()` | — |
| Transitions | `@remotion/transitions` | `xfade`, `overlay` |
| Text | `<Text>` components | `drawtext` filter |
| Media decode | `<Video>`, `<Img>` | `ffmpeg -i` decode |
| Audio mixing | `<Audio>` volume prop | `amix`, `volume` filters |
| Captions | `@remotion/install-whisper-cpp` | `ffmpeg + whisper` |
| Encoding | `npx remotion render` | `libx264`, `libx265` |
| Scaling | Lambda config | `scale`, `pad` filters |
| GIF | `--codec=gif` | `ffmpeg -vf palettegen` |
| Concatenation | `Series` component | `concat` demuxer |
| Probe | — | `ffprobe` |
| Thumbnails | `npx remotion still` | `ffmpeg -vframes 1` |

## Remotion Agent Skills (28 Rules)

Remotion maintains official **Agent Skills** — 28 modular rule files that teach AI coding agents (Claude Code, Codex, OpenCode, Cursor) how to write correct Remotion code:

```bash
# Install Remotion Agent Skills
npx skills add remotion-dev/skills

# Skills are loaded automatically by your agent when within the project
```

The skills cover:
- 9 built-in component patterns (sequences, series, still images, audio, video, shapes, text, IFrame, animated GIF)
- 7 transition types (fade, slide, wipe, flip, clock wipe, custom)
- Animation primitives (spring physics, interpolation, frame-based keyframes)
- Audio integration (background music, voiceover timing, volume control)
- Caption generation from audio files via Whisper
- 3D rendering with Three.js integration
- Deployment and rendering configuration (Lambda, Cloud Run, local CLI)

**When working in a Remotion project**, always install the official Remotion Agent Skills first:
```bash
npx skills add remotion-dev/skills
```

## Common Content Creator Patterns

### Pattern 1: Prompt-to-Video

```
User prompt → Agent creates Remotion components → npm run dev → iterate → render
```

Best for: quick content, social media, prototypes.

### Pattern 2: Template + Data

```
Data source (JSON/API) → Parametric Remotion template → Batch render → Platform distribution
```

Best for: personalized videos at scale, analytics reports, user onboarding.

### Pattern 3: App-Embedded

```
Web app UI → Remotion Player (preview) → Remotion renderer → Export
```

Best for: video editor apps, social media scheduling tools, marketing platforms.

### Pattern 4: CI/CD Pipeline

```
Git push → GitHub Actions → Build Remotion → Render → Deploy to CDN
```

Best for: automated changelog videos, release notes, product updates.

## Deployment Options

| Option | Command | Best For |
|--------|---------|----------|
| **Local CLI** | `npx remotion render` | Single videos, testing |
| **Node.js API** | `@remotion/renderer` | Batch rendering, app integration |
| **Remotion Lambda** | `@remotion/lambda` | Scalable serverless (AWS) |
| **Cloud Run** | Docker + `remotion render` | Container-based production |
| **Remotion Player** | `@remotion/player` | In-browser preview in your app |

## Platform-Specific Rendering

```bash
# YouTube (16:9, H.264, high quality)
ffmpeg -i render.mp4 -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k -movflags +faststart youtube.mp4

# YouTube Shorts / TikTok / Instagram Reels (9:16, vertical)
ffmpeg -i render.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" \
  -c:v libx264 -crf 22 short.mp4

# LinkedIn / X (16:9, capped at 720p for upload speed)
ffmpeg -i render.mp4 -vf "scale=1280:720" -c:v libx264 -crf 22 social.mp4

# Instagram Feed (1:1, square)
ffmpeg -i render.mp4 -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black" square.mp4

# GIF (loop for social)
ffmpeg -i render.mp4 -vf "fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 output.gif
```

## Performance Optimization

### Remotion Side
- Use `useCurrentFrame()` sparingly — memoize children when possible
- Pre-render expensive computations with `useMemo()`
- Use `continueInBackground` for non-blocking rendering
- Set `--concurrency` to match CPU cores for faster renders
- Use `--quality` to control JPEG compression (lower = faster)

### FFmpeg Side
```bash
# Hardware-accelerated encoding (Apple Silicon)
ffmpeg -i input.mp4 -c:v h264_videotoolbox -b:v 5M -c:a copy output.mp4

# Hardware-accelerated encoding (NVIDIA)
ffmpeg -i input.mp4 -c:v h264_nvenc -preset p7 -cq 20 output.mp4

# Fast draft encoding
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset ultrafast draft.mp4

# Parallel encoding (split + encode + concat)
ffmpeg -i input.mp4 -f segment -segment_time 60 -c copy parts/%03d.mp4
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Remotion render hangs | Out of memory | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |
| FFmpeg `drawtext` not found | Missing `--enable-libfreetype` | Reinstall FFmpeg with freetype, or use Pillow overlay |
| Audio out of sync | Frame rate mismatch | Verify `fps` in composition matches source media |
| Lambda render timeout | Composition too long | Break into smaller segments, or increase Lambda timeout |
| Slow render | High CRF + complex scenes | Use `--concurrency=8` and reduce CRF temporarily |
| `No such filter` error | FFmpeg missing modules | Check `ffmpeg -filters` or reinstall with full build |
| Remotion Studio blank | Port conflict | `npm run dev -- --port=3001` |
| Caption alignment off | Frame timing drift | Use `getAudioDuration()` to verify audio length |

## Related Skills

- `ai-video-production` — Full pipeline with TTS, music gen, cloud GPU rendering
- `ai-video-cinema` — Google Veo 3.1 + Vertex AI cinematic production
- `ai-video-generation` — 100+ AI video models via Muapi API
- `edge-video-gen` — Local open-source video generation (Wan, CogVideo, etc.)
- `voicebox` — Local TTS/voice API for voiceover generation
- `edge-tts` — Local text-to-speech with open-source models
