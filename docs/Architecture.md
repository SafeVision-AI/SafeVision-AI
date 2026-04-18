# SafeVisionAI — Architecture

## System Architecture Overview

```mermaid
graph TD
    A[User Device - Browser] --> B[Next.js 15 PWA on Vercel CDN]

    B --> C[Emergency Locator]
    B --> D[AI Chat - Online]
    B --> E[Challan Calculator]
    B --> F[Road Reporter]

    B --> G[Browser Offline Layer]
    G --> G1[WebLLM Phi-3 Mini]
    G --> G2[DuckDB-Wasm]
    G --> G3[HNSWlib.js]
    G --> G4[GeoJSON + Turf.js]
    G --> G5[IndexedDB + Service Worker]

    B -->|HTTPS| H[FastAPI Backend :8000 on Render.com]
    B -->|HTTPS| CS[FastAPI Chatbot Service :8010 on Render.com]

    H --> H1[Emergency API - PostGIS + Overpass]
    H --> H3[Challan Service - DuckDB SQL]
    H --> H4[RoadWatch Service - Authority Matrix]
    H -->|proxy| CS

    CS --> CS1[ChatEngine - Agentic RAG]
    CS --> CS2[11-Provider LLM Fallback Chain]
    CS --> CS3[9 Agent Tools]
    CS --> CS4[Sarvam AI - Indian Language Routing]
    CS --> CS5[ChromaDB RAG Vectorstore]

    H --> I[Core Services]
    I --> I1[Redis Cache - Upstash]
    I --> I2[PostGIS Queries]
    I --> I4[Nominatim Geocoding]

    H --> J[External Free Services]
    J --> J1[Supabase PostgreSQL + PostGIS]
    J --> J2[Upstash Redis]
    J --> J4[OSM Overpass API]
    J --> J5[HuggingFace Hub - WebLLM CDN]
```

---

## Three-Service Architecture

SafeVisionAI runs as **three independent services**:

| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| **Backend** | 8000 | FastAPI + PostGIS + Redis | Emergency locator, challan calc, road reporting, geocoding |
| **Chatbot Service** | 8010 | FastAPI + ChromaDB + 11 LLMs | Agentic RAG chatbot, Indian language AI, speech |
| **Frontend** | 3000 | Next.js 15 + React 19 PWA | UI, maps (MapLibre GL), offline AI (WebLLM, DuckDB-Wasm) |

> **Critical:** Backend and Chatbot Service have **separate** `.venv`, `.env`, `requirements.txt`, and `Dockerfile`. Never mix their dependencies.

---

## Dual-Layer AI Architecture

Online RAG with multi-provider fallback when connected, full offline AI using WebLLM when not.

```mermaid
flowchart TD
    A[User sends message] --> B{Is network available?}

    B -->|YES| CS[Chatbot Service :8010]
    B -->|NO| D[WebLLM Phi-3 Mini - Runs on device]

    CS --> CS1[IntentDetector - classify query]
    CS --> CS2[ContextAssembler - call 9 agent tools]
    CS --> CS3[ChromaDB RAG - top 5 law/medical chunks]
    CS --> CS4[ProviderRouter - 11 LLM fallback chain]
    CS4 --> CS5{Indian language?}
    CS5 -->|YES| CS6[Sarvam AI 30B/105B]
    CS5 -->|NO| CS7[Groq → Cerebras → Gemini → ...]

    D --> D1[HNSWlib.js vector search on IndexedDB]
    D --> D2[Turf.js GeoJSON for nearby POI]
    D --> D3[First-aid.json local data]

    CS6 --> E[Response to user]
    CS7 --> E
    D1 --> E
    D2 --> E
    D3 --> E
```

| Aspect | Online — Layer 1 | Offline — Layer 2 |
|---|---|---|
| LLM | 11-provider chain (Groq primary) | WebLLM Phi-3-mini-4k (4-bit) |
| Indian Languages | Sarvam AI (30B/105B) | English only |
| Runs on | Cloud (Groq/Gemini/etc.) | User's browser (WebGPU) |
| RAG | ChromaDB on chatbot service | HNSWlib.js in browser |
| POI Search | PostGIS ST_DWithin | Turf.js haversine on GeoJSON |
| Challan | DuckDB SQL on backend | DuckDB-Wasm in browser |
| Cost | ₹0 (all free tiers) | ₹0 (local device compute) |

---

## 11-Provider LLM Fallback Chain

