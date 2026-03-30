# SafeVisionAI  AI Instructions

## Overview of AI Components

SafeVisionAI uses AI at **five distinct layers**  each with a specific purpose and technical implementation. This document explains how each AI component works, why it was chosen, and how to implement or extend it.

---

## AI Layer 1: Online LLM  Groq llama3-70b (Server-Side RAG)

### What It Does
Answers user questions about traffic laws, first aid, and emergency services using retrieval-augmented generation. Every answer is grounded in actual documents  not model training data.

### Why Groq + llama3-70b?
- **Free tier**: 6,000 tokens/minute  sufficient for hackathon
- **Speed**: 1-2 second first token  fastest available free LLM
- **Quality**: 70B parameters  better reasoning than smaller models
- **Multilingual**: Native support for 10+ Indian languages

### System Prompt (Do Not Change Without Testing)

```python
SYSTEM_PROMPT = """You are SafeVisionAI AI  an emergency road safety assistant for India.
Your capabilities:
- Find nearest hospitals, police stations, ambulances (using provided location data)
- Explain Indian traffic laws with exact Motor Vehicles Act section numbers
- Provide first-aid guidance grounded in WHO Trauma Care Guidelines
- Calculate traffic fines using provided violation data
- Guide users through road issue reporting

Rules you MUST follow:
1. If ANY injury is mentioned, start with "Call 112 immediately."
2. Always cite the MVA section number when mentioning a fine (e.g., "Section 185, Rs 10,000")
3. Answer ONLY from the provided context  never from training memory for legal/medical facts
4. If context doesn't cover the question, say "I don't have specific data on this  please call 112"
5. Respond in the SAME LANGUAGE the user wrote in (do not switch to English)
6. For location queries, use the GPS data provided  never ask the user for their location
"""
```

### How RAG Works Step by Step

```
1. User asks: "what is the fine for drunk driving in Tamil Nadu?"

2. detect_intent(message)  "CHALLAN_QUERY"
    Groq classifies into one of 9 labels (JSON response)

3. ChromaDB MMR search with user's question as query
    Returns 5 most relevant, diverse chunks from indexed PDFs
    Example chunk: "Section 185  Whoever drives or attempts to drive a motor vehicle
      while under the influence of alcohol... shall be punishable with imprisonment
      for a term which may extend to six months and with fine which may extend to ten
      thousand rupees..."

4. If CHALLAN_QUERY  also query DuckDB:
   SELECT * FROM violations WHERE violation_code='MVA_185'
   LEFT JOIN state_overrides WHERE state_code='TN'
    Returns: base_fine=10000, state_override=null, imprisonment='6 months'

5. Build final prompt:
   [SYSTEM_PROMPT]
   
   Context from Motor Vehicles Act:
   [chunk 1]
   [chunk 2]
   [chunk 3]
   [chunk 4]
   [chunk 5]
   
   DuckDB result:
   Section 185, First offence: Rs 10,000, Repeat: Rs 15,000, Imprisonment: 6 months
   No Tamil Nadu state override found  national amount applies.
   
   Chat history: [last 6 turns]
   
   User: "what is the fine for drunk driving in Tamil Nadu?"

6. Groq generates:
   "Under Section 185 of the Motor Vehicles Amendment Act 2019, drunk driving carries
   a fine of Rs 10,000 for a first offence with up to 6 months imprisonment. 
   Tamil Nadu has not set a state-specific override, so the national amount applies.
   For a repeat offence within 3 years, the fine rises to Rs 15,000 with 2 years imprisonment."
```

---

## AI Layer 2: Offline LLM  WebLLM Phi-3 Mini (Browser-Side)

### What It Does
Runs a complete large language model on the user's device via WebGPU. Answers questions about first aid and traffic laws when there is no internet connection.

### Why Phi-3 Mini?
- **Best reasoning per parameter**: 3.8B params but outperforms models twice its size on legal/factual Q&A
- **4-bit quantized**: ~2.2GB fits in browser Cache Storage
- **Microsoft**: Trained on high-quality synthetic textbook data  good for dense legal reasoning
- **WebGPU acceleration**: 3-5s response on modern Android Chrome

### Model Selection Logic

