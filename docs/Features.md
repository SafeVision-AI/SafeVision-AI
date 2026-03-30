# SafeVisionAI  Features Specification

## Module 1: Emergency Locator (SafeVisionAI Core)

### F1.1  GPS Auto-Detection
- Uses `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`
- 10-second timeout, cached for 30 seconds (maximumAge)
- On deny: clear error screen with instructions to enable GPS in browser settings
- `watchPosition` auto-refreshes nearby list when user moves > 500m

### F1.2  Nearby Emergency Services Map
- Leaflet.js with CartoDB Dark tile layer (free, no API key)
- Color-coded circle markers: hospitals (red), police (blue), ambulance (red+cross), fire (orange-red), towing (amber), puncture (green)
- Each marker popup: name, distance, phone, **Tap-to-Call** button, **Directions** (Google Maps deep link)
- Services sorted: has_trauma first  is_24hr  distance ASC

### F1.3  Tiered Radius Fallback
- Sequence: 500m  1km  5km  10km  25km  50km
- If PostGIS < 3 results: expand radius automatically
- If DB still sparse at 50km: Overpass API live fallback
- UI badge shows actual search radius used: "Showing services within 25km"

### F1.4  SOS WhatsApp Share
- Fixed red SOS button (bottom-right, always visible)
- Generated message includes: Google Maps link, GPS coordinates, nearest hospital + phone, nearest police + phone, 112/102 numbers
- Optional: blood group from user profile, vehicle number from user profile
- Opens via `wa.me` deep link  no WhatsApp API key needed

### F1.5  Emergency Numbers Bar
- Fixed bottom bar on every page: 112, 102, 100, 1033
- Standard `tel:` href  opens phone dialer instantly
- Long-press 3-second confirmation with countdown animation before dialling (prevents accidental calls)

### F1.6  Crash Detection
- DeviceMotion API at ~60Hz
- Threshold: 2.5G (24.5 m/s) change between consecutive readings
- Speed check: if GPS speed < 10 kmph  ignore (phone drop, not crash)
- 30-second cooldown between detections
- 10-second "Are you okay? Cancel" countdown with progress circle
- If no cancel: auto-sends SOS WhatsApp + opens emergency page

### F1.7  Offline Emergency Map (25 Cities)
- `india-emergency.geojson` cached by Service Worker on first load
- `Turf.js nearestPoint()` for haversine distance filtering
- Orange "Offline  Cached Data" banner
- Cities covered: Chennai, Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Bhopal, Patna, Kochi, Coimbatore, Nagpur, Visakhapatnam, Surat, Indore, Bhubaneswar, Thiruvananthapuram, Madurai, Vadodara, Agra, Varanasi

### F1.8  First Aid Guidance
- Dedicated `/first-aid` page with 8 static scenario cards (no AI needed)
- Scenarios: Severe Bleeding, Unconscious Person, Suspected Fracture, Burn, Choking, Cardiac Arrest, Head Injury, Snake Bite
- Numbered WHO-based steps  works fully offline, zero latency

---

## Module 2: AI Chatbot

### F2.1  Intent Detection (9 Classes)
| Intent | Trigger Examples | Tools Called |
|--------|----------------|-------------|
| FIND_HOSPITAL | "nearest hospital", "accident injury" | PostGIS + Overpass |
| FIND_POLICE | "police station", "file FIR" | PostGIS + Overpass |
| FIND_AMBULANCE | "ambulance number", "102" | PostGIS + Overpass |
| FIND_TOW | "towing", "car broke down" | PostGIS + Overpass |
| FIRST_AID_INFO | "bleeding", "unconscious", "fracture" | ChromaDB WHO RAG |
| CHALLAN_QUERY | "fine", "penalty", "drunk driving cost" | DuckDB SQL |
| ROAD_REPORT | "pothole", "broken road" | Overpass + Matrix |
| LEGAL_INFO | "speed limit", "Section 184" | ChromaDB MV Act RAG |
| OTHER | "hello", "what can you do" | Direct LLM |

### F2.2  Online RAG Chatbot
- LangChain `ConversationalRetrievalChain`
- Model: `groq/llama3-70b-8192` (free tier, 6000 tokens/min)
- Retriever: ChromaDB MMR search, top-5 chunks
- Knowledge base: MV Act 1988 + MV Amendment Act 2019 + WHO Trauma Care Guidelines
- Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (local CPU, free)

