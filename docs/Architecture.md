# SafeVisionAI - Architecture

## System Architecture Overview

```mermaid
graph TD
    A[User Device - Browser] --> B[Next.js 14 PWA on Vercel CDN]

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

    B -->|HTTPS| H[FastAPI Backend on Render.com]

    H --> H1[Emergency API - PostGIS + Overpass]
    H --> H2[Chat Router - LangChain + Groq]
    H --> H3[Challan Service - DuckDB SQL]
    H --> H4[RoadWatch Service - Authority Matrix]

    H --> I[Core Services]
    I --> I1[Redis Cache - Upstash]
    I --> I2[PostGIS Queries]
    I --> I3[ChromaDB RAG]
    I --> I4[Nominatim Geocoding]

    H --> J[External Free Services]
    J --> J1[Supabase PostgreSQL + PostGIS]
    J --> J2[Upstash Redis]
    J --> J3[Groq API - llama3-70b]
    J --> J4[OSM Overpass API]
    J --> J5[HuggingFace Hub - WebLLM CDN]
```

---

## Dual-Layer AI Architecture

The most technically significant decision in SafeVisionAI. Online RAG with Groq when connected, full offline AI using WebLLM when not.

```mermaid
flowchart TD
    A[User sends message] --> B{Is network available?}

    B -->|YES| C[FastAPI Backend]
    B -->|NO| D[WebLLM Phi-3 Mini - Runs on device]

    C --> C1[Groq llama3-70b-8192]
    C --> C2[ChromaDB RAG - top 5 law/medical chunks]
    C --> C3[PostGIS POI search]

    D --> D1[HNSWlib.js vector search on IndexedDB]
    D --> D2[Turf.js GeoJSON for nearby POI]
    D --> D3[First-aid.json local data]

    C1 --> E[Response to user]
    C2 --> E
    C3 --> E
    D1 --> E
    D2 --> E
    D3 --> E
```

| Aspect | Online - Layer 1 | Offline - Layer 2 |
|---|---|---|
| LLM | Groq llama3-70b-8192 | WebLLM Phi-3-mini-4k (4-bit) |
| Parameters | 70 billion | 3.8 billion |
| Runs on | Groq cloud (free API) | User's browser (WebGPU) |
| Context | 8,192 tokens | 4,096 tokens |
| First token | 1-2 seconds | 3-5s (GPU) / 8-15s (CPU) |
| RAG | ChromaDB on server | HNSWlib.js in browser |
| POI Search | PostGIS ST_DWithin | Turf.js haversine on GeoJSON |
| Challan | DuckDB SQL on server | DuckDB-Wasm in browser |
| Cost | Rs. 0 (Groq free tier) | Rs. 0 (local device compute) |

---

## 5-Layer Offline Architecture

```mermaid
graph LR
    L1[Layer 1 - App Shell] --> L1D["All UI, JS, CSS, fonts - Workbox precache at install"]
    L2[Layer 2 - Emergency POI] --> L2D["india-emergency.geojson - 25 cities + Turf.js"]
    L3[Layer 3 - Challan Calc] --> L3D["DuckDB-Wasm + violations.csv + state_overrides.csv"]
    L4[Layer 4 - AI Chatbot] --> L4D["WebLLM Phi-3 Mini ~2.2GB + HNSWlib.js + first-aid.json"]
    L5[Layer 5 - Road Reports] --> L5D["IndexedDB + Background Sync API - offline queue"]
```

---

## Data Flow: Emergency Locator

```mermaid
sequenceDiagram
    participant U as User Browser
    participant F as FastAPI
    participant R as Redis Cache
    participant P as PostGIS DB
    participant O as OSM Overpass

    U->>F: GET /api/v1/emergency/nearby?lat=X&lon=Y
    F->>R: Check cache key nearby:lat:lon
    R-->>F: HIT - return cached result
    F-->>U: Return cached hospitals/police

    Note over F,R: On cache MISS:
    F->>P: ST_DWithin query (GIST index, radius 5km)
    P-->>F: Nearby emergency services
    F->>F: If count < 3, expand radius up to 50km
    F->>O: Fallback to Overpass API if still < 3
    O-->>F: Additional POI from OSM
    F->>R: Cache result for 1 hour
    F-->>U: EmergencyResponse with sorted results
    U->>U: Render Leaflet map markers by category
```

---

## Data Flow: AI Chatbot

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as FastAPI Chat
    participant G as Groq llama3-70b
    participant C as ChromaDB
    participant R as Redis

    U->>FE: Types or speaks a message
    FE->>API: POST /api/v1/chat/message
    API->>G: detect_intent(message) - returns one of 9 labels
    G-->>API: Intent label e.g. FIND_HOSPITAL

    alt FIND_* intent
        API->>API: Call /emergency/nearby internally
        API->>API: Format services list as context
    end

    API->>C: MMR search - top 5 diverse law/medical chunks
    C-->>API: Relevant PDF text chunks
    API->>R: Load chat history for session
    R-->>API: Previous messages
    API->>G: Prompt = system + context + history + user message
    G-->>API: Grounded response with law section references
    API->>R: Store updated chat history
    API-->>FE: Answer + intent + source sections
    FE-->>U: Display formatted response
```

---

## RAG Pipeline Architecture

```mermaid
flowchart TD
    subgraph BUILD ["Phase 1 - Index Build (once, ~10 minutes)"]
        P1[PDF Documents] --> P2[PyPDFLoader]
        P2 --> P3[LangChain Documents with metadata]
        P3 --> P4["RecursiveCharacterTextSplitter - chunk 1000, overlap 150"]
        P4 --> P5["sentence-transformers/all-MiniLM-L6-v2 - 384-dim embeddings"]
        P5 --> P6[ChromaDB Storage - data/chroma_db/]
    end

    subgraph QUERY ["Phase 2 - Query Handling (every message)"]
        Q1[User message] --> Q2[all-MiniLM embedding - 384-dim vector]
        Q2 --> Q3["ChromaDB MMR search - balance relevance + diversity"]
        Q3 --> Q4[Top 5 law/medical chunks]
        Q4 --> Q5["Inject into Groq prompt as context"]
        Q5 --> Q6[Groq llama3-70b grounded response]
    end
```

---

## PWA Caching Strategy

| Resource Type | Strategy | Cache Name | TTL |
|---|---|---|---|
| App shell (HTML/JS/CSS) | Precache | app-shell | versioned |
| /api/v1/emergency/* | NetworkFirst | emergency-api | 3600s |
| *.geojson files | CacheFirst | geojson-data | permanent |
| *.onnx / *.bin / *.wasm | CacheFirst | model-weights | permanent |
| OSM tile URLs | StaleWhileRevalidate | osm-tiles | 500 entries max |
| /api/v1/challan/* | NetworkFirst | challan-api | 86400s |
| Road issue photos | Background Sync | IndexedDB queue | - |
| /offline-data/*.json | CacheFirst | offline-content | permanent |

---

## Monorepo Folder Structure

```
SafeVisionAI/
  backend/           FastAPI Python 3.11 application
  frontend/          Next.js 14 TypeScript PWA
  docs/              Technical documentation
  .github/
    workflows/
      ci.yml         GitHub Actions CI/CD
  render.yaml        Render.com deployment config
  .gitignore
  README.md
  SETUP.md
```

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
