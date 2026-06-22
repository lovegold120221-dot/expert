---
name: remotion-editor-agent
version: "1.0.0"
description: "Edits and renders the full tutorial using Remotion as the compositing brain and FFmpeg as the media operations engine. Trims clips, adds captions, cursor highlights, zooms, callouts, chapter titles, quiet background music, transitions, and exports final MP4 to ./out/final/youtube-app-tutorial.mp4. Inspects all media with FFprobe before editing. Ninth step in the showcase-production-director workforce."
---

# Remotion Editor Agent

Edits and renders the final tutorial using **Remotion** (compositing brain) + **FFmpeg** (media operations engine). This is where everything comes together.

## Input

All assets from previous steps:
- Screen recordings: `./assets/screen-recordings/scene-*.mp4`
- Sourced media: `./assets/source-images/`, `./assets/source-videos/`
- Generated media: `./assets/generated-images/`, `./assets/generated-videos/`
- Narration: `./assets/voiceover/narration.mp3`
- Music: `./assets/music/` (if sourced)
- Captions: `./assets/captions/captions.srt`, `./assets/captions/captions.json`
- Lower-thirds: `./assets/captions/lower-thirds.json`
- Storyboard: `./metadata/storyboard.md`

## Step 1: Inspect All Media with FFprobe

```bash
# Inspect every screen recording before editing
for f in assets/screen-recordings/*.mp4; do
  echo "=== $(basename "$f") ==="
  ffprobe -v quiet -print_format json -show_format -show_streams "$f"
done > metadata/screen-captures/media-inventory.json
```

Verify:
- ✅ All clips are 1920×1080
- ✅ All clips are 30 FPS
- ✅ Codec is H.264 (or transcodable)
- ✅ No clips have embedded audio that would conflict with narration

## Step 2: Transcode if Needed

```bash
# Transcode any non-H.264 clips to consistent format
for f in assets/screen-recordings/*.mp4; do
  codec=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$f")
  if [ "$codec" != "h264" ]; then
    echo "Transcoding $(basename "$f") from $codec to h264..."
    ffmpeg -i "$f" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
      "${f%.mp4}_transcoded.mp4"
  fi
done
```

## Step 3: Set Up Remotion Project

```bash
# Create Remotion project
cd ./templates/remotion
npx create-video@latest tutorial-edit --template blank
cd tutorial-edit
npm install
npx skills add remotion-dev/skills

# Symlink assets into Remotion public directory
ln -s ../../../assets public/assets
```

## Step 4: Build the Remotion Composition

The composition follows the storyboard scene-by-scene:

```tsx
// src/TutorialVideo.tsx
import { AbsoluteFill, Sequence, Audio, Video, Img, useVideoConfig,
         spring, interpolate, useCurrentFrame, Series } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// Import caption data
import captions from "../assets/captions/captions.json";
import lowerThirds from "../assets/captions/lower-thirds.json";

// --- Scene Components ---

const ScreenRecordingScene: React.FC<{
  src: string;
  captionText?: string;
  lowerThird?: string;
  zoomRegion?: { x: number; y: number; scale: number };
}> = ({ src, captionText, lowerThird, zoomRegion }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom effect
  const zoom = zoomRegion
    ? interpolate(frame, [0, 30, 60], [1, zoomRegion.scale, zoomRegion.scale])
    : 1;

  return (
    <AbsoluteFill>
      <Video
        src={src}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          transform: zoomRegion ? `scale(${zoom})` : undefined,
          transformOrigin: zoomRegion
            ? `${zoomRegion.x}% ${zoomRegion.y}%`
            : "center",
        }}
      />
      {/* Lower-third label */}
      {lowerThird && (
        <div style={{
          position: "absolute", top: 80, left: 60,
          background: "rgba(0,0,0,0.7)", color: "white",
          padding: "12px 24px", borderRadius: "0 8px 8px 0",
          fontSize: 24, fontFamily: "Arial, sans-serif",
          borderLeft: "4px solid #4A90D9",
        }}>
          {lowerThird}
        </div>
      )}
    </AbsoluteFill>
  );
};

const CaptionOverlay: React.FC<{
  captions: Array<{ start: number; end: number; text: string }>;
  currentTime: number;
}> = ({ captions, currentTime }) => {
  const active = captions.find(c => currentTime >= c.start && currentTime <= c.end);
  if (!active) return null;

  return (
    <div style={{
      position: "absolute", bottom: 80, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.6)", color: "white",
        padding: "12px 24px", borderRadius: 8,
        fontSize: 22, fontFamily: "Arial, sans-serif",
        textAlign: "center", maxWidth: "80%",
        lineHeight: 1.4,
      }}>
        {active.text}
      </div>
    </div>
  );
};

// --- Main Composition ---

export const TutorialVideo: React.FC<{
  scenes: Array<{
    src: string;
    durationFrames: number;
    lowerThird?: string;
    zoomRegion?: { x: number; y: number; scale: number };
  }>;
  narrationSrc: string;
  musicSrc?: string;
}> = ({ scenes, narrationSrc, musicSrc }) => {
  const { fps } = useVideoConfig();

  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {/* Audio layers */}
      <Audio src={narrationSrc} volume={1.0} />
      {musicSrc && <Audio src={musicSrc} volume={0.15} />}

      {/* Scene sequence */}
      {scenes.map((scene, i) => {
        const startFrame = scenes.slice(0, i).reduce((a, s) => a + s.durationFrames, 0);
        return (
          <Sequence key={i} from={startFrame} durationInFrames={scene.durationFrames}>
            <ScreenRecordingScene
              src={scene.src}
              lowerThird={scene.lowerThird}
              zoomRegion={scene.zoomRegion}
            />
          </Sequence>
        );
      })}

      {/* Caption overlay - applies to entire video */}
      <CaptionOverlay
        captions={captions}
        currentTime={frame / fps}
      />
    </AbsoluteFill>
  );
};
```

