# SafeVisionAI - Environment Variables

All environment variables needed to run the project locally and in production.

---

## Backend - `backend/.env`

Copy `backend/.env.example` and fill in each value.

```bash
cp backend/.env.example backend/.env
```

### Database

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with asyncpg driver | Supabase -> Settings -> Database -> URI (replace `postgresql://` with `postgresql+asyncpg://`) |
| `SUPABASE_URL` | Your Supabase project URL | Supabase -> Settings -> API -> Project URL |
| `SUPABASE_ANON_KEY` | Public anon key (read-only) | Supabase -> Settings -> API -> anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key (admin access) | Supabase -> Settings -> API -> service_role |

Example format:
```
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cache (Redis)

| Variable | Description | Where to get it |
|---|---|---|
| `REDIS_URL` | Upstash Redis connection string with TLS | Upstash -> Database -> Connect -> .env tab |

Example format:
```
REDIS_URL=rediss://default:[TOKEN]@[HOST].upstash.io:6379
```

### AI / Groq

| Variable | Description | Where to get it |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for llama3-70b | console.groq.com -> API Keys -> Create Key |
| `GROQ_MODEL` | Model name to use | Set to: `llama3-70b-8192` |
| `CHROMA_PATH` | Local path where ChromaDB stores vector index | Set to: `data/chroma_db` |

Example format:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama3-70b-8192
CHROMA_PATH=data/chroma_db
```

### App Config

| Variable | Description | Recommended value |
|---|---|---|
| `ENVIRONMENT` | Running environment | `development` or `production` |
| `DEFAULT_RADIUS` | Default search radius in meters | `5000` |
| `MAX_RADIUS` | Maximum expandable radius in meters | `50000` |
| `CACHE_TTL` | Default Redis cache expiry in seconds | `3600` |

Example format:
```
ENVIRONMENT=development
DEFAULT_RADIUS=5000
MAX_RADIUS=50000
CACHE_TTL=3600
```

---

## Frontend - `frontend/.env.local`

Copy `frontend/.env.local.example` and fill in each value.

```bash
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Description | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the running FastAPI backend | `http://localhost:8000` (local) or your Render.com URL (production) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Same as backend `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key only - never service role | Same as backend `SUPABASE_ANON_KEY` |

Example format:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> IMPORTANT: Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend .env. That key has admin access and must stay in the backend only.

> IMPORTANT: All frontend env variables must start with `NEXT_PUBLIC_` to be accessible in the browser.

---

## Production Environment Variables

When deploying, set these in the hosting dashboards instead of .env files.

### Render.com (Backend)

Go to: Render Dashboard -> Your Service -> Environment

Set all backend variables from the list above with production values:
- `DATABASE_URL` - same Supabase URL (it's already production)
- `REDIS_URL` - same Upstash URL (already production)
- `GROQ_API_KEY` - same key
- `CHROMA_PATH` - set to `data/chroma_db`
- `ENVIRONMENT` - set to `production`
- `DEFAULT_RADIUS` - `5000`
- `MAX_RADIUS` - `50000`
- `CACHE_TTL` - `3600`

### Vercel (Frontend)

Go to: Vercel Dashboard -> Project -> Settings -> Environment Variables

Set:
- `NEXT_PUBLIC_API_URL` - your Render.com service URL e.g. `https://safevisionai-api.onrender.com`
- `NEXT_PUBLIC_SUPABASE_URL` - your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - your Supabase anon key

---

## Free Tier Accounts Needed

| Service | Sign up at | Used for | Free limit |
|---|---|---|---|
| Supabase | supabase.com | PostgreSQL + PostGIS database | 500MB DB, 2GB bandwidth |
| Upstash | upstash.com | Redis cache | 10,000 commands/day |
| Groq | console.groq.com | llama3-70b LLM API | 14,400 requests/day |
| Vercel | vercel.com | Frontend hosting | Unlimited for personal |
| Render.com | render.com | Backend hosting | 750 hours/month free |

All services have free tiers sufficient for a hackathon demo. No credit card needed for any of them.

---

## Security Notes

- `.env` and `.env.local` are in `.gitignore` - they will never be committed
- Never log or print API keys in your code
- Never put secrets in frontend code - only `NEXT_PUBLIC_*` vars in frontend
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - use it only on the backend and only when absolutely necessary

---

*For full setup steps, see `SETUP.md`*
*For deployment steps, see `docs/Deployment.md`*
