# SafeVisionAI  Agent Guide

> **READ THIS FIRST.** This document is written for any developer, AI agent, or team member who opens this codebase for the first time. After reading this, you should understand the complete application  what it does, how it works, which files do what, and where to start coding.

---

## What Is SafeVisionAI?

**SafeVisionAI** is a full-stack, AI-powered road safety Progressive Web App (PWA) built for the IIT Madras Road Safety Hackathon 2026. It is one unified application that solves three problem statements:

1. **Emergency Locator**  Find the nearest hospital, police station, ambulance, towing service using GPS. Works offline for 25 Indian cities.
2. **AI Chatbot**  Answer questions about traffic laws (Motor Vehicles Act 2019) and first aid. Uses Groq llama3-70b online, Phi-3 Mini entirely in the browser when offline.
3. **Challan Calculator**  Calculate exact traffic fines under MVA 2019 with state-specific overrides. Deterministic SQL  never hallucinates.
4. **Road Reporter**  Let citizens report potholes, flooding, broken roads. Automatically routes the complaint to the correct government authority (NHAI, State PWD, District Collector, PMGSY).

**Total infrastructure cost: 0.** Every tool is free/open source.

---

## Who Is It For?

-  -  **Drivers** who had an accident and need help in 10 seconds
-  **Highway travelers** with no internet on remote roads
-  **Two-wheeler riders** who want to know their helmet fine
-  **Citizens** who want to report a pothole and know who is responsible
-  **Learner drivers** who want to understand traffic laws

---

## Tech Stack in One Line

**Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + Leaflet.js (maps) + WebLLM (offline AI) + DuckDB-Wasm (offline SQL) + Transformers.js (browser vision)  
**Backend**: FastAPI (Python 3.11) + PostgreSQL with PostGIS + Redis + ChromaDB + Groq API  
**Infra**: Vercel (frontend) + Render.com (backend) + Supabase (DB) + Upstash (Redis)

---

## Folder Structure

