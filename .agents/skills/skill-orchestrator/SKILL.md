---
name: skill-orchestrator
version: "1.0.0"
description: "Meta-skill that orchestrates all available skills. ALWAYS starts with last30days to check for new tools, updates, and best practices before determining which downstream skills to use. Generates a TODO list and pipelines skills in optimal order. Use when the user asks for any complex multi-step task, or when unsure which skill to load. This is the BOOTSTRAP skill — invoke it FIRST for any non-trivial request."
argument-hint: 'skill-orchestrator build me a mobile PWA | skill-orchestrator create a full-stack app | skill-orchestrator generate AI video from text'
allowed-tools: Bash, Read, Write, Grep, Glob, WebFetch, WebSearch, Skill, Task, TodoWrite, AskUserQuestion
user-invocable: true
metadata:
  openclaw:
    emoji: "🎯"
    tags:
      - meta
      - orchestrator
      - pipeline
      - bootstrap
      - routing
      - todo
      - automation
---

# 🎯 Skill Orchestrator — The Bootstrap Meta-Skill

## NON-NEGOTIABLE: ALWAYS START WITH `last30days`

**Rule Zero:** Before invoking ANY other skill, ALWAYS run `last30days` to check:
1. What's new in the last 30 days for the relevant technology
2. Updated best practices, breaking changes, or deprecations
3. New tools, models, or frameworks that could improve the outcome
4. Community sentiment and real-world usage patterns

The `last30days` research feeds into every downstream skill decision. Skipping it means building on stale information.

---

## Orchestration Pipeline

### How Skills Are Activated (Codex-Style)

Skills use **progressive disclosure** — you see name + description first, and load the full SKILL.md only when the skill matches the task.

**Explicit invocation:** User says `$skill-name` or "use skill-name":
```
$edge-ollama run llama3 locally
use gstack-suite to ship this feature
```
→ Load that skill's full SKILL.md immediately.

**Implicit invocation:** Task intent matches a skill's description trigger words:
```
"build me a dashboard"        → matches edge-langchain + design-html
"debug this crash"            → matches investigate + systematic-debugging
"ship this to production"     → matches ship + land-and-deploy
```
→ Scan skill descriptions, match trigger words, load matched skills.

### Phase 0: last30days — ALWAYS FIRST
```
Skill: last30days
Query: "{task-summary} best practices 2026 tools"
Purpose: Fresh intel on what's current, what works, what's deprecated
```

### Phase 1: Intent Classification
Parse the user's request into one or more of these domains:

| Domain | Skills to Load |
|--------|---------------|
| 🎬 AI Video/Media | `ai-video-generation`, `ai-video-cinema`, `ai-video-production`, `tiktok-contents`, `remotion-content-creator` |
| 📦 Content Creator | `free-image-source`, `free-video-source`, `local-image-gen`, `local-video-gen`, `comfyui-workflows`, `video-editing-assembly` |
| 🎨 Image/Audio/Video | `edge-image-gen`, `edge-tts`, `edge-video-gen` |
| 🤖 AI/ML Models | `open-search-code-lm`, `gemini-api-dev`, `gemini-interactions-api`, `finetuning` |
| 🖥️ Edge/Offline LLM | `edge-ollama`, `edge-ollama-agents`, `edge-llama-cpp`, `edge-vllm`, `edge-exo`, `edge-jan`, `edge-mlc-llm`, `edge-llamafile`, `edge-open-webui`, `edge-langchain`, `edge-candle`, `edge-transformers-js`, `edge-tensorrt-llm`, `edge-gpt4all` |
| 🌐 Web/Frontend | `mobile-pwa-design`, `design-html`, `design-shotgun`, `design-review`, `flutter-dev` |
| ☁️ Cloud/Infra | `azure-prepare`, `azure-deploy`, `azure-kubernetes`, `azure-enterprise-infra-planner` |
| 🔧 Full-Stack App | `full-app-development`, `autonomous-app-generator` |
| 📊 Quality/Review | `qa`, `review`, `codex`, `health`, `benchmark`, `cso` |
| 🧠 Planning/Design | `brainstorming`, `office-hours`, `writing-plans`, `plan-ceo-review`, `plan-eng-review` |
| 🐛 Debugging | `investigate`, `systematic-debugging`, `azure-diagnostics` |
| 🧪 Testing | `test-driven-development`, `mobile-app-testing`, `qa-only` |
| 📹 YouTube/Media | `youtube-transcribe`, `youtube-transcript`, `youtube-subtitle-downloader`, `youtube-search` |
| 🌍 Web Scraping | `browser-act`, `browser-use`, `web-page-marker`, `google-search-serp` |
| 📧 Communication | `himalaya`, `gmail-accounts` |
| 🎨 Design | `design-consultation`, `design-shotgun`, `design-review`, `design-html`, `sleek-design-mobile-apps` |
| 🔐 Security | `cso`, `azure-compliance` |
| 🚀 Deploy/Ship | `ship`, `land-and-deploy`, `setup-deploy` |
| 📝 Docs | `document-release` |
| 🖥️ Desktop/Mac | `macbook`, `machine-access`, `screenshot` |
| 🏗️ Agent Workflow/Mgmt | `gstack-suite`, `superpowers`, `hermes-agent`, `paperclip`, `skill-orchestrator` |
| 📺 App Showcase/Tutorial | `showcase-production-director`, `app-intake-and-brief-agent`, `tutorial-script-agent`, `screen-capture-planner-agent`, `screen-recording-agent`, `free-media-source-agent`, `local-visual-generation-agent`, `storyboard-agent`, `voice-caption-agent`, `tutorial-avatar-overlay-agent`, `remotion-editor-agent`, `final-quality-check-agent` |

