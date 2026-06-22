---
name: local-image-gen
version: "1.0.0"
description: "Locally hosted image generation on macOS Apple Silicon. Uses MFLUX with FLUX.1-schnell as the default engine for fast text-to-image generation. Uses ComfyUI only for advanced workflows: inpainting, upscaling, LoRA, ControlNet, or workflow JSON loading. Saves outputs to ./out/images and metadata to ./metadata. Use when the user asks to: generate images locally, create AI art on Mac, run FLUX on Apple Silicon, text-to-image without cloud, generate images offline, create scene images for video, do inpainting, upscale images, use ControlNet, or apply LoRA models locally."
---

# Local Image Generation

Locally hosted image generation on **macOS Apple Silicon** using MFLUX (default) and ComfyUI (advanced).

## Engine Selection

| Engine | When to Use | VRAM | Speed |
|--------|-------------|------|-------|
| **MFLUX** (default) | Fast text-to-image, batch generation, simple prompts | ~8GB | Fast (~5-15s per image) |
| **ComfyUI** | Inpainting, upscaling, LoRA, ControlNet, workflow JSON | ~8-12GB | Medium (workflow-dependent) |

## Default: MFLUX + FLUX.1-schnell

### Setup

```bash
# Install MFLUX
pip install mflux

# Verify installation — should detect Apple Silicon (MPS)
python3 -c "import torch; print('MPS available:', torch.backends.mps.is_available())"
```

### Generate Image

```bash
# Basic text-to-image generation
python3 -c "
from mflux import Flux1

# Load model (schnell = fast, dev = quality)
model = Flux1.from_pretrained('flux-schnell')  # or 'flux-dev'

# Generate image
image = model.generate_image(
    seed=42,
    prompt='A professional office meeting room with modern furniture, bright lighting, photorealistic',
    width=1024,
    height=576,  # 16:9 ratio for video projects
    steps=4,     # schnell: 2-4 steps. dev: 25-50 steps
    guidance=3.5
)

# Save
image.save('out/images/office-meeting.png')
"
```

### Image Generation Parameters

| Parameter | FLUX.1-schnell | FLUX.1-dev |
|-----------|---------------|------------|
| Steps | 2-4 (default: 4) | 25-50 (default: 30) |
| Guidance | 2.0-5.0 (default: 3.5) | 3.0-7.0 (default: 3.5) |
| Speed | ~5-8s per image | ~30-60s per image |
| Quality | Good (fast) | Better (slow) |

### Prompt Tips for Content Creator Images

```bash
# Scene image for video B-roll
python3 -c "
from mflux import Flux1
model = Flux1.from_pretrained('flux-schnell')
image = model.generate_image(
    prompt='Wide shot of a modern tech startup office, employees collaborating at desks, natural lighting, Apple-like aesthetic, clean minimalist design, 4K',
    width=1536, height=864,  # 16:9 widescreen
    steps=4, seed=42
)
image.save('out/images/tech-office-bg.png')
"

# Abstract background for text overlays
python3 -c "
from mflux import Flux1
model = Flux1.from_pretrained('flux-schnell')
image = model.generate_image(
    prompt='Abstract gradient background in deep blue and purple, smooth flowing shapes, subtle glow, no text, no logos, wallpaper style',
    width=1920, height=1080,
    steps=3, seed=7
)
image.save('out/images/abstract-bg.png')
"

# Product or object shot
python3 -c "
from mflux import Flux1
model = Flux1.from_pretrained('flux-schnell')
image = model.generate_image(
    prompt='Professional microphone on desk, studio lighting, shallow depth of field, podcast setup, photorealistic',
    width=1024, height=1024,
    steps=4, seed=21
)
image.save('out/images/microphone-shot.png')
"
```

## Advanced: ComfyUI

Use ComfyUI when you need advanced image operations:

```bash
# Start ComfyUI server
cd /path/to/ComfyUI
python3 main.py --force-fp16 --highvram

# ComfyUI runs at: http://127.0.0.1:8188
```

### When to Use ComfyUI

