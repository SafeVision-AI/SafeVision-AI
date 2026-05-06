# SafeVixAI — Tech Stack

## Overview

SafeVixAI uses a **three-service architecture** with in-browser AI inference as an offline fallback — the only road safety app globally with client-side LLM, SQL, and vector search running entirely in the user's browser.

```
Layer            Technology                          Cost

Frontend         Next.js 15 + React 19 + Tailwind    Free (Vercel)
Backend          FastAPI + Python 3.11 + Uvicorn     Free (Render.com)
Chatbot Service  FastAPI + 11 LLM providers + RAG    Free (Render.com)
Online LLM       Groq / Gemini / Sarvam AI (chain)   Free (multi-provider)
Offline LLM      WebLLM Phi-3 Mini 4-bit (WebGPU)   Free (device compute)
Vector Store     ChromaDB (local persistent)         Free (server disk)
Spatial DB       PostgreSQL 16 + PostGIS 3.4         Free (Supabase)
Cache            Redis via Upstash                   Free (10K cmds/day)
Maps             MapLibre GL (vector tiles)          Free (no API key)
POI Data         Overpass API (OSM)                  Free (fair use)
Geocoding        Nominatim (OSM)                     Free (1 req/sec)
Embeddings       LocalHashEmbeddingFunction          Free (CPU, zero ML dep)
Edge SQL         DuckDB-Wasm (browser)               Free (device compute)
Edge Vector      HNSWlib.js (browser)                Free (device compute)
Edge Vision      Transformers.js + YOLOv8n ONNX      Free (device compute)
CI/CD            GitHub Actions                      Free (2000 min/mo)
Total                                                ₹ 0
```

---

## Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3.1 | App Router, SSR, PWA, automatic code splitting |
| **React** | 19.1.0 | UI component framework |
| **TypeScript** | 5.5.3 | Type safety across entire frontend |
| **Tailwind CSS** | 3.4.10 | Utility-first styling, dark navy theme |
| **MapLibre GL** | 5.22.0 | Vector map rendering — `dynamic({ssr:false})` |
| **@mlc-ai/web-llm** | 0.2.73 | Phi-3 Mini inference in browser via WebGPU/Wasm |
| **@huggingface/transformers** | 4.0.1 | YOLOv8n ONNX pothole detection + embeddings |
| **@duckdb/duckdb-wasm** | 1.29.0 | SQL engine in browser for offline challan calc |
| **hnswlib-wasm** | latest | ANN vector search for offline RAG pipeline |
| **@turf/turf** | 6.5.0 | Haversine distance filter on offline GeoJSON |
| **idb** | 8.0.0 | IndexedDB wrapper for offline storage |
| **zustand** | 4.5.4 | Global state: GPS, services, AI mode, profile |
| **swr** | 2.2.5 | Data fetching with stale-while-revalidate cache |
| **axios** | 1.7.7 | HTTP client for backend API calls |
| **motion** | 12.7.3 | Animations (SOS countdown, loading states) |
| **react-hot-toast** | 2.4.1 | Toast notifications for offline queue, errors |
| **lucide-react** | 0.427.0 | Icon set |
| **shadcn** | 4.2.0 | Accessible UI component primitives |
| **three.js** | 0.169.0 | 3D rendering (landing page visuals) |
| **@react-three/fiber** | 9.1.0 | React renderer for Three.js |

### Offline Frontend Technologies (Browser-Native)
| API | Purpose | Browser Support |
|---|---|---|
| `navigator.geolocation` | GPS location | All modern browsers |
| `DeviceMotion API` | Crash detection (60Hz accelerometer) | Chrome, Safari, Edge |
| `Web Speech API` | Voice input transcription | Chrome, Edge, Samsung |
| `SpeechSynthesis API` | Voice output (read answers aloud) | All modern browsers |
| `Service Worker + Workbox` | Offline caching + background sync | Chrome, Edge, Firefox |
| `Cache Storage API` | Model weights + tile + GeoJSON caching | All modern browsers |
| `IndexedDB` | Offline profile, pending reports, RAG index | All modern browsers |
| `Background Sync API` | Auto-submit offline reports when reconnected | Chrome, Edge |
| `Notification API` | Document expiry push alerts | Chrome, Edge |

---

## Backend Stack (Port 8000)

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115.0 | Async REST API framework |
| **Uvicorn** | 0.30.6 | ASGI server |
| **SQLAlchemy** | 2.0.35 | Async ORM (asyncio extras) |
| **asyncpg** | 0.29.0 | Async PostgreSQL driver |
| **GeoAlchemy2** | 0.15.2 | PostGIS geometry column types |
| **Alembic** | 1.13.2 | Database migrations |
| **psycopg2-binary** | 2.9.9 | Synchronous DB adapter fallback |
| **Redis** | 5.0.8 | Async Redis client |
| **httpx** | 0.27.2 | Async HTTP client |
| **DuckDB** | 0.10.3 | In-process SQL computation |
| **geopandas** | 0.14.4 | Geospatial DataFrame processing |
| **shapely** | 2.0.6 | Geometry operations |
| **geopy** | 2.4.1 | Geocoding API helper |
| **numpy** | 1.26.4 | Numerical compute |
| **pandas** | 2.2.2 | Tabular data compute |
| **Pillow** | 10.4.0 | Image processing validation |
| **Pydantic** | 2.9.2 | Request validation |
| **pydantic-settings** | 2.5.2 | `.env` config loading |
| **python-dotenv** | 1.0.1 | Environment variables |
| **python-multipart** | 0.0.12 | Form data parsing |
| **aiofiles** | 24.1.0 | Async file operations |
| **pypdf** | 4.3.1 | Legacy PDF utility |
| **LangChain** | 0.3.1 | Legacy memory format support |
| **ChromaDB** | 0.5.3 | Legacy API connector |
| **sentence-transformers** | 3.0.1 | Legacy config compatibility (runtime uses hash-based LocalHashEmbeddingFunction) |

