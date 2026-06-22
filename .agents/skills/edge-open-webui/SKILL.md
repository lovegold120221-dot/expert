---
name: edge-open-webui
version: "1.0.0"
description: "Open WebUI — Self-hosted ChatGPT-like interface for local LLMs. ⭐139k stars, MIT license. The most popular web UI for Ollama and OpenAI-compatible APIs. Features: RAG, web search, multimodal, voice, MCP tools, user management, RBAC. Docker-based, one-command deploy. Use when the user asks to: set up web interface for local LLMs, self-host chat UI, RAG with local documents, team AI workspace."
argument-hint: 'edge-open-webui setup web interface | edge-open-webui RAG local docs | edge-open-webui self-host chat'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🌐"
    tags: [web-ui, self-hosted, rag, ollama, docker, chat-interface, mcp, multimodal]
    repo: https://github.com/open-webui/open-webui
    homepage: https://openwebui.com
    stars: 139000
    license: MIT
---

# 🌐 Open WebUI — Self-Hosted AI Interface

**⭐139,000 stars | MIT License**

The most feature-complete web UI for local and cloud LLMs. Think ChatGPT's interface, but you own it. Connects to Ollama, OpenAI, Anthropic, and any OpenAI-compatible API.

## Quick Start

```bash
# With Ollama already running:
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main

# Open http://localhost:3000
```

## Key Features

- **Chat Interface** — Full ChatGPT-like experience
- **RAG** — Chat with your documents (PDF, docx, txt, etc.)
- **Web Search** — Augment responses with live web results
- **Multimodal** — Image input and vision model support
- **Voice** — Speech-to-text and text-to-speech
- **MCP Tools** — Model Context Protocol integration
- **Multi-user** — RBAC, user management, admin panel
- **Model Management** — Download, configure, switch models
- **Prompt Library** — Save and reuse prompts
- **Mobile-friendly** — PWA support

## Backend Compatibility

- Ollama (primary)
- OpenAI API
- Anthropic API
- Any OpenAI-compatible endpoint
- LiteLLM proxy

## When to Use

- Team AI workspace on private infrastructure
- RAG over internal documents
- Privacy-first ChatGPT alternative for organizations
- Single interface for multiple model providers
- Evaluating and comparing different models
