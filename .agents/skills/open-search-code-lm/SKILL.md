---
name: open-search-code-lm
description: "Open-source AI model finder — search GitHub for free LLMs, TTS, STT, image generation, video generation, and coding tools. Use when the user asks to: find an open-source LLM, search for free text-to-speech models, find speech-to-text models, look up open-source image generation tools, search for free video generation models, find open-source coding assistants, discover AI tools on GitHub, compare open-source AI models, find alternatives to paid AI services, or evaluate the best free AI models in any category."
---

# Open-Source AI Model Search & Evaluation

Find, evaluate, and use the best free open-source AI models on GitHub across six categories: LLM, TTS, STT, Image Generation, Video Generation, and Coding Tools.

## Search Methodology

### Primary: GitHub Search via `gh` CLI

```bash
# Syntax
gh search repos "<keywords>" --sort stars --limit 20 --json fullName,stargazersCount,description,url

# Example — find LLMs
gh search repos "large language model open source" --sort stars --limit 10 --json fullName,stargazersCount,description

# Get detailed repo info
gh repo view <owner/repo> --json name,owner,stargazerCount,forkCount,description,homepageUrl,licenseInfo,primaryLanguage,repositoryTopics
```

### Secondary: GitHub API

```bash
# REST API
curl -s "https://api.github.com/search/repositories?q=KEYWORDS&sort=stars&order=desc&per_page=10"

# With specific language/topic filters
curl -s "https://api.github.com/search/repositories?q=KEYWORDS+language:python&sort=stars&order=desc&per_page=10"
```

### Best Search Keywords Per Category

| Category | Best Search Terms | Sort By |
|----------|-------------------|---------|
| **LLM** | `llm inference open source`, `large language model`, `llama transformer`, `local llm` | stars |
| **TTS** | `text to speech`, `tts open source`, `voice cloning`, `text-to-speech` | stars |
| **STT** | `whisper speech recognition`, `speech to text`, `asr open source`, `automatic speech recognition` | stars |
| **Image Gen** | `stable diffusion`, `image generation`, `diffusion model`, `text to image` | stars |
| **Video Gen** | `text to video generation`, `video generation model`, `text-to-video`, `video diffusion` | stars |
| **Coding** | `ai coding assistant`, `code generation`, `coding agent`, `ai developer` | stars |

## Category Reference: Top Open-Source Tools