### Phase 2: Skill Loading
Load skills in this order:
1. Domain-specific skills (from Phase 1 table)
2. Supporting skills (testing, review, security — loaded as needed)
3. Utility skills (screenshot, connect-chrome — optional)

### Phase 3: TODO Generation
Generate a structured TODO list with:
- Skill name + specific action from that skill
- Priority (high/medium/low)
- Dependencies between steps

### Phase 4: Execution
Execute skills in pipeline order, updating TODO as each completes.

### Phase 5: Validation
After all skills complete:
- Run `health` for code quality score
- Run `review` / `codex` for code review
- Run `qa` for testing (if applicable)

---

## Skill Routing Rules

### If task involves "build an app" or "create a project":
```
1. last30days → check what's current
2. brainstorming → explore intent
3. writing-plans → design architecture
4. office-hours → validate idea (optional)
5. plan-eng-review → lock in execution plan
6. full-app-development OR autonomous-app-generator → build
7. qa → test
8. review → code review
9. ship → deploy
```

### If task involves "generate video" or "AI media":
```
1. last30days → check latest models
2. ai-video-generation → select model
3. ai-video-cinema OR ai-video-production → produce
```

### If task involves "create programmatic video" or "Remotion":
```
1. remotion-content-creator → scaffold project, compose components
2. edge-tts OR voicebox → generate voiceover
3. edge-image-gen → generate scene images (if needed)
4. FFmpeg (via remotion-content-creator) → media ops, audio mixing, platform export
```

### If task involves "content creator pipeline" or "full video production" (images → video → edit):
```
1. free-image-source → search/download free stock images
2. free-video-source → search/download free stock video clips
3. local-image-gen → generate images (fallback or fill gaps)
4. local-video-gen → generate video clips (fallback or fill gaps)
5. comfyui-workflows → advanced processing (upscale, inpaint, LoRA, ControlNet)
6. video-editing-assembly → compose everything into final video
   ├── Remotion: scene assembly, text overlays, transitions, captions
   └── FFmpeg: audio mix, platform export, encoding, optimization
```

### If task involves "find free images" or "stock photos":
```
1. free-image-source → search Unsplash, Pexels, Pixabay
2. Save metadata (source, creator, license, attribution)
```

### If task involves "find free video" or "stock footage":
```
1. free-video-source → search Pexels, Pixabay, Mixkit, Coverr
2. Save metadata (source, creator, license, duration, resolution)
```

### If task involves "generate image locally" or "local image gen":
```
1. local-image-gen → MFLUX + FLUX.1-schnell (default)
2. comfyui-workflows → if advanced ops needed (inpaint, upscale, LoRA, ControlNet)
```

