---
name: edge-vllm
version: "1.0.0"
description: "vLLM — High-throughput LLM serving engine. ⭐82.7k stars, Apache 2.0. State-of-the-art serving with PagedAttention, continuous batching, and speculative decoding. 200+ model architectures. OpenAI-compatible API. Supports NVIDIA, AMD, Intel, Apple Silicon, Google TPU, Huawei Ascend, and more. Use when the user asks to: serve LLMs at production scale, maximize GPU throughput, deploy inference servers, handle concurrent requests, optimize model serving latency."
argument-hint: 'edge-vllm serve llama at scale | edge-vllm deploy inference server | edge-vllm optimize throughput'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "⚡"
    tags: [llm-serving, high-throughput, paged-attention, inference-server, cuda, tpu, quantization, production]
    repo: https://github.com/vllm-project/vllm
    homepage: https://vllm.ai
    stars: 82700
    license: Apache-2.0
---

# ⚡ vLLM — Production LLM Serving

**⭐82,700 stars | Apache 2.0 | 17,587 commits | 2,000+ contributors**

The industry standard for serving LLMs at scale. If you need to serve models to many users concurrently with maximum throughput, vLLM is the answer.

## Quick Start

```bash
# Install
uv pip install vllm

# Serve a model (OpenAI-compatible API)
vllm serve meta-llama/Llama-3.2-1B-Instruct

# Or via Python
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.2-1B-Instruct
```

## Key Technologies

- **PagedAttention** — Efficient KV cache management (the paper that started it all)
- **Continuous Batching** — Maximizes GPU utilization
- **Chunked Prefill** — Reduces time-to-first-token
- **Prefix Caching** — Reuses KV cache across requests
- **Speculative Decoding** — Faster generation with draft models
- **Disaggregated Serving** — Separate prefill and decode nodes

## Hardware Support

| Hardware | Status |
|----------|--------|
| NVIDIA GPU | ✅ CUDA (primary) |
| AMD GPU | ✅ ROCm |
| Intel GPU | ✅ XPU |
| Apple Silicon | ✅ MPS backend |
| Google TPU | ✅ |
| Huawei Ascend | ✅ |
| x86/ARM CPU | ✅ |

## Quantization Support

FP8, MXFP8, MXFP4, NVFP4, INT8, INT4, GPTQ, AWQ, GGUF, compressed-tensors, ModelOpt, TorchAO

## 200+ Supported Models

Including Llama, Qwen, Gemma, Mixtral, DeepSeek-V3, GPT-OSS, Qwen-MoE, multimodal (LLaVA, Qwen-VL, Pixtral), embedding models, and reward models.

## When to Use

- Production LLM serving at scale
- Multi-user concurrent inference
- Maximum GPU throughput needed
- Serving large MoE models (DeepSeek-V3, Mixtral)
- Distributed inference across multiple GPUs
- OpenAI-compatible API in production
- Structured output generation