### F2.3  Offline Chatbot (WebLLM)
- Primary model: `Phi-3-mini-4k-instruct-q4f16_1-MLC` (3.8B, ~2.2GB, WebGPU)
- Fallback model: `gemma-2b-it-q4f16_1-MLC` (2B, ~1.4GB, WebAssembly CPU)
- Runtime detection: `navigator.gpu.requestAdapter()`
- Offline RAG: HNSWlib.js + IndexedDB with 20 pre-bundled first-aid articles
- Response time: 3-5s (WebGPU) or 8-15s (WebAssembly)

### F2.4  Multilingual Support
- Auto-detect input language (Groq llama3-70b is multilingual natively)
- System prompt: "Respond in the same language the user wrote in"
- Supported: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi
- Optional: language selector in chat settings

### F2.5  Voice Input/Output
- Input: Web Speech API (Chrome, Edge, Samsung Internet)
- Mic button turns red + pulses when recording, auto-stops after 5s silence
- Output: Web Speech Synthesis API (speaker icon per bot message)
- Graceful degradation: mic disabled with tooltip on Safari/Firefox

### F2.6  Conversation Memory
- LangChain `ConversationBufferWindowMemory(k=6)`
- Redis storage with 24-hour TTL, key: `chat:history:{session_id}`

---

## Module 3: Challan Calculator (DriveLegal)

### F3.1  Fine Calculation Engine
- DuckDB SQL with LEFT JOIN: national fines + state overrides
- `COALESCE(state_overrides.override_fine, violations.base_fine_inr)`
- 22+ MVA sections, 5 vehicle types: 2-Wheeler, LMV, Auto, Commercial, Bus
- Online: FastAPI `/api/v1/challan/calculate`
- Offline: DuckDB-Wasm in browser against cached `violations.csv`

### F3.2  MVA AI Assistant
- RAG grounded in full MV Act text  section numbers always in answer
- Common queries: speed limits, BAC limits, documents required, helmet rules

### F3.3  Global Traffic Law
- WHO Global Status Report 2023 (100+ countries) indexed in ChromaDB
- Answers international traffic law questions

---

## Module 4: Road Reporter (RoadWatch)

### F4.1  Geotagged Issue Reporting
- Issue types: pothole, flooding, broken road, accident-prone zone, missing signage, no lighting
- Severity: 1 (minor crack) to 5 (road impassable)
- GPS mandatory, auto-filled; photo optional

### F4.2  In-Browser Pothole Detection
- Model: `Xenova/yolov8n` ONNX (15MB, Transformers.js)
- Shows bounding box SVG overlay + confidence badge
- Detection result stored as JSONB in `road_issues.ai_detection`

### F4.3  Automatic Authority Routing
- Overpass API identifies `highway` OSM tag at report GPS coordinates
- Deterministic routing matrix: NHNHAI, SHState PWD, MDRDistrict Collector, villagePMGSY, urbanMunicipal Corporation

### F4.4  Road Infrastructure Transparency
- Shows: contractor name, budget sanctioned/spent, exec engineer + phone, last relayed date, next maintenance
- Sources: data.gov.in NHAI + PMGSY OMMAS
- Overdue maintenance flagged in red with months overdue

### F4.5  Offline Report Queue
- Report serialized to IndexedDB on submit while offline
- Service Worker Background Sync auto-posts on reconnect
- Toast: "Saved  will submit when connected"

### F4.6  Community Issues Map Layer
- Toggle: shows all open/acknowledged road issues near user
- Yellow = open, Orange = acknowledged, Grey = resolved
- Waze-inspired: toast notification "Pothole reported 200m ahead"

---

## Bonus Features

### F5.1  User Profile
- Blood group, allergies, medical conditions (IndexedDB only  never uploaded without consent)
- Emergency contacts (up to 3 with names and phones)
- Vehicle number (included in SOS WhatsApp message)

### F5.2  Driving Safety Score
- Activates when GPS speed > 10 kmph
- Score 0-100, decrements on phone taps + overspeeding + hard braking
- Shareable as WhatsApp status

### F5.3  Accident Blackspot Heatmap
- Anonymised crash detection GPS events aggregated
- Leaflet.heat plugin shows red clusters of dangerous road segments

### F5.4  Document Expiry Reminders
- Insurance expiry, PUC certificate, driving licence renewal
- Browser Notification API alerts at 30 days and 7 days before expiry

### F5.5  Non-Emergency Roadside Services
- Petrol pumps (amenity=fuel), ATMs, pharmacies, rest areas via Overpass API
- Separate "Roadside Services" tab on emergency page  creates daily active users

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