### If task involves "generate video locally" or "local video gen":
```
1. local-image-gen → generate still image first
2. local-video-gen → LTX-Video image-to-video animation
3. video-editing-assembly → post-process and integrate
```

### If task involves "ComfyUI" or "advanced workflow":
```
1. comfyui-workflows → load/save workflow JSONs
2. local-image-gen or local-video-gen → normal generation (non-ComfyUI cases)
```

### If task involves "app showcase" or "app tutorial" or "YouTube tutorial" or "product demo":
```
1. showcase-production-director → orchestrates full 12-agent workflow
   ├── app-intake-and-brief-agent → production brief
   ├── tutorial-script-agent → 10-15min timestamped script
   ├── screen-capture-planner-agent → shot list
   ├── screen-recording-agent → real screen recording
   ├── free-media-source-agent → supplementary stock media
   ├── local-visual-generation-agent → local AI visuals
   ├── storyboard-agent → editing timeline
   ├── voice-caption-agent → narration + captions
   ├── tutorial-avatar-overlay-agent → AI talking-head overlay
   ├── remotion-editor-agent → Remotion + FFmpeg edit
   └── final-quality-check-agent → QA report
```

### If task involves "avatar" or "talking head" or "animated face":
```
1. tutorial-avatar-overlay-agent → SadTalker/LivePortrait talking-head
```

### If task involves "record a tutorial" or "screen recording":
```
1. screen-capture-planner-agent → plan shots
2. screen-recording-agent → record footage
```

### If task involves "write a tutorial script":
```
1. tutorial-script-agent → timestamped YouTube script
```

### If task involves "edit a tutorial" or "render a video":
```
1. remotion-editor-agent → Remotion + FFmpeg assembly
2. final-quality-check-agent → QA review
```

### If task involves "review video quality":
```
1. final-quality-check-agent → strict QA review
```

### If task involves "debug this" or "fix this bug":
```
1. investigate → root cause
2. systematic-debugging → structured fix
3. test-driven-development → write test first
```

### If task involves "deploy to Azure":
```
1. last30days → check Azure updates
2. azure-prepare → prepare infra
3. azure-validate → pre-deployment checks
4. azure-deploy → deploy
```

### If task involves "create a design" or "design this":
```
1. last30days → check design trends
2. design-consultation → create design system
3. design-shotgun → explore variants
4. design-html → finalize
5. design-review → polish
```

### If task involves "mobile app":
```
1. last30days → check mobile trends
2. mobile-pwa-design OR flutter-dev OR sleek-design-mobile-apps
3. mobile-app-testing → test
```

### If task involves "generate image" or "image gen" or "AI art":
```
1. last30days → check latest open-source image models
2. edge-image-gen → detect hardware → select model → generate
3. If using ComfyUI workflow → ComfyUI nodes
```

### If task involves "text-to-speech" or "voice" or "narration":
```
1. last30days → check latest TTS models
2. edge-tts → detect hardware → select model (ChatTTS/Piper/XTTSv2)
3. If voice cloning → Coqui XTTSv2 with 6-second sample
```

### If task involves "generate video" or "animate" or "text-to-video":
```
1. last30days → check latest video gen models
2. edge-video-gen → detect VRAM → select model (Wan2.1/CogVideoX/Mochi)
3. If production quality → Wan2.1-14B (24GB VRAM)
4. If quick iteration → Wan2.1-1.3B or CogVideoX-2B
```

### If task involves "run LLM locally" or "offline AI" or "edge model":
```
1. last30days → check latest edge LLM tools and models
2. Determine deployment target (CPU/GPU/Mac/NVIDIA/Mobile/Browser)
3. Load appropriate edge skill(s) from the Edge LLM Skill Index above
4. If building an app around it → edge-langchain + app framework
5. If serving → edge-vllm OR edge-ollama OR edge-llama-cpp
6. If distributing → edge-llamafile OR edge-mlc-llm
7. test-driven-development → validate inference quality
```

### If task involves "agent workflow" or "manage agents" or "sprint":
```
1. last30days → check agent workflow best practices
2. For structured dev sprints → gstack-suite (CEO/design/eng/QA/ship)
3. For methodology enforcement (TDD) → superpowers (brainstorming→TDD→review)
4. For personal AI agent → hermes-agent (self-improving, multi-platform)
5. For multi-agent orchestration → paperclip (org chart, budgets, governance)
6. If coordinating multiple of the above → skill-orchestrator (this skill)
```

