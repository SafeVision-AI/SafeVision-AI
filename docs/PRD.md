# SafeVisionAI  Product Requirements Document (PRD)

## 1. Product Overview

**SafeVisionAI** is an AI-powered road safety platform built for the **IIT Madras Road Safety Hackathon 2026**. It addresses three problem statements in one unified application:

| Module | Problem Statement | Core Value |
|--------|------------------|------------|
| Emergency Locator | SafeVisionAI | Find nearest hospital/police/ambulance instantly, even offline |
| AI Chatbot | SafeVisionAI + DriveLegal | Groq llama3-70b online + Phi-3 Mini offline  legal Q&A + first aid |
| Challan Calculator | DriveLegal | Deterministic MVA 2019 fine calculation with state overrides |
| Road Reporter | RoadWatch | Geotagged issue reporting with automatic authority routing |

**Total infrastructure cost: 0**  100% free and open-source stack.

---

## 2. Problem Statements

### 2.1 SafeVisionAI  Emergency Response
India has over 150,000 road accident deaths annually (WHO 2023). The critical window for emergency response is the first 10 minutes. Existing apps (HumSafar, Rakshak) cover limited geographies, have no AI, and fail offline. SafeVisionAI solves this with instant GPS-based emergency service locator that works offline on remote highways.

### 2.2 DriveLegal  Traffic Law Education
Most Indians are unaware of traffic fine amounts under the MV Amendment Act 2019. Legal information is buried in gazette notifications. SafeVisionAI provides a deterministic challan calculator + RAG-powered legal assistant grounded in the actual Motor Vehicles Act text.

### 2.3 RoadWatch  Road Infrastructure Accountability
India has over 450,000 km of national and state highways with poor pothole reporting mechanisms. Citizens have no way to know which government authority is responsible for a specific road or what the maintenance budget was. SafeVisionAI routes complaints to the correct executive engineer automatically.

---

## 3. Target Users

| User Persona | Need | Key Feature Used |
|---|---|---|
| Road accident victim | Instant emergency help | Emergency Locator + SOS |
| Highway driver | Works without internet | Offline PWA + WebLLM |
| Traffic fine payer | Know exact fine amount | Challan Calculator |
| Pothole reporter | Report road damage easily | Road Reporter |
| Injured person (limited mobility) | Hands-free operation | Voice Input + SOS |
| Non-English speaker | Use in native language | Multilingual chatbot |

---

## 4. Functional Requirements

### Module 1  Emergency Locator
- [ ] GPS auto-detection on page load (high accuracy, 10s timeout)
- [ ] Nearby services map: hospitals (red), police (blue), ambulance (red+cross), fire (orange), towing (amber)
- [ ] Tiered radius fallback: 500m  1km  5km  10km  25km  50km
- [ ] SOS WhatsApp share with GPS link, blood group, vehicle number, nearest services
- [ ] Always-visible emergency numbers bar: 112, 102, 100, 1033
- [ ] Crash detection via DeviceMotion API (2.5G threshold, 10-second cancel window)
- [ ] Offline emergency map for 25 Indian cities (GeoJSON + Service Worker)
- [ ] First aid guidance via AI chatbot (WHO grounded)

### Module 2  AI Chatbot
- [ ] 9-intent detection: FIND_HOSPITAL, FIND_POLICE, FIND_AMBULANCE, FIND_TOW, FIRST_AID_INFO, CHALLAN_QUERY, ROAD_REPORT, LEGAL_INFO, OTHER
- [ ] Online RAG: LangChain + Groq llama3-70b + ChromaDB (MV Act + WHO Guidelines)
- [ ] Offline AI: WebLLM Phi-3 Mini (3.8B, 4-bit) + HNSWlib.js + IndexedDB
- [ ] Multilingual: auto-detect and respond in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali
- [ ] Voice input via Web Speech API + voice output via Speech Synthesis
- [ ] Conversation memory: last 6 turns in Redis (24-hour TTL)

### Module 3  Challan Calculator
- [ ] 22+ MVA 2019 violations with base fines and repeat offence amounts
- [ ] State-specific overrides for TN, KA, MH, DL, AP, TS, KL, RJ
- [ ] GPS auto-detects state for pre-selection
- [ ] Offline calculation via DuckDB-Wasm
- [ ] Every answer cites MVA section number

### Module 4  Road Reporter
- [ ] 5-step report form: type, severity, GPS, photo, description
- [ ] In-browser pothole detection: YOLOv8n ONNX via Transformers.js (15MB)
- [ ] Automatic authority routing: NHNHAI, SHState PWD, MDRDistrict Collector
- [ ] Road infrastructure data: contractor, budget, exec engineer (PMGSY/NHAI)
- [ ] Offline queue: IndexedDB + Background Sync API
- [ ] Community issues layer on emergency map

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Emergency API response < 200ms (Redis cached), PostGIS query < 50ms |
| Offline | Core emergency features work from first visit, zero extra download |
| PWA | Installable on Android home screen, standalone mode |
| Cost | 0 total infrastructure cost (all free tiers) |
| Accessibility | WCAG AA contrast, 44px touch targets, voice input, multilingual |
| Global | Works in any country via OSM Overpass API |
| Privacy | All offline AI inference local  no data leaves device |

---

## 6. Out of Scope (for Hackathon MVP)

- Real-time government complaint portal integration (links only)
- Satellite SOS (like Apple Emergency SOS)
- Dashcam / fleet management features
- Passive pothole detection while driving (Phase 2)
- B2B fleet safety scoring (future monetisation)

---

## 7. Evaluation Criteria Coverage

| Criterion | How We Satisfy |
|---|---|
| Reliability & data accuracy | Dual-source: OSM + government datasets, source_url on every record |
| Number of contacts fetched | 7 service categories, 80150 contacts per city at 5km radius |
| Offline functionality | 5 independent offline layers from first visit |
| Innovation | In-browser LLM + computer vision, crash detection, heatmap |
| Global applicability | OSM worldwide, WHO 100+ country data in RAG |

---

*Document version: 1.0 | Hackathon: IIT Madras Road Safety Hackathon 2026*
