# SafeVisionAI

**AI Emergency Response + DriveLegal + RoadWatch — Three Problem Statements, One App**

> IIT Madras Road Safety Hackathon 2026 | Team Submission
> Total infrastructure cost: Rs. 0 — 100% free and open source

---

## What SafeVisionAI Does

| Module | What it does | Works Offline? |
|---|---|---|
| Emergency Locator | Find nearest hospital/police/ambulance using GPS | Yes — 25 Indian cities |
| AI Chatbot | Answer traffic law + first aid questions | Yes — Phi-3 Mini in browser |
| Challan Calculator | Exact MVA 2019 fines with state overrides | Yes — DuckDB-Wasm |
| Road Reporter | Report potholes, auto-routes to NHAI/PWD/PMGSY | Yes — offline queue |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys
uvicorn main:app --reload --port 8000
```

Verify: http://localhost:8000/health

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in your keys
npm run dev
```

Verify: http://localhost:3000

---

## Project Structure

```
SafeVisionAI/
├── backend/          FastAPI Python 3.11 + PostgreSQL/PostGIS + ChromaDB
├── frontend/         Next.js 14 TypeScript PWA + WebLLM + DuckDB-Wasm
├── docs/             Complete technical documentation
└── .github/          GitHub Actions CI/CD
```

Read `docs/Agent.md` first — it gives a complete overview of the entire application.

---

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, PostGIS, ChromaDB, LangChain, Groq, Redis

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Leaflet.js, WebLLM, DuckDB-Wasm, Transformers.js

**Infra:** Vercel, Render.com, Supabase, Upstash, GitHub Actions — all free tier

---

## Documentation

| File | Contents |
|---|---|
| [docs/Agent.md](docs/Agent.md) | START HERE — complete app overview for new developers |
| [docs/PRD.md](docs/PRD.md) | Product requirements and evaluation criteria |
| [docs/Features.md](docs/Features.md) | Every feature with technical details |
| [docs/Architecture.md](docs/Architecture.md) | System diagrams and data flows |
| [docs/Database.md](docs/Database.md) | All 7 tables with column definitions |
| [docs/API.md](docs/API.md) | All 17 endpoints with request/response examples |
| [docs/TechStack.md](docs/TechStack.md) | All technologies with versions and purposes |
| [docs/UIUX.md](docs/UIUX.md) | Design system, colors, component specs |
| [docs/AI_Instructions.md](docs/AI_Instructions.md) | How each AI layer works |
| [docs/Security.md](docs/Security.md) | Auth, privacy, API security |
| [docs/Deployment.md](docs/Deployment.md) | Step-by-step deployment guide |
| [SETUP.md](SETUP.md) | Full installation and run guide |

---

## Live Demo

- Frontend: https://safevisionai.vercel.app
- Backend API: https://safevisionai-api.onrender.com/docs

---

*IIT Madras Road Safety Hackathon 2026*