### 1. LLMs (Large Language Models)

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [ollama/ollama](https://github.com/ollama/ollama) | ⭐173k | Run LLMs locally — Llama, Mistral, Gemma, Qwen, DeepSeek | `brew install ollama && ollama run llama3` |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | ⭐139k | ChatGPT-like UI for local LLMs + Ollama backend | `docker run -d -p 3000:8080 ghcr.io/open-webui/open-webui` |
| [mudler/LocalAI](https://github.com/mudler/LocalAI) | ⭐46.6k | All-in-one: LLM, TTS, STT, Image, Video, Voice | `docker run -p 8080:8080 localai/localai` |
| [huggingface/transformers](https://github.com/huggingface/transformers) | ⭐144k | Universal model hub — 500k+ models | `pip install transformers` |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | ⭐80k+ | CPU-optimized LLM inference in C/C++ | `make && ./main -m model.gguf` |
| [intel/ipex-llm](https://github.com/intel/ipex-llm) | ⭐8.8k | Accelerate LLM inference on Intel hardware | `pip install ipex-llm` |

**Evaluation Criteria**: license, model size, hardware requirements, quantization support, inference speed, community activity, API compatibility (OpenAI-compatible preferred)

### 2. TTS (Text-to-Speech)

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | ⭐58.3k | Few-shot voice cloning — 1min audio → TTS model | `pip install -r requirements.txt` |
| [coqui-ai/TTS](https://github.com/coqui-ai/TTS) | ⭐45.4k | Deep learning TTS toolkit — 30+ languages | `pip install TTS && tts --text "Hello"` |
| [2noise/ChatTTS](https://github.com/2noise/ChatTTS) | ⭐39.3k | Generative speech model for daily dialogue | `pip install chattts` |
| [babysor/MockingBird](https://github.com/babysor/MockingBird) | ⭐36.8k | Clone voice in 5 seconds | PyTorch-based |
| [myshell-ai/MeloTTS](https://github.com/myshell-ai/MeloTTS) | ⭐8k+ | Fast multilingual TTS | `pip install melotts` |
| [Plachtaa/VALL-E-X](https://github.com/Plachtaa/VALL-E-X) | ⭐7.9k | Zero-shot TTS (Microsoft VALL-E X) | `pip install -r requirements.txt` |

**Evaluation Criteria**: voice quality, languages supported, voice cloning quality, inference speed, real-time capability, speaker diversity

### 3. STT (Speech-to-Text)

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [openai/whisper](https://github.com/openai/whisper) | ⭐101k | Robust speech recognition — 100+ languages | `pip install openai-whisper` |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | ⭐50.4k | Port of Whisper in C/C++ — CPU optimized | `make -j && ./main -m ggml-model.bin` |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | ⭐23.3k | 4x faster Whisper with CTranslate2 | `pip install faster-whisper` |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | ⭐22.2k | Word-level timestamps + speaker diarization | `pip install whisperx` |
| [PaddlePaddle/PaddleSpeech](https://github.com/PaddlePaddle/PaddleSpeech) | ⭐12.6k | Full speech toolkit — ASR, TTS, speaker verification | `pip install paddlespeech` |

**Evaluation Criteria**: accuracy (WER), language support, real-time factor, hardware requirements, speaker diarization, timestamp precision

### 4. Image Generation

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | ⭐163k | Stable Diffusion web UI — most popular | `git clone && webui.sh` |
| [comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI) | ⭐115k | Node-based SD workflow editor | `git clone && main.py` |
| [huggingface/diffusers](https://github.com/huggingface/diffusers) | ⭐33.7k | State-of-the-art diffusion models (image, video, audio) | `pip install diffusers` |
| [invoke-ai/InvokeAI](https://github.com/invoke-ai/InvokeAI) | ⭐27.3k | Creative engine for professionals | `pip install invokeai` |
| [Stability-AI/stablediffusion](https://github.com/Stability-AI/stablediffusion) | ⭐40k+ | Official Stable Diffusion | `pip install -r requirements.txt` |
| [lllyasviel/Fooocus](https://github.com/lllyasviel/Fooocus) | ⭐45k+ | SD with one-click install | Download + run |

**Evaluation Criteria**: image quality, generation speed, model support (SD1.5/SDXL/Flux), extensions ecosystem, control methods (ControlNet, LoRA), hardware requirements

### 5. Video Generation

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) | ⭐17.9k | 200+ video models (Kling, Sora, Veo, Wan, Seedance) via Muapi API | Web app |
| [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1) | ⭐16.1k | Open large-scale video generative models | `pip install -r requirements.txt` |
| [PKU-YuanGroup/Open-Sora-Plan](https://github.com/PKU-YuanGroup/Open-Sora-Plan) | ⭐12.1k | Reproduce Sora — open T2V model | `pip install -r requirements.txt` |
| [zai-org/CogVideo](https://github.com/zai-org/CogVideo) | ⭐12.7k | Text & image to video (CogVideoX + CogVideo) | `pip install -r requirements.txt` |
| [duixcom/Duix-Avatar](https://github.com/duixcom/Duix-Avatar) | ⭐13.4k | AI avatar/digital human toolkit for video | Desktop app |
| [genmoai/mochi](https://github.com/genmoai/mochi) | ⭐3.6k | Best OSS video generation models | `pip install mochi` |
| [showlab/Tune-A-Video](https://github.com/showlab/Tune-A-Video) | ⭐4.3k | One-shot tuning for T2V generation | `pip install -r requirements.txt` |

**Evaluation Criteria**: video quality, motion coherence, resolution, duration, generation speed, character consistency, camera control

### 6. Coding Assistants & AI Development Tools

| Repo | Stars | Description | Setup |
|------|-------|-------------|-------|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | ⭐75.7k | AI-driven development — autonomous coding agent | `docker pull openhands/openhands` |
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | ⭐68.4k | Multi-agent framework — AI software company | `pip install metagpt` |
| [openinterpreter/open-interpreter](https://github.com/openinterpreter/openinterpreter) | ⭐63.8k | Natural language interface for computers | `pip install open-interpreter` |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | ⭐52.7k | Orchestrate role-playing AI agents | `pip install crewai` |
| [TabbyML/tabby](https://github.com/TabbyML/tabby) | ⭐33.5k | Self-hosted AI coding assistant | `docker run tabbyml/tabby` |
| [continuedev/continue](https://github.com/continuedev/continue) | ⭐33.5k | Open-source AI code assistant for IDE | VS Code extension |
| [plandex-ai/plandex](https://github.com/plandex-ai/plandex) | ⭐15.4k | AI coding agent for large projects | `brew install plandex` |
| [opencode-ai/opencode](https://github.com/opencode-ai/opencode) | ⭐12.8k | Powerful AI coding agent (terminal) | `npm install -g @opencode-ai/opencode` |
| [Aider-AI/aider](https://github.com/Aider-AI/aider) | ⭐40k+ | AI pair programming in terminal | `pip install aider-chat` |

**Evaluation Criteria**: autonomy level, IDE integration, language support, multi-file editing capability, git awareness, model support (local vs cloud)

## Evaluation Framework

When evaluating any open-source AI tool, check:

```
1. LICENSE — Must be permissive (MIT/Apache 2.0) for commercial use, or check restrictions
2. STARS — >1k = active community; >10k = battle-tested; >50k = industry standard
3. LAST UPDATE — Updated within 3 months = actively maintained
4. HARDWARE — CPU-only? GPU required? Quantization support? VRAM requirements?
5. API COMPATIBILITY — OpenAI-compatible API = easy integration
6. LANGUAGE/FW — Python? C++? JavaScript? Node? Docker?
7. DOCUMENTATION — README quality, examples, tutorials, API docs
8. COMMUNITY — Issues resolved, PRs merged, Discord/Discord activity
```

## Installation Patterns

### Python Packages
```bash
pip install <package>           # Latest stable
pip install git+<repo-url>      # Bleeding edge
uv pip install <package>        # Fast Python installer
```

### Local Serving
```bash
# Docker (most common)
docker pull <image>
docker run -d -p 8080:8080 <image>

# Native
git clone <repo>
cd <repo>
pip install -r requirements.txt
python app.py
```

### Node.js / npm
```bash
npm install -g <package>
npx <package>
```

## Quick Reference: gh Search Commands

```bash
# Search by category
gh search repos "text to speech tts" --sort stars --limit 10 --json fullName,stargazersCount,description

# Filter by language
gh search repos "llm inference" --language python --sort stars --limit 10 --json fullName,stargazersCount

# Filter by license
gh search repos "whisper" --license mit --sort stars --limit 5 --json fullName,stargazersCount

# Get detailed info
gh repo view owner/repo --json name,owner,stargazerCount,forkCount,description,licenseInfo,primaryLanguage,updatedAt

# List recent releases
gh release list -R owner/repo --limit 5
```

## Experience Notes

Path: `{working-directory}/open-search-code-lm-memories/open-search-code-lm.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