---

## TODOWRITE Integration
After Phase 2 (skill loading), ALWAYS call `TODOWrite` with the full task breakdown. Each TODO item must include:
- The skill being used
- The specific action
- Priority level
- Dependencies

Example:
```json
[
  {"content": "last30days: Research latest AI video models and best practices", "status": "in_progress", "priority": "high"},
  {"content": "ai-video-generation: Select model and generate prompt", "status": "pending", "priority": "high"},
  {"content": "ai-video-cinema: Apply cinematic composition and render", "status": "pending", "priority": "medium"},
  {"content": "qa: Verify output quality", "status": "pending", "priority": "medium"}
]
```

---

## Special Considerations

### Edge/Offline/Mobile LLM Tasks
When the user asks about edge LLMs, offline models, or mobile AI:
1. `last30days` on "open source edge LLM models mobile offline 2026"
2. `open-search-code-lm` — find open-source edge models on GitHub
3. Load any edge-specific skills (see edge-llm skills below)

### Azure-Specific Tasks
Always check `azure-cost` before provisioning to avoid surprise bills.
Always run `azure-validate` before `azure-deploy`.

### Security-Critical Tasks
Always load `cso` for security audit.
Always load `careful` or `guard` for production safety.

### Multi-File Changes
Use `freeze` to scope edits to specific directories.
Use `unfreeze` when done.

---

## Edge LLM & Offline Model Skill Index

These 13 specialized skills cover every open-source edge/offline/mobile LLM scenario:

### Inference Runtimes (Run Models Anywhere)
| Skill | Stars | Purpose |
|-------|-------|---------|
| `edge-llama-cpp` | ⭐116k | CPU-first inference in C/C++. Metal, CUDA, Vulkan, WebGPU, mobile. Universal GGUF runtime |
| `edge-ollama` | ⭐174k | Easiest local LLM runner. One-command models. OpenAI API. Coding agent integration |
| `edge-vllm` | ⭐82.7k | Production LLM serving. PagedAttention. 200+ models. Maximum GPU throughput |
| `edge-tensorrt-llm` | ⭐11k | NVIDIA-optimized. Up to 8x faster than PyTorch. FP8/INT4. Triton Server |

### Distribution & Deployment
| Skill | Stars | Purpose |
|-------|-------|---------|
| `edge-mlc-llm` | ⭐22.8k | ML compilation for iOS, Android, WebGPU. Native mobile SDKs. Write once, run everywhere |
| `edge-llamafile` | ⭐24.9k | Single-file LLM executable. Zero install. 6 OSes. Mozilla project |
| `edge-exo` | ⭐45.3k | Distributed AI cluster. Automatic device discovery. RDMA over Thunderbolt 5 |
| `edge-transformers-js` | ⭐14k | Run HuggingFace models in browser. WebGPU. Zero server |

### Applications & Interfaces
| Skill | Stars | Purpose |
|-------|-------|---------|
| `edge-jan` | ⭐43k | ChatGPT alternative. Offline desktop app. One-click model downloads |
| `edge-open-webui` | ⭐139k | Self-hosted web UI. RAG, web search, multimodal, voice, MCP |
| `edge-gpt4all` | ⭐75k | CPU-only laptop AI. Curated model library. Privacy-first |

### Frameworks & Embedding
| Skill | Stars | Purpose |
|-------|-------|---------|
| `edge-langchain` | ⭐105k | LLM app framework. Agents, RAG, chains. Works with all local models |
| `edge-candle` | ⭐17k | Rust ML framework. WASM-compatible. Zero Python deps. HuggingFace |

### Edge LLM Routing Decision Tree

```
User wants to run LLM locally?
├── Just want it to work? → edge-ollama
├── Maximum performance on NVIDIA? → edge-tensorrt-llm OR edge-vllm
├── CPU-only / Mac? → edge-llama-cpp OR edge-gpt4all
├── Mobile (iOS/Android)? → edge-mlc-llm
├── Browser/Web? → edge-transformers-js OR edge-mlc-llm
├── Cluster multiple devices? → edge-exo
├── Single executable distribution? → edge-llamafile
├── Desktop app with GUI? → edge-jan OR edge-gpt4all
├── Self-hosted web UI / team? → edge-open-webui
├── Build agent/RAG app? → edge-langchain + edge-ollama
└── Rust/WASM/embedded? → edge-candle
```

