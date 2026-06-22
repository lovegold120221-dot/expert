---
name: edge-gpt4all
version: "1.0.0"
description: "GPT4All — Run LLMs locally on CPU. ⭐75k+ stars, MIT license. Desktop app + Python bindings. Curated model library with one-click downloads. No GPU required. Privacy-first. Use when the user asks to: run LLMs on any laptop, CPU-only inference with good UX, curated local model library, privacy-first desktop AI."
argument-hint: 'edge-gpt4all run LLM on laptop | edge-gpt4all CPU-only inference | edge-gpt4all local AI desktop'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "💻"
    tags: [cpu-inference, desktop-app, curated-models, privacy, no-gpu, laptop, nomic]
    repo: https://github.com/nomic-ai/gpt4all
    homepage: https://www.nomic.ai/gpt4all
    stars: 75000
    license: MIT
---

# 💻 GPT4All — AI for Every Laptop

**⭐75,000+ stars | MIT License | Nomic AI**

Run LLMs on any laptop, no GPU required. Curated model library with one-click downloads. Built on llama.cpp for CPU-optimized inference. Desktop app + Python SDK + TypeScript SDK.

## Quick Start

```bash
# Install
pip install gpt4all

# Python
from gpt4all import GPT4All
model = GPT4All("Llama-3.2-1B-Instruct-Q4_0.gguf")
output = model.generate("Tell me a joke")
```

Or download the [desktop app](https://www.nomic.ai/gpt4all).

## Key Features

- **Curated model library** — Tested, optimized models ready to download
- **CPU-optimized** — Runs well on any modern laptop
- **Local document RAG** — Chat with your files
- **Private** — Everything runs on-device
- **Chat UI** — Desktop app with conversation history
- **Python/TS SDKs** — Embed in your applications

## Supported Models

Pre-optimized GGUF models including Llama, Mistral, Gemma, Phi, Command R, and more — all curated and tested.

## When to Use

- Running AI on a laptop without GPU
- Non-technical users wanting local AI
- Privacy-first document Q&A
- Offline/air-gapped environments
- Quick prototyping with local models
