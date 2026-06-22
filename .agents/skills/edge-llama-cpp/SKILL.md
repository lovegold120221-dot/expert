---
name: edge-llama-cpp
version: "1.0.0"
description: "llama.cpp — CPU-first LLM inference engine in C/C++. 116k stars, MIT license. The universal runtime for running LLMs on any hardware: Apple Silicon (Metal), NVIDIA (CUDA), AMD (HIP/Vulkan), Intel (SYCL), Snapdragon (Hexagon), WebGPU, RISC-V. Supports 1.5-8bit quantization. Powers Ollama, Jan, LM Studio, GPT4All, and dozens of other tools. Use when the user asks to: run LLMs locally on CPU/Mac, quantize models, serve models via OpenAI-compatible API, run LLMs on edge devices, mobile, or browser (WebGPU), convert models to GGUF format, benchmark local LLM performance."
argument-hint: 'edge-llama-cpp run llama3 locally | edge-llama-cpp quantize model | edge-llama-cpp serve API'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🦙"
    tags: [edge, local-llm, cpu-inference, quantization, gguf, cpp, apple-silicon, cuda, vulkan, webgpu, mobile]
    repo: https://github.com/ggml-org/llama.cpp
    homepage: https://llama.app
    stars: 116000
    license: MIT
---

# 🦙 llama.cpp — Edge LLM Inference Engine

**⭐116,000 stars | MIT License | 9,618 commits**

The universal inference engine that runs LLMs on literally anything. CPU, GPU, phone, browser, RISC-V — if it has a processor, llama.cpp runs on it.

## Quick Start

```bash
# Install
brew install llama.cpp

# Run a model (downloads from HuggingFace automatically)
llama-cli -hf ggml-org/gemma-3-1b-it-GGUF

# Launch OpenAI-compatible server
llama-server -hf ggml-org/gemma-3-1b-it-GGUF --port 8080
```

## Supported Backends

| Backend | Target |
|---------|--------|
| Metal | Apple Silicon (M1-M5) |
| CUDA | NVIDIA GPU |
| HIP | AMD GPU |
| Vulkan | Cross-platform GPU |
| SYCL | Intel GPU |
| WebGPU | Browser |
| Hexagon | Snapdragon (mobile) |
| RPC | Distributed inference |
| OpenCL | Adreno GPU (Android) |

## Quantization Levels

1.5-bit to 8-bit integer quantization. Lower bits = smaller file, faster, less accurate:
- Q4_K_M = Best balance for most use (recommended)
- Q8_0 = Near-lossless
- Q2_K = Smallest usable

## Model Format: GGUF

All models must be in GGUF format. Convert from HuggingFace:
```bash
python convert_hf_to_gguf.py /path/to/model --outtype q8_0
```

## Key Commands

```bash
# Chat mode
llama-cli -m model.gguf -cnv

# Benchmark
llama-bench -m model.gguf

# Perplexity measurement
llama-perplexity -m model.gguf -f test.txt

# Server with speculative decoding
llama-server -m model.gguf -md draft.gguf

# Serve embeddings
llama-server -m model.gguf --embedding --pooling cls
```

## Mobile/Edge Deployment

- **iOS/macOS**: XCFramework binary available
- **Android**: `examples/llama.android` + Java bindings  
- **React Native**: `mybigday/llama.rn`
- **Flutter**: `xuegao-tzx/Fllama`
- **Browser/WebGPU**: `tangledgroup/llama-cpp-wasm`, `ngxson/wllama`

## When to Use

- Running LLMs on any hardware with minimal setup
- CPU-only inference without GPU
- Apple Silicon optimization (Metal-first)
- Quantizing models for edge deployment
- Mobile/browser/embedded inference
- OpenAI-compatible local API server
- As the backend for Ollama, Jan, GPT4All, etc.
