---
name: local-visual-generation-agent
version: "1.0.0"
description: "Generates support visuals locally when stock media is weak or unavailable. Uses MFLUX/FLUX.1-schnell for images, ComfyUI for advanced workflows (inpainting, upscaling, LoRA, ControlNet), and LTX-Video for short image-to-video clips. Generated visuals are ONLY for intro, outro, thumbnail, abstract backgrounds, transitions, concept illustrations, or B-roll fillers. Never replaces real app walkthrough footage. Sixth step in the showcase-production-director workforce."
---

# Local Visual Generation Agent

Generates support visuals locally when free stock sources can't provide what's needed. Uses the local generation infrastructure (MFLUX, ComfyUI, LTX-Video) on macOS Apple Silicon.

## Input

- Production brief + shot list (for visual requirements)
- Gap list from `free-media-source-agent` (what couldn't be sourced)

## Scope: What to Generate

| Use Case | Engine | Example Prompt |
|----------|--------|---------------|
| Intro background | MFLUX | Abstract tech background, blue gradient, modern, no text |
| Chapter transition | MFLUX | Simple gradient with soft glow, dark theme |
| Concept illustration | MFLUX | Visual metaphor for "teamwork" or "speed" |
| Thumbnail background | MFLUX + upscale | High contrast background for text overlay |
| B-roll filler video | LTX-Video | Slow ambient movement, nature/tech/abstract |
| Image enhancement | ComfyUI | Upscale or inpaint to fix blemishes |

⚠️ **NEVER generate**:
- Fake app UI (use real screenshots/screen recordings)
- Fake data or charts
- Replacements for actual app walkthrough footage

## Generation Pipeline

### Default: MFLUX + FLUX.1-schnell (Images)

```bash
# Generate abstract background for chapter transitions
python3 -c "
from mflux import Flux1
model = Flux1.from_pretrained('flux-schnell')
image = model.generate_image(
    prompt='Abstract gradient background, deep blue to purple, smooth flowing shapes, no text, no logos, cinematic, 4K quality',
    width=1920, height=1080,
    steps=4, seed=42
)
image.save('assets/generated-images/chapter-bg-blue.png')
"
```

### Advanced: ComfyUI (Upscaling, Inpainting, LoRA)

```python
# Run a ComfyUI upscaling workflow
import json, requests

with open('workflows/comfyui/upscale-4x.json') as f:
    workflow = json.load(f)

# Set the input image
workflow["1"]["inputs"]["image"] = "assets/generated-images/thumbnail-raw.png"

response = requests.post(
    "http://127.0.0.1:8188/prompt",
    json={"prompt": workflow}
)
```

### Video: LTX-Video (Short Image-to-Video Clips)

```bash
# Generate a short ambient clip from a generated image
# Use the workflow at: workflows/comfyui/ltx-video-i2v.json
```

## Metadata

Every generated asset gets a metadata file in `./metadata/generated-assets/`:

```json
{
  "filename": "chapter-bg-blue.png",
  "engine": "mflux",
  "model": "FLUX.1-schnell",
  "prompt": "Abstract gradient background, deep blue to purple...",
  "width": 1920,
  "height": 1080,
  "steps": 4,
  "seed": 42,
  "generated_at": "2026-06-20T12:00:00Z",
  "usage": "Chapter transition background for sections 2-5"
}
```

## Output Directory

- Images: `./assets/generated-images/`
- Videos: `./assets/generated-videos/`
- Metadata: `./metadata/generated-assets/`

## Handoff

Pass all generated files + metadata to `storyboard-agent`.

## Related Skills

- `local-image-gen` — Detailed MFLUX/FLUX instructions
- `local-video-gen` — Detailed LTX-Video instructions
- `comfyui-workflows` — Advanced workflow engine
- `free-media-source-agent` — Stock sourcing (runs before this)
- `storyboard-agent` — Next step
- `showcase-production-director` — Master orchestrator
