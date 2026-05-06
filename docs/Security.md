# SafeVixAI  Security

## Security Overview

SafeVixAI handles sensitive user data (GPS location, blood group, emergency contacts) and makes calls to emergency services. Security is critical even for a hackathon MVP.

---

## 1. Authentication & Authorization

### Current Implementation
- **JWT Authentication**: Email/OTP flow in `backend/api/v1/auth.py`. JWT tokens issued and validated via `core/security.py`.
- **Bearer token injection**: Frontend API client (`lib/api.ts`) attaches Bearer token from Zustand store (in-memory only — NOT persisted to localStorage).
- **Admin endpoints**: Protected via `ADMIN_SECRET` header (chatbot RAG rebuild, index management).
- **Error boundary**: `frontend/app/error.tsx` catches all unhandled errors — prevents white screen crashes.
- **Environment validation**: `frontend/lib/public-env.ts` throws at import time if any `NEXT_PUBLIC_*` URL is missing.

---

## 2. API Security

### CORS Configuration
```python
# backend/core/config.py — CORS is environment-driven with fail-fast in production
# If ENVIRONMENT=production and CORS_ORIGINS="*", the app raises RuntimeError at startup.
# Same guard exists in chatbot_service/config.py.

# Production CORS_ORIGINS env var example:
# CORS_ORIGINS=https://safevixai.vercel.app,https://safevixai-backup.vercel.app
```

**Key enforcement:** Both backend and chatbot services **raise RuntimeError** on startup if `CORS_ORIGINS` is set to `*` in production mode. This is a hard fail-fast, not a warning.

### Input Validation
- All request parameters validated via **Pydantic** schemas
- GPS coordinates validated: lat  [-90, 90], lon  [-180, 180]
- Photo uploads: filetype validation, 10MB max size limit via `python-multipart`
- SQL injection: **impossible**  SQLAlchemy parameterized queries only
- Violation codes: validated against whitelist pattern `^MVA_[A-Z0-9_]+$`

### Rate Limiting

> **Status: ✅ Implemented** via `slowapi` (IP-based)

Rate limiting is enforced in production using `slowapi` with IP-based key extraction:

```python
# backend/core/limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

# Active limits (decorator-based on route handlers):
# chat.py:       @limiter.limit("5/minute")    — LLM calls
# emergency.py:  @limiter.limit("10/minute")   — emergency service lookups
# roadwatch.py:  @limiter.limit("8/minute")    — road issue reports
```

The limiter middleware is registered in `backend/main.py` via `app.state.limiter` with `_rate_limit_exceeded_handler` for clean 429 responses.

---

## 3. Data Privacy

### What We Store vs. What We Don't

| Data | Stored? | Where | Notes |
|---|---|---|---|
| GPS coordinates (emergency search) | No | Redis cache key only (no IP link) | Coordinates cached, not logged |
| GPS coordinates (road report) | Yes | PostgreSQL road_issues table | Required for complaint routing |
| Blood group | No | Browser IndexedDB only | Never sent to server |
| Emergency contacts | No | Browser IndexedDB only | Never sent to server |
| Vehicle number | No | Browser IndexedDB only | Only included in WhatsApp message |
| Chat messages (online) | Yes | Redis (24hr TTL) | Session-only, auto-deleted |
| Chat messages (offline) | No | Never leaves device | WebLLM runs fully locally |
| Crash detection events | Planned | PostgreSQL crash_events (V2) | Anonymised lat/lon only, no user ID (not yet implemented) |
| Photos (road reports) | Yes | Local/Render Disk | User-submitted evidence (Supabase Storage in V2) |

### Anonymized Crash Heatmap
```python
# Only store anonymised coordinates, rounded to ~100m precision
# Never store: user_id, IP, exact timestamp, or device info
crash_event = {
    "lat": round(event.lat, 3),  # ~100m precision
    "lon": round(event.lon, 3),
    "hour_bucket": event.timestamp.strftime("%Y-%m-%d %H"),  # hour only, not minutes
}
```

