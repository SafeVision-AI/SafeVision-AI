# SafeVisionAI — AI Instructions

## Overview of AI Components

SafeVisionAI uses AI at **five distinct layers** — each with a specific purpose and technical implementation. This document explains how each AI component works, why it was chosen, and how to implement or extend it.

---

## AI Layer 1: Online LLM — 11-Provider Agentic RAG (Server-Side)

### What It Does
Answers user questions about traffic laws, first aid, and emergency services using an **agentic RAG pipeline** running on the separate chatbot service (port 8010). Every answer is grounded in actual documents + 9 agent tools — not model training data.

### 11-Provider Fallback Chain
Instead of relying on a single LLM, the chatbot cascades through 11 providers for zero downtime:

```
Groq → Cerebras → Gemini → GitHub Models → NVIDIA NIM → OpenRouter → Mistral → Together → Template
```

**Indian language auto-routing:**
- Hindi, Tamil, Telugu, Kannada, Bengali, etc. → **Sarvam AI sarvam-30b** (trained on 4 trillion Indic tokens)
- Legal/challan queries in Indian languages → **Sarvam AI sarvam-105b** (higher accuracy for law)
- English → Default chain (Groq primary, 300+ tok/s)
- Language detection: regex-based Unicode script ranges (no NLTK dependency)

### Why Multi-Provider?
- **Zero downtime**: If Groq rate-limits, Cerebras takes over, then Gemini, etc.
- **Speed**: Groq delivers 300+ tok/s, Cerebras 2000+ tok/s
- **Cost**: Every provider has a free tier — total LLM cost is ₹0
- **Specialization**: Sarvam AI trained specifically for Indian languages

### System Prompt (Do Not Change Without Testing)

```python
SYSTEM_PROMPT = (
    "You are RoadSoS, an AI assistant built for Indian road safety and emergency response. "
    "Help users with: emergency contacts, first aid, pothole/accident reporting, traffic challans, "
    "navigation, and road authority escalation. "
    "Always answer concisely in the SAME language the user writes in (Hindi, Tamil, Telugu, etc.). "
    "For life-threatening situations, always lead with 112 (universal emergency) or 102 (ambulance). "
    "Be factual — cite MV Act sections when answering challan questions."
)
```

### How Agentic RAG Works Step by Step

```
1. User asks: "what is the fine for drunk driving in Tamil Nadu?"

2. SafetyChecker.evaluate(message)
   → Block if harmful, pass if safe

3. IntentDetector.detect(message) → "CHALLAN_QUERY"
   Rules-based classifier using keyword matching (no separate LLM call)

4. ContextAssembler.assemble(intent, params)
   Calls relevant tools based on intent:
   
   For CHALLAN_QUERY:
   → ChallanTool: calls backend API /api/v1/challan/calculate?violation_code=MVA_185
   → LegalSearchTool: ChromaDB MMR search for top-5 diverse MV Act chunks
   
   For FIND_HOSPITAL:
   → SosTool: calls backend API /api/v1/emergency/nearby

5. ProviderRouter.generate(context + history + user_message)
   → Detects language → selects provider
   → Tamil text → Sarvam AI sarvam-30b
   → Builds final prompt with system prompt + context + history
   → Streams response

6. ConversationMemoryStore.append(session_id, turn)
   → Persists to Redis (24hr TTL)

7. Response:
   "Under Section 185 of the Motor Vehicles Amendment Act 2019, drunk driving carries
   a fine of Rs 10,000 for a first offence with up to 6 months imprisonment.
   Tamil Nadu has not set a state-specific override, so the national amount applies."
```

### 9 Agent Tools

