---
name: comfyui-workflows
version: "1.0.0"
description: "ComfyUI as the advanced local workflow engine for image, video, upscaling, inpainting, LoRA, ControlNet, and workflow automation on macOS Apple Silicon. Saves workflow JSONs to ./workflows/comfyui and output to ./out. Use when the user asks to: use ComfyUI, run advanced AI image workflows, do inpainting with ComfyUI, upscale images with AI, apply LoRA models, use ControlNet for pose/edge/depth control, load or create workflow JSONs, batch process images, automate ComfyUI pipelines, run custom nodes, or chain multiple AI models together visually."
---

# ComfyUI Workflows

ComfyUI as the advanced local workflow engine for image and video generation on **macOS Apple Silicon**. For complex pipelines that standard tools can't handle — inpainting, upscaling, LoRA, ControlNet, and multi-model chains.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  ComfyUI Server                   │
│              http://127.0.0.1:8188                │
├──────────────────────────────────────────────────┤
│                                                   │
│  Node Graph ───▶ Queue ───▶ Execute ───▶ Output   │
│                                                   │
│  • Load image/checkpoint   • KSampler             │
│  • VAE encode/decode       • ControlNetApply      │
│  • CLIP text encode        • LatentUpscale         │
│  • LoRALoader              • SaveImage/Video       │
│                                                   │
└──────────────────────────────────────────────────┘
        ▲                                    │
        │ WebSocket API                      │ File System
        │ REST API                           │
        │ (JSON workflow)                    ▼
        │                            ./workflows/comfyui/
        │                            ./out/images/
        │                            ./out/videos/
        └─────────────────────────────────────────┘
                     Programmatic Control
```

## Setup

```bash
# Prerequisites: Python 3.10+, Git
# Install ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Install custom nodes (as needed)
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git  # Node manager
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git  # Video tools
# cd ..

# Start server (Apple Silicon optimized)
python3 main.py --force-fp16 --highvram

# Open in browser
# http://127.0.0.1:8188
```

## Workflow Categories

Save all workflow JSONs to `./workflows/comfyui/`:

### 1. Text-to-Image

**File**: `./workflows/comfyui/txt2img.json`

Basic text-to-image with FLUX.1 or SDXL:
```
LoadCheckpoint → CLIPTextEncode → KSampler → VAEDecode → SaveImage
```

### 2. Image-to-Image (img2img)

**File**: `./workflows/comfyui/img2img.json`

Generate variations of an existing image:
```
LoadImage → VAEEncode → KSampler (with denoise=0.6) → VAEDecode → SaveImage
```

**Denoise parameter**: 
- 0.3-0.5 = subtle changes (color, lighting)
- 0.5-0.7 = moderate changes (composition, style)
- 0.7-0.9 = major changes (different scene, same structure)

### 3. Inpainting

**File**: `./workflows/comfyui/inpaint.json`

Replace specific regions of an image:
```
LoadImage + LoadMask → VAEEncode → KSampler → VAEDecode → SaveImage
```

**Inpainting workflow:**
1. Load the source image
2. Create a mask (white = regenerate, black = keep)
3. Mask can be loaded from file or generated with SAM/CLIP segmentation
4. Set denoise to 1.0 for full regeneration of masked area

```python
# Programmatic inpainting via API
import json, requests

workflow = json.load(open("workflows/comfyui/inpaint.json"))
# Modify the mask node's image input
workflow["10"]["inputs"]["image"] = "path/to/mask.png"

requests.post("http://127.0.0.1:8188/prompt",
    json={"prompt": workflow})
```

### 4. Upscaling

**File**: `./workflows/comfyui/upscale-4x.json`

Upscale images with AI models (4K output):
```
LoadImage → UpscaleModelLoader → ImageUpscaleWithModel → SaveImage
```

**Recommended upscalers**: 
- `4x-UltraSharp.pth` — Best for general photography
- `4x-AnimeSharp.pth` — Best for illustrated/anime content  
- `8x_NMKD-Superscale_150000_G.pth` — Maximum quality (very slow)

### 5. LoRA Application

**File**: `./workflows/comfyui/lora-apply.json`

Apply fine-tuned style/subject models:
```
LoadCheckpoint → LoadLoRA → CLIPTextEncode → KSampler → VAEDecode → SaveImage
```

**LoRA strength**: 0.5-1.0 (higher = stronger effect)

### 6. ControlNet

**File**: `./workflows/comfyui/controlnet-pose.json`

Pose/edge/depth-guided generation:
```
LoadImage (source) → ControlNetLoader → ControlNetApply → KSampler → VAEDecode → SaveImage
```

**ControlNet types:**
| Type | File | Best For |
|------|------|----------|
| Canny | `controlnet-canny.json` | Edge-guided, structural |
| OpenPose | `controlnet-pose.json` | Human pose, character consistency |
| Depth | `controlnet-depth.json` | 3D scene structure |
| Scribble | `controlnet-scribble.json` | Rough sketch → refined image |
| MLSD | `controlnet-mlsd.json` | Straight lines, architecture |

### 7. LTX-Video (Image-to-Video)

**File**: `./workflows/comfyui/ltx-video-i2v.json`

Generate short video clips from still images:
```
LoadImage → LTXVideoI2V → VHSVideoCombine → SaveVideo
```

## Programmatic API

### Submit a Workflow

```python
import json, requests, uuid
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"

