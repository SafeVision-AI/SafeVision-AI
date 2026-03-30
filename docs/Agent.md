# SafeVisionAI â€” Agent Guide

> **READ THIS FIRST.** This document is written for any developer, AI agent, or team member who opens this codebase for the first time. After reading this, you should understand the complete application â€” what it does, how it works, which files do what, and where to start coding.

---

## What Is SafeVisionAI?

**SafeVisionAI** is a full-stack, AI-powered road safety Progressive Web App (PWA) built for the IIT Madras Road Safety Hackathon 2026. It is one unified application that solves three problem statements:

1. **Emergency Locator** â€” Find the nearest hospital, police station, ambulance, towing service using GPS. Works offline for 25 Indian cities.
2. **AI Chatbot** â€” Answer questions about traffic laws (Motor Vehicles Act 2019) and first aid. Uses Groq llama3-70b online, Phi-3 Mini entirely in the browser when offline.
3. **Challan Calculator** â€” Calculate exact traffic fines under MVA 2019 with state-specific overrides. Deterministic SQL â€” never hallucinates.
4. **Road Reporter** â€” Let citizens report potholes, flooding, broken roads. Automatically routes the complaint to the correct government authority (NHAI, State PWD, District Collector, PMGSY).

**Total infrastructure cost: â‚¹0.** Every tool is free/open source.

---

## Who Is It For?

- ðŸš— **Drivers** who had an accident and need help in 10 seconds
- ðŸ›£ï¸ **Highway travelers** with no internet on remote roads
- ðŸï¸ **Two-wheeler riders** who want to know their helmet fine
- ðŸ•³ï¸ **Citizens** who want to report a pothole and know who is responsible
- ðŸ‘® **Learner drivers** who want to understand traffic laws

---

## Tech Stack in One Line

**Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + Leaflet.js (maps) + WebLLM (offline AI) + DuckDB-Wasm (offline SQL) + Transformers.js (browser vision)  
**Backend**: FastAPI (Python 3.11) + PostgreSQL with PostGIS + Redis + ChromaDB + Groq API  
**Infra**: Vercel (frontend) + Render.com (backend) + Supabase (DB) + Upstash (Redis)

---

## Folder Structure

