---
name: edge-exo
version: "1.0.0"
description: "exo — Run frontier AI locally across all your devices. ⭐45.3k stars, Apache 2.0. Automatic device discovery turns all your Macs/iPhones/iPads/Linux boxes into one AI cluster. RDMA over Thunderbolt 5. Runs DeepSeek v3.1 671B on 4x M3 Ultra Mac Studios. Use when the user asks to: cluster devices for AI inference, run large models across multiple Macs, use Thunderbolt RDMA for distributed inference, run models too large for one device."
argument-hint: 'edge-exo cluster Macs for inference | edge-exo run DeepSeek across devices | edge-exo distributed LLM'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "🔗"
    tags: [distributed, cluster, apple-silicon, rdma, thunderbolt, mlx, tensor-parallelism, p2p]
    repo: https://github.com/exo-explore/exo
    homepage: https://x.com/exolabs
    stars: 45300
    license: Apache-2.0
---

# 🔗 exo — Distributed AI Cluster

**⭐45,300 stars | Apache 2.0 | 2,351 commits**

Turn all your Apple devices into one AI supercomputer. Automatic peer discovery, topology-aware model sharding, and RDMA over Thunderbolt 5 for near-zero latency between devices.

## Quick Start (macOS)

```bash
# Clone and run
git clone https://github.com/exo-explore/exo
cd exo/dashboard && npm install && npm run build && cd ..
uv run exo

# Or with Nix
nix run .#exo
```

Dashboard at `http://localhost:52415`

## What It Can Do

- **4 × M3 Ultra Mac Studio** → Run DeepSeek v3.1 671B (8-bit) at interactive speeds
- **Tensor Parallelism** → 1.8x speedup on 2 devices, 3.2x on 4 devices
- **Automatic Discovery** → Devices find each other on the network automatically
- **RDMA over Thunderbolt 5** → 99% latency reduction between devices
- **Custom namespace** → Isolate clusters on the same network

## API Compatibility

- ✅ OpenAI Chat Completions API
- ✅ Claude Messages API
- ✅ OpenAI Responses API
- ✅ Ollama API (Open WebUI compatible)

## Requirements

- macOS 26.2+ for RDMA
- Thunderbolt 5 for RDMA (M4 Pro/Max, M3 Ultra)
- Xcode (Metal ToolChain)
- uv, node, rust (nightly)

## When to Use

- Running models too large for any single device
- Clustering multiple Apple Silicon devices
- Maximum privacy — everything stays on your hardware
- Running 671B+ models without cloud costs
- Research on distributed inference topologies
