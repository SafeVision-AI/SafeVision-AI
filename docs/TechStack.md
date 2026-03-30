# SafeVisionAI â€” Tech Stack

## Overview

SafeVisionAI uses a **dual-layer AI architecture** â€” the only road safety app globally with in-browser LLM inference as a fallback for offline use.

```
Layer            Technology                          Cost
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Frontend         Next.js 14 + TypeScript + Tailwind  Free (Vercel)
Backend          FastAPI + Python 3.11 + Uvicorn     Free (Render.com)
Online LLM       Groq llama3-70b-8192 (LangChain)   Free (6000 tok/min)
Offline LLM      WebLLM Phi-3 Mini 4-bit (WebGPU)   Free (device compute)
Vector Store     ChromaDB (local persistent)         Free (server disk)
Spatial DB       PostgreSQL 16 + PostGIS 3.4         Free (Supabase)
Cache            Redis via Upstash                   Free (10K cmds/day)
Maps             Leaflet.js + OpenStreetMap          Free (no API key)
POI Data         Overpass API (OSM)                  Free (fair use)
Geocoding        Nominatim (OSM)                     Free (1 req/sec)
Embeddings       sentence-transformers/all-MiniLM    Free (local CPU)
Edge SQL         DuckDB-Wasm (browser)               Free (device compute)
Edge Vector      HNSWlib.js (browser)                Free (device compute)
Edge Vision      Transformers.js + YOLOv8n ONNX      Free (device compute)
CI/CD            GitHub Actions                      Free (2000 min/mo)
Total                                                â‚¹0
```

---

## Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.5 | App Router, SSR, PWA, automatic code splitting |
| **React** | 18.3.1 | UI component framework |
| **TypeScript** | 5.5.3 | Type safety across entire frontend |
| **Tailwind CSS** | 3.4.10 | Utility-first styling, dark navy theme |
| **Leaflet.js** | 1.9.4 | Interactive map â€” dynamic import (no SSR) |
| **react-leaflet** | 4.2.1 | React wrapper for Leaflet |
| **@mlc-ai/web-llm** | 0.2.73 | Phi-3 Mini inference in browser via WebGPU/Wasm |
| **@huggingface/transformers** | 3.0.0 | YOLOv8n ONNX pothole detection + embeddings |
| **@duckdb/duckdb-wasm** | 1.29.0 | SQL engine in browser for offline challan calc |
| **hnswlib-wasm** | latest | ANN vector search for offline RAG pipeline |
| **@turf/turf** | 6.5.0 | Haversine distance filter on offline GeoJSON |
| **idb** | 8.0.0 | IndexedDB wrapper for offline storage |
| **next-pwa** | 5.6.0 | Service Worker, precache, runtime caching |
| **zustand** | 4.5.4 | Global state: GPS, services, AI mode, profile |
| **swr** | 2.2.5 | Data fetching with stale-while-revalidate cache |
| **axios** | 1.7.7 | HTTP client for backend API calls |
| **framer-motion** | 11.3.24 | Animations (SOS countdown, loading states) |
| **react-hot-toast** | 2.4.1 | Toast notifications for offline queue, errors |
| **lucide-react** | 0.427.0 | Icon set |

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

## Backend Stack

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115.0 | Async REST + WebSocket API framework |
| **Uvicorn** | 0.30.6 | ASGI server with standard extras |
| **LangChain** | 0.3.1 | ConversationalRetrievalChain orchestration |
| **langchain-groq** | 0.2.0 | Groq LLM integration for LangChain |
| **ChromaDB** | 0.5.3 | Local vector store for RAG (SQLite-backed) |
| **sentence-transformers** | 3.0.1 | `all-MiniLM-L6-v2` embeddings (local CPU) |
| **SQLAlchemy** | 2.0.35 | Async ORM (asyncio extras) |
| **asyncpg** | 0.29.0 | Async PostgreSQL driver |
| **GeoAlchemy2** | 0.15.2 | PostGIS geometry column types for SQLAlchemy |
| **Alembic** | 1.13.2 | Database migration management |
| **Redis (hiredis)** | 5.0.8 | Async Redis client for Upstash connection |
| **httpx** | 0.27.2 | Async HTTP client for Overpass + Nominatim |
| **DuckDB** | 0.10.3 | In-process SQL for challan calculation |
| **Pydantic** | 2.9.2 | Request/response validation |
| **pydantic-settings** | 2.5.2 | `.env` config loading with type validation |

---

## AI Models

| Model | Parameters | Size | Runtime | Use Case |
|---|---|---|---|---|
| `Groq llama3-70b-8192` | 70B | Cloud | Groq API | Online chatbot â€” max intelligence |
| `Phi-3-mini-4k-instruct-q4f16_1-MLC` | 3.8B | ~2.2GB | WebGPU | Offline chatbot â€” primary |
| `gemma-2b-it-q4f16_1-MLC` | 2B | ~1.4GB | WebAssembly | Offline chatbot â€” CPU fallback |
| `sentence-transformers/all-MiniLM-L6-v2` | 22M | ~90MB | Server CPU | Server-side embeddings for ChromaDB |
| `Xenova/all-MiniLM-L6-v2` | 22M | ~25MB | Browser Wasm | Browser-side embeddings for offline RAG |
| `Xenova/yolov8n` | ~6M | ~15MB | Browser Wasm | In-browser pothole detection from photos |

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
| Frontend hosting | Vercel | 100GB/month CDN | Next.js PWA |
| Backend hosting | Render.com | 750 hrs/month | FastAPI |
| Database | Supabase | 500MB PostgreSQL | All tables |
| Cache | Upstash | 10K commands/day | Redis |
| LLM API | Groq | 6,000 tokens/min | llama3-70b |
| Model CDN | Hugging Face | Unlimited public | WebLLM weights |
| Maps | OpenStreetMap CDN | Unlimited fair use | Leaflet tiles |
| Geocoding | Nominatim | 1 req/sec | Address lookup |
| POI data | Overpass API | Fair use | Emergency services |
| CI/CD | GitHub Actions | 2,000 min/month | Tests + deploy |

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
