# SafeVisionAI  Security

## Security Overview

SafeVisionAI handles sensitive user data (GPS location, blood group, emergency contacts) and makes calls to emergency services. Security is critical even for a hackathon MVP.

---

## 1. Authentication & Authorization

### Current (Hackathon MVP)
- Most endpoints are **public**  no auth required for emergency features
- Road issue reports optionally associate a Supabase Auth `user_id`
- Supabase anon key used for frontend DB access (read-only via RLS)
- Supabase service role key used only on backend (never exposed to browser)

### Supabase Row Level Security (RLS)
*(Planned for V2 - Post Hackathon)*
Row Level Security will be enabled on the database tables to ensure users can only access reports they have submitted. Currently, for the V1 Hackathon MVP, all data access relies on backend API filtering.

---

## 2. API Security

### CORS Configuration
```python
# main.py  Restrict to known origins in production
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "https://safevisionai.vercel.app",
    "http://localhost:3000",  # dev only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### Input Validation
- All request parameters validated via **Pydantic** schemas
- GPS coordinates validated: lat  [-90, 90], lon  [-180, 180]
- Photo uploads: filetype validation, 10MB max size limit via `python-multipart`
- SQL injection: **impossible**  SQLAlchemy parameterized queries only
- Violation codes: validated against whitelist pattern `^MVA_[A-Z0-9_]+$`

### Rate Limiting
```python
# Protect expensive AI endpoints from abuse
# Implemented via Redis sliding window

RATE_LIMITS = {
    "/api/v1/chat/message": "30/minute",      # LLM calls
    "/api/v1/roads/report": "10/minute",       # Prevent spam reports
    "/api/v1/geocode/search": "60/minute",     # Nominatim rate limit compliance
    "/api/v1/emergency/nearby": "120/minute",  # Allow frequent location updates
}
```

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
| Crash detection events | Anonymised lat/lon only | PostgreSQL crash_events | No user ID, no timestamp precision |
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
DATABASE_URL=postgresql+asyncpg://...    # Supabase connection string
GROQ_API_KEY=gsk_...                     # Groq API key
REDIS_URL=rediss://...                   # Upstash Redis TLS URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Admin key  backend only

# frontend/.env.local  never commit this file
NEXT_PUBLIC_API_URL=https://...         # Backend URL (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Anon key only (read-only)
```

### GitHub Actions Secrets
- All secret values stored in **GitHub Secrets** (not in code)
- Referenced in CI/CD via `${{ secrets.GROQ_API_KEY }}`
- Service role key never used in GitHub Actions workflows

---

## 6. Content Security

### Photo Upload Safety
- Filetype validated by MIME type AND file extension
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
- System prompt is immutable  user cannot override it
- Intent detection runs before RAG to prevent jailbreak attempts
- Groq model temperature set to 0.3 (low creativity, high factual grounding)
- RAG context explicitly instructed: "Answer ONLY from the provided text"

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

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
