---
name: edge-video-gen
version: "1.0.0"
description: "Local video generation with open-source models — Wan2.1, CogVideoX, Mochi 1, Hunyuan Video, LTX-Video, Stable Video Diffusion. Use when the user asks to: generate AI video locally, create video from text, animate images into video, do image-to-video, run video models on GPU, set up ComfyUI for video, create first-frame-to-last-frame transitions."
argument-hint: 'edge-video-gen generate video locally | edge-video-gen animate image | edge-video-gen text-to-video'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🎬"
    tags: [video-generation, text-to-video, image-to-video, wan, cogvideo, mochi, hunyuan-video, comfyui, local, gpu]
    repos:
      - https://github.com/Wan-Video/Wan2.1 (⭐16.2k)
      - https://github.com/THUDM/CogVideo (⭐12.7k)
      - https://github.com/genmoai/mochi (⭐3.6k)
---

# 🎬 Local Video Generation — Cinema on Your Machine

Generate videos from text or images using open-source models. Run entirely offline.

---

## Hardware → Model Selection

```bash
python3 -c "
import torch
if torch.cuda.is_available():
    mem = torch.cuda.get_device_properties(0).total_mem / 1e9
    print(f'NVIDIA GPU: {mem:.1f}GB VRAM')
    if mem >= 24:    print('→ Wan2.1-14B, CogVideoX-5B, Mochi-1 (full)')
    elif mem >= 16:  print('→ Wan2.1-14B (offload), CogVideoX-5B (int8)')
    elif mem >= 12:  print('→ Wan2.1-1.3B, CogVideoX-2B, LTX-Video')
    elif mem >= 8:   print('→ Wan2.1-1.3B (offload), LTX-Video (fp16)')
    else:            print('→ CPU mode — very slow, use ComfyUI cloud')
elif torch.backends.mps.is_available():
    print('Apple Silicon → Wan2.1-1.3B (experimental), Stable Video Diffusion')
else:
    print('CPU only → not recommended. Use cloud: replicate.com, fal.ai')
"
```

## Quick Start — Wan2.1 (⭐16.2k)

Best open-source video model. 1.3B runs on 8GB VRAM, 14B needs 24GB.

```bash
git clone https://github.com/Wan-Video/Wan2.1
cd Wan2.1
pip install -r requirements.txt

# Download the 1.3B model (8GB VRAM)
pip install huggingface_hub
huggingface-cli download Wan-AI/Wan2.1-T2V-1.3B --local-dir ./models/Wan2.1-T2V-1.3B
```

**Text-to-Video (1.3B, ~4 min on RTX 4090):**
```bash
python generate.py \
  --task t2v-1.3B --size 832*480 \
  --ckpt_dir ./models/Wan2.1-T2V-1.3B \
  --offload_model True --t5_cpu \
  --sample_shift 8 --sample_guide_scale 6 \
  --prompt "A cat and dog playing chess in a library, dramatic lighting"
```

**Text-to-Video (14B, multi-GPU):**
```bash
torchrun --nproc_per_node=8 generate.py \
  --task t2v-14B --size 1280*720 \
  --ckpt_dir ./models/Wan2.1-T2V-14B \
  --dit_fsdp --t5_fsdp --ulysses_size 8 \
  --prompt "Cinematic drone shot of a futuristic city at dawn"
```

**Image-to-Video:**
```bash
python generate.py \
  --task i2v-14B --size 1280*720 \
  --ckpt_dir ./models/Wan2.1-I2V-14B-720P \
  --image input.jpg \
  --prompt "The scene comes to life with gentle motion and atmospheric lighting"
```

## ComfyUI Video Workflow

ComfyUI supports all video models natively:

```bash
# Install ComfyUI
git clone https://github.com/Comfy-Org/ComfyUI
cd ComfyUI && pip install -r requirements.txt

# Download Wan2.1 nodes (auto via ComfyUI Manager)
python main.py --enable-manager
```

**ComfyUI video models:** Wan2.1, Wan2.2, Hunyuan Video 1.5, Mochi, LTX-Video, CogVideoX, Stable Video Diffusion

## CogVideoX (⭐12.7k) — Text + Image-to-Video

```bash
pip install diffusers transformers accelerate

# 2B model — fits 12GB VRAM
from diffusers import CogVideoXPipeline
pipe = CogVideoXPipeline.from_pretrained(
    "THUDM/CogVideoX-2b", torch_dtype=torch.float16
).to("cuda")

video = pipe("A panda playing guitar on a beach at sunset").frames[0]
# Save video frames...
```

## LTX-Video — Real-Time Speed

Fastest open-source video model. 2-4 seconds for a clip.

```bash
pip install diffusers
```

```python
from diffusers import LTXPipeline
pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video", torch_dtype=torch.float16
).to("cuda")
video = pipe("A drone flying over a mountain lake").frames[0]
```

## Mochi 1 — High Quality (Genmo)

```bash
pip install diffusers
```

```python
from diffusers import MochiPipeline
pipe = MochiPipeline.from_pretrained(
    "genmo/mochi-1-preview", torch_dtype=torch.bfloat16
).to("cuda")
video = pipe("A dog wearing a cape flying through clouds").frames[0]
```

## Available Video Models

| Model | VRAM | Resolution | Speed | Quality |
|-------|------|-----------|-------|---------|
| Wan2.1-1.3B | 8 GB | 480p | 4 min/clip | Great |
| Wan2.1-14B | 24 GB | 720p | 10 min/clip | SOTA |
| CogVideoX-2B | 12 GB | 720p | 6 min/clip | Great |
| CogVideoX-5B | 16 GB | 720p | 12 min/clip | Excellent |
| LTX-Video | 8 GB | 768p | 3 sec/clip | Good |
| Mochi-1 | 24 GB | 480p | 8 min/clip | Great |
| Hunyuan Video | 16 GB | 720p | 8 min/clip | Excellent |
| SVD (img2vid) | 8 GB | 576p | 2 min/clip | Good |

## Speed Optimization

```bash
# TeaCache — 2x speedup for Wan2.1
pip install teacache
# Set --tea_cache in ComfyUI Wan node

# FP8 quantization — half VRAM
# Use DiffSynth-Studio for quantized inference:
pip install diffsynth
```

## Quick One-Liners

```bash
# Wan2.1 1.3B — runs on any gaming GPU
huggingface-cli download Wan-AI/Wan2.1-T2V-1.3B --local-dir ./wan && \
python generate.py --task t2v-1.3B --size 832*480 --ckpt_dir ./wan \
  --offload_model True --t5_cpu --prompt "YOUR PROMPT"

# CogVideoX — best for quick iterations
python -c "
from diffusers import CogVideoXPipeline; import torch
p = CogVideoXPipeline.from_pretrained('THUDM/CogVideoX-2b', torch_dtype=torch.float16).to('cuda')
v = p('YOUR PROMPT').frames[0]
# Save frames
"
```
