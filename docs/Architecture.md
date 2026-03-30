# SafeVisionAI â€” Architecture

## System Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        USER DEVICE                               â”‚
â”‚                                                                   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚              Next.js 14 PWA (Vercel CDN)                  â”‚   â”‚
â”‚  â”‚                                                           â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚   â”‚
â”‚  â”‚  â”‚Emergencyâ”‚  â”‚AI Chat  â”‚  â”‚Challan   â”‚  â”‚Road      â”‚  â”‚   â”‚
â”‚  â”‚  â”‚Locator  â”‚  â”‚(Online) â”‚  â”‚Calc      â”‚  â”‚Reporter  â”‚  â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â”‚   â”‚
â”‚  â”‚       â”‚            â”‚            â”‚               â”‚         â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”‚   â”‚
â”‚  â”‚  â”‚              Browser Offline Layer                    â”‚ â”‚   â”‚
â”‚  â”‚  â”‚  WebLLM (Phi-3)  â”‚  DuckDB-Wasm  â”‚  HNSWlib.js      â”‚ â”‚   â”‚
â”‚  â”‚  â”‚  GeoJSON Turf.js â”‚  IndexedDB    â”‚  Service Worker   â”‚ â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚ HTTPS
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    FastAPI Backend (Render.com)                   â”‚
â”‚                                                                   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Emergency    â”‚  â”‚ Chat Router   â”‚  â”‚ Challan Service      â”‚  â”‚
â”‚  â”‚ API          â”‚  â”‚ (LangChain    â”‚  â”‚ (DuckDB SQL)         â”‚  â”‚
â”‚  â”‚ (PostGIS +   â”‚  â”‚  + Groq)      â”‚  â”‚                      â”‚  â”‚
â”‚  â”‚  Overpass)   â”‚  â”‚               â”‚  â”‚ RoadWatch Service    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚ (Overpass +         â”‚  â”‚
â”‚         â”‚                  â”‚          â”‚  Authority Matrix)   â”‚  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚  â”‚         Core Services           â”‚                              â”‚
â”‚  â”‚  Redis Cache â”‚ PostGIS Queries  â”‚                              â”‚
â”‚  â”‚  Nominatim   â”‚ ChromaDB RAG     â”‚                              â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    External Services (All Free)                   â”‚
â”‚                                                                   â”‚
â”‚  Supabase DB    Upstash Redis    Groq API    OSM Overpass        â”‚
â”‚  (PostgreSQL    (10K cmds/day)   (70B LLM    (POI data)         â”‚
â”‚  + PostGIS)     API caching)     free tier)                      â”‚
â”‚                                                                   â”‚
â”‚  Nominatim      HuggingFace Hub  data.gov.in  PMGSY OMMAS       â”‚
â”‚  (Geocoding)    (WebLLM CDN)     (NHAI data)  (road infra)      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Dual-Layer AI Architecture

The most technically significant decision in SafeVisionAI. No other road safety app globally has implemented this approach.

```
User sends message
        â”‚
        â–¼
  Is network available?
        â”‚
  â”Œâ”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”
  YES           NO
  â”‚              â”‚
  â–¼              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ FastAPI  â”‚  â”‚ WebLLM (Phi-3 Mini 3.8B)     â”‚
â”‚ Groq     â”‚  â”‚ Running on USER'S DEVICE      â”‚
â”‚ llama3-  â”‚  â”‚                              â”‚
â”‚ 70b-8192 â”‚  â”‚ + HNSWlib.js vector search   â”‚
â”‚          â”‚  â”‚   on IndexedDB first-aid data â”‚
â”‚ ChromaDB â”‚  â”‚                              â”‚
â”‚ RAG      â”‚  â”‚ + Turf.js GeoJSON for POI    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚                    â”‚
       â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â–¼
       Same chat interface
       same intent detection
       same user experience
```

| Aspect | Online (Layer 1) | Offline (Layer 2) |
|---|---|---|
| LLM | Groq llama3-70b-8192 | WebLLM Phi-3-mini-4k (4-bit) |
| Parameters | 70 billion | 3.8 billion |
| Runs on | Groq cloud (free API) | User's browser (WebGPU) |
| Context | 8,192 tokens | 4,096 tokens |
| First token | 1-2 seconds | 3-5s (GPU) / 8-15s (CPU) |
| RAG | ChromaDB on server | HNSWlib.js in browser |
| POI Search | PostGIS ST_DWithin | Turf.js haversine on GeoJSON |
| Challan | DuckDB SQL on server | DuckDB-Wasm in browser |
| Cost | â‚¹0 (Groq free tier) | â‚¹0 (local device compute) |

---

## 5-Layer Offline Architecture

```
Layer 1: App Shell
  All UI, JS, CSS, fonts â€” Workbox precache at install
  â†“ Available from FIRST visit, zero config

Layer 2: Emergency POI Data
  india-emergency.geojson (25 cities) + Turf.js
  â†“ Available from first visit, no extra download

Layer 3: Challan Calculator
  DuckDB-Wasm + violations.csv + state_overrides.csv
  â†“ Available from first visit, files cached by Service Worker

Layer 4: AI Chatbot
  WebLLM Phi-3 Mini (~2.2GB) + HNSWlib.js + first-aid.json
  â†“ Available after one-time download (user-initiated)

Layer 5: Road Reports (Offline Queue)
  IndexedDB + Background Sync API
  â†“ Always â€” queues offline, auto-submits when online
```