```
SafeVisionAI/
â”‚
â”œâ”€â”€ backend/                    â† FastAPI Python 3.11 application
â”‚   â”œâ”€â”€ main.py                 â† App entry point â€” CORS, routers, health check
â”‚   â”œâ”€â”€ requirements.txt        â† All pinned Python dependencies
â”‚   â”œâ”€â”€ Dockerfile              â† For Render.com deployment
â”‚   â”œâ”€â”€ .env.example            â† Copy â†’ .env, fill in values
â”‚   â”‚
â”‚   â”œâ”€â”€ api/v1/
â”‚   â”‚   â”œâ”€â”€ emergency.py        â† /nearby, /sos, /numbers â€” GPS + hospital locator
â”‚   â”‚   â”œâ”€â”€ chat.py             â† /message, WebSocket /stream â€” LangChain + Groq RAG
â”‚   â”‚   â”œâ”€â”€ challan.py          â† /calculate, /violations, /states â€” MVA fine calculator
â”‚   â”‚   â””â”€â”€ roadwatch.py        â† /report, /authority, /issues â€” road issue reporter
â”‚   â”‚
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”œâ”€â”€ config.py           â† Pydantic settings â€” reads all .env vars
â”‚   â”‚   â”œâ”€â”€ database.py         â† Async SQLAlchemy engine + get_db dependency
â”‚   â”‚   â””â”€â”€ redis_client.py     â† Async Redis pool + CacheHelper
â”‚   â”‚
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ llm_service.py      â† â­ SafeVisionAIChatbot â€” the main AI brain
â”‚   â”‚   â”œâ”€â”€ overpass_service.py â† Queries OSM for live emergency service locations
â”‚   â”‚   â”œâ”€â”€ geocoding_service.pyâ† Nominatim: GPS â†’ city/state name
â”‚   â”‚   â”œâ”€â”€ challan_service.py  â† DuckDB SQL fine calculation with state overrides
â”‚   â”‚   â””â”€â”€ authority_router.py â† GPS â†’ road type â†’ NHAI/PWD/PMGSY authority
â”‚   â”‚
â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”œâ”€â”€ emergency.py        â† emergency_services ORM (PostGIS geometry column)
â”‚   â”‚   â”œâ”€â”€ challan.py          â† traffic_violations + state_fine_overrides ORM
â”‚   â”‚   â”œâ”€â”€ road_issue.py       â† road_issues + road_infrastructure ORM
â”‚   â”‚   â”œâ”€â”€ user.py             â† user profiles ORM
â”‚   â”‚   â””â”€â”€ schemas.py          â† â­ ALL Pydantic request/response schemas
â”‚   â”‚
â”‚   â”œâ”€â”€ migrations/
â”‚   â”‚   â””â”€â”€ versions/
â”‚   â”‚       â””â”€â”€ 001_initial_schema.py  â† Creates all 6 DB tables with PostGIS
â”‚   â”‚
â”‚   â”œâ”€â”€ data/
â”‚   â”‚   â”œâ”€â”€ motor_vehicles_act_1988.pdf    â† Download manually (indiacode.nic.in)
â”‚   â”‚   â”œâ”€â”€ mv_amendment_act_2019.pdf      â† Download manually (morth.nic.in)
â”‚   â”‚   â”œâ”€â”€ who_trauma_care_guidelines.pdf â† Download manually (who.int)
â”‚   â”‚   â”œâ”€â”€ violations_seed.csv            â† 22+ MVA violations with fines
â”‚   â”‚   â”œâ”€â”€ state_overrides.csv            â† State-specific fine overrides
â”‚   â”‚   â”œâ”€â”€ seed_violations.py             â† Loads CSVs â†’ PostgreSQL
â”‚   â”‚   â”œâ”€â”€ seed_emergency.py              â† Overpass API â†’ 25 cities â†’ PostgreSQL + GeoJSON
â”‚   â”‚   â”œâ”€â”€ build_vectorstore.py           â† PDFs â†’ ChromaDB (run ONCE, takes 10 min)
â”‚   â”‚   â””â”€â”€ chroma_db/                     â† âš ï¸ Never delete! Built by build_vectorstore.py
â”‚   â”‚
â”‚   â””â”€â”€ tests/
â”‚       â”œâ”€â”€ conftest.py           â† pytest fixtures
â”‚       â”œâ”€â”€ test_emergency.py     â† 8 tests for /nearby, /sos endpoints
â”‚       â”œâ”€â”€ test_challan.py       â† 7 tests for fine calculation
â”‚       â””â”€â”€ test_chatbot.py       â† 6 tests for AI responses
â”‚
â”œâ”€â”€ frontend/                   â† Next.js 14 TypeScript PWA
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ layout.tsx           â† Root: PWA meta, ConnectivityProvider, Toaster
â”‚   â”‚   â”œâ”€â”€ page.tsx             â† Home: 4 module cards + emergency numbers bar
â”‚   â”‚   â”œâ”€â”€ emergency/page.tsx   â† Map + service list + SOS button
â”‚   â”‚   â”œâ”€â”€ chat/page.tsx        â† Online/Offline AI chat tabs
â”‚   â”‚   â”œâ”€â”€ challan/page.tsx     â† Fine calculator + violations browser
â”‚   â”‚   â”œâ”€â”€ report/page.tsx      â† Road issue report form
â”‚   â”‚   â”œâ”€â”€ first-aid/page.tsx   â† 8 static offline first-aid cards
â”‚   â”‚   â””â”€â”€ settings/page.tsx    â† Blood group, contacts, vehicle number
â”‚   â”‚
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ EmergencyMap.tsx     â† â­ Leaflet map (dynamic, no-SSR)
â”‚   â”‚   â”œâ”€â”€ SOSButton.tsx        â† Fixed red SOS â†’ WhatsApp deep link
â”‚   â”‚   â”œâ”€â”€ EmergencyNumbers.tsx â† Fixed bottom bar: 112, 102, 100, 1033
â”‚   â”‚   â”œâ”€â”€ ChatInterface.tsx    â† Online chat UI (Groq)
â”‚   â”‚   â”œâ”€â”€ VoiceInput.tsx       â† Web Speech API microphone
â”‚   â”‚   â”œâ”€â”€ OfflineChat.tsx      â† Offline WebLLM chat UI
â”‚   â”‚   â”œâ”€â”€ ModelLoader.tsx      â† WebLLM 2GB download progress bar
â”‚   â”‚   â”œâ”€â”€ ChallanCalculator.tsxâ† 4-step fine calculator form
â”‚   â”‚   â”œâ”€â”€ ReportForm.tsx       â† 5-step road issue form
â”‚   â”‚   â”œâ”€â”€ PotholeDetector.tsx  â† â­ YOLOv8n in-browser pothole detection
â”‚   â”‚   â”œâ”€â”€ AuthorityCard.tsx    â† Auto-routed authority display (NHAI/PWD/etc.)
â”‚   â”‚   â””â”€â”€ ConnectivityProvider.tsx â† React context for online/offline state
â”‚   â”‚
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ store.ts             â† â­ Zustand global state (GPS, services, AI mode)
â”‚   â”‚   â”œâ”€â”€ api.ts               â† Axios instance + SWR hooks for all endpoints
â”‚   â”‚   â”œâ”€â”€ geolocation.ts       â† GPS + crash detection (DeviceMotion API)
â”‚   â”‚   â”œâ”€â”€ edge-ai.ts           â† â­ WebLLM init, model selection, chatOffline()
â”‚   â”‚   â”œâ”€â”€ offline-rag.ts       â† HNSWlib.js + IndexedDB offline vector search
â”‚   â”‚   â”œâ”€â”€ offline-pois.ts      â† GeoJSON + Turf.js for offline emergency services
â”‚   â”‚   â”œâ”€â”€ duckdb-challan.ts    â† DuckDB-Wasm offline challan calculation
â”‚   â”‚   â”œâ”€â”€ sos-share.ts         â† WhatsApp SOS message generator
â”‚   â”‚   â””â”€â”€ user-profile.ts      â† IndexedDB: blood group, contacts, vehicle number
â”‚   â”‚
â”‚   â”œâ”€â”€ public/
â”‚   â”‚   â”œâ”€â”€ manifest.json        â† PWA manifest (standalone mode, app shortcuts)
â”‚   â”‚   â”œâ”€â”€ icons/               â† PWA icons (192px, 512px)
â”‚   â”‚   â”œâ”€â”€ leaflet/             â† Leaflet marker icons (webpack workaround)
â”‚   â”‚   â””â”€â”€ offline-data/
â”‚   â”‚       â”œâ”€â”€ india-emergency.geojson  â† 25-city POI bundle (generated by seed_emergency.py)
â”‚   â”‚       â”œâ”€â”€ violations.csv           â† Challan data for DuckDB-Wasm
â”‚   â”‚       â”œâ”€â”€ state_overrides.csv      â† State overrides for DuckDB-Wasm
â”‚   â”‚       â””â”€â”€ first-aid.json           â† 20 WHO first-aid articles for offline RAG
â”‚   â”‚
â”‚   â”œâ”€â”€ next.config.js           â† next-pwa config, WebAssembly, runtime caching
â”‚   â”œâ”€â”€ tailwind.config.ts       â† Dark navy theme, custom colors
â”‚   â””â”€â”€ package.json             â† All npm dependencies (pinned)
â”‚
â”œâ”€â”€ docs/                       â† â­ This folder â€” read all docs before coding
â”‚   â”œâ”€â”€ Agent.md                â† YOU ARE HERE â€” complete app overview
â”‚   â”œâ”€â”€ PRD.md                  â† Product requirements and evaluation criteria
â”‚   â”œâ”€â”€ Features.md             â† Every feature defined with technical detail
â”‚   â”œâ”€â”€ TechStack.md            â† All technologies with versions and purposes
â”‚   â”œâ”€â”€ Architecture.md         â† System diagrams and data flow
â”‚   â”œâ”€â”€ Database.md             â† All 7 tables with column definitions + SQL
â”‚   â”œâ”€â”€ API.md                  â† All 17 endpoints with request/response examples
â”‚   â”œâ”€â”€ UIUX.md                 â† Design system, colors, components spec
â”‚   â”œâ”€â”€ Security.md             â† Auth, privacy, API security
â”‚   â”œâ”€â”€ Deployment.md           â† Step-by-step setup and deployment
â”‚   â”œâ”€â”€ AI_Instructions.md      â† How each AI layer works with code examples
â”‚   â””â”€â”€ DataSources.md          â† Where all data comes from
â”‚
â”œâ”€â”€ .github/workflows/ci.yml   â† GitHub Actions: test backend + build frontend
â”œâ”€â”€ render.yaml                â† Render.com deployment config
â”œâ”€â”€ .gitignore                 â† Excludes .env, venv, node_modules, chroma_db, PDFs
â””â”€â”€ README.md                  â† Quick start for team members
```

