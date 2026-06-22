---
name: edge-ollama-agents
version: "1.0.0"
description: "Ollama Models as Agents — Create, deploy, and orchestrate Ollama models as AI agents with memory, RAG, embeddings, tool-calling, and deep research. Covers Modelfile creation, custom model fine-tuning, vector databases (ChromaDB/Qdrant/pgvector), LangChain memory patterns, RAG pipelines, embedding generation, web search integration, and multi-step autonomous research agents. Use when the user asks to: create a custom Ollama model, build an agent with memory, set up RAG with local models, generate embeddings, do deep research with Ollama, build an autonomous agent, add tool-calling to a model, create a Modelfile, connect Ollama to a vector database."
argument-hint: 'edge-ollama-agents create agent with memory | edge-ollama-agents build RAG pipeline | edge-ollama-agents deep research agent'
allowed-tools: Bash, Read, Write, WebFetch, WebSearch, Grep, Glob
user-invocable: true
metadata:
  openclaw:
    emoji: "🧠"
    tags: [ollama, agents, memory, rag, embeddings, deep-research, modelfile, tool-calling, vector-db, langchain, chromadb, autonomous]
    repo: https://github.com/ollama/ollama
    stars: 174000
    license: MIT
---

# 🧠 Ollama Models as Agents — Complete Playbook

Build autonomous AI agents backed by local Ollama models with persistent memory, RAG document retrieval, embeddings-based search, and multi-step deep research capabilities.

---

## Phase 1: Creating Custom Ollama Models

### A. Modelfile — The Quick Path

Create a file called `Modelfile`:

```dockerfile
# Base model
FROM llama3.2

# System prompt — defines the agent's role
SYSTEM """
You are Eburon, an AI research assistant. You have access to:
- Long-term memory (stored in ChromaDB)
- Document retrieval (RAG pipeline)
- Web search (via tool calling)
- Code execution (Python sandbox)

Always cite sources. When unsure, search before answering.
"""

# Temperature — lower = more deterministic
PARAMETER temperature 0.7

# Context window size
PARAMETER num_ctx 32768

# Custom stop tokens
PARAMETER stop "<|end|>"
PARAMETER stop "User:"

# Template for chat format
TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>"""
```

Build and run:
```bash
ollama create eburon-agent -f Modelfile
ollama run eburon-agent
```

### B. GGUF Conversion — Custom Fine-Tunes

Convert any HuggingFace model to Ollama:
```bash
# Step 1: Convert to GGUF
python3 ~/llama.cpp/convert_hf_to_gguf.py /path/to/model --outtype q4_k_m

# Step 2: Create Modelfile pointing to GGUF
cat > Modelfile <<'EOF'
FROM ./model-Q4_K_M.gguf
TEMPLATE "{{ .Prompt }}"
EOF

# Step 3: Create Ollama model
ollama create my-custom-model -f Modelfile
```

### C. Merging LoRA Adapters

```bash
# Apply LoRA to base model
ollama create eburon-finance \
  --from-base llama3.2 \
  --lora ./finance-lora.bin \
  --modelfile Modelfile
```

---

## Phase 2: Memory Systems

### A. Conversation Buffer Memory (Short-Term)

```python
from langchain.memory import ConversationBufferMemory
from langchain_ollama import ChatOllama

llm = ChatOllama(model="eburon-agent", temperature=0.7)
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="output"
)

# Memory persists within session
response = llm.invoke("What did we discuss earlier?")
memory.save_context({"input": "Discuss AI"}, {"output": response})
```

### B. Vector Memory (Long-Term, Semantic Search)

```python
import chromadb
from chromadb.utils import embedding_functions

# ChromaDB with Ollama embeddings
client = chromadb.PersistentClient(path="./eburon-memory")
ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    model_name="nomic-embed-text",
    url="http://localhost:11434/api/embeddings"
)

collection = client.get_or_create_collection(
    name="agent-memory",
    embedding_function=ollama_ef
)

# Store memories
collection.add(
    documents=["User prefers dark mode in all apps"],
    metadatas=[{"type": "preference", "timestamp": "2026-06-13"}],
    ids=["mem-001"]
)

# Semantic recall — finds relevant memories
results = collection.query(
    query_texts=["user interface preferences"],
    n_results=5
)
```

### C. Summary Memory (Compression)

```python
from langchain.memory import ConversationSummaryMemory

summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    max_token_limit=500
)
# Auto-summarizes old messages to stay within context
```

### D. Entity Memory (Structured Facts)

```python
from langchain.memory import ConversationEntityMemory

entity_memory = ConversationEntityMemory(llm=llm)
# Tracks: "User's name is John", "John works at Acme Corp"
# Structured key-value pairs across conversations
```

---

## Phase 3: RAG — Retrieval Augmented Generation

### A. Document Loading & Chunking

