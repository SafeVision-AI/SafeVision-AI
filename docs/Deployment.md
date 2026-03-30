# SafeVisionAI â€” Deployment Guide

## Infrastructure Overview (All Free Tier)

| Service | Provider | URL | Purpose |
|---|---|---|---|
| Frontend | Vercel | `safevisionai.vercel.app` | Next.js PWA, global CDN |
| Backend | Render.com | `safevisionai-api.onrender.com` | FastAPI, 750h/month free |
| Database | Supabase | `[project].supabase.co` | PostgreSQL + PostGIS |
| Cache | Upstash | `[host].upstash.io` | Redis, 10K commands/day |
| LLM API | Groq | `api.groq.com` | llama3-70b, 6000 tok/min |
| Model CDN | Hugging Face | `huggingface.co` | WebLLM weights |
| CI/CD | GitHub Actions | â€” | Auto-deploy on push |

---

## Step 1: Create Free Accounts

1. **Groq** â†’ [console.groq.com](https://console.groq.com) â€” Create account â†’ API Keys â†’ Create Key (starts with `gsk_`)
2. **Supabase** â†’ [supabase.com](https://supabase.com) â€” New project â†’ Region: Singapore (closest to India) â†’ Save password
3. **Upstash** â†’ [upstash.com](https://upstash.com) â€” New Redis Database â†’ Global â†’ Copy `REDIS_URL`
4. **Vercel** â†’ [vercel.com](https://vercel.com) â€” Connect GitHub account
5. **Render.com** â†’ [render.com](https://render.com) â€” Connect GitHub account
6. **data.gov.in** â†’ [data.gov.in](https://data.gov.in) â€” Register â†’ Get API key (for NHAI data)

---

## Step 2: Database Setup (Supabase)

### Enable PostGIS (Run in Supabase SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT PostGIS_version(); -- verify: should return version string
```

### Get Connection String
Supabase â†’ Settings â†’ Database â†’ Connection string â†’ URI

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
# Check Supabase Table Editor â€” should see 6 tables
```

### Download Required PDFs (for RAG)

```
Download to backend/data/:
- motor_vehicles_act_1988.pdf    â†’ indiacode.nic.in
- mv_amendment_act_2019.pdf      â†’ morth.nic.in
- who_trauma_care_guidelines.pdf â†’ who.int
```

### Seed the Database

```bash
# Seed traffic violations and state overrides (~2 seconds)
python data/seed_violations.py

# Seed emergency services for 25 Indian cities (~4 minutes via Overpass API)
# Also creates: frontend/public/offline-data/india-emergency.geojson
python data/seed_emergency.py

# Build ChromaDB vector store from PDFs â€” RUN ONCE, takes 5-10 minutes
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
# 1. DevTools â†’ Application â†’ Service Workers â†’ verify registered
# 2. DevTools â†’ Network â†’ check "Offline"
# 3. Navigate to /emergency â€” hospitals should still show
```

---

## Step 5: Deploy Backend to Render.com

### Via render.yaml (Recommended)

The `render.yaml` at the project root configures automatic deployment.

1. Go to Render.com â†’ New â†’ Blueprint
2. Connect GitHub repository
3. Render detects `render.yaml` automatically
4. Set environment variables (from Render dashboard):
   - `DATABASE_URL`
   - `REDIS_URL`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Manual Setup (Alternative)

Render.com â†’ New â†’ Web Service:
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

## Step 6: Deploy Frontend to Vercel

### Via GitHub Integration (Recommended)

1. Vercel Dashboard â†’ New Project â†’ Import from GitHub
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
# Chrome â†’ visit safevisionai.vercel.app â†’ check "Add to Home Screen" prompt
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
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cache
REDIS_URL=rediss://default:[TOKEN]@[HOST].upstash.io:6379

# AI
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama3-70b-8192
CHROMA_PATH=data/chroma_db

# App
ENVIRONMENT=production
DEFAULT_RADIUS=5000
MAX_RADIUS=50000
CACHE_TTL=3600
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://safevisionai-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Render.com Free Tier Limitations

- **512MB RAM** â€” sufficient for FastAPI + ChromaDB reads (build vectorstore before deploy)
- **750 hrs/month** â€” one service runs 24/7 for a month
- **Cold starts** â€” first request after inactivity takes ~30s (free tier sleeps after 15min)
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