```
SafeVisionAI/

 chatbot_service/             Standalone FastAPI Voice & Chatbot Service
 backend/                     FastAPI Python 3.11 application
    main.py                  App entry point  CORS, routers, health check
    requirements.txt         All pinned Python dependencies
    Dockerfile               For Render.com deployment
    .env.example             Copy  .env, fill in values
   
    api/v1/
       emergency.py         /nearby, /sos, /numbers  GPS + hospital locator
       chat.py              /message, WebSocket /stream  LangChain + Groq RAG
       challan.py           /calculate, /violations, /states  MVA fine calculator
       roadwatch.py         /report, /authority, /issues  road issue reporter
   
    core/
       config.py            Pydantic settings  reads all .env vars
       database.py          Async SQLAlchemy engine + get_db dependency
       redis_client.py      Async Redis pool + CacheHelper
   
    services/
       llm_service.py        SafeVisionAIChatbot  the main AI brain
       overpass_service.py  Queries OSM for live emergency service locations
       geocoding_service.py Nominatim: GPS  city/state name
       challan_service.py   DuckDB SQL fine calculation with state overrides
       authority_router.py  GPS  road type  NHAI/PWD/PMGSY authority
   
    models/
       emergency.py         emergency_services ORM (PostGIS geometry column)
       challan.py           traffic_violations + state_fine_overrides ORM
       road_issue.py        road_issues + road_infrastructure ORM
       user.py              user profiles ORM
       schemas.py            ALL Pydantic request/response schemas
   
    migrations/
       versions/
           001_initial_schema.py   Creates all 6 DB tables with PostGIS
   
    data/
       motor_vehicles_act_1988.pdf     Download manually (indiacode.nic.in)
       mv_amendment_act_2019.pdf       Download manually (morth.nic.in)
       who_trauma_care_guidelines.pdf  Download manually (who.int)
       violations_seed.csv             22+ MVA violations with fines
       state_overrides.csv             State-specific fine overrides
       seed_violations.py              Loads CSVs  PostgreSQL
       seed_emergency.py               Overpass API  25 cities  PostgreSQL + GeoJSON
       build_vectorstore.py            PDFs  ChromaDB (run ONCE, takes 10 min)
       chroma_db/                       Never delete! Built by build_vectorstore.py
   
    tests/
        conftest.py            pytest fixtures
        test_emergency.py      8 tests for /nearby, /sos endpoints
        test_challan.py        7 tests for fine calculation
        test_chatbot.py        6 tests for AI responses

 frontend/                    Next.js 14 TypeScript PWA
    app/
       layout.tsx            Root: PWA meta, ConnectivityProvider, Toaster
       page.tsx              Home: 4 module cards + emergency numbers bar
       emergency/page.tsx    Map + service list + SOS button
       chat/page.tsx         Online/Offline AI chat tabs
       challan/page.tsx      Fine calculator + violations browser
       report/page.tsx       Road issue report form
       first-aid/page.tsx    8 static offline first-aid cards
       settings/page.tsx     Blood group, contacts, vehicle number
   
    components/
       EmergencyMap.tsx       Leaflet map (dynamic, no-SSR)
       SOSButton.tsx         Fixed red SOS  WhatsApp deep link
       EmergencyNumbers.tsx  Fixed bottom bar: 112, 102, 100, 1033
       ChatInterface.tsx     Online chat UI (Groq)
       VoiceInput.tsx        Web Speech API microphone
       OfflineChat.tsx       Offline WebLLM chat UI
       ModelLoader.tsx       WebLLM 2GB download progress bar
       ChallanCalculator.tsx 4-step fine calculator form
       ReportForm.tsx        5-step road issue form
       PotholeDetector.tsx    YOLOv8n in-browser pothole detection
       AuthorityCard.tsx     Auto-routed authority display (NHAI/PWD/etc.)
       ConnectivityProvider.tsx  React context for online/offline state
   
    lib/
       store.ts               Zustand global state (GPS, services, AI mode)
       api.ts                Axios instance + SWR hooks for all endpoints
       geolocation.ts        GPS + crash detection (DeviceMotion API)
       edge-ai.ts             WebLLM init, model selection, chatOffline()
       offline-rag.ts        HNSWlib.js + IndexedDB offline vector search
       offline-pois.ts       GeoJSON + Turf.js for offline emergency services
       duckdb-challan.ts     DuckDB-Wasm offline challan calculation
       sos-share.ts          WhatsApp SOS message generator
       user-profile.ts       IndexedDB: blood group, contacts, vehicle number
   
    public/
       manifest.json         PWA manifest (standalone mode, app shortcuts)
       icons/                PWA icons (192px, 512px)
       leaflet/              Leaflet marker icons (webpack workaround)
       offline-data/
           india-emergency.geojson   25-city POI bundle (generated by seed_emergency.py)
           violations.csv            Challan data for DuckDB-Wasm
           state_overrides.csv       State overrides for DuckDB-Wasm
           first-aid.json            20 WHO first-aid articles for offline RAG
   
    next.config.js            next-pwa config, WebAssembly, runtime caching
    tailwind.config.ts        Dark navy theme, custom colors
    package.json              All npm dependencies (pinned)

 docs/                         This folder  read all docs before coding
    Agent.md                 YOU ARE HERE  complete app overview
    PRD.md                   Product requirements and evaluation criteria
    Features.md              Every feature defined with technical detail
    TechStack.md             All technologies with versions and purposes
    Architecture.md          System diagrams and data flow
    Database.md              All 7 tables with column definitions + SQL
    API.md                   All 17 endpoints with request/response examples
    UIUX.md                  Design system, colors, components spec
    Security.md              Auth, privacy, API security
    Deployment.md            Step-by-step setup and deployment
    AI_Instructions.md       How each AI layer works with code examples
    DataSources.md           Where all data comes from

  chatbot_docs/                Mirrored or customized docs for the chatbot infrastructure

 .github/workflows/ci.yml    GitHub Actions: test backend + build frontend
 render.yaml                 Render.com deployment config
 .gitignore                  Excludes .env, venv, node_modules, chroma_db, PDFs
 README.md                   Quick start for team members
```

