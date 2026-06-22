---
name: edge-image-gen
version: "1.0.0"
description: "Local image generation with open-source models — Stable Diffusion, SDXL, FLUX, SD3, HiDream, Hunyuan Image. Use when the user asks to: generate images locally, create AI art offline, set up Stable Diffusion, run FLUX on local GPU, build image gen pipeline, use ComfyUI, generate images with ControlNet, upscale with ESRGAN, do inpainting, create image variations."
argument-hint: 'edge-image-gen generate image locally | edge-image-gen setup Stable Diffusion | edge-image-gen run FLUX on GPU'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🎨"
    tags: [image-generation, stable-diffusion, flux, comfyui, sd, sdxl, controlnet, upscale, inpainting, local, gpu, metal, cuda]
    repos:
      - https://github.com/Comfy-Org/ComfyUI (⭐117k)
      - https://github.com/AUTOMATIC1111/stable-diffusion-webui (⭐163k)
      - https://github.com/huggingface/diffusers (⭐33.7k)
---

# 🎨 Local Image Generation — Zero Cloud, Full Control

Generate images entirely on your machine using open-source models. No API keys, no credits, no censorship.

---

## Hardware → Model Selection

Auto-detect and recommend:

```bash
# Detect GPU
python3 -c "
import torch
if torch.cuda.is_available():
    mem = torch.cuda.get_device_properties(0).total_mem / 1e9
    print(f'NVIDIA GPU: {mem:.1f}GB VRAM')
    if mem >= 24:    print('→ Run: FLUX-dev, SD3.5-Large, SDXL (full)')
    elif mem >= 12:  print('→ Run: SDXL, FLUX-schnell, SD3.5-Medium')
    elif mem >= 8:   print('→ Run: SD1.5, SDXL (fp16), Wan2.1-1.3B')
    elif mem >= 4:   print('→ Run: SD1.5, LCM-LoRA (fast)')
    else:            print('→ Run: SD1.5 (CPU mode) or use ComfyUI --cpu')
elif torch.backends.mps.is_available():
    print('Apple Silicon (Metal) → Run: SD1.5, SDXL, FLUX-schnell')
else:
    print('CPU only → Run: SD1.5 (slow) or use cloud fallback')
"
```

## Quick Start — ComfyUI (⭐117k)

The universal node-graph interface for ALL image/video/audio models.

```bash
# Desktop app (macOS/Windows) — easiest
# Download from: https://www.comfy.org/download

# Or pip install
git clone https://github.com/Comfy-Org/ComfyUI
cd ComfyUI
pip install -r requirements.txt
python main.py  # Opens at http://localhost:8188
```

**Place models in:**
```
ComfyUI/models/checkpoints/    ← SD1.5, SDXL, FLUX .safetensors
ComfyUI/models/vae/            ← VAE
ComfyUI/models/loras/          ← LoRA adapters
ComfyUI/models/controlnet/     ← ControlNet
ComfyUI/models/upscale_models/ ← ESRGAN
```

## Python API — Diffusers (⭐33.7k)

```bash
pip install diffusers transformers accelerate
```

**SDXL — Best quality/performance balance (12GB+ VRAM):**
```python
from diffusers import StableDiffusionXLPipeline
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16, variant="fp16"
).to("cuda")
image = pipe("A cyberpunk city at sunset, neon lights reflecting on wet streets").images[0]
image.save("output.png")
```

**SD1.5 — Runs on 4GB VRAM, fastest iteration:**
```python
from diffusers import StableDiffusionPipeline
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")
```

**FLUX-schnell — Best quality, 24GB+ VRAM:**
```python
from diffusers import FluxPipeline
pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell",
    torch_dtype=torch.bfloat16
).to("cuda")
```

**Apple Silicon (MPS) — Mac users:**
```python
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5"
).to("mps")  # Metal Performance Shaders
```

## Advanced Techniques

### ControlNet — Pose, Depth, Canny
```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny")
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", controlnet=controlnet
)
image = pipe("cyberpunk", image=canny_image).images[0]
```

### Inpainting — Edit specific regions
```python
pipe = StableDiffusionInpaintPipeline.from_pretrained(
    "runwayml/stable-diffusion-inpainting"
)
result = pipe(prompt="a cat", image=original, mask_image=mask).images[0]
```

### Upscale — ESRGAN, SwinIR, 4x-UltraSharp
```python
# ComfyUI node: Load Upscale Model → Upscale Image
# Models: 4x-UltraSharp.pth, 4x_NMKD-Superscale.pth, 8x_NMKD-Superscale.pth
```

### LCM-LoRA — 4-step generation (real-time)
```python
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
image = pipe("fast generation", num_inference_steps=4).images[0]
```

## Available Models (Free & Open)

| Model | VRAM | Quality | Speed |
|-------|------|---------|-------|
| SD1.5 | 4 GB | Good | Fast |
| SDXL 1.0 | 8 GB | Great | Medium |
| SD3.5 Medium | 12 GB | Excellent | Medium |
| SD3.5 Large | 24 GB | Best | Slow |
| FLUX.1-schnell | 24 GB | Excellent | Medium |
| FLUX.1-dev | 24 GB | Best | Slow |
| HiDream | 12 GB | Excellent | Medium |
| Hunyuan Image 2.1 | 12 GB | Excellent | Medium |
| Qwen Image | 16 GB | Excellent | Medium |
| Lumina 2.0 | 12 GB | Great | Fast |

## One-Click Quick Commands

```bash
# Install ComfyUI with one click
pip install comfy-cli && comfy install

# Generate from CLI
python -c "
from diffusers import StableDiffusionPipeline
pipe = StableDiffusionPipeline.from_pretrained('runwayml/stable-diffusion-v1-5', safety_checker=None)
pipe.to('cuda' if __import__('torch').cuda.is_available() else 'mps' if __import__('torch').backends.mps.is_available() else 'cpu')
pipe('YOUR PROMPT').images[0].save('out.png')
"
```