def run_workflow(workflow_path: str, node_overrides: dict = None) -> str:
    """
    Run a ComfyUI workflow JSON and return the prompt ID.
    
    Args:
        workflow_path: Path to workflow JSON file
        node_overrides: Dict of {node_id: {field: value}} to override
    
    Returns:
        prompt_id: UUID string for tracking
    """
    with open(workflow_path) as f:
        workflow = json.load(f)
    
    # Apply node overrides
    if node_overrides:
        for node_id, overrides in node_overrides.items():
            if node_id in workflow:
                workflow[node_id]["inputs"].update(overrides)
    
    # Submit to ComfyUI
    response = requests.post(
        f"{COMFYUI_URL}/prompt",
        json={"prompt": workflow, "client_id": str(uuid.uuid4())}
    )
    response.raise_for_status()
    return response.json()["prompt_id"]


def wait_for_completion(prompt_id: str, timeout: int = 300) -> dict:
    """Wait for a workflow to complete and return outputs."""
    import time
    start = time.time()
    
    while time.time() - start < timeout:
        history = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
        if history.status_code == 200 and history.json():
            return history.json()[prompt_id]
        time.sleep(1)
    
    raise TimeoutError(f"Workflow {prompt_id} did not complete within {timeout}s")


def queue_and_wait(workflow_path: str, overrides: dict = None) -> dict:
    """Run a workflow and wait for it to complete."""
    prompt_id = run_workflow(workflow_path, overrides)
    return wait_for_completion(prompt_id)
```

### Workflow Templates

```python
# Run inpainting on an image
result = queue_and_wait(
    "workflows/comfyui/inpaint.json",
    {
        "1": {"image": "path/to/source.png"},  # LoadImage node
        "2": {"image": "path/to/mask.png"},     # LoadMask node
        "10": {"seed": 42, "steps": 30},        # KSampler node
    }
)

# Run upscaling
result = queue_and_wait(
    "workflows/comfyui/upscale-4x.json",
    {
        "1": {"image": "out/images/raw.png"},
    }
)

# Generate with ControlNet pose
result = queue_and_wait(
    "workflows/comfyui/controlnet-pose.json",
    {
        "1": {"image": "out/images/pose-ref.png"},
        "3": {"text": "A person wearing a business suit"},
        "10": {"seed": 99},
    }
)
```

## Workflow Metadata

Every workflow JSON saved to `./workflows/comfyui/` should include its purpose as a comment or in a companion `.md` file:

Save companion file as `./workflows/comfyui/{workflow-name}.md`:

```markdown
# {workflow-name}.json

## Purpose
Describe what this workflow does (e.g., "Upscales images to 4K using 4x-UltraSharp")

## Nodes
- LoadImage (id: 1) — input image
- UpscaleModelLoader (id: 5) — loads 4x-UltraSharp.pth
- ImageUpscaleWithModel (id: 6) — applies upscale
- SaveImage (id: 9) — saves to ComfyUI output dir

## Parameters
- upscale_model: "4x-UltraSharp.pth"

## Usage
```python
run_workflow("workflows/comfyui/upscale-4x.json", {"1": {"image": "input.png"}})
```
```

## File Organization

```
project/
├── workflows/
│   └── comfyui/                 # All workflow JSONs
│       ├── txt2img.json
│       ├── img2img.json
│       ├── inpaint.json
│       ├── upscale-4x.json
│       ├── lora-apply.json
│       ├── controlnet-pose.json
│       ├── controlnet-canny.json
│       ├── controlnet-depth.json
│       ├── ltx-video-i2v.json
│       ├── txt2img.md            # Workflow documentation
│       └── inpaint.md
├── out/
│   ├── images/                   # ComfyUI image outputs
│   └── videos/                   # ComfyUI video outputs
└── metadata/                     # Metadata for ComfyUI outputs
```

## Best Practices

### Workflow Design
- Use **Reroute** nodes for clean connections
- Add **PreviewImage** nodes for intermediate debugging
- Use **Primitive** nodes for frequently changed parameters (seed, steps, prompt)
- Save workflows with **Export** (not Save) to strip workflow-level metadata

### Performance on Apple Silicon
- Use `--force-fp16` flag for MPS performance
- Use `--highvram` if you have 16GB+ unified memory
- Close other GPU-intensive apps during generation
- For FLUX.1 workflows, use `--force-fp16 --lowvram` if memory constrained

### Custom Nodes (via ComfyUI Manager)
Essential custom nodes for content creation:
- `ComfyUI-Manager` — Install/update custom nodes
- `ComfyUI-VideoHelperSuite` — Video combine/export
- `ComfyUI-Impact-Pack` — Advanced segmentation, face detection
- `ComfyUI-Frame-Interpolation` — Smooth slow motion
- `rgthree-comfy` — Power nodes (efficient rerouting)

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "CUDA error: out of memory" | MPS memory exhausted | Reduce batch size, use --lowvram, lower resolution |
| "No such node type" | Missing custom node | Install via ComfyUI Manager |
| WebSocket connection failed | Queue too long | Clear queue, restart ComfyUI |
| Image corruption in output | VAE mismatch | Ensure VAE matches checkpoint |
| Slow generation | fp32 instead of fp16 | Use `--force-fp16` flag |
| Workflow loads wrong models | Path mismatch | Use relative paths in workflow JSON |

## Related Skills

- `local-image-gen` — Fast text-to-image (MFLUX) for simple cases
- `local-video-gen` — LTX-Video video generation
- `video-editing-assembly` — Final video assembly
- `free-image-source` — Free stock images as alternative inputs
