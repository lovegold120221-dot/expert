---
name: edge-candle
version: "1.0.0"
description: "candle — Minimalist ML framework in Rust. ⭐17k+ stars, MIT/Apache 2.0. HuggingFace's Rust ML framework. WASM-compatible for browser inference. Zero Python dependencies. Use when the user asks to: run ML in Rust, browser inference via WASM, lightweight ML without Python, embed LLMs in Rust applications."
argument-hint: 'edge-candle run LLM in Rust | edge-candle WASM browser inference | edge-candle Rust ML'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🕯️"
    tags: [rust, wasm, browser-inference, minimalist, huggingface, zero-deps, embedded]
    repo: https://github.com/huggingface/candle
    homepage: https://huggingface.github.io/candle
    stars: 17000
    license: MIT / Apache-2.0
---

# 🕯️ candle — Rust ML Framework

**⭐17,000+ stars | MIT / Apache 2.0 | HuggingFace**

A minimalist machine learning framework in Rust. Runs LLMs, Stable Diffusion, Whisper, and YOLO — with no Python, no libtorch, no system dependencies. Compiles to WASM for browser inference.

## Quick Start

```bash
# Add to Rust project
cargo add candle-core candle-nn candle-transformers

# Run a model
cargo run --example llama --release -- \
  --model-path model.gguf \
  --prompt "Hello, world!"
```

## Key Features

- **Pure Rust** — No C++ dependencies, no Python
- **WASM** — Compile models to run in browsers
- **GGUF support** — Load quantized llama.cpp models
- **Metal/CUDA** — GPU acceleration
- **Examples included** — Llama, Whisper, Stable Diffusion, YOLO, Phi, Gemma, and more

## Supported Models

- Llama, Mistral, Phi, Gemma, Qwen (LLMs)
- Whisper (speech-to-text)
- Stable Diffusion (image generation)
- YOLO (object detection)
- Segment Anything (SAM)
- Wuerstchen, StableLM, and more

## When to Use

- Embedding LLMs in Rust applications
- Browser/WASM inference (no server needed)
- Lightweight, zero-dependency deployments
- IoT/embedded ML
- High-performance Rust backends needing ML capabilities