| Tool | Function | Data Source |
|------|----------|-------------|
| **SosTool** | Find nearest emergency services | Backend API → PostGIS + Overpass |
| **ChallanTool** | Calculate traffic fines | Backend API → DuckDB SQL |
| **LegalSearchTool** | Search MV Act, traffic regulations | ChromaDB vector search |
| **FirstAidTool** | WHO-based first-aid protocols | Static JSON data |
| **WeatherTool** | Current weather conditions | OpenWeather API |
| **RoadInfrastructureTool** | Contractor, budget, engineer info | Backend API → data.gov.in |
| **RoadIssuesTool** | Community-reported road issues | Backend API → PostGIS |
| **SubmitReportTool** | Submit road damage reports | Backend API → PostgreSQL |
| **EmergencyTool** | Find nearby emergency services directly | Backend API → PostGIS + Overpass |

---

## AI Layer 2: Offline LLM — WebLLM Phi-3 Mini (Browser-Side)

### What It Does
Runs a complete large language model on the user's device via WebGPU. Answers questions about first aid and traffic laws when there is no internet connection.

### Why Phi-3 Mini?
- **Best reasoning per parameter**: 3.8B params but outperforms models twice its size on legal/factual Q&A
- **4-bit quantized**: ~2.2GB fits in browser Cache Storage
- **Microsoft**: Trained on high-quality synthetic textbook data — good for dense legal reasoning
- **WebGPU acceleration**: 3-5s response on modern Android Chrome

### Model Selection Logic

```typescript
// lib/offline-ai.ts

async function selectModel(): Promise<string> {
  // Check if WebGPU is available
  const hasGPU = 'gpu' in navigator && await navigator.gpu?.requestAdapter()
  
  if (hasGPU) {
    // Phi-3 Mini — best quality, requires WebGPU
    return "Phi-3-mini-4k-instruct-q4f16_1-MLC"
  } else {
    // Gemma-2B — lighter, runs on WebAssembly CPU
    return "gemma-2b-it-q4f16_1-MLC"
  }
}
```

### Offline RAG Architecture

```
1. At first offline chat activation:
   - Load first-aid.json (20 WHO-based articles, pre-bundled with PWA)
   - Generate 384-dim embeddings for each article using Transformers.js
     (Xenova/all-MiniLM-L6-v2, 25MB, runs in browser)
   - Build HNSWlib.js HNSW graph index in IndexedDB
   - This setup takes ~30 seconds on first use, milliseconds after

2. Each offline chat message:
   - Embed user query → 384-dim vector
   - HNSWlib.js ANN search → top-3 most similar first-aid articles
   - Inject article text as context into Phi-3 Mini prompt
   - Phi-3 Mini generates response (~3-15 seconds)
```

### Key Offline Limitation
The offline LLM **cannot** search for hospitals in real-time — it only has access to the 20 pre-bundled first-aid articles and the static GeoJSON POI bundle. Make this clear to users via the `ConnectivityBadge` component.

---

## AI Layer 3: Intent Detection

### Rule-Based Classification System

The IntentDetector uses keyword matching and regex patterns — **not** a separate LLM call. This keeps intent classification instant (<1ms) with zero API cost.

```python
# agent/intent_detector.py

INTENTS = {
    "FIND_HOSPITAL": ["hospital", "trauma", "medical", "doctor", "clinic"],
    "FIND_POLICE": ["police", "FIR", "station", "law enforcement"],
    "FIND_AMBULANCE": ["ambulance", "102", "medical transport"],
    "FIND_TOW": ["towing", "breakdown", "vehicle recovery", "puncture"],
    "FIRST_AID_INFO": ["bleeding", "unconscious", "fracture", "burn", "CPR"],
    "CHALLAN_QUERY": ["fine", "challan", "penalty", "drunk driving", "MVA"],
    "ROAD_REPORT": ["pothole", "broken road", "reporting", "complain"],
    "LEGAL_INFO": ["speed limit", "traffic rules", "Section", "allowed"],
    "OTHER": []  # Default fallback
}
```