---

## Data Flow: Emergency Locator (Online)

```
1. User opens /emergency page
        â”‚
2. navigator.geolocation.getCurrentPosition()
   â†’ lat, lon stored in Zustand
        â”‚
3. /api/v1/geocode/reverse
   â†’ city "Chennai", state "Tamil Nadu"
        â”‚
4. /api/v1/emergency/nearby?lat=X&lon=Y
        â”‚
   â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ FastAPI emergency.py             â”‚
   â”‚                                  â”‚
   â”‚ 1. Check Redis cache             â”‚
   â”‚    key: nearby:13.0827:80.2707.. â”‚
   â”‚    HIT â†’ return cached result    â”‚
   â”‚    MISS â†’ continue               â”‚
   â”‚                                  â”‚
   â”‚ 2. PostGIS ST_DWithin query      â”‚
   â”‚    GIST index â†’ < 50ms           â”‚
   â”‚                                  â”‚
   â”‚ 3. If count < 3 â†’ expand radius  â”‚
   â”‚    500mâ†’1kmâ†’5kmâ†’10kmâ†’25kmâ†’50km  â”‚
   â”‚                                  â”‚
   â”‚ 4. If still < 3 â†’ Overpass API   â”‚
   â”‚    fallback â†’ merge + dedup      â”‚
   â”‚                                  â”‚
   â”‚ 5. Cache result in Redis 1hr     â”‚
   â”‚    Return EmergencyResponse      â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚
5. Frontend renders Leaflet markers
   color-coded by category
```

---

## Data Flow: AI Chatbot (Online)

```
User types/speaks message
        â”‚
Web Speech API â†’ text input (if voice)
        â”‚
POST /api/v1/chat/message
        â”‚
   â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ FastAPI chat.py                 â”‚
   â”‚                                 â”‚
   â”‚ 1. detect_intent(message)       â”‚
   â”‚    â†’ Prompt Groq to return JSON â”‚
   â”‚    â†’ one of 9 intent labels     â”‚
   â”‚                                 â”‚
   â”‚ 2. If FIND_* intent:            â”‚
   â”‚    â†’ call /emergency/nearby     â”‚
   â”‚    â†’ format services as context â”‚
   â”‚                                 â”‚
   â”‚ 3. ChromaDB MMR search          â”‚
   â”‚    â†’ top-5 diverse law/med chunksâ”‚
   â”‚                                 â”‚
   â”‚ 4. Build prompt:                â”‚
   â”‚    system + retrieved context   â”‚
   â”‚    + chat_history + user messageâ”‚
   â”‚                                 â”‚
   â”‚ 5. Groq llama3-70b generates    â”‚
   â”‚    grounded response            â”‚
   â”‚                                 â”‚
   â”‚ 6. Store in Redis chat history  â”‚
   â”‚ 7. Return answer + intent + src â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## RAG Pipeline Architecture

```
PHASE 1: INDEX BUILD (once, ~10 minutes)

PDF Documents â†’ PyPDFLoader â†’ LangChain Documents
                                    â”‚
                              Add metadata
                          (source, type, page)
                                    â”‚
                     RecursiveCharacterTextSplitter
                     (chunk_size=1000, overlap=150)
                                    â”‚
                    sentence-transformers/all-MiniLM-L6-v2
                    â†’ 384-dimensional embeddings
                                    â”‚
                            ChromaDB Storage
                         data/chroma_db/ (persistent)


PHASE 2: QUERY HANDLING (every chat message)

User message â†’ all-MiniLM embedding â†’ 384-dim vector
                                            â”‚
                              ChromaDB MMR search
                              (balance relevance + diversity)
                                            â”‚
                              Top 5 relevant law/medical chunks
                                            â”‚
                    Injected into Groq prompt as context:
                    "Using ONLY these sections, answer: [chunks]
                     Question: [user message]"
                                            â”‚
                         Groq llama3-70b generates
                         grounded response with section numbers
```

---

## PWA Service Worker Caching Strategy

```
Resource Type          Strategy           Cache Name        TTL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
App shell (HTML/JS/CSS) Precache          app-shell         âˆž (versioned)
/api/v1/emergency/*    NetworkFirst       emergency-api     3600s
*.geojson files        CacheFirst         geojson-data      âˆž
*.onnx/*.bin/*.wasm    CacheFirst         model-weights     âˆž
OSM tile URLs          StaleWhileReval.   osm-tiles         500 entries max
/api/v1/challan/*      NetworkFirst       challan-api       86400s
Road issue photos      Background Sync    (IndexedDB queue) â€”
/offline-data/*.json   CacheFirst         offline-content   âˆž
```

---

## Monorepo Folder Structure

```
SafeVisionAI/
â”œâ”€â”€ backend/           FastAPI Python 3.11 application
â”œâ”€â”€ frontend/          Next.js 14 TypeScript PWA
â”œâ”€â”€ docs/              Technical documentation (this folder)
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ workflows/
â”‚       â””â”€â”€ ci.yml    GitHub Actions CI/CD
â”œâ”€â”€ render.yaml        Render.com deployment config
â”œâ”€â”€ .gitignore
â””â”€â”€ README.md
```

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