---

## Invocation Contract

**When to invoke this skill:**
- User asks for any multi-step task
- User says "I want to build X"
- User provides a complex request spanning multiple domains
- User says "help me figure out where to start"
- User appears unsure which skill to use

**How to invoke:**
```
Skill: skill-orchestrator
Then follow the pipeline above top-to-bottom
```

**Output contract:**
After each phase, report to the user:
- What was done
- What's next
- Any decisions needed

**LAW: Never skip last30days.** Even for "quick" tasks. The 30-second research pays for itself in avoiding deprecated approaches.

---

---

## OpenCV Computer Vision Roadmap

Eight OpenCV skills added for computer vision across all platforms. Each skill covers a distinct OpenCV module domain:

| Skill | Module | Covers |
|-------|--------|--------|
| **opencv-core** | core + highgui + imgcodecs | Installation, build, Mat, I/O, GUI, pixel ops |
| **opencv-image-processing** | imgproc | Filtering, morphology, edges, contours, thresholds, histograms, segmentation |
| **opencv-vision** | features2d + calib3d + objdetect | SIFT/ORB features, camera calibration, face/Haar/QR detection, tracking |
| **opencv-dnn** | dnn | ONNX/TF/PyTorch model deployment, YOLO, SSD, face detection DNN, pose |
| **opencv-python** | Python API | NumPy interop, webcam, Flask/FastAPI, Streamlit, GPU optimization |
| **opencv-video** | video + videoio | Background subtraction, optical flow, stabilization, surveillance pipelines |
| **opencv-ml** | ml | SVM, KNN, Random Forest, ANN, K-Means, PCA for vision |
| **opencv-contrib** | opencv_contrib | Superpixels, face recognition, text detection, ArUco, super-resolution, RGB-D |

When the user asks for computer vision work:
1. Load `opencv-core` for installation/setup questions
2. Route to the specific domain skill based on the task
3. Use `opencv-python` when the user needs Python integration patterns
4. Use `opencv-dnn` when deploying neural networks (ONNX, YOLO, etc.)
5. Use `opencv-contrib` when extra/advanced modules are needed

**Reference:** https://github.com/opencv/opencv — ⭐89.2k, Apache 2.0, OpenCV 5.0.0

---

## Edge LLM Enhancement Roadmap

This is the roadmap for adding 10+ edge/offline/mobile LLM superpower skills. Each entry maps to a GitHub repo or tool that gives this orchestrator awareness of production-grade edge LLM capabilities:

1. **llama.cpp** — CPU-first LLM inference engine with metal/cuda support. The universal runtime.
2. **MLC-LLM** — Universal LLM deployment across phones, browsers, and laptops. Apple MLX + WebGPU.
3. **Ollama** — Local LLM runner with model library, REST API, and Modelfile packaging.
4. **vLLM** — High-throughput LLM serving with PagedAttention. Production-grade.
5. **LM Studio** — Desktop app for running local LLMs with model downloader + chat UI.
6. **Jan.ai** — Open-source ChatGPT alternative with local models. Desktop app.
7. **Open WebUI** — Self-hosted WebUI for Ollama/OpenAI-compatible APIs.
8. **LangChain/LangGraph** — LLM application framework with agent orchestration.
9. **llamafile** — Single-file executable LLM. One binary, no install.
10. **exo** — Distributed LLM inference across devices. Cluster your phones/laptops.
11. **TensorRT-LLM** — NVIDIA optimized LLM inference. Maximum GPU throughput.
12. **candle** — Minimalist ML framework in Rust. WASM-compatible for browser inference.

When the user requests edge/offline/mobile LLM work, this orchestrator will:
1. Run `last30days` on the relevant tool(s)
2. Load `open-search-code-lm` if more tools are needed
3. Select the right tool for the right deployment target
4. Generate a pipeline-specific TODO

---

**Remember:** This skill is your bootstrap. When in doubt, start here. The orchestrator ensures no skill is missed, no step is skipped, and you always build on fresh intelligence from last30days.
