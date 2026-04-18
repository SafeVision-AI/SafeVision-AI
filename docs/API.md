# SafeVisionAI  API Reference

## Base URLs

| Environment | URL |
|---|---|
| Development (Backend) | `http://localhost:8000` |
| Development (Frontend) | `http://localhost:3000` |
| Production (Backend) | `https://safevisionai-api.onrender.com` |
| Production (Frontend) | `https://safevisionai.vercel.app` |

Auto-generated Swagger docs available at: `{BASE_URL}/docs`

---

## Authentication

Most endpoints are public (no auth required for hackathon MVP). Road issue reporting optionally attaches a `reporter_id` from Supabase Auth.

---

## Endpoints

### System

#### `GET /health`
Returns server status, chatbot readiness, and environment info.

**Response:**
```json
{
  "status": "ok",
  "chatbot_ready": true,
  "environment": "production",
  "version": "1.0.0"
}
```

---

### Emergency (`/api/v1/emergency`)

#### `GET /api/v1/emergency/nearby`
Find nearest emergency services at given GPS coordinates.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `lat` | float | required | Latitude (e.g., 13.0827) |
| `lon` | float | required | Longitude (e.g., 80.2707) |
| `radius` | int | 5000 | Search radius in meters |
| `categories` | string | all | Comma-separated: hospital,police,ambulance,fire,towing |
| `limit` | int | 20 | Max results to return |

**Response:**
```json
{
  "services": [
    {
      "name": "Apollo Hospital",
      "category": "hospital",
      "sub_category": "trauma_centre",
      "phone": "+91-44-28291919",
      "lat": 13.0621,
      "lon": 80.2812,
      "distance_meters": 2300,
      "has_trauma": true,
      "has_icu": true,
      "is_24hr": true,
      "address": "21 Greams Lane, Thousand Lights, Chennai"
    }
  ],
  "count": 15,
  "radius_used": 5000,
  "source": "database"
}
```

**Redis cache key:** `nearby:{lat:.4f}:{lon:.4f}:{radius}:{categories}`
**Cache TTL:** 3600 seconds

#### `GET /api/v1/emergency/sos`
Returns all service categories + all national emergency numbers (for SOS WhatsApp message generation).

**Query Params:** `lat`, `lon`

#### `GET /api/v1/emergency/numbers`
Returns static dict of all national emergency numbers (112, 102, 100, 1033, 108 etc.).

---

### Chat (`/api/v1/chat`)

#### `POST /api/v1/chat/message`
Send a message to the AI chatbot.

**Request Body:**
```json
{
  "message": "nearest hospital to my location",
  "session_id": "uuid-v4-string",
  "lat": 13.0827,
  "lon": 80.2707,
  "language": "en"
}
```

**Response:**
```json
{
  "answer": "The nearest trauma centre is Apollo Hospital, 2.3km away. Call +91-44-28291919. For emergency, dial 112 immediately.",
  "intent": "FIND_HOSPITAL",
  "sources": [
    {"document": "who_trauma_care_guidelines.pdf", "page": 45}
  ],
  "model_used": "groq-llama-3.3-70b",
  "latency_ms": 1240
}
```

#### `WebSocket /api/v1/chat/stream`
Streaming chat response  tokens delivered as they are generated.

**Send:** `{"message": "...", "session_id": "...", "lat": 0.0, "lon": 0.0}`

**Receive:** `{"token": "The ", "done": false}`  `{"token": "", "done": true, "intent": "LEGAL_INFO"}`

#### `GET /api/v1/chat/history/{session_id}`
Returns last 20 message pairs for a session (from Redis).

---

### Challan (`/api/v1/challan`)

#### `GET /api/v1/challan/calculate`
Calculate fine for a specific traffic violation.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `violation_code` | string | required | e.g., `MVA_185` |
| `vehicle_type` | string | `all` | 2w, lmv, commercial, bus |
| `state_code` | string | None | TN, KA, MH, DL, AP etc. |
| `is_repeat` | bool | false | Whether repeat offence |