### Why Intent-First?
Without intent detection, every message would trigger a full RAG search. With intent:
- `FIND_*` intents call PostGIS directly (faster + more accurate)
- `FIRST_AID_INFO` searches WHO medical chunks only (not MV Act)
- `LEGAL_INFO` searches MV Act chunks only (not medical docs)
- `CHALLAN_QUERY` uses deterministic DuckDB SQL (no LLM hallucination for fine amounts)

---

## AI Layer 4: In-Browser Computer Vision — YOLOv8n

### What It Does
Detects potholes and road damage in uploaded photos using a 15MB ONNX model running entirely in the browser. No server, no API, works offline.

### How It Works

```typescript
// components/PotholeDetector.tsx

import { pipeline } from '@huggingface/transformers'

// Loads Xenova/yolov8n (15MB ONNX) from browser cache on first use
const detector = await pipeline('object-detection', 'Xenova/yolov8n')

// Run inference on uploaded image
const detections = await detector(imageElement, { threshold: 0.3 })

// detections = [
//   { label: 'pothole', score: 0.87, box: { xmin, ymin, xmax, ymax } },
//   ...
// ]
```

### Confidence Display
```
< 50%: "Low confidence — road damage may be present"
50-75%: "Possible road damage detected (X% confidence)"
75-90%: "Road damage detected (X% confidence)" [yellow badge]
> 90%: "Pothole confirmed (X% confidence)" [green badge]
```

---

## AI Layer 5: RAG Knowledge Base — ChromaDB

### What's Indexed

| Document | Source | Why It's Needed |
|---|---|---|
| Motor Vehicles Act 1988 | indiacode.nic.in | All base traffic laws |
| MV Amendment Act 2019 | morth.nic.in | Updated fine amounts |
| WHO Trauma Care Guidelines | who.int | First-aid protocols |
| WHO Global Road Safety 2023 | who.int | 100+ country traffic laws |
| State amendment PDFs | State transport dept | State-level variations |

### Building the Index

```python
# data/build_vectorstore.py — run once, takes 5-10 minutes

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Load all PDFs
loaders = [PyPDFLoader(f) for f in pdf_paths]
docs = [doc for loader in loaders for doc in loader.load()]

# Split into chunks (1000 chars, 150 overlap)
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, overlap=150)
chunks = splitter.split_documents(docs)

# Generate embeddings (runs locally on CPU, no API cost)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Store in ChromaDB (persists to disk)
vectorstore = Chroma.from_documents(
    chunks,
    embeddings,
    persist_directory="data/chroma_db",
    collection_name="safevisionai_docs"
)
```

### ⚠ ChromaDB Persistence Rules
- `chatbot_service/data/chroma_db/` — **COMMITTED** to git (Render needs it at cold start)
- `backend/data/chroma_db/` — **gitignored** (build locally with `build_vectorstore.py`)
- Never delete either directory — rebuilding takes 5-10 minutes

---

## Adding New Knowledge to the RAG

```bash
# 1. Add new PDF to chatbot_service/data/ or backend/data/
# 2. Run build_vectorstore.py again (incremental update)
python data/build_vectorstore.py

# 3. Restart the service to reload ChromaDB from disk
# The service loads chroma_db on startup via lifespan
```

---

## Chatbot Testing Checklist

| Test | Expected Response Contains |
|---|---|
| "nearest hospital" | Hospital name + phone + "Call 112" |
| "drunk driving fine" | "Section 185" + "Rs 10,000" |
| "helmet fine in Bangalore" | "Section 194C" + "Rs 1,000" + "Karnataka" |
| "someone is bleeding badly" | "Call 112 immediately" (first line) |
| "speed limit on highways" | Specific km/h value + MVA section |
| Send in Hindi | Response in Hindi (routed to Sarvam AI) |
| Send in Tamil | Response in Tamil (routed to Sarvam AI) |
| "hello" | Friendly greeting without legal content |

---

*Document version: 2.0 | IIT Madras Road Safety Hackathon 2026*
