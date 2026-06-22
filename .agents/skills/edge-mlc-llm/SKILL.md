---
name: edge-mlc-llm
version: "1.0.0"
description: "MLC-LLM — Universal LLM deployment via ML compilation. ⭐22.8k stars, Apache 2.0. Compile and run LLMs natively on ANY platform: iOS, Android, WebGPU browsers, Windows, Linux, macOS. Uses machine learning compilation (TVM Unity) for maximum hardware optimization. OpenAI-compatible API on every platform. Use when the user asks to: deploy LLMs to mobile (iOS/Android), run LLMs in browser via WebGPU, optimize models for specific hardware, cross-platform LLM deployment."
argument-hint: 'edge-mlc-llm deploy LLM to iOS | edge-mlc-llm run in browser | edge-mlc-llm compile for Android'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🔧"
    tags: [ml-compilation, tvm, cross-platform, ios, android, webgpu, wasm, metal, cuda, vulkan]
    repo: https://github.com/mlc-ai/mlc-llm
    homepage: https://llm.mlc.ai
    stars: 22800
    license: Apache-2.0
---

# 🔧 MLC-LLM — Universal LLM Deployment Engine

**⭐22,800 stars | Apache 2.0 | 1,799 commits**

The "compile once, run everywhere" approach to LLMs. Uses machine learning compilation to optimize models for each hardware target. Native iOS and Android apps. WebGPU in browser.

## Quick Start

```bash
# Install
pip install mlc-llm

# Run a model
mlc_llm chat HF://mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC

# Serve REST API
mlc_llm serve HF://mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC
```

## Platform Coverage

| Platform | GPU Backend |
|----------|-------------|
| macOS | Metal (dGPU + iGPU) |
| Windows/Linux | Vulkan, CUDA, ROCm |
| iOS/iPadOS | Metal on A-series |
| Android | OpenCL (Adreno + Mali) |
| Web Browser | WebGPU + WASM |

## Related Project: WebLLM

[WebLLM](https://github.com/mlc-ai/web-llm) brings LLMs to the browser with WebGPU. No server needed — models run entirely in the browser.

## Key Features

- **ML Compilation** — Optimizes model kernels for specific hardware
- **TensorIR + MetaSchedule** — Automatic optimization search
- **OpenAI-compatible API** — Same API everywhere
- **Native mobile SDKs** — Real iOS (Swift) and Android (Kotlin) packages
- **Quantization** — 4-bit weight quantization for mobile

## When to Use

- Deploying LLMs to iOS/Android apps
- Browser-based LLM inference (WebLLM)
- Maximum hardware optimization needed
- Unified API across radically different platforms
- Mobile-first AI applications
