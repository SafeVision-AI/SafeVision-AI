# SafeVisionAI ðŸš¨

**AI Emergency Response + DriveLegal + RoadWatch â€” Three Problem Statements, One App**

> IIT Madras Road Safety Hackathon 2026 | Team Submission  
> Total infrastructure cost: **â‚¹0** â€” 100% free and open source

[![Backend CI](https://github.com/[org]/SafeVisionAI/actions/workflows/ci.yml/badge.svg)](https://github.com/[org]/SafeVisionAI/actions)
[![Deploy Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](https://safevisionai.vercel.app)
[![Deploy Backend](https://img.shields.io/badge/Backend-Render.com-blue)](https://safevisionai-api.onrender.com/health)

---

## What SafeVisionAI Does

| Module | What it does | Works Offline? |
|---|---|---|
| ðŸš‘ **Emergency Locator** | Find nearest hospital/police/ambulance using GPS | âœ… Yes â€” 25 Indian cities |
| ðŸ¤– **AI Chatbot** | Answer traffic law + first aid questions | âœ… Yes â€” Phi-3 Mini in browser |
| âš–ï¸ **Challan Calculator** | Exact MVA 2019 fines with state overrides | âœ… Yes â€” DuckDB-Wasm |
| ðŸ•³ï¸ **Road Reporter** | Report potholes, auto-routes to NHAI/PWD/PMGSY | âœ… Yes â€” offline queue |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env â€” fill in Supabase, Redis, Groq API keys

# Enable PostGIS in Supabase SQL Editor first:
# CREATE EXTENSION IF NOT EXISTS postgis;

# Run migrations
alembic upgrade head

# Download PDFs to backend/data/ (see docs/DataSources.md)

# Seed database (run in order)
python data/seed_violations.py      # ~2 seconds
python data/seed_emergency.py       # ~4 minutes â€” 25 cities from OSM
python data/build_vectorstore.py    # ~10 minutes â€” build RAG index (run ONCE)

# Start development server
uvicorn main:app --reload --port 8000

# Verify: http://localhost:8000/health
# Swagger docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local â€” fill in API URL and Supabase keys

# Start development server
npm run dev

# App opens at: http://localhost:3000
```

### Test Offline Mode

```bash
# Service Worker only runs in production build
cd frontend
npm run build && npm start

# Then in Chrome:
# DevTools â†’ Network â†’ check "Offline" â†’ navigate to /emergency
# Hospitals should still show from cached GeoJSON
```

---

## Project Structure

```
SafeVisionAI/
â”œâ”€â”€ backend/          FastAPI Python 3.11 + PostgreSQL/PostGIS + ChromaDB
â”œâ”€â”€ frontend/         Next.js 14 TypeScript PWA + WebLLM + DuckDB-Wasm
â”œâ”€â”€ docs/             Complete technical documentation
â””â”€â”€ .github/          GitHub Actions CI/CD
```

**ðŸ“– Start with `docs/Agent.md` for a complete application overview.**

---

## Tech Stack

**Backend**: FastAPI Â· SQLAlchemy Â· PostGIS Â· ChromaDB Â· LangChain Â· Groq Â· Redis  
**Frontend**: Next.js 14 Â· TypeScript Â· Tailwind Â· Leaflet.js Â· WebLLM Â· DuckDB-Wasm Â· Transformers.js  
**Infra**: Vercel Â· Render.com Â· Supabase Â· Upstash Â· GitHub Actions

---

## Documentation

| Document | What's in it |
|---|---|
| [Agent.md](docs/Agent.md) | **START HERE** â€” Complete app overview for new developers |
| [PRD.md](docs/PRD.md) | Product requirements and evaluation criteria |
| [Features.md](docs/Features.md) | Every feature defined with technical details |
| [Architecture.md](docs/Architecture.md) | System diagrams and data flows |
| [Database.md](docs/Database.md) | All 7 tables with column definitions and spatial queries |
| [API.md](docs/API.md) | All 17 endpoints with request/response examples |
| [TechStack.md](docs/TechStack.md) | All technologies with versions and purposes |
| [UIUX.md](docs/UIUX.md) | Design system, colors, component specifications |
| [AI_Instructions.md](docs/AI_Instructions.md) | How each AI layer works with code examples |
| [Security.md](docs/Security.md) | Auth, privacy, API security |
| [Deployment.md](docs/Deployment.md) | Step-by-step deployment to Vercel + Render |
| [DataSources.md](docs/DataSources.md) | Where all data comes from (PDFs, APIs, OSM) |

---

## Key Commands

```bash
# Backend tests
cd backend && pytest tests/ -v

# Rebuild ChromaDB after adding PDFs
python data/build_vectorstore.py

# New DB migration
alembic revision --autogenerate -m "description"
alembic upgrade head

# Test API
curl "http://localhost:8000/api/v1/emergency/nearby?lat=13.0827&lon=80.2707"
curl "http://localhost:8000/api/v1/challan/calculate?violation_code=MVA_185"
```

---

## Live Demo

- **Frontend**: [safevisionai.vercel.app](https://safevisionai.vercel.app)
- **Backend API**: [safevisionai-api.onrender.com/docs](https://safevisionai-api.onrender.com/docs)

---

*IIT Madras Road Safety Hackathon 2026 â€” Built to Win. Built to Save Lives.*