---

## Chatbot Service Stack (Port 8010)

A **separate FastAPI service** with its own Python environment & heavy ML dependencies.

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115.0 | Async REST API for AI chatbot |
| **Uvicorn** | 0.30.6 | ASGI Server |
| **torch / torchaudio** | 2.3.1 | PyTorch runtime for speech models |
| **transformers** | 4.44.2 | Hugging Face model loading |
| **datasets** | 3.0.0 | Dataset loaders |
| **ChromaDB** | 0.5.3 | Local vector store for RAG |
| **LocalHashEmbeddingFunction** | custom | Hash-based 384-dim embeddings (SHA-256, zero ML dep) |
| **LangChain** | 0.3.1 | Document loading and tools |
| **langchain-community / openai / google-genai** | Various | LLM Provider Wrappers |
| **groq / openai / mistralai** | Various | Official Provider SDKs |
| **google-generativeai** | 0.8.6 | Google Gemini Flash |
| **Redis** | 5.0.8 | Conversation memory |
| **httpx / requests** | Various | HTTP API Clients |
| **pandas / numpy** | Various | Output processing |
| **pdfplumber / pypdf** | Various | Advanced PDF text extraction |
| **Pydantic / python-dotenv** | Various | Config and data validation |
| **pytest / pytest-asyncio** | Various | Service testing suite |

### 11-Provider LLM Fallback Chain

| Provider | Model | Speed | Use Case |
|----------|-------|-------|----------|
| **Groq** | llama3-70b-8192 | 300+ tok/s | Primary English |
| **Cerebras** | llama-3.3-70b | 2000+ tok/s | Speed overflow |
| **Gemini** | 1.5 Flash | Varies | Large context (1M tokens) |
| **Sarvam AI** | sarvam-30b | Varies | Indian languages (Hindi, Tamil, etc.) |
| **Sarvam AI** | sarvam-105b | Varies | Legal queries in Indian languages |
| **GitHub Models** | Various | Varies | Free with GitHub account |
| **NVIDIA NIM** | Various | Varies | GPU-optimized inference |
| **OpenRouter** | 20+ models | Varies | Gateway to many providers |
| **Mistral** | Various | Varies | 1B tok/month free |
| **Together** | Various | Varies | $25 credit bank |
| **Template** | Deterministic | Instant | Always-works fallback |

---

## AI Models

| Model | Parameters | Size | Runtime | Use Case |
|---|---|---|---|---|
| `Groq llama3-70b-8192` | 70B | Cloud | Groq API | Online chatbot — max intelligence |
| `Phi-3-mini-4k-instruct-q4f16_1-MLC` | 3.8B | ~2.2GB | WebGPU | Offline chatbot — primary |
| `gemma-2b-it-q4f16_1-MLC` | 2B | ~1.4GB | WebAssembly | Offline chatbot — CPU fallback |
| `LocalHashEmbeddingFunction` | N/A | 0 MB | Server CPU | Hash-based 384-dim embeddings for ChromaDB |
| `Xenova/all-MiniLM-L6-v2` | 22M | ~25MB | Browser Wasm | Browser-side embeddings for offline RAG |
| `Xenova/yolov8n` | ~6M | ~15MB | Browser Wasm | In-browser pothole detection from photos |
| `ai4bharat/indic-seamless` | Large | ~7GB | Server GPU/CPU | Indian language speech (ASR/TTS) |

---

## Database

| Store | Technology | Use |
|---|---|---|
| **Primary DB** | Supabase PostgreSQL 16 + PostGIS 3.4 | All tables + spatial queries |
| **Cache** | Upstash Redis | API response caching, chat history, rate limits |
| **Vector Store** | ChromaDB (local persistent) | RAG chunks from MV Act + WHO PDFs |
| **Browser Store** | IndexedDB (via `idb`) | Offline profile, pending reports, HNSWlib index |

---

## Infrastructure

| Service | Provider | Free Tier | Use |
|---|---|---|---|
| Frontend hosting | Vercel | 100GB/month CDN | Next.js 15 PWA |
| Backend hosting | Render.com | 750 hrs/month | FastAPI (port 8000) |
| Chatbot hosting | Render.com | 750 hrs/month | FastAPI (port 8010) |
| Database | Supabase | 500MB PostgreSQL | All tables |
| Cache | Upstash | 10K commands/day | Redis |
| LLM APIs | Groq + 10 more | Free tiers | 11-provider chain |
| Model CDN | Hugging Face | Unlimited public | WebLLM weights |
| Maps | MapLibre GL + OSM | Free (open source) | Vector map tiles |
| Geocoding | Nominatim | 1 req/sec | Address lookup |
| POI data | Overpass API | Fair use | Emergency services |
| CI/CD | GitHub Actions | 2,000 min/month | Tests + deploy |

---

*Document version: 2.0 | IIT Madras Road Safety Hackathon 2026*