```python
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, UnstructuredMarkdownLoader,
    UnstructuredHTMLLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load documents
loaders = [
    PyPDFLoader("./docs/report.pdf"),
    TextLoader("./docs/notes.txt"),
    UnstructuredMarkdownLoader("./docs/README.md"),
]

docs = []
for loader in loaders:
    docs.extend(loader.load())

# Chunk with overlap for context continuity
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""]
)
chunks = splitter.split_documents(docs)
```

### B. Embedding + Vector Store

```python
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

# Ollama embeddings (local, free, unlimited)
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",      # or "mxbai-embed-large"
    base_url="http://localhost:11434"
)

# Store in ChromaDB
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./eburon-rag-db"
)

# Or use Qdrant (production-scale)
# Or pgvector (PostgreSQL-native)
# Or FAISS (in-memory, fastest for small datasets)
```

### C. Retrieval + Generation

```python
from langchain.chains import RetrievalQA
from langchain_ollama import ChatOllama

llm = ChatOllama(model="eburon-agent")

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",           # or "map_reduce", "refine"
    retriever=vectorstore.as_retriever(
        search_type="mmr",        # Max Marginal Relevance
        search_kwargs={"k": 5}    # Retrieve top 5 chunks
    ),
    return_source_documents=True  # Show which docs were used
)

result = qa_chain.invoke("What is our Q3 revenue forecast?")
print(result["result"])           # The answer
print(result["source_documents"]) # Which chunks informed it
```

### D. Advanced RAG Patterns

**HyDE (Hypothetical Document Embeddings):**
```python
# Generate a hypothetical answer → embed it → retrieve similar docs
# Better for questions where keyword search fails
hypothetical = llm.invoke("Write a paragraph about Q3 revenue trends")
hypothetical_embedding = embeddings.embed_query(hypothetical)
results = vectorstore.similarity_search_by_vector(hypothetical_embedding, k=5)
```

**Self-Query Retrieval:**
```python
from langchain.retrievers import SelfQueryRetriever

retriever = SelfQueryRetriever.from_llm(
    llm=llm,
    vectorstore=vectorstore,
    document_content_description="Financial reports and memos",
    metadata_field_info=[...]
)
# "Show me Q3 reports from the finance team" 
# → filters metadata.team="finance" + semantic search
```

**Multi-Query Retrieval:**
```python
from langchain.retrievers import MultiQueryRetriever

retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=llm
)
# Generates 3-5 rephrased queries → retrieves for each → deduplicates
```

---

## Phase 4: Tool-Calling Agents

### A. Native Ollama Tool Calling

```python
import ollama

response = ollama.chat(
    model="eburon-agent",
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"]
            }
        }
    }]
)

# Model returns tool call → you execute → send result back
if response.message.tool_calls:
    for tool in response.message.tool_calls:
        if tool.function.name == "get_weather":
            result = get_weather(tool.function.arguments["city"])
            # Send result back to model for final answer
```

### B. LangChain Agent with Tools

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool, tool
from langchain_ollama import ChatOllama

llm = ChatOllama(model="eburon-agent", temperature=0)

# Define tools
@tool
def search_web(query: str) -> str:
    """Search the web for current information."""
    # Use DuckDuckGo, SerpAPI, Brave Search, etc.
    from duckduckgo_search import DDGS
    results = DDGS().text(query, max_results=5)
    return "\n".join([f"{r['title']}: {r['body']}" for r in results])

@tool
def read_file(path: str) -> str:
    """Read contents of a file."""
    with open(path) as f:
        return f.read()

@tool  
def python_repl(code: str) -> str:
    """Execute Python code and return result."""
    import subprocess
    result = subprocess.run(["python3", "-c", code], capture_output=True, text=True)
    return result.stdout or result.stderr

tools = [search_web, read_file, python_repl]

agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

