---
name: edge-jan
version: "1.0.0"
description: "Jan — Open-source ChatGPT alternative. ⭐43k stars, Apache 2.0. Desktop app for running LLMs 100% offline. Download and run models from HuggingFace with one click. Built on llama.cpp + TensorRT-LLM. Supports local models AND cloud APIs (OpenAI, Anthropic, Mistral, Groq). OpenAI-compatible local API server at localhost:1337. MCP support. Use when the user asks to: run ChatGPT-like UI locally, desktop AI app, offline AI assistant, privacy-first chat."
argument-hint: 'edge-jan run ChatGPT locally | edge-jan desktop AI offline | edge-jan local chat app'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "💬"
    tags: [chatgpt-alternative, desktop-app, offline, privacy, local-llm, ollama, openai-api, mcp]
    repo: https://github.com/janhq/jan
    homepage: https://jan.ai
    stars: 43000
    license: Apache-2.0
---

# 💬 Jan — ChatGPT That Runs on Your Computer

**⭐43,000 stars | Apache 2.0 | 8,069 commits**

The polished desktop app for running AI models 100% offline. Beautiful UI, one-click model downloads, and full privacy. Works on macOS, Windows, and Linux.

## Quick Start

```bash
# Download from jan.ai or:
# macOS: jan.dmg
# Windows: jan.exe
# Linux: jan.deb or jan.AppImage
```

Or build from source:
```bash
git clone https://github.com/janhq/jan
cd jan
make dev
```

## Key Features

- **Download models with one click** — Browse and install from HuggingFace
- **Local API server** — OpenAI-compatible at `localhost:1337`
- **Custom Assistants** — Create specialized AI personas
- **Cloud integration** — Also connect to OpenAI, Anthropic, Mistral, Groq
- **MCP support** — Model Context Protocol for agentic capabilities
- **Cross-platform** — macOS, Windows, Linux
- **Nitro engine** — Built on llama.cpp + TensorRT-LLM

## System Requirements

| Model Size | RAM Needed |
|-----------|------------|
| 3B params | 8 GB |
| 7B params | 16 GB |
| 13B params | 32 GB |

macOS 13.6+, Windows 10+, any Linux with GPU.

## Supported Models

Llama, Gemma, Qwen, GPT-OSS, Mistral, Phi, DeepSeek, and any GGUF model.

## When to Use

- Non-technical users who want ChatGPT-like experience offline
- Privacy-sensitive work (legal, medical, financial)
- Testing multiple models quickly with a GUI
- Local API server for other apps
- Air-gapped environments