---

## Critical Things to Know Before Coding

### 1. The Map Has 3 Separate Components (Don't Confuse Them)
- **Tile Images** (visual map background)  OpenStreetMap CDN via Leaflet TileLayer
- **Marker Locations** (hospital/police dots)  PostGIS database OR Overpass API OR GeoJSON
- **Address Text** (city/state labels)  Nominatim geocoder

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
- Never delete this directory  rebuilding takes 10 minutes

### 5. WebLLM Downloads On-Demand Only
- The 2.2GB Phi-3 Mini model is only downloaded when user clicks "Use Offline AI"
- `next-pwa` runs Service Worker only in production (`npm run build && npm start`)
- Test offline mode with production build, not `npm run dev`

### 6. DuckDB Is Used Twice (Different Places)
- Server-side: `duckdb` Python package in `services/challan_service.py` (online)
- Browser-side: `@duckdb/duckdb-wasm` npm package in `lib/duckdb-challan.ts` (offline)

### 7. Safety Rule (Never Remove)
Any chat response about injuries must start with "Call 112 immediately."  check `services/llm_service.py` for the safety check function.

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
| GET | `/api/v1/geocode/search` | Address  GPS |
| GET | `/api/v1/geocode/reverse` | GPS  city/state |
| GET | `/api/v1/offline/bundle/{city}` | GeoJSON for offline |

---

## Key Design Decisions (and Why)

| Decision | Reason |
|---|---|
| FastAPI over Django/Flask | Async by default  critical for concurrent GPS + LLM calls |
| PostGIS over MongoDB geo | ST_DWithin with GIST index < 50ms; Mongo is much slower for radius queries |
| Groq over OpenAI | Free 6000 tok/min; OpenAI would cost  at scale |
| WebLLM Phi-3 over Gemma | Better legal reasoning per parameter; best offline model for law Q&A |
| DuckDB for challan | Deterministic SQL; LLM would hallucinate fine amounts |
| OSM/Overpass over Google Maps | Google Maps API costs ; OSM is free and global |
| CartoDB Dark tiles | Free, no API key, dark theme matches app, red markers stand  dramatically |
| Zustand over Redux | 90% less boilerplate; sufficient for this app's state complexity |
| IndexedDB for user profile | Blood group never leaves device  privacy by architecture |

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| `ST_MakePoint(lat, lon)` | `ST_MakePoint(lon, lat)`  longitude FIRST |
| Using `::geometry` in ST_DWithin | Use `::geography`  gives distances in meters |
| Importing Leaflet in layout.tsx | Import only in components with `dynamic({ssr:false})` |
| Deleting `data/chroma_db/` | Never delete  rebuild = 10 minutes |
| Testing PWA offline with `npm run dev` | Run `npm run build && npm start` for Service Worker |
| Calling Nominatim without User-Agent | Always set `User-Agent: SafeVisionAI/1.0` header |
| Hardcoding API keys in code | Always use environment variables |
| Answering injury queries without 112 prompt | Always prepend "Call 112 immediately" |

---

## Reading Order for New Team Members

1. `docs/Agent.md`  You are here
2. `docs/PRD.md`  Understand the goal
3. `docs/Architecture.md`  Understand the system
4. `docs/Features.md`  Understand what to build
5. `docs/TechStack.md`  Understand the tools
6. `docs/Database.md`  Understand the data model
7. `docs/API.md`  Understand the API contracts
8. `docs/AI_Instructions.md`  Understand the AI layers
9. `docs/Deployment.md`  Get your local environment running
10. Start coding!

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
*This document should be updated whenever significant architectural decisions are made.*
