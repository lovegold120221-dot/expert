---
name: edge-tensorrt-llm
version: "1.0.0"
description: "TensorRT-LLM — NVIDIA-optimized LLM inference. Maximum GPU throughput on NVIDIA hardware. Up to 8x faster than vanilla PyTorch. Supports FP8, INT8, INT4 quantization. Tensor parallelism, pipeline parallelism, inflight batching. Use when the user asks to: maximize NVIDIA GPU inference speed, optimize LLM serving on NVIDIA hardware, deploy models with minimum latency on GPUs."
argument-hint: 'edge-tensorrt-llm optimize NVIDIA inference | edge-tensorrt-llm max GPU throughput'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🚀"
    tags: [nvidia, tensorrt, gpu-optimization, cuda, fp8, int4, inference-optimization, triton]
    repo: https://github.com/NVIDIA/TensorRT-LLM
    homepage: https://nvidia.github.io/TensorRT-LLM
    stars: 11000
    license: Apache-2.0
---

# 🚀 TensorRT-LLM — Maximum GPU Throughput

**⭐11,000+ stars | Apache 2.0 | NVIDIA**

NVIDIA's official LLM inference optimization toolkit. If you have NVIDIA GPUs and need maximum performance, this is how you get it. Up to 8x faster than HuggingFace Transformers.

## Quick Start

```bash
# Docker (recommended)
docker run --gpus all -it --rm \
  nvcr.io/nvidia/tensorrt-llm/triton_trt_llm:latest

# Or pip install
pip install tensorrt_llm
```

## Performance

- **FP8 inference** — 2x throughput vs FP16
- **INT4 quantization** — 4x memory reduction
- **Inflight batching** — Maximizes GPU utilization
- **Tensor parallelism** — Split models across multiple GPUs
- **Pipeline parallelism** — Layer distribution across GPUs

## Key Features

- Build optimized engines from HuggingFace models
- Triton Inference Server integration
- OpenAI-compatible API endpoint
- Multi-GPU and multi-node support
- Speculative decoding support
- LoRA adapter support

## When to Use

- Production NVIDIA GPU inference
- Maximum tokens-per-second per GPU
- Serving large models to many concurrent users
- Reducing GPU costs through optimization
- H100/B200/Blackwell GPU optimization