### GDPR / Privacy Principles Applied
- **Data minimization**: Only collect what's strictly needed
- **Purpose limitation**: Emergency location not used for analytics
- **Storage limitation**: Chat history auto-deleted after 24 hours
- **Local processing**: All offline AI inference stays on device
- **User consent**: Blood group/contacts stored only after explicit user action

---

## 4. Transport Security

- All traffic over **HTTPS** (Vercel + Render both enforce HTTPS)
- Upstash Redis connection over **TLS** (`rediss://` scheme)
- Supabase connection over **SSL** (`?sslmode=require` in connection string)
- WebSocket connections use **WSS** (secure WebSocket)
- Groq API calls over **HTTPS** with API key in header (not URL)

---

## 5. Secret Management

### Environment Variables (Never Hardcode)

```bash
# backend/.env  never commit this file
DATABASE_URL=postgresql+asyncpg://...    # PostgreSQL connection string
GROQ_API_KEY=gsk_...                     # Groq API key
REDIS_URL=rediss://...                   # Upstash Redis TLS URL
ADMIN_SECRET=...                         # Admin validation token

# frontend/.env.local  never commit this file
NEXT_PUBLIC_API_URL=https://...         # Backend URL (public)
```

### GitHub Actions Secrets
- All secret values stored in **GitHub Secrets** (not in code)
- Referenced in CI/CD via `${{ secrets.GROQ_API_KEY }}`

---

## 6. Content Security

### Photo Upload Safety
- Filetype validated by MIME type AND magic bytes (file signature validation)
- Maximum upload size: 10MB enforced via `python-multipart`
- *(Planned V2)* Image resized server-side before storing (prevents polyglot attacks)
- *(Planned V2)* Supabase Storage serves from CDN  isolated from application server
- *(Planned V2)* Virus scanning: TODO for production

### AI Output Safety
```python
# Chatbot safety check  always prepend emergency numbers for injury queries
SAFETY_OVERRIDE = {
    "keywords": ["bleeding", "unconscious", "accident", "injury", "crash"],
    "prepend": "Call 112 immediately for emergency services. ",
}

def apply_safety_check(message: str, response: str) -> str:
    if any(kw in message.lower() for kw in SAFETY_OVERRIDE["keywords"]):
        return SAFETY_OVERRIDE["prepend"] + response
    return response
```

### Prompt Injection Defense
- **12-pattern guard**: `chatbot_service/providers/base.py` checks every user message against 12 prohibited injection patterns ("ignore previous instructions", "you are now", "system prompt", etc.) BEFORE sending to any LLM.
- **SafetyChecker**: `chatbot_service/agent/safety_checker.py` blocks harmful queries ("how to fake an accident", "how to escape after hit and run", etc.) with a firm refusal + 112 redirect.
- Intent detection runs before RAG to classify and scope the query.
- LLM provider timeout: `asyncio.wait_for()` enforced on every provider call via `ProviderRouter._generate_with_timeout()` — prevents infinite hangs.
- RAG context explicitly instructed: "Answer ONLY from the provided text."

---

## 7. Dependency Security

- All Python packages **pinned** in requirements.txt (no floating versions)
- All npm packages **pinned** in package.json
- GitHub Dependabot enabled for automated security updates
- `pip audit` runs in CI to check for known CVEs
- `npm audit` runs in CI frontend build step

---

## 8. Hackathon-Specific Notes

For production deployment (post-hackathon), the following would be added:
- Full JWT authentication for all mutation endpoints
- IP-based rate limiting at CDN level (Vercel Edge)
- Proper audit logging for all road reports
- Compliance review for DPDP Act (India's data protection law)
- Penetration testing before public launch

---

*Document version: 1.1 | IIT Madras Road Safety Hackathon 2026 | Updated: May 2026*