**Response:**
```json
{
  "violation_code": "MVA_185",
  "section": "185",
  "description_en": "Drunk driving  first offence",
  "base_fine_inr": 10000,
  "state_override_fine": null,
  "final_fine_inr": 10000,
  "repeat_fine_inr": 15000,
  "imprisonment": "6 months",
  "dl_points": 0,
  "state_code": null,
  "effective_date": "2019-09-01"
}
```

**Error:** `404` if `violation_code` not found.

#### `GET /api/v1/challan/violations`
List all violations, filterable by vehicle type or search string.

**Query Params:** `vehicle_type?`, `search?` (searches description_en)

#### `GET /api/v1/challan/states/{code}`
Get all state-specific fine overrides for a state code (e.g., `/states/TN`).

---

### Roads (`/api/v1/roads`)

#### `POST /api/v1/roads/report`
Submit a new road issue report.

**Request:** Multipart form data
| Field | Type | Required | Description |
|---|---|---|---|
| `issue_type` | string | Yes | pothole, flood, broken, missing_signage, no_lighting, accident_prone |
| `severity` | int (1-5) | Yes | 1=minor, 5=impassable |
| `lat` | float | Yes | GPS latitude of issue |
| `lon` | float | Yes | GPS longitude of issue |
| `description` | string | No | Optional description |
| `photo` | file | No | Photo of road issue |

**Response:**
```json
{
  "uuid": "rs-2026-03-tn-00847",
  "authority_name": "NHAI",
  "authority_phone": "1033",
  "complaint_portal": "https://nhai.gov.in/complaint",
  "road_type": "National Highway",
  "road_number": "NH-44",
  "exec_engineer": "Mr. Rajesh Kumar",
  "exec_engineer_phone": "+91-44-28263851",
  "last_relayed_date": "2023-03",
  "next_maintenance": "2025-09",
  "budget_sanctioned": 452000000,
  "budget_spent": 387000000
}
```

#### `GET /api/v1/roads/authority`
Look up responsible authority for given GPS coordinates without submitting a report.

**Query Params:** `lat`, `lon`

#### `GET /api/v1/roads/issues`
Get nearby community-reported road issues for the map layer.

**Query Params:** `lat`, `lon`, `radius` (default 5000m)

#### `GET /api/v1/roads/infrastructure`
Get road infrastructure data (contractor, budget, engineer) at coordinates.

**Query Params:** `lat`, `lon`

---

### Geocoding (`/api/v1/geocode`)

#### `GET /api/v1/geocode/search`
Forward geocoding: text address  GPS coordinates.

**Query Params:** `q` (address string)

#### `GET /api/v1/geocode/reverse`
Reverse geocoding: GPS  address, city, state, country.

**Query Params:** `lat`, `lon`

**Response:**
```json
{
  "display_name": "Tambaram, Chennai, Tamil Nadu, India",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "state_code": "TN",
  "country_code": "IN",
  "postcode": "600045"
}
```

---

### Offline Data (`/api/v1/offline`)

#### `GET /api/v1/offline/bundle/{city}`
Returns GeoJSON bundle of emergency services for a specific city (for offline pre-loading).

**Response:** GeoJSON FeatureCollection

---

## Error Responses

| Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request (invalid params) |
| 404 | Resource not found (e.g., violation_code not in DB) |
| 422 | Validation error (e.g., lat out of range -90 to 90) |
| 429 | Rate limited (Nominatim 1 req/sec) |
| 500 | Internal server error |
| 503 | LLM service unavailable (All 11 providers down  use offline fallback) |

---

## Rate Limits (Free Tier Constraints)

| Service | Limit | Our Handling |
|---|---|---|
| Main LLM APIs | Varies per provider | 11-provider fallback chain + offline AI |
| Nominatim geocoder | 1 req/sec | Redis cache (86400s TTL) + rate limiter |
| Overpass API | Fair use ~1 req/sec | Redis cache (3600s TTL) per coordinate |
| Upstash Redis | 10,000 commands/day | Efficient cache keys, no redundant writes |

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