```mermaid
flowchart LR
    A[User Message] --> B{Language?}
    B -->|Indian| S[Sarvam AI]
    S --> S1[sarvam-30b General]
    S --> S2[sarvam-105b Legal]
    B -->|English| C[Groq 300+ tok/s]
    C -->|fail| D[Cerebras 2000+ tok/s]
    D -->|fail| E[Gemini 1M context]
    E -->|fail| F[GitHub Models]
    F -->|fail| G[NVIDIA NIM]
    G -->|fail| H[OpenRouter]
    H -->|fail| I[Mistral]
    I -->|fail| J[Together]
    J -->|fail| K[Template - always works]
```

Language detection is regex-based (Unicode script ranges for Devanagari, Tamil, Telugu, Kannada, Bengali, etc.) — no NLTK dependency needed.

---

## 5-Layer Offline Architecture

```mermaid
graph LR
    L1[Layer 1 - App Shell] --> L1D["All UI, JS, CSS, fonts — Service Worker precache"]
    L2[Layer 2 - Emergency POI] --> L2D["india-emergency.geojson — 25 cities + Turf.js"]
    L3[Layer 3 - Challan Calc] --> L3D["DuckDB-Wasm + violations.csv + state_overrides.csv"]
    L4[Layer 4 - AI Chatbot] --> L4D["WebLLM Phi-3 Mini ~2.2GB + HNSWlib.js + first-aid.json"]
    L5[Layer 5 - Road Reports] --> L5D["IndexedDB + Background Sync API — offline queue"]
```

---

## Data Flow: Emergency Locator

```mermaid
sequenceDiagram
    participant U as User Browser
    participant F as Backend :8000
    participant R as Redis Cache
    participant P as PostGIS DB
    participant O as OSM Overpass

    U->>F: GET /api/v1/emergency/nearby?lat=X&lon=Y
    F->>R: Check cache key nearby:lat:lon
    R-->>F: HIT — return cached result
    F-->>U: Return cached hospitals/police

    Note over F,R: On cache MISS:
    F->>P: ST_DWithin query (GIST index, radius 5km)
    P-->>F: Nearby emergency services
    F->>F: If count < 3, expand radius up to 50km
    F->>O: Fallback to Overpass API if still < 3
    O-->>F: Additional POI from OSM
    F->>R: Cache result for 1 hour
    F-->>U: EmergencyResponse with sorted results
    U->>U: Render MapLibre GL markers by category
```

---

## Data Flow: AI Chatbot (Agentic RAG)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend :3000
    participant CS as Chatbot Service :8010
    participant PR as ProviderRouter
    participant C as ChromaDB
    participant R as Redis
    participant BE as Backend :8000

    U->>FE: Types or speaks a message
    FE->>CS: POST /api/v1/chat/
    CS->>CS: SafetyChecker.evaluate()
    CS->>CS: IntentDetector.detect() — classify intent
    CS->>CS: ContextAssembler.assemble()

    alt Emergency intent
        CS->>BE: Call /api/v1/emergency/nearby
        BE-->>CS: Nearby services
    end
    alt Legal intent
        CS->>C: ChromaDB vector search — top 5 chunks
        C-->>CS: Relevant law text
    end

    CS->>R: Load conversation history
    R-->>CS: Previous messages
    CS->>PR: ProviderRouter.generate() with context
    PR->>PR: Auto-detect language → route to provider
    PR-->>CS: LLM response
    CS->>R: Store updated history
    CS-->>FE: ChatResponse (text + intent + sources)
    FE-->>U: Display formatted response
```

---

## Monorepo Folder Structure

```
SafeVisionAI/
├── backend/              FastAPI Python 3.11 — port 8000
├── chatbot_service/      FastAPI Agentic RAG Chatbot — port 8010
├── frontend/             Next.js 15 + React 19 TypeScript PWA — port 3000
├── docs/                 Technical documentation (17 files)
├── chatbot_docs/         Chatbot-specific documentation (14 files)
├── notebooks/            5 Colab notebooks (YOLO, ChromaDB, Accidents, Roads, Risk)
├── scripts/              Root-level data pipeline scripts
├── docker-compose.yml    4 services: postgres, redis, backend, chatbot, frontend
├── AGENTS.md             AI agent quick-reference
├── SETUP.md              Full installation guide
├── README.md             Project overview
└── .github/workflows/    GitHub Actions CI/CD
```

---

*Document version: 2.0 | IIT Madras Road Safety Hackathon 2026*
