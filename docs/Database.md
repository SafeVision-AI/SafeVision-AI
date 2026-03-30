# SafeVisionAI  Database Design

## Database: PostgreSQL 16 + PostGIS 3.4 (via Supabase)

**Why PostGIS?** The `ST_DWithin` function with GIST index finds all emergency services within a radius in **< 50ms** regardless of table size. Always cast to `::geography` (not `::geometry`)  geography uses meters, geometry uses degrees.

>  **Critical**: `ST_MakePoint` takes **longitude FIRST, latitude SECOND**. This is opposite to the common lat,lon convention.

---

## Enable PostGIS (Run Once in Supabase SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT PostGIS_version(); -- verify
```

---

## Tables

### 1. `emergency_services`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | BIGSERIAL | PRIMARY KEY | Auto-increment internal ID |
| osm_id | BIGINT | UNIQUE, NULLABLE | OSM element ID  prevents duplicate inserts |
| osm_type | TEXT |  | node, way, or relation |
| name | TEXT | NOT NULL | Service name in English |
| name_local | TEXT |  | Local language name (Tamil, Hindi, etc.) |
| category | TEXT | NOT NULL, INDEX | hospital, police, ambulance, fire, towing, puncture, showroom |
| sub_category | TEXT |  | trauma_centre, icu, district_hospital, etc. |
| address | TEXT |  | Full address from OSM addr:* tags |
| phone | TEXT |  | General contact number |
| phone_emergency | TEXT |  | Dedicated emergency line |
| website | TEXT |  | Website URL |
| **location** | GEOMETRY(Point,4326) | NOT NULL, **GIST INDEX** | PostGIS geographic point |
| city | TEXT |  | City name for display |
| district | TEXT |  | Administrative district |
| state | TEXT |  | Full state name |
| state_code | CHAR(2) | INDEX | TN, KA, MH, DL etc. |
| country_code | CHAR(2) | DEFAULT 'IN', INDEX | Global applicability  ISO 3166 |
| is_24hr | BOOLEAN | DEFAULT TRUE | Round-the-clock filtering |
| has_trauma | BOOLEAN | DEFAULT FALSE | Trauma centre  priority sort |
| has_icu | BOOLEAN | DEFAULT FALSE | ICU availability |
| bed_count | INTEGER |  | Total bed capacity |
| rating | FLOAT | CHECK 0-5 | User rating |
| source | TEXT | DEFAULT 'overpass' | overpass, govt_dataset, manual, user_verified |
| raw_tags | JSONB |  | Complete OSM tag set |
| verified | BOOLEAN | DEFAULT FALSE | Manually verified flag |
| last_updated | TIMESTAMP | DEFAULT NOW() | For re-seeding identification |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

### 2. `traffic_violations`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| violation_code | TEXT | UNIQUE PRIMARY KEY | MVA_177, MVA_185 etc. |
| section | TEXT | NOT NULL | Section number (e.g., '185') |
| description_en | TEXT | NOT NULL | Plain English violation description |
| description_hi | TEXT |  | Hindi translation |
| description_ta | TEXT |  | Tamil translation |
| base_fine_inr | INTEGER | NOT NULL | First offence fine in  |
| repeat_fine_inr | INTEGER |  | Subsequent offence fine |
| vehicle_type | TEXT | DEFAULT 'all' | all, 2w, lmv, 4w, commercial, bus |
| imprisonment | TEXT | NULLABLE | '3 months', '6 months', NULL if none |
| dl_points | INTEGER | DEFAULT 0 | DL penalty points |
| is_compoundable | BOOLEAN | DEFAULT TRUE | Can settle out of court |
| effective_date | DATE | NOT NULL, DEFAULT 2019-09-01 | MV Amendment Act 2019 date |

### 3. `state_fine_overrides`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY |  |
| violation_code | TEXT | FK  traffic_violations | National violation reference |
| state_code | CHAR(2) | NOT NULL | TN, KA, MH, DL, etc. |
| override_fine | INTEGER | NOT NULL | State-specific fine in  |
| authority | TEXT |  | State Traffic Police etc. |
| source_url | TEXT |  | Source URL for verification |
| effective_date | DATE | NOT NULL | When state override took effect |
|  | UNIQUE | (violation_code, state_code) | Prevents duplicates |

### 4. `road_issues`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | BIGSERIAL | PRIMARY KEY |  |
| uuid | UUID | UNIQUE, DEFAULT gen_random_uuid() | Public complaint reference |
| issue_type | TEXT | NOT NULL | pothole, flood, accident_prone, broken, missing_signage, no_lighting |
| severity | INTEGER | CHECK 1-5 | 1=minor, 5=impassable |
| description | TEXT |  | Optional user description |
| **location** | GEOMETRY(Point,4326) | NOT NULL, **GIST INDEX** | GPS of issue |
| location_address | TEXT |  | Reverse-geocoded address |
| road_name | TEXT |  | Road name from OSM or user |
| road_type | TEXT |  | NH, SH, MDR, village_road, urban |
| road_number | TEXT |  | NH-44, SH-12 etc. |
| photo_url | TEXT |  | Supabase Storage URL |
| ai_detection | JSONB |  | {detected, confidence, severity, bounding_boxes} |
| reporter_id | UUID | NULLABLE | Anonymous or logged-in user |
| authority_name | TEXT |  | NHAI, Tamil Nadu PWD etc. |
| authority_phone | TEXT |  | Auto-assigned helpline |
| authority_email | TEXT |  | Auto-assigned email |
| complaint_ref | TEXT |  | Government portal reference |
| status | TEXT | DEFAULT 'open' | open, acknowledged, in_progress, resolved, rejected |
| status_updated | TIMESTAMP |  | Last status change timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Report submission time |

### 5. `road_infrastructure`

| Column | Type | Purpose |
|---|---|---|
| road_id | TEXT UNIQUE | PMGSY or NHAI project ID |
| road_name | TEXT | Road name |
| road_type | TEXT | NH, SH, MDR, village_road |
| road_number | TEXT | NH-44, SH-12 etc. |
| length_km | FLOAT | Road segment length |
| geometry | GEOMETRY(LineString,4326) | Road path  GIST indexed |
| state_code | CHAR(2) | State for filtering |
| contractor_name | TEXT | Assigned contractor |
| exec_engineer | TEXT | Responsible Executive Engineer |
| exec_engineer_phone | TEXT | EE contact number |
| budget_sanctioned | BIGINT | Sanctioned budget in  |
| budget_spent | BIGINT | Amount spent to date in  |
| construction_date | DATE | When road was built |
| last_relayed_date | DATE | Last resurfacing date |
| next_maintenance | DATE | Scheduled next maintenance |
| project_source | TEXT | PMGSY, NHAI, State, Municipal |
| data_source_url | TEXT | URL where data was obtained |

### 6. `first_aid_articles`

| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Primary key |
| title | TEXT | e.g., "Controlling severe bleeding" |
| body_md | TEXT | Article content in Markdown |
| tags | TEXT[] | {bleeding, fracture, unconscious, burn, choking, cardiac} |
| source | TEXT | WHO, MoRTH, Red Cross, AIIMS |
| source_url | TEXT | Source URL for attribution |
| language | TEXT | en, hi, ta etc. Default en |

### 7. `chat_logs`

| Column | Type | Purpose |
|---|---|---|
| id | BIGSERIAL | Primary key |
| session_id | UUID | Links messages in one conversation |
| user_message | TEXT | What the user typed |
| bot_response | TEXT | What AI responded |
| intent | TEXT | Detected intent label |
| lat / lon | DOUBLE PRECISION | User location at query time |
| model_used | TEXT | groq-llama3, phi3-mini, gemma-2b |
| latency_ms | INTEGER | Response time in milliseconds |
| created_at | TIMESTAMP | Message timestamp |

---

## Critical Spatial Queries

### Find Nearest Emergency Services (Core Query)

```sql
SELECT
    name, name_local, category, sub_category,
    phone, phone_emergency, address,
    has_trauma, has_icu, is_24hr, rating,
    ST_Y(location) AS lat,
    ST_X(location) AS lon,
    ST_Distance(
        location::geography,
        ST_MakePoint(:lon, :lat)::geography  -- lon FIRST!
    ) AS distance_meters