---

## Critical Things to Know Before Coding

### 1. The Map Has 3 Separate Components (Don't Confuse Them)
- **Tile Images** (visual map background) â†’ OpenStreetMap CDN via Leaflet TileLayer
- **Marker Locations** (hospital/police dots) â†’ PostGIS database OR Overpass API OR GeoJSON
- **Address Text** (city/state labels) â†’ Nominatim geocoder

### 2. PostGIS Gotchas
- `ST_MakePoint` takes **longitude FIRST, latitude SECOND** (opposite of common convention)
- Always cast to `::geography` (meters), never `::geometry` (degrees)
- PostGIS must be enabled in Supabase **before** running migrations

### 3. Leaflet in Next.js Requires 3 Things
- `dynamic(() => import(...), { ssr: false })` on all Leaflet components
- `import 'leaflet/dist/leaflet.css'` inside the component (not in layout)
- Copy marker icons to `public/leaflet/` (webpack breaks default icon paths)

### 4. ChromaDB Must Be Built Before Server Starts
- Run `python data/build_vectorstore.py` once after downloading the PDFs
- The `data/chroma_db/` directory must exist before `uvicorn` starts
- Never delete this directory â€” rebuilding takes 10 minutes

### 5. WebLLM Downloads On-Demand Only
- The 2.2GB Phi-3 Mini model is only downloaded when user clicks "Use Offline AI"
- `next-pwa` runs Service Worker only in production (`npm run build && npm start`)
- Test offline mode with production build, not `npm run dev`

