# SafeVisionAI - Roadmap

Build phases for the IIT Madras Road Safety Hackathon 2026 submission.

---

## Phase Overview

```mermaid
gantt
    title SafeVisionAI Build Phases
    dateFormat  YYYY-MM-DD
    section Phase 1 - Foundation
    Project setup and scaffolding     :done, p1a, 2026-03-30, 2d
    Docs and folder structure         :done, p1b, 2026-03-30, 1d
    Git repo and CI setup             :done, p1c, 2026-03-31, 1d

    section Phase 2 - Backend Core
    Database schema and migrations    :p2a, 2026-04-01, 2d
    Emergency Locator API             :p2b, 2026-04-02, 3d
    Challan Calculator API            :p2c, 2026-04-03, 2d
    Road Reporter API                 :p2d, 2026-04-05, 2d

    section Phase 3 - AI Layer
    ChromaDB setup and PDF ingestion  :p3a, 2026-04-05, 2d
    LangChain + Groq chat pipeline    :p3b, 2026-04-06, 3d
    Intent detection system           :p3c, 2026-04-07, 2d

    section Phase 4 - Frontend
    Next.js app shell and routing     :p4a, 2026-04-07, 2d
    Emergency Locator UI + MapLibre   :p4b, 2026-04-08, 3d
    AI Chat UI                        :p4c, 2026-04-09, 2d
    Challan Calculator UI             :p4d, 2026-04-10, 2d
    Road Reporter UI                  :p4e, 2026-04-11, 2d

    section Phase 5 - Offline PWA
    Service Worker setup              :p5a, 2026-04-11, 2d
    WebLLM Phi-3 integration          :p5b, 2026-04-12, 3d
    DuckDB-Wasm offline challan       :p5c, 2026-04-13, 2d
    IndexedDB offline queue           :p5d, 2026-04-14, 2d

    section Phase 6 - Deploy and Polish
    Deploy backend to Render.com      :p6a, 2026-04-14, 1d
    Deploy frontend to Vercel         :p6b, 2026-04-14, 1d
    End-to-end testing                :p6c, 2026-04-15, 2d
    Demo prep and submission          :p6d, 2026-04-16, 2d
```

---

## Phase 1 - Foundation (Done)

**Goal:** Project structure, documentation, Git setup.

- [x] Create monorepo structure (backend/, frontend/, docs/)
- [x] Write all documentation (Agent.md, PRD, Architecture, API, DB, etc.)
- [x] requirements.txt and package.json with pinned versions
- [x] .gitignore, README.md, SETUP.md
- [x] GitHub repo created and initial push done
- [x] CI/CD workflow stub (.github/workflows/ci.yml)

---

## Phase 2 - Backend Core

**Goal:** All 4 API modules working with real data.

- [x] Set up Supabase project and enable PostGIS + pg_trgm
- [x] Run Alembic migrations (create all 6 tables)
- [x] Seed traffic violations data (seed_violations.py)
- [x] Seed emergency services for 25 cities from OSM (seed_emergency.py)
- [x] Emergency Locator API - ST_DWithin + Overpass fallback
- [x] Geocoding API - Nominatim reverse geocode
- [x] Challan Calculator API - DuckDB SQL + state overrides
- [x] Road Reporter API - submit issue, route to authority
- [x] Set up Upstash Redis and connect cache client
- [x] Write tests for all endpoints (pytest)

**Key files:**
- `backend/api/v1/emergency.py`
- `backend/api/v1/challan.py`
- `backend/api/v1/roadwatch.py`
- `backend/services/overpass_service.py`
- `backend/services/challan_service.py`
- `backend/services/authority_router.py`

---

## Phase 3 - AI Layer

**Goal:** RAG chatbot working online with Groq + ChromaDB.

- [x] Download 3 PDFs (MV Act 1988, MV Amendment 2019, WHO Trauma)
- [x] Run build_vectorstore.py to index PDFs into ChromaDB
- [x] LangChain RAG chain with ChromaDB MMR retrieval
- [x] Groq llama-3.3-70b-versatile integration
- [x] Intent detection system (9 intent labels)
- [x] Chat history in Redis per session
- [x] Chat API endpoint - POST /api/v1/chat/message
- [x] Test RAG accuracy on sample queries

**Key files:**
- `backend/services/llm_service.py`
- `backend/api/v1/chat.py`
- `backend/data/build_vectorstore.py`

---

## Phase 4 - Frontend

**Goal:** All 4 modules working as connected UI.

- [x] Next.js App Router setup with TypeScript
- [x] Tailwind CSS global styles and design tokens
- [x] Home page with 4 module cards
- [x] Emergency Locator - GPS + MapLibre GL map + hospital markers
- [x] SOS button - calls nearest hospital
- [x] AI Chat - message bubbles, intent badges, source citations
- [x] Challan Calculator - violation selector, state dropdown, fine display
- [x] Road Reporter - photo upload, GPS tag, category select, submit
- [x] First Aid page - static offline guide
- [x] Zustand global store (location, chat history, offline status)
- [x] SWR data fetching with error/loading states

**Key files:**
- `frontend/app/emergency/page.tsx`
- `frontend/app/chat/page.tsx`
- `frontend/app/challan/page.tsx`
- `frontend/app/report/page.tsx`
- `frontend/components/EmergencyMap.tsx`
- `frontend/components/ChatInterface.tsx`
- `frontend/lib/store.ts`

---

## Phase 5 - Offline PWA

**Goal:** All core features work with no internet connection.

- [x] Service worker + Workbox configuration
- [x] Precache app shell (HTML, JS, CSS, fonts)
- [x] Cache india-emergency.geojson at install time
- [x] DuckDB-Wasm + violations.csv for offline challan
- [x] WebLLM Phi-3 Mini one-time download and browser inference
- [x] HNSWlib.js vector search on first-aid.json
- [x] IndexedDB offline queue for road reports
- [x] Background Sync API for auto-submit when online
- [x] Offline status indicator in UI
- [/] Test all 4 modules in Chrome DevTools offline mode

**Key files:**
- `frontend/lib/edge-ai.ts`
- `frontend/lib/duckdb-challan.ts`
- `frontend/lib/offline-store.ts`
- `frontend/public/offline-data/`

---

## Phase 6 - Deploy and Polish

**Goal:** Live demo URLs working, submission ready.

- [ ] Deploy FastAPI to Render.com (render.yaml)
- [ ] Set all backend env vars in Render dashboard
- [ ] Deploy Next.js to Vercel
- [ ] Set all frontend env vars in Vercel dashboard
- [ ] Test full E2E flow on live URLs
- [ ] Test offline mode on mobile (Chrome + Firefox)
- [ ] Test on low-end Android device
- [ ] Lighthouse audit - target PWA score > 90
- [ ] Record demo video
- [ ] Final submission

---

## Status Legend

| Symbol | Meaning |
|---|---|
| [x] | Done |
| [ ] | Not started |
| [/] | In progress |
| [-] | Skipped / deferred |

---

*Last updated: March 31, 2026*
