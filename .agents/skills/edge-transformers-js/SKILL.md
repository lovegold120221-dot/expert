---
name: edge-transformers-js
version: "1.0.0"
description: "Transformers.js — Run ML models in the browser with JavaScript. ⭐14k+ stars, Apache 2.0. HuggingFace Transformers ported to JavaScript/ONNX Runtime Web. Runs entirely in the browser with WebGPU — no server, no install. Use when the user asks to: run AI in the browser, client-side ML, offline web apps with AI, browser-based NLP, image, speech."
argument-hint: 'edge-transformers-js run AI in browser | edge-transformers-js client-side ML | edge-transformers-js browser NLP'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🌍"
    tags: [javascript, browser, wasm, webgpu, onnx, client-side, huggingface, offline]
    repo: https://github.com/huggingface/transformers.js
    homepage: https://huggingface.co/docs/transformers.js
    stars: 14000
    license: Apache-2.0
---

# 🌍 Transformers.js — AI in the Browser

**⭐14,000+ stars | Apache 2.0 | HuggingFace**

Run HuggingFace Transformers directly in the browser. No server, no Python, no install. Just JavaScript. Uses ONNX Runtime Web with WebGPU acceleration.

## Quick Start

```html
<script type="module">
  import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';

  // Sentiment analysis
  const classifier = await pipeline('sentiment-analysis');
  const result = await classifier('I love Transformers.js!');
  // [{label: 'POSITIVE', score: 0.99}]
</script>
```

## Capabilities in Browser

| Task | Example |
|------|---------|
| Text Generation | Llama, Gemma, Phi |
| Translation | NLLB, T5 |
| Summarization | BART, T5 |
| Image Classification | ResNet, ViT |
| Object Detection | YOLO, DETR |
| Speech Recognition | Whisper |
| Text-to-Speech | SpeechT5 |
| Image Generation | Stable Diffusion |
| Embeddings | BGE, all-MiniLM |
| Zero-shot Classification | BART-MNLI |

## Node.js Usage

```bash
npm install @huggingface/transformers
```

```javascript
import { pipeline } from '@huggingface/transformers';
const generator = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct');
```

## When to Use

- 100% client-side AI (privacy-first)
- Offline-capable web applications
- Browser extensions with AI
- Edge computing without server costs
- Demo and educational applications
- Progressive Web Apps (PWAs) with AI