FROM emergency_services
WHERE
    ST_DWithin(
        location::geography,
        ST_MakePoint(:lon, :lat)::geography,
        :radius_meters
    )
    AND category = ANY(:categories)
    AND country_code = :country_code
ORDER BY
    has_trauma DESC,
    is_24hr DESC,
    distance_meters ASC
LIMIT :limit;
```

### Road Type Detection (Authority Routing)

```sql
SELECT
    road_type, road_number, contractor_name,
    exec_engineer, exec_engineer_phone,
    budget_sanctioned, budget_spent, last_relayed_date
FROM road_infrastructure
WHERE ST_DWithin(
    geometry::geography,
    ST_MakePoint(:lon, :lat)::geography,
    100  -- within 100m of road centreline
)
ORDER BY ST_Distance(
    geometry::geography,
    ST_MakePoint(:lon, :lat)::geography
) LIMIT 1;
```

### Accident Heatmap Clusters

```sql
SELECT
    ROUND(lat::numeric, 3) AS grid_lat,
    ROUND(lon::numeric, 3) AS grid_lon,
    COUNT(*) AS event_count,
    MAX(created_at) AS last_event
FROM crash_events
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY grid_lat, grid_lon
HAVING COUNT(*) >= 3
ORDER BY event_count DESC;
```

---

## Cache Keys (Redis)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `nearby:{lat:.4f}:{lon:.4f}:{radius}:{cats}` | 3600s | Emergency services query results |
| `geocode:reverse:{lat:.4f}:{lon:.4f}` | 86400s | City/state name from GPS |
| `challan:{code}:{type}:{state}` | 604800s | Fine calculation results |
| `roads:authority:{lat:.3f}:{lon:.3f}` | 3600s | Authority routing results |
| `chat:history:{session_id}` | 86400s | Conversation memory |

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
