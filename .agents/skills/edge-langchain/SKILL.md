---
name: edge-langchain
version: "1.0.0"
description: "LangChain & LangGraph — LLM application framework. Build agents, RAG systems, and LLM-powered apps with composable components. Supports 100+ model providers including all local/edge options (Ollama, llama.cpp, vLLM, HuggingFace). LangGraph adds agent orchestration with state machines. Use when the user asks to: build RAG applications, create AI agents, chain LLM calls, build LLM-powered apps with tools."
argument-hint: 'edge-langchain build RAG app | edge-langchain create AI agent | edge-langchain chain LLM calls'
allowed-tools: Bash, Read, Write, WebFetch
user-invocable: true
metadata:
  openclaw:
    emoji: "⛓️"
    tags: [llm-framework, agents, rag, chains, tools, langgraph, orchestration, state-machine]
    repo: https://github.com/langchain-ai/langchain
    homepage: https://langchain.com
    stars: 105000
    license: MIT
---

# ⛓️ LangChain — LLM Application Framework

**⭐105,000+ stars | MIT License**

The standard framework for building LLM-powered applications. Compose chains, build agents, implement RAG, and orchestrate complex AI workflows. Works with local models via Ollama, llama.cpp, vLLM, and HuggingFace.

## Quick Start

```bash
pip install langchain langchain-community

# With local models via Ollama
pip install langchain-ollama

# With LangGraph for agents
pip install langgraph
```

## Core Concepts

| Component | Purpose |
|-----------|---------|
| **Chains** | Compose multiple LLM calls |
| **Agents** | LLM decides which tools to use |
| **Tools** | Functions the LLM can call |
| **Retrievers** | Fetch relevant documents |
| **Vector Stores** | Store and search embeddings |
| **Memory** | Persist conversation state |

## LangGraph — Agent Orchestration

LangGraph adds state-machine-based agent orchestration:
```python
from langgraph.graph import StateGraph

# Build multi-step agent workflows
# with branching, looping, and conditional logic
```

## Local Model Integration

```python
# Ollama
from langchain_ollama import ChatOllama
llm = ChatOllama(model="llama3.2")

# llama.cpp
from langchain_community.llms import LlamaCpp
llm = LlamaCpp(model_path="model.gguf")

# vLLM (OpenAI-compatible)
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(base_url="http://localhost:8000/v1", api_key="not-needed")
```

## When to Use

- Building RAG (Retrieval-Augmented Generation) systems
- Creating AI agents that use tools
- Multi-step LLM workflows
- Connecting LLMs to databases, APIs, and documents
- Prototyping LLM applications before production
- Agent orchestration with state management (LangGraph)
