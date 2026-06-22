---
name: edge-ollama
version: "1.0.0"
description: "Ollama — Get up and running with local LLMs. ⭐174k stars, MIT license. The most popular local LLM runner. One command to download and run hundreds of models. Built on llama.cpp with Go. OpenAI-compatible REST API. Integrates with Claude Code, OpenCode, Codex, Continue, Cline, Cursor, and 200+ community tools. Use when the user asks to: run LLMs locally, download models, serve OpenAI-compatible API, set up coding agent with local models, use local models in any app."
argument-hint: 'edge-ollama run deepseek locally | edge-ollama serve API | edge-ollama use with Claude Code'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🦙"
    tags: [local-llm, model-runner, api-server, ollama, openai-compatible, coding-agent]
    repo: https://github.com/ollama/ollama
    homepage: https://ollama.com
    stars: 174000
    license: MIT
---

# 🦙 Ollama — Local LLM Runner

**⭐174,000 stars | MIT License | 5,456 commits**

The easiest way to run LLMs locally. One command to download, run, and serve any model. Backed by llama.cpp for maximum hardware compatibility.

## Quick Start

```bash
# Install (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Run a model
ollama run gemma4

# List available models
ollama list

# Download a model
ollama pull deepseek-r1:7b

# Serve OpenAI-compatible API (port 11434)
ollama serve
```

## API Usage

```bash
# Chat completion
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [{"role": "user", "content": "Why is the sky blue?"}],
  "stream": false
}'

# Generate embeddings
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "Hello world"
}'
```

## Python / JS SDKs

```bash
pip install ollama
npm i ollama
```

## Coding Agent Integration

Ollama integrates directly with coding agents:
```bash
ollama launch claude      # Claude Code
ollama launch opencode    # OpenCode
ollama launch codex       # Codex CLI
```

## Supported Models (hundreds available)

- **Gemma 4** (Google)
- **DeepSeek R1/V3** 
- **Llama 4**
- **Qwen 2.5/3**
- **Mistral**
- **Phi-4** (Microsoft)
- **Command R+** (Cohere)
- **GPT-OSS** (OpenAI open model)
- **Kimi K2.6**
- **GLM-5.1**
- and 100+ more at [ollama.com/library](https://ollama.com/library)

## Key Features

- **Modelfile** — Package custom models with system prompts
- **Multimodal** — Image input support (llava, minicpm-v)
- **Tool calling** — Native function calling support
- **GPU acceleration** — Automatic GPU detection and offloading
- **Concurrent requests** — Parallel model serving
- **Model management** — pull, list, rm, cp, push

## When to Use

- Quickest way to run any LLM locally
- Local AI coding assistant (VS Code, terminal, IDE)
- Privacy-first AI applications
- Testing models before cloud deployment
- RAG applications with local models
- Any app needing OpenAI-compatible API locally
