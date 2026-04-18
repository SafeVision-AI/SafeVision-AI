# SafeVisionAI  Deployment Guide

## Infrastructure Overview (All Free Tier)

| Service | Provider | URL | Purpose |
|---|---|---|---|
| Frontend | Vercel | `safevisionai.vercel.app` | Next.js 15 PWA, global CDN |
| Backend | Render.com | `safevisionai-api.onrender.com` | FastAPI :8000, 750h/month free |
| Chatbot Service | Render.com | `safevisionai-chatbot.onrender.com` | FastAPI :8010, Agentic RAG AI |
| Database | Supabase | `[project].supabase.co` | PostgreSQL + PostGIS |
| Cache | Upstash | `[host].upstash.io` | Redis, 10K commands/day |
| LLM APIs | Groq + 10 more | Various | 11-provider fallback chain |
| Model CDN | Hugging Face | `huggingface.co` | WebLLM weights |
| CI/CD | GitHub Actions | | Auto-deploy on push |

---

## Step 1: Create Free Accounts

1. **Groq**  [console.groq.com](https://console.groq.com)  Create account  API Keys  Create Key (starts with `gsk_`)
2. **Supabase**  [supabase.com](https://supabase.com)  New project  Region: Singapore (closest to India)  Save password
3. **Upstash**  [upstash.com](https://upstash.com)  New Redis Database  Global  Copy `REDIS_URL`
4. **Vercel**  [vercel.com](https://vercel.com)  Connect GitHub account
5. **Render.com**  [render.com](https://render.com)  Connect GitHub account
6. **data.gov.in**  [data.gov.in](https://data.gov.in)  Register  Get API key (for NHAI data)

---

## Step 2: Database Setup (Supabase)

### Enable PostGIS (Run in Supabase SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT PostGIS_version(); -- verify: should return version string
```

### Get Connection String
Supabase  Settings  Database  Connection string  URI

Change `postgresql://` to `postgresql+asyncpg://` for async driver.

---

## Step 3: Backend Setup (Local Dev)

```bash
# 1. Navigate to backend directory
cd SafeVisionAI/backend

# 2. Create and activate Python virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Install all dependencies
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env
# Edit .env and fill in all values from Step 1-2

# 5. Run database migrations (creates all 6 tables)
alembic upgrade head

# 6. Verify tables were created
# Check Supabase Table Editor  should see 6 tables
```

### Download Required PDFs (for RAG)

```
Download to backend/data/:
- motor_vehicles_act_1988.pdf     indiacode.nic.in
- mv_amendment_act_2019.pdf       morth.nic.in
- who_trauma_care_guidelines.pdf  who.int
```

### Seed the Database

```bash
# Seed traffic violations and state overrides (~2 seconds)
python data/seed_violations.py

# Seed emergency services for 25 Indian cities (~4 minutes via Overpass API)
# Also creates: frontend/public/offline-data/india-emergency.geojson
python data/seed_emergency.py

# Build ChromaDB vector store from PDFs  RUN ONCE, takes 5-10 minutes
# Creates: data/chroma_db/ directory (never delete this!)
python data/build_vectorstore.py
```

### Start Backend Dev Server

```bash
uvicorn main:app --reload --port 8000

# Verify at: http://localhost:8000/health
# Swagger docs: http://localhost:8000/docs
```

---

## Step 4: Frontend Setup (Local Dev)

```bash
# 1. Navigate to frontend directory
cd SafeVisionAI/frontend

# 2. Install all npm packages
npm install

# 3. Copy environment template
cp .env.local.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 4. Start development server
npm run dev
# Opens at: http://localhost:3000
```

### Test Offline Mode (PWA)

```bash
# Note: Service Worker only registers in production build

# Build and start production server locally
npm run build && npm start

# Then in Chrome:
# 1. DevTools  Application  Service Workers  verify registered
# 2. DevTools  Network  check "Offline"
# 3. Navigate to /emergency  hospitals should still show
```

---

## Step 5: Deploy Backend to Render.com

### Via render.yaml (Recommended)

The `render.yaml` at the project root configures automatic deployment.

1. Go to Render.com  New  Blueprint
2. Connect GitHub repository
3. Render detects `render.yaml` automatically
4. Set environment variables (from Render dashboard):
   - `DATABASE_URL`
   - `REDIS_URL`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Manual Setup (Alternative)

Render.com  New  Web Service:
- **Name:** `safevisionai-api`
- **Root Directory:** `backend`
- **Runtime:** Python 3.11
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
- **Health Check Path:** `/health`

### Run Migrations on Render

After first deploy, open Render Shell:
```bash
alembic upgrade head
python data/seed_violations.py
python data/seed_emergency.py  # 4 minutes
python data/build_vectorstore.py  # 10 minutes
```

---

## Step 5b: Deploy Chatbot Service to Render.com

The chatbot service is a **separate** Render web service.

Render.com → New → Web Service:
- **Name:** `safevisionai-chatbot`
- **Root Directory:** `chatbot_service`
- **Runtime:** Python 3.11
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
- **Health Check Path:** `/health`

Set environment variables:
- `DEFAULT_LLM_PROVIDER`, `DEFAULT_LLM_MODEL`
- All LLM provider API keys (GROQ, GEMINI, SARVAM, etc.)
- `MAIN_BACKEND_BASE_URL` = your Render backend URL
- `REDIS_URL` = Upstash Redis URL
- `CHROMA_PERSIST_DIR` = `./data/chroma_db`

> **Note:** `chatbot_service/data/chroma_db/` is committed to git, so Render gets the vectorstore automatically on deploy. No build-time vectorstore creation needed.

---

## Step 6: Deploy Frontend to Vercel

### Via GitHub Integration (Recommended)

1. Vercel Dashboard  New Project  Import from GitHub
2. Select `SafeVisionAI` repository
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `frontend`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://safevisionai-api.onrender.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key

Vercel auto-deploys on every `git push` to `main`.

### Via CLI (Alternative)

```bash
cd frontend
npx vercel --prod
```

---

## Step 7: Verify Production Deployment

```bash
# Backend health check
curl https://safevisionai-api.onrender.com/health
# Expected: {"status":"ok","chatbot_ready":true}

# Emergency API test
curl "https://safevisionai-api.onrender.com/api/v1/emergency/nearby?lat=13.0827&lon=80.2707"
# Expected: {"services":[...],"count":N}

# Challan API test
curl "https://safevisionai-api.onrender.com/api/v1/challan/calculate?violation_code=MVA_185"
# Expected: {"final_fine_inr":10000,"section":"185"}

# Frontend PWA check
# Chrome  visit safevisionai.vercel.app  check "Add to Home Screen" prompt
```

---

## CI/CD (GitHub Actions)

Configured in `.github/workflows/ci.yml`:

- **Triggers:** Push to `main` or `develop`, any Pull Request to `main`
- **Backend job:** Runs pytest with PostGIS and Redis services
- **Frontend job:** Runs `npm run build` to verify no build errors
- **Auto-deploy:** Vercel and Render both watch the `main` branch

---

## Environment Variables Reference

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Cache
REDIS_URL=rediss://default:[TOKEN]@[HOST].upstash.io:6379

# Chatbot
CHATBOT_SERVICE_URL=http://localhost:8010

# App
ENVIRONMENT=production
DEFAULT_RADIUS=5000
MAX_RADIUS=50000
CACHE_TTL=3600
```

### Chatbot Service (`chatbot_service/.env`)

```bash
# LLM
DEFAULT_LLM_PROVIDER=groq
DEFAULT_LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=...
GEMINI_API_KEY=...
SARVAM_API_KEY=...

# Backend connection
MAIN_BACKEND_BASE_URL=http://localhost:8000

# RAG
CHROMA_PERSIST_DIR=./data/chroma_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Cache
REDIS_URL=rediss://default:[TOKEN]@[HOST].upstash.io:6379
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_BACKEND_URL=https://safevisionai-api.onrender.com
NEXT_PUBLIC_CHATBOT_URL=https://safevisionai-chatbot.onrender.com
```

---

## Render.com Free Tier Limitations

- **512MB RAM**  sufficient for FastAPI + ChromaDB reads (build vectorstore before deploy)
- **750 hrs/month**  one service runs 24/7 for a month
- **Cold starts**  first request after inactivity takes ~30s (free tier sleeps after 15min)
  - Mitigation: Set up a `/health` ping every 14 minutes via UptimeRobot (free)

---

## Daily Development Commands

```bash
# Backend (in backend/ with venv active)
uvicorn main:app --reload --port 8000

# Frontend (in frontend/)
npm run dev

# Run all backend tests
cd backend && pytest tests/ -v

# Run specific test
pytest tests/test_challan.py::test_drunk_driving_first_offence -v

# Create new DB migration after model changes
alembic revision --autogenerate -m "add_crash_events_table"
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Rebuild ChromaDB (after adding PDFs)
python data/build_vectorstore.py

# Test API manually
curl "http://localhost:8000/api/v1/emergency/nearby?lat=13.0827&lon=80.2707"
curl "http://localhost:8000/api/v1/challan/calculate?violation_code=MVA_185"
```

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