| Operation | Why ComfyUI | MFLUX Equivalent |
|-----------|-------------|-----------------|
| **Inpainting** | Mask-based region regeneration | Not supported |
| **Image-to-image** | Generate variations of existing image | Not supported natively |
| **Upscaling** | 2x-4x with model-based upscalers | Basic resize only |
| **LoRA** | Apply finetuned styles/subjects | Not supported |
| **ControlNet** | Pose/edge/depth-guided generation | Not supported |
| **Workflow JSON** | Load/save complex multi-node graphs | Not supported |
| **Batch processing** | Queue multiple jobs | Supported natively |

### ComfyUI Workflow Usage

```python
# Programmatic: Submit workflow JSON to ComfyUI API
import json, requests

def run_comfyui_workflow(workflow_path, output_node_id=9):
    """Load and execute a ComfyUI workflow."""
    with open(workflow_path) as f:
        workflow = json.load(f)
    
    response = requests.post(
        "http://127.0.0.1:8188/prompt",
        json={"prompt": workflow}
    )
    return response.json()

# Example: Run an inpainting workflow
run_comfyui_workflow("workflows/comfyui/inpaint-workflow.json")

# Example: Run an upscaling workflow
run_comfyui_workflow("workflows/comfyui/upscale-4x-workflow.json")
```

## Metadata

Every generated image MUST have metadata saved alongside it.

Save as `./metadata/{filename}.json`:

```json
{
  "filename": "office-meeting.png",
  "engine": "mflux",
  "model": "FLUX.1-schnell",
  "prompt": "A professional office meeting room...",
  "negative_prompt": null,
  "width": 1024,
  "height": 576,
  "steps": 4,
  "guidance": 3.5,
  "seed": 42,
  "generated_at": "2026-06-20T12:00:00Z",
  "generation_time_seconds": 6.5,
  "comfyui_workflow": null,
  "usage": "B-roll background for video scene 3"
}
```

For ComfyUI-generated images, additionally save:

```json
{
  "filename": "inpainted-scene.png",
  "engine": "comfyui",
  "model": "FLUX.1-schnell + inpainting",
  "workflow_file": "workflows/comfyui/inpaint-workflow.json",
  "workflow_workflow_id": "abc-123",
  "prompt": "...",
  "seed": 42,
  "generated_at": "2026-06-20T12:00:00Z",
  "usage": "Replaced background element in scene 3"
}
```

## Output Organization

```
project/
├── out/
│   └── images/           # Generated images
│       ├── office-meeting.png
│       ├── tech-office-bg.png
│       └── ...
├── metadata/              # Metadata for every generated image
│   ├── office-meeting.json
│   └── ...
└── workflows/
    └── comfyui/           # ComfyUI workflow JSONs
        ├── inpaint-workflow.json
        ├── upscale-4x-workflow.json
        └── ...
```

## Aspect Ratios for Content Creation

| Use Case | Aspect Ratio | Dimensions (W×H) |
|----------|-------------|------------------|
| YouTube video background | 16:9 | 1920×1080 or 1536×864 |
| YouTube thumbnail | 16:9 | 1280×720 |
| Instagram post | 1:1 | 1024×1024 |
| Instagram story / Shorts | 9:16 | 864×1536 |
| Presentation slide | 4:3 | 1024×768 |
| Wide banner | 21:9 | 1920×822 |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "MPS backend not available" | PyTorch not installed with MPS | `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cpu` |
| Out of memory during generation | FLUX.1-dev with high resolution | Use `flux-schnell` instead, reduce resolution, or close other apps |
| "No module named mflux" | MFLUX not installed | `pip install mflux` |
| CUDA error on Mac | CUDA-only model variant | FLUX.1-schnell works on MPS. Make sure you're using the right model. |
| ComfyUI won't connect | Server not running | Start ComfyUI first with `python3 main.py` |
| Slow generation | High step count | Reduce steps (schnell: 2-4, dev: 25 max) |

## Related Skills

- `local-video-gen` — Animate generated images into video clips
- `comfyui-workflows` — Advanced workflow management for ComfyUI
- `free-image-source` — Free stock images as alternative
- `video-editing-assembly` — Assemble images into final video
