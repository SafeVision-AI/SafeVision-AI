# SafeVisionAI — Environment Variables

All environment variables needed to run the project's **three services** locally and in production.

---

## Backend — `backend/.env`

Copy `backend/.env.example` and fill in each value.

```bash
cp backend/.env.example backend/.env
```

### Database

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with asyncpg driver | Supabase → Settings → Database → URI (replace `postgresql://` with `postgresql+asyncpg://`) |

Example format:
```
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Cache (Redis)

| Variable | Description | Where to get it |
|---|---|---|
| `REDIS_URL` | Upstash Redis connection string with TLS | Upstash → Database → Connect → .env tab |

> Optional — falls back to in-memory cache if missing.

### Service Connection

| Variable | Description | Default |
|---|---|---|
| `CHATBOT_SERVICE_URL` | URL of the chatbot service | `http://localhost:8010/api/v1` |

### External APIs

| Variable | Required | Description |
|---|---|---|
| `OVERPASS_URLS` | No | Comma-separated Overpass API endpoints |
| `OPENROUTESERVICE_API_KEY` | No | For routing (free tier available) |
| `DATA_GOV_API_KEY` | No | For government data endpoints |

### App Config

| Variable | Description | Recommended value |
|---|---|---|
| `ENVIRONMENT` | Running environment | `development` or `production` |
| `DEFAULT_RADIUS` | Default search radius in meters | `5000` |
| `MAX_RADIUS` | Maximum expandable radius in meters | `50000` |
| `CACHE_TTL` | Default Redis cache expiry in seconds | `3600` |

---

## Chatbot Service — `chatbot_service/.env`

Copy `chatbot_service/.env.example` and fill in each value.

```bash
cp chatbot_service/.env.example chatbot_service/.env
```

### LLM Provider API Keys

| Variable | Required | Provider |
|---|---|---|
| `DEFAULT_LLM_PROVIDER` | Yes | Default: `groq` |
| `DEFAULT_LLM_MODEL` | Yes | Model ID for chosen provider |
| `GROQ_API_KEY` | For Groq | Primary English provider (300+ tok/s) |
| `CEREBRAS_API_KEY` | For Cerebras | Speed overflow (2000+ tok/s) |
| `GEMINI_API_KEY` | For Gemini | Google Gemini 1.5 Flash (1M context) |
| `SARVAM_API_KEY` | For Sarvam | Indian language specialist |
| `GITHUB_TOKEN` | For GitHub Models | Free with GitHub account |
| `NVIDIA_NIM_API_KEY` | For NVIDIA NIM | GPU-optimized inference |
| `OPENROUTER_API_KEY` | For OpenRouter | Gateway to 20+ models |
| `MISTRAL_API_KEY` | For Mistral | 1B tokens/month free |
| `TOGETHER_API_KEY` | For Together | $25 free credit |

> You only need keys for providers you want to enable. The ProviderRouter auto-skips providers without keys.

| `HF_TOKEN` | No | HuggingFace — fallback for Sarvam, Shuka, BharatGen, Whisper via HF Inference API. Not needed for core chatbot flow |

### Backend Connection

| Variable | Description | Default |
|---|---|---|
| `MAIN_BACKEND_BASE_URL` | URL of the main backend API | `http://localhost:8000` |

### RAG Configuration

| Variable | Description | Default |
|---|---|---|
| `CHROMA_PERSIST_DIR` | Path to ChromaDB vectorstore | `./data/chroma_db` |
| `EMBEDDING_MODEL` | Sentence-transformers model name | `sentence-transformers/all-MiniLM-L6-v2` |

### Other Services

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | No | Redis for conversation memory (falls back to in-memory) |
| `OPENWEATHER_API_KEY` | No | Required for the WeatherTool |

---

## Frontend — `frontend/.env.local`

```bash
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Description | Value |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | URL of backend API | `http://localhost:8000` (local) or Render URL (prod) |
| `NEXT_PUBLIC_CHATBOT_URL` | URL of chatbot service | `http://localhost:8010` (local) or Render URL (prod) |

> **IMPORTANT:** All frontend env variables must start with `NEXT_PUBLIC_` to be accessible in the browser.

---

## Production Environment Variables

When deploying, set these in the hosting dashboards instead of .env files.

### Render.com — Backend Service

Set all backend variables with production values:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `REDIS_URL` — Upstash Redis URL
- `CHATBOT_SERVICE_URL` — Render chatbot service URL (internal)
- `ENVIRONMENT` — set to `production`

### Render.com — Chatbot Service

Set all chatbot variables:
- `DEFAULT_LLM_PROVIDER`, `DEFAULT_LLM_MODEL`
- All LLM provider API keys you want active
- `MAIN_BACKEND_BASE_URL` — Render backend URL
- `REDIS_URL` — same Upstash URL
- `CHROMA_PERSIST_DIR` — `./data/chroma_db`

### Vercel — Frontend

- `NEXT_PUBLIC_BACKEND_URL` — your Render backend URL
- `NEXT_PUBLIC_CHATBOT_URL` — your Render chatbot URL

---

## Free Tier Accounts Needed

| Service | Sign up at | Used for | Free limit |
|---|---|---|---|
| Supabase | supabase.com | PostgreSQL + PostGIS database | 500MB DB, 2GB bandwidth |
| Upstash | upstash.com | Redis cache | 10,000 commands/day |
| Groq | console.groq.com | Primary LLM API | 14,400 requests/day |
| Sarvam AI | sarvam.ai | Indian language LLM | Free tier available |
| Vercel | vercel.com | Frontend hosting | Unlimited for personal |
| Render.com | render.com | Backend + chatbot hosting | 750 hours/month free |

All services have free tiers sufficient for a hackathon demo. No credit card needed for any of them.

---

## Security Notes

- `.env` and `.env.local` are in `.gitignore` — they will never be committed
- Never log or print API keys in your code
- Never put secrets in frontend code — only `NEXT_PUBLIC_*` vars in frontend
- Backend and chatbot service each have their **own** `.env` — don't mix them

---

*For full setup steps, see `SETUP.md`*
*For deployment steps, see `docs/Deployment.md`*