executor.invoke({"input": "Research the latest AI trends and summarize in 3 bullets"})
```

### C. Custom Tool List for Research Agents

```python
research_tools = [
    Tool(name="web_search", func=search_web,
         description="Search the web. Input: search query string."),
    Tool(name="summarize", func=summarize_text,
         description="Summarize long text. Input: text to summarize."),
    Tool(name="extract_facts", func=extract_facts,
         description="Extract key facts from text as bullet points."),
    Tool(name="compare_sources", func=compare_sources,
         description="Compare multiple sources for agreement/contradiction."),
    Tool(name="save_finding", func=save_to_memory,
         description="Save an important finding to long-term memory."),
    Tool(name="python", func=python_repl,
         description="Run Python for data analysis. Input: Python code."),
]
```

---

## Phase 5: Deep Research Agent

### Full Autonomous Research Pipeline

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
import ollama

class ResearchState(TypedDict):
    query: str
    sub_questions: List[str]
    search_results: List[dict]
    findings: List[str]
    synthesis: str
    citations: List[str]

def generate_sub_questions(state: ResearchState):
    """Break main query into sub-questions."""
    response = ollama.chat(model="eburon-agent", messages=[{
        "role": "user",
        "content": f"Break this research question into 3-5 specific sub-questions:\n\n{state['query']}\n\nReturn as numbered list."
    }])
    questions = [q.strip() for q in response.message.content.split("\n") if q.strip().startswith(tuple("12345"))]
    return {"sub_questions": questions}

def search_each_question(state: ResearchState):
    """Search web for each sub-question in parallel."""
    results = []
    for q in state["sub_questions"]:
        # Search + extract
        r = ollama.chat(model="eburon-agent", messages=[{
            "role": "user",
            "content": f"Research this question and return key findings with sources:\n{q}"
        }])
        results.append({"question": q, "findings": r.message.content})
    return {"search_results": results}

def synthesize(state: ResearchState):
    """Synthesize all findings into a coherent report."""
    findings_text = "\n\n".join([
        f"Q: {r['question']}\nA: {r['findings']}" 
        for r in state["search_results"]
    ])
    response = ollama.chat(model="eburon-agent", messages=[{
        "role": "user",
        "content": f"""Synthesize these research findings into a comprehensive report.
Include: Executive Summary, Key Findings, Detailed Analysis, Contradictions/Gaps, Recommendations.

Research findings:
{findings_text}"""
    }])
    return {"synthesis": response.message.content}

# Build the graph
workflow = StateGraph(ResearchState)
workflow.add_node("decompose", generate_sub_questions)
workflow.add_node("research", search_each_question)
workflow.add_node("synthesize", synthesize)
workflow.set_entry_point("decompose")
workflow.add_edge("decompose", "research")
workflow.add_edge("research", "synthesize")
workflow.add_edge("synthesize", END)

research_agent = workflow.compile()
result = research_agent.invoke({"query": "What is the state of AI video generation in 2026?"})
print(result["synthesis"])
```

---

## Phase 6: Production Deployment Patterns

### A. Persistent Agent with Memory Loop

```python
class PersistentAgent:
    def __init__(self, model="eburon-agent"):
        self.llm = ChatOllama(model=model)
        self.memory = ConversationSummaryMemory(llm=self.llm)
        self.vector_memory = Chroma(
            persist_directory="./agent-memory",
            embedding_function=OllamaEmbeddings(model="nomic-embed-text")
        )
        self.tools = [search_web, python_repl, save_to_memory]
        
    def think(self, user_input: str) -> str:
        # 1. Recall relevant memories
        memories = self.vector_memory.similarity_search(user_input, k=3)
        memory_context = "\n".join([m.page_content for m in memories])
        
        # 2. Build prompt with memory + tools
        prompt = f"""Context from memory:
{memory_context}

Chat history summary:
{self.memory.buffer}

User: {user_input}"""
        
        # 3. Agent decides: answer, search, or use tools
        response = self.llm.invoke(prompt)
        
        # 4. Save to memory
        self.memory.save_context(
            {"input": user_input},
            {"output": response.content}
        )
        self.vector_memory.add_texts(
            [f"User: {user_input}\nAssistant: {response.content}"],
            metadatas=[{"timestamp": str(datetime.now())}]
        )
        
        return response.content
```

### B. Multi-Agent Orchestration

```python
# Researcher agent → Writer agent → Reviewer agent
researcher = ChatOllama(model="eburon-researcher", system="You research topics deeply.")
writer = ChatOllama(model="eburon-writer", system="You write clear, engaging prose.")
reviewer = ChatOllama(model="eburon-reviewer", system="You review for accuracy and clarity.")

def multi_agent_pipeline(topic: str) -> str:
    research = researcher.invoke(f"Research: {topic}")
    draft = writer.invoke(f"Write based on: {research}")
    final = reviewer.invoke(f"Review and improve: {draft}")
    return final
```

---

## Quick-Start Commands

```bash
# Create a custom agent model
ollama create eburon-agent -f Modelfile

# Generate embeddings
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "The sky is blue because of Rayleigh scattering"
}'

# Test tool calling
ollama run eburon-agent "Search for today's top AI news and summarize"

# List all models (agents)
ollama list

# Delete a model
ollama rm eburon-agent
```

## Required Python Packages

```bash
pip install ollama langchain langchain-ollama langchain-chroma chromadb
pip install duckduckgo-search sentence-transformers unstructured
pip install langgraph pypdf beautifulsoup4
```

## When to Use This Skill

- Creating a custom Ollama model (Modelfile, GGUF, LoRA)
- Building an agent with persistent memory across sessions
- Setting up RAG to answer questions from your documents
- Generating embeddings for semantic search
- Building a deep research agent that searches + synthesizes
- Adding tool-calling to Ollama models
- Multi-agent orchestration with local models
- Connecting Ollama to ChromaDB/Qdrant/pgvector
