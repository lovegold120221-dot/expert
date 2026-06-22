---
name: ai-video-cinema
description: "Cinematic AI video production with Google Veo 3.1, FFmpeg compositing, and Google Vertex AI GenMedia tooling. Expert in cinematic video generation, video editing, format conversion, overlays, clip concatenation, GIF creation, and audio sync. Use when the user asks to: generate cinematic-quality AI video, use Veo 3.1 for text-to-video, overlay images on video, concatenate video clips, create GIFs from video, sync audio to video, use the 5-part cinematic prompt formula, apply camera controls for AI video, generate video with reference images for consistency, do first-frame-to-last-frame video transitions, or use ingredients-to-video for multi-reference shots. Reference: github.com/GoogleCloudPlatform/vertex-ai-creative-studio — GenMedia video editor skill with Veo 3.1 and FFmpeg tooling."
---

# AI Cinema — Veo 3.1 + FFmpeg Video Production

Cinematic AI video production using Google Veo 3.1, FFmpeg-based tools, and the GenMedia toolchain for professional-grade video compositing and editing.

## Core Tools

| Tool | Function | MCP Endpoint |
|------|----------|--------------|
| Veo T2V | Text-to-video generation | `mcp_veo_veo_t2v` |
| Veo I2V | Image-to-video generation | `mcp_veo_veo_i2v` |
| Veo Extend | Extend existing video | `mcp_veo_veo_extend_video` |
| Veo First→Last | Transition between two key frames | `mcp_veo_veo_first_last_to_video` |
| Veo Ingredients | Multi-reference image to video | `mcp_veo_veo_ingredients_to_video` |
| FFmpeg Overlay | Place image on video | `mcp_avtool_ffmpeg_overlay_image_on_video` |
| FFmpeg Concat | Merge multiple clips | `mcp_avtool_ffmpeg_concatenate_media_files` |
| FFmpeg→GIF | Convert video to GIF | `mcp_avtool_ffmpeg_video_to_gif` |
| FFmpeg Audio Sync | Combine audio and video | `mcp_avtool_ffmpeg_combine_audio_and_video` |
| FFmpeg Media Info | Get video/audio metadata | `mcp_avtool_ffmpeg_get_media_info` |

## Veo 3.1 Cinematic Video Generation

### The 5-Part Formula

Every Veo video prompt should combine five elements:

```
[CINEMATOGRAPHY] + [SUBJECT] + [ACTION] + [CONTEXT] + [STYLE]
```

**Examples:**

| Level | Prompt |
|-------|--------|
| Basic | "A cat playing with a ball of yarn" |
| Good | "Close-up of a ginger cat batting a red yarn ball on a hardwood floor, warm afternoon light" |
| Cinematic | "Low-angle close-up tracking shot of a ginger cat playfully batting a red yarn ball on a polished hardwood floor, golden afternoon sunlight streaming through a window creating long shadows, soft fur texture, shallow depth of field, vintage 16mm film grain" |

### Cinematography Vocabulary

| Shot Type | Description | Best For |
|-----------|-------------|----------|
| High-angle long shot | Camera above, full body visible | Establishing scenes |
| Low-angle tracking shot | Camera below, moving with subject | Power, drama |
| Over-the-shoulder | Behind a character looking at subject | Dialogue, POV |
| Extreme close-up | Single detail fills frame | Emotion, intensity |
| Dutch angle | Tilted horizon | Tension, unease |
| Crane shot | Vertical camera movement | Grand reveals |
| POV | Through character's eyes | Immersion |
| Drone shot | Aerial, sweeping | Landscapes, scale |

### Soundstage Direction (Veo 3+)

For Veo 3 models, use quotation marks for specific dialogue and brackets for audio:

```
A robot says "HELLO WORLD" while sparks fly around it. [loud electrical crackle] [gentle hum]
```

### Advanced Generation Modes

| Mode | MCP Tool | Use Case |
|------|----------|----------|
| **Text-to-Video** | `veo_t2v` | Generate video from text prompt |
| **Image-to-Video** | `veo_i2v` | Animate a starting image |
| **First→Last** | `veo_first_last_to_video` | Precise control over transition between two key frames — first image = start frame, last image = end frame, Veo generates the motion between them |
| **Ingredients** | `veo_ingredients_to_video` (or `veo_reference_to_video`) | Up to 3 reference images to maintain character/style consistency across multi-shot sequences |
| **Extend Video** | `veo_extend_video` | Seamlessly continue an existing video |

### Quality Tiers

| Model | Best For | Speed |
|-------|----------|-------|
| `veo-3.1-generate-001` | Full cinematic quality, 1080p | Slower |
| `veo-3.1-lite-generate-001` | Faster generation, 720p/1080p | Faster |

## Image-on-Video Overlay

When placing logos, watermarks, or static elements on existing video:

1. **Check source dimensions** — use `ffmpeg_get_media_info` to get video width/height
2. **Calculate coordinates** — top-left is `0:0`, bottom-right is `(width-overlay_width):(height-overlay_height)`
3. **Apply overlay** — call `ffmpeg_overlay_image_on_video`

## Clip Concatenation

When merging multiple video clips:

1. **Verify compatibility** — ensure all clips have matching dimensions and frame rates using `ffmpeg_get_media_info`
2. **Standardize if needed** — the concat tool will auto-standardize mismatched clips
3. **Concat** — use `ffmpeg_concatenate_media_files`

## GIF Generation

```bash
# Two-pass approach for high-quality GIFs
ffmpeg_video_to_gif(
  input="video.mp4",
  fps=15,                    # Default: good balance
  scale_width_factor=0.33    # Default: reduces to 1/3 width
)
```

- **fps=15** for standard web GIFs
- Increase fps for smoother animation (larger file)
- Increase `scale_width_factor` for higher resolution (larger file)

## Audio-Video Sync

When adding soundtrack or voiceover to video:

1. **Check audio duration** — use `ffmpeg_get_media_info` on the audio file
2. **Ensure video matches** — video should be at least as long as audio
3. **Combine** — use `ffmpeg_combine_audio_and_video`
4. **Level adjustment** — use `input_video_volume_db_change` and `input_audio_volume_db_change` to balance:
   - Video original audio: reduce by -12dB to -20dB (becomes background)
   - New audio track: keep at 0dB (primary audio)

## Technical Tips

- Always check media info BEFORE attempting complex filters
- Prefer `.mp4` (H.264) for maximum compatibility
- For lossless intermediate edits, use ProRes or DNxHD
- For web delivery: H.264 .mp4 with AAC audio at 192kbps
- For GIFs: under 15MB is ideal for most web use cases

## Full Cinematic Workflow

```
1. PLAN: Write scene-by-scene script with 5-part prompts
2. GENERATE: Create reference images for each scene (Flux/Midjourney)
3. ANIMATE: Use Veo ingredients-to-video with images as references
4. COMPOSE: Overlay titles, logos, lower-thirds via FFmpeg
5. AUDIO: Generate voiceover, add background music
6. SYNC: Combine audio tracks, balance levels
7. CONCAT: Merge all scenes into final video
8. OPTIMIZE: Create GIF excerpt, verify media info
9. EXPORT: Output as H.264 .mp4
```

## Experience Notes

Path: `{working-directory}/video-cinema-memories/video-cinema.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
