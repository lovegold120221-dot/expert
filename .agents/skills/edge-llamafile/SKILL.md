---
name: edge-llamafile
version: "1.0.0"
description: "llamafile — Distribute and run LLMs with a single file. ⭐24.9k stars, Apache 2.0. Mozilla project that collapses all LLM complexity into one executable. Runs on macOS, Windows, Linux, FreeBSD, OpenBSD, NetBSD — no installation, no dependencies. Built on llama.cpp + Cosmopolitan Libc. Also includes whisperfile for speech-to-text. Use when the user asks to: distribute LLMs as a single executable, run LLMs with zero install, create portable AI applications, speech-to-text with no setup."
argument-hint: 'edge-llamafile create single-file LLM | edge-llamafile run model portably | edge-llamafile speech-to-text'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "📁"
    tags: [single-file, portable, cross-platform, cosmopolitan, mozilla, whisper, speech-to-text, zero-install]
    repo: https://github.com/mozilla-ai/llamafile
    homepage: https://docs.mozilla.ai/llamafile
    stars: 24900
    license: Apache-2.0
---

# 📁 llamafile — Single-File LLM Distribution

**⭐24,900 stars | Apache 2.0 | 834 commits**

The ultimate portable LLM: one file, every OS, zero installation. A Mozilla project combining llama.cpp with Cosmopolitan Libc for truly universal executables.

## Quick Start

```bash
# Download a pre-built llamafile
curl -LO https://huggingface.co/mozilla-ai/llamafile_0.10/resolve/main/Qwen3.5-0.8B-Q8_0.llamafile

# Make it executable
chmod +x Qwen3.5-0.8B-Q8_0.llamafile

# Run it — that's it!
./Qwen3.5-0.8B-Q8_0.llamafile
```

Opens a web UI automatically. No Python, no Docker, no package manager needed.

## What Makes It Special

- **Single file** — Model weights + inference engine bundled together
- **Universal binary** — Same file runs on macOS, Linux, Windows, BSD
- **Zero dependencies** — No install, no pip, no npm, no conda
- **Built-in web server** — Chat UI opens in browser automatically
- **Whisperfile** — Same concept for speech-to-text (STT)

## Creating Custom llamafiles

```bash
# Install llamafile tool
git clone https://github.com/mozilla-ai/llamafile
cd llamafile
make -j8

# Create a llamafile from GGUF
./llamafile/bin/llamafile-convert model.gguf
```

## Platforms Supported

macOS, Windows, Linux, FreeBSD, OpenBSD, NetBSD — x86_64 and ARM64. Windows limited to files under 4GB.

## When to Use

- Distributing LLM apps to non-technical users
- Air-gapped / offline environments
- Demos and workshops (no setup needed)
- Portable AI on USB drives
- CI/CD testing with local models
- Speech-to-text with zero setup