### 6. DuckDB Is Used Twice (Different Places)
- Server-side: `duckdb` Python package in `services/challan_service.py` (online)
- Browser-side: `@duckdb/duckdb-wasm` npm package in `lib/duckdb-challan.ts` (offline)

### 7. Safety Rule (Never Remove)
Any chat response about injuries must start with "Call 112 immediately." â€” check `services/llm_service.py` for the safety check function.

---

## How to Start Development

### First Time Setup

```bash
# 1. Clone the repo
git clone https://github.com/[org]/SafeVisionAI.git
cd SafeVisionAI

# 2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env      # Fill in all values

# 3. Enable PostGIS in Supabase SQL Editor:
# CREATE EXTENSION IF NOT EXISTS postgis;

# 4. Run migrations
alembic upgrade head

# 5. Download PDFs to backend/data/ (see docs/Deployment.md)

# 6. Seed data
python data/seed_violations.py
python data/seed_emergency.py   # 4 minutes
python data/build_vectorstore.py  # 10 minutes, run once

# 7. Start backend
uvicorn main:app --reload --port 8000

# 8. Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local  # Fill in values
npm run dev
```

---

## API Endpoints Quick Reference

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/health` | Server status |
| GET | `/api/v1/emergency/nearby` | Find hospitals/police near GPS |
| GET | `/api/v1/emergency/sos` | All services + numbers for SOS |
| GET | `/api/v1/emergency/numbers` | Static emergency number list |
| POST | `/api/v1/chat/message` | AI chatbot (Groq + RAG) |
| WS | `/api/v1/chat/stream` | Streaming chat tokens |
| GET | `/api/v1/chat/history/{id}` | Session chat history |
| GET | `/api/v1/challan/calculate` | Fine calculation (DuckDB) |
| GET | `/api/v1/challan/violations` | List all violations |
| GET | `/api/v1/challan/states/{code}` | State override list |
| POST | `/api/v1/roads/report` | Submit road issue |
| GET | `/api/v1/roads/authority` | Road authority at GPS |
| GET | `/api/v1/roads/issues` | Community issues near GPS |
| GET | `/api/v1/roads/infrastructure` | Contractor/budget data |
| GET | `/api/v1/geocode/search` | Address â†’ GPS |
| GET | `/api/v1/geocode/reverse` | GPS â†’ city/state |
| GET | `/api/v1/offline/bundle/{city}` | GeoJSON for offline |

---

## Key Design Decisions (and Why)

| Decision | Reason |
|---|---|
| FastAPI over Django/Flask | Async by default â€” critical for concurrent GPS + LLM calls |
| PostGIS over MongoDB geo | ST_DWithin with GIST index < 50ms; Mongo is much slower for radius queries |
| Groq over OpenAI | Free 6000 tok/min; OpenAI would cost â‚¹ at scale |
| WebLLM Phi-3 over Gemma | Better legal reasoning per parameter; best offline model for law Q&A |
| DuckDB for challan | Deterministic SQL; LLM would hallucinate fine amounts |
| OSM/Overpass over Google Maps | Google Maps API costs â‚¹; OSM is free and global |
| CartoDB Dark tiles | Free, no API key, dark theme matches app, red markers stand å‡º dramatically |
| Zustand over Redux | 90% less boilerplate; sufficient for this app's state complexity |
| IndexedDB for user profile | Blood group never leaves device â€” privacy by architecture |

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| `ST_MakePoint(lat, lon)` | `ST_MakePoint(lon, lat)` â€” longitude FIRST |
| Using `::geometry` in ST_DWithin | Use `::geography` â€” gives distances in meters |
| Importing Leaflet in layout.tsx | Import only in components with `dynamic({ssr:false})` |
| Deleting `data/chroma_db/` | Never delete â€” rebuild = 10 minutes |
| Testing PWA offline with `npm run dev` | Run `npm run build && npm start` for Service Worker |
| Calling Nominatim without User-Agent | Always set `User-Agent: SafeVisionAI/1.0` header |
| Hardcoding API keys in code | Always use environment variables |
| Answering injury queries without 112 prompt | Always prepend "Call 112 immediately" |

---

## Reading Order for New Team Members

1. `docs/Agent.md` â† You are here
2. `docs/PRD.md` â† Understand the goal
3. `docs/Architecture.md` â† Understand the system
4. `docs/Features.md` â† Understand what to build
5. `docs/TechStack.md` â† Understand the tools
6. `docs/Database.md` â† Understand the data model
7. `docs/API.md` â† Understand the API contracts
8. `docs/AI_Instructions.md` â† Understand the AI layers
9. `docs/Deployment.md` â† Get your local environment running
10. Start coding!

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
*This document should be updated whenever significant architectural decisions are made.*