```typescript
// lib/edge-ai.ts

async function selectModel(): Promise<string> {
  // Check if WebGPU is available
  const hasGPU = 'gpu' in navigator && await navigator.gpu?.requestAdapter()
  
  if (hasGPU) {
    // Phi-3 Mini  best quality, requires WebGPU
    return "Phi-3-mini-4k-instruct-q4f16_1-MLC"
  } else {
    // Gemma-2B  lighter, runs on WebAssembly CPU
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
   - Embed user query  384-dim vector
   - HNSWlib.js ANN search  top-3 most similar first-aid articles
   - Inject article text as context into Phi-3 Mini prompt
   - Phi-3 Mini generates response (~3-15 seconds)
```

### Key Offline Limitation
The offline LLM **cannot** search for hospitals in real-time  it only has access to the 20 pre-bundled first-aid articles and the static GeoJSON POI bundle. Make this clear to users via the `ConnectivityBadge` component.

---

## AI Layer 3: Intent Detection

### 9-Intent Classification System

```python
INTENT_PROMPT = """Classify this road safety message into exactly one of these intents.
Return ONLY a JSON object with key "intent".

Intents:
- FIND_HOSPITAL: looking for hospitals, trauma centres, medical help
- FIND_POLICE: looking for police station, file FIR
- FIND_AMBULANCE: looking for ambulance, 102, medical transport
- FIND_TOW: towing, car breakdown, vehicle recovery, puncture
- FIRST_AID_INFO: bleeding, unconscious, fracture, burn, first aid, CPR
- CHALLAN_QUERY: traffic fine, challan, penalty, drunk driving cost, MVA
- ROAD_REPORT: pothole, broken road, reporting, who to complain
- LEGAL_INFO: speed limit, traffic rules, Motor Vehicles Act, can I, allowed to
- OTHER: greetings, general, out of scope

Message: "{message}"

Return: {"intent": "INTENT_LABEL"}"""
```

### Why Intent-First?
Without intent detection, every message would trigger a full RAG search. With intent:
- `FIND_*` intents skip RAG and hit PostGIS directly (faster + more accurate)
- `FIRST_AID_INFO` searches WHO medical chunks only (not MV Act)
- `LEGAL_INFO` searches MV Act chunks only (not medical docs)
- `CHALLAN_QUERY` skips LLM entirely for base queries (deterministic DuckDB)

---

## AI Layer 4: In-Browser Computer Vision  YOLOv8n

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

### Important Note on Accuracy
YOLOv8n is trained on the **COCO dataset**  not specifically Indian road potholes. It will detect general objects (cars, people, holes) but may miss some road-specific damage patterns.

For production: fine-tune on Indian pothole dataset from Kaggle. For hackathon: the live demo of computer vision in the browser is the impressive part  the capability demonstration matters more than perfect accuracy.

### Confidence Display
```
< 50%: "Low confidence  road damage may be present"
50-75%: "Possible road damage detected (X% confidence)"
75-90%: "Road damage detected (X% confidence)" [yellow badge]
> 90%: "Pothole confirmed (X% confidence)" [green badge]
```

---

## AI Layer 5: RAG Knowledge Base  ChromaDB

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
# data/build_vectorstore.py  run once, takes 5-10 minutes

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Load all PDFs
loaders = [PyPDFLoader(f) for f in pdf_paths]
docs = [doc for loader in loaders for doc in loader.load()]

# Add metadata
for doc in docs:
    doc.metadata['doc_type'] = 'legal' if 'motor' in doc.metadata['source'] else 'medical'

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

###  Never delete `data/chroma_db/`
This directory contains the vectorized knowledge base. Rebuilding it takes 5-10 minutes. Add it to `.gitignore` (it's too large for git) but never delete it locally.

---

## Adding New Knowledge to the RAG

```bash
# 1. Add new PDF to backend/data/
# 2. Run build_vectorstore.py again (incremental update)
python data/build_vectorstore.py

# 3. Restart FastAPI server to reload ChromaDB from disk
# The server loads chroma_db on startup via lifespan
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
| Send in Hindi | Response in Hindi |
| "hello" | Friendly greeting without legal content |

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