## Step 5: Register Composition

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { TutorialVideo } from "./TutorialVideo";

// Calculate total frames from scenes
const TOTAL_FRAMES = scenes.reduce((a, s) => a + s.durationFrames, 0);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TutorialVideo"
      component={TutorialVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        scenes: [
          { src: "scene-01-preview.mp4", durationFrames: 900 },
          { src: "scene-02-dashboard-overview.mp4", durationFrames: 1350 },
          // ... all 9 scenes
        ],
        narrationSrc: "narration.mp3",
        musicSrc: "background-music.mp3",
      }}
    />
  );
};
```

## Step 6: Draft Render

```bash
# Fast draft for timing review
npx remotion render TutorialVideo out/final/draft.mp4 --crf=28

# Check duration matches target (10-15 min)
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 out/final/draft.mp4
```

## Step 7: Apply FFmpeg Post-Production

After Remotion exports the draft, use FFmpeg for finishing:

```bash
# 1. Audio mastering — mix narration + music
ffmpeg -i out/final/remotion-render.mp4 \
  -i assets/voiceover/narration.mp3 \
  -i assets/music/background-music.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[voice];[2:a]volume=0.15[music];\
   [voice][music]amix=inputs=2:duration=first:weights=1.0 0.15[audio]" \
  -map 0:v -map "[audio]" \
  -c:v copy -c:a aac -b:a 192k \
  out/final/audio-mixed.mp4

# 2. Burn subtitles into video (if needed)
ffmpeg -i out/final/audio-mixed.mp4 \
  -vf "subtitles=assets/captions/captions.srt:force_style='FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=60'" \
  -c:a copy \
  out/final/captioned.mp4

# 3. Final export — YouTube optimized
ffmpeg -i out/final/captioned.mp4 \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 192k -movflags +faststart \
  out/final/youtube-app-tutorial.mp4
```

## Step 8: Verify Final Output

```bash
ffprobe -v quiet -print_format json -show_format -show_streams \
  out/final/youtube-app-tutorial.mp4 > metadata/renders/final-render-info.json

echo "Duration: $(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 out/final/youtube-app-tutorial.mp4)s"
echo "Size: $(du -h out/final/youtube-app-tutorial.mp4 | cut -f1)"
echo "Resolution: $(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of default=noprint_wrappers=1:nokey=1 out/final/youtube-app-tutorial.mp4)"
```

## Render Metadata

Save as `./metadata/renders/render-log.json`:

```json
{
  "project": "[App Name] Tutorial",
  "rendered_at": "2026-06-20T12:00:00Z",
  "engine": "remotion + ffmpeg",
  "remotion_version": "4.x",
  "duration_seconds": 780,
  "resolution": {"width": 1920, "height": 1080},
  "fps": 30,
  "scenes": 9,
  "assets_used": {
    "screen_recordings": ["scene-01.mp4", "..."],
    "source_images": ["bg.jpg", "..."],
    "generated_images": ["chapter-bg.png", "..."],
    "voiceover": "narration.mp3",
    "music": "background-music.mp3"
  },
  "ffmpeg_passes": ["audio-mix", "caption-burn", "final-export"],
  "output": "out/final/youtube-app-tutorial.mp4"
}
```

## Handoff

Pass the final video + all metadata to `final-quality-check-agent`.

## Related Skills

- `video-editing-assembly` — Detailed Remotion + FFmpeg instructions
- `remotion-content-creator` — Remotion architecture deep-dive
- `voice-caption-agent` — Input: captions and narration
- `storyboard-agent` — Input: editing timeline
- `final-quality-check-agent` — Next step
- `showcase-production-director` — Master orchestrator
