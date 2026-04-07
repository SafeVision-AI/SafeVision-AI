# RoadSoS Complete Project Resource Checklist

Generated from:
- [RoadSoS_Complete_Resources_main.docx](C:/Hackathons/IITM/RoadSoS_Complete_Resources_main.docx)
- [RoadSoS_Chatbot_Impl_Plan.txt](C:/Hackathons/IITM/RoadSoS_Chatbot_Impl_Plan.txt)
- [RoadSoS_Chatbot_Guide.txt](C:/Hackathons/IITM/RoadSoS_Chatbot_Guide.txt)
- [doc_text.txt](C:/Hackathons/IITM/doc_text.txt)

Cross-checked against the current repository on 2026-04-07.

This file is the single source of truth for:
- what you need to collect
- where to get it
- where it belongs in the repo
- which env variable or file it maps to
- whether the current repo already uses it
- which future runtime/service/file assets the source documents still expect

Important notes:
- Do not commit secrets into git.
- Keep large datasets outside normal source control. Suggested local folder: `SafeVisionAI/backend/datasets/`.
- Chatbot rows point to `chatbot_service/.env` even though the latest chatbot env template currently lives on the chatbot branch.

## Status legend

| Status | Meaning |
|---|---|
| `Wired now` | Current code already references this item. |
| `Needs value` | Current code expects it, but you must add the real value. |
| `Needs download` | You must manually download the file or dataset. |
| `Partially wired` | Some scaffolding exists, but import/provider integration is not complete yet. |
| `Future phase` | Recommended by the document, but not implemented in the current repo yet. |
| `Reference only` | Mentioned as a benchmark, portal, or workflow aid; no repo download is required. |
| `Skip` | The document explicitly says this is not worth using as the main path. |

## 1. Core accounts, hosting, and deployment services

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Supabase project | https://supabase.com | Dashboard account only | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Wired now | Critical |
| Upstash Redis | https://upstash.com | Dashboard account only | `REDIS_URL` | Wired now | Critical |
| Render backend hosting | https://render.com | Dashboard account only | N/A | Future phase | High |
| Vercel frontend hosting | https://vercel.com | Dashboard account only | N/A | Future phase | High |
| data.gov.in account | https://data.gov.in | Dashboard account only | `DATA_GOV_API_KEY` | Partially wired | Critical |
| AI Kosh account | https://aikosh.indiaai.gov.in | Dashboard account only | N/A | Needs download | High |
| Kaggle account | https://kaggle.com | Dashboard account only | N/A | Needs download | High |
| Hugging Face account | https://huggingface.co | Dashboard account only | `HF_TOKEN` | Future phase | High |
| OpenWeather account | https://openweathermap.org | Dashboard account only | `OPENWEATHER_API_KEY` | Wired now | High |
| openrouteservice account | https://openrouteservice.org | Dashboard account only | `OPENROUTESERVICE_API_KEY` | Wired now | Critical |

## 2. Backend env values and config

Target file: [backend/.env.example](C:/Hackathons/IITM/SafeVisionAI/backend/.env.example) -> copy to `backend/.env`

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Environment mode | Manual value | `backend/.env` | `ENVIRONMENT` | Needs value | High |
| Allowed frontend origins | Manual value | `backend/.env` | `CORS_ORIGINS` | Wired now | High |
| PostgreSQL connection string | Supabase -> Settings -> Database -> URI | `backend/.env` | `DATABASE_URL` | Needs value | Critical |
| Redis connection string | Upstash -> Connect -> `.env` tab | `backend/.env` | `REDIS_URL` | Needs value | Critical |
| DB pool size | Manual tuning | `backend/.env` | `DB_POOL_SIZE` | Wired now | Medium |
| DB max overflow | Manual tuning | `backend/.env` | `DB_MAX_OVERFLOW` | Wired now | Medium |
| DB pool timeout | Manual tuning | `backend/.env` | `DB_POOL_TIMEOUT_SECONDS` | Wired now | Medium |
| DB recycle time | Manual tuning | `backend/.env` | `DB_POOL_RECYCLE_SECONDS` | Wired now | Medium |
| Supabase URL | Supabase -> Settings -> API | `backend/.env` | `SUPABASE_URL` | Needs value | Critical |
| Supabase anon key | Supabase -> Settings -> API | `backend/.env` | `SUPABASE_ANON_KEY` | Needs value | Critical |
| Supabase service role key | Supabase -> Settings -> API | `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Needs value | Critical |
| Default search radius | Manual value | `backend/.env` | `DEFAULT_RADIUS` | Wired now | Medium |
| Max search radius | Manual value | `backend/.env` | `MAX_RADIUS` | Wired now | Medium |
| Emergency minimum results | Manual value | `backend/.env` | `EMERGENCY_MIN_RESULTS` | Wired now | Medium |
| Emergency radius steps | Manual value | `backend/.env` | `EMERGENCY_RADIUS_STEPS` | Wired now | Medium |
| Cache TTL | Manual value | `backend/.env` | `CACHE_TTL_SECONDS` | Wired now | Medium |
| Geocode cache TTL | Manual value | `backend/.env` | `GEOCODE_CACHE_TTL_SECONDS` | Wired now | Medium |
| Authority cache TTL | Manual value | `backend/.env` | `AUTHORITY_CACHE_TTL_SECONDS` | Wired now | Medium |
| Primary Overpass endpoint | Public OSM | `backend/.env` | `OVERPASS_URL` | Wired now | Critical |
| Overpass mirror list | Public OSM mirrors | `backend/.env` | `OVERPASS_URLS` | Wired now | High |
| Nominatim reverse geocoder | Public OSM | `backend/.env` | `NOMINATIM_URL` | Wired now | Critical |
| Photon search geocoder | Public Photon | `backend/.env` | `PHOTON_URL` | Wired now | Critical |
| openrouteservice base URL | openrouteservice docs | `backend/.env` | `OPENROUTESERVICE_BASE_URL` | Wired now | High |
| openrouteservice API key | openrouteservice dashboard | `backend/.env` | `OPENROUTESERVICE_API_KEY` | Needs value | Critical |
| HTTP user-agent string | Manual value with your email/site | `backend/.env` | `HTTP_USER_AGENT` | Needs value | Critical |
| Request timeout | Manual value | `backend/.env` | `REQUEST_TIMEOUT_SECONDS` | Wired now | Medium |
| Upstream retry attempts | Manual value | `backend/.env` | `UPSTREAM_RETRY_ATTEMPTS` | Wired now | Medium |
| Upstream retry backoff | Manual value | `backend/.env` | `UPSTREAM_RETRY_BACKOFF_SECONDS` | Wired now | Medium |
| data.gov.in API key | data.gov.in account | `backend/.env` | `DATA_GOV_API_KEY` | Needs value | High |
| OpenWeather API key | OpenWeather dashboard | `backend/.env` | `OPENWEATHER_API_KEY` | Needs value | High |
| OpenWeather base URL | OpenWeather docs | `backend/.env` | `OPENWEATHER_BASE_URL` | Wired now | Medium |
| OpenWeather units | Manual value | `backend/.env` | `OPENWEATHER_UNITS` | Wired now | Medium |
| Chatbot mode | Manual value | `backend/.env` | `CHATBOT_MODE` | Wired now | Medium |
| Chatbot ready flag | Manual value | `backend/.env` | `CHATBOT_READY` | Wired now | Medium |
| Local upload base URL | Manual value or storage URL | `backend/.env` | `LOCAL_UPLOAD_BASE_URL` | Needs value | Medium |
| Max upload size | Manual value | `backend/.env` | `MAX_UPLOAD_BYTES` | Wired now | Medium |
| Allowed upload MIME types | Manual value | `backend/.env` | `ALLOWED_UPLOAD_CONTENT_TYPES` | Wired now | Medium |
| Offline bundle directory | Manual path | `backend/.env` | `OFFLINE_BUNDLE_DIR` | Wired now | Medium |
| Route cache TTL | Manual value | `backend/.env` | `ROUTE_CACHE_TTL_SECONDS` | Wired now | Medium |

## 3. Frontend env values and config

Target file: [frontend/.env.example](C:/Hackathons/IITM/SafeVisionAI/frontend/.env.example) -> copy to `frontend/.env`

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Backend API URL | Your local backend or deployed backend URL | `frontend/.env` | `NEXT_PUBLIC_API_URL` | Needs value | Critical |
| Supabase project URL | Supabase -> Settings -> API | `frontend/.env` | `NEXT_PUBLIC_SUPABASE_URL` | Needs value | Critical |
| Supabase anon key | Supabase -> Settings -> API | `frontend/.env` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Needs value | Critical |
| Live map default zoom | Manual value | `frontend/.env` | `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | Wired now | Medium |
| Fallback map latitude | Manual value | `frontend/.env` | `NEXT_PUBLIC_MAP_FALLBACK_LAT` | Wired now | Medium |
| Fallback map longitude | Manual value | `frontend/.env` | `NEXT_PUBLIC_MAP_FALLBACK_LON` | Wired now | Medium |
| Fallback map zoom | Manual value | `frontend/.env` | `NEXT_PUBLIC_MAP_FALLBACK_ZOOM` | Wired now | Medium |
| Primary map style URL | OpenFreeMap Liberty | `frontend/.env` | `NEXT_PUBLIC_MAP_STYLE_URL` | Wired now | Critical |
| MapTiler key | MapTiler dashboard | `frontend/.env` | `NEXT_PUBLIC_MAPTILER_KEY` | Skip | Low |
| MapTiler style id | Manual value | `frontend/.env` | `NEXT_PUBLIC_MAPTILER_STYLE_ID` | Skip | Low |

## 4. Chatbot env values and config

Target file: `chatbot_service/.env` on the chatbot branch.

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Environment mode | Manual value | `chatbot_service/.env` | `ENVIRONMENT` | Partially wired | Medium |
| Chatbot service name | Manual value | `chatbot_service/.env` | `CHATBOT_SERVICE_NAME` | Partially wired | Medium |
| Chatbot service port | Manual value | `chatbot_service/.env` | `CHATBOT_SERVICE_PORT` | Partially wired | Medium |
| Allowed origins | Manual value | `chatbot_service/.env` | `CORS_ORIGINS` | Partially wired | Medium |
| Main backend base URL | Local or deployed backend | `chatbot_service/.env` | `MAIN_BACKEND_BASE_URL` | Partially wired | Critical |
| Main backend timeout | Manual value | `chatbot_service/.env` | `MAIN_BACKEND_TIMEOUT_SECONDS` | Partially wired | Medium |
| Redis URL | Upstash -> Connect | `chatbot_service/.env` | `REDIS_URL` | Partially wired | High |
| Chroma persist directory | Manual path | `chatbot_service/.env` | `CHROMA_PERSIST_DIR` | Future phase | High |
| RAG data directory | Manual path | `chatbot_service/.env` | `RAG_DATA_DIR` | Future phase | High |
| Embedding model | Hugging Face ID | `chatbot_service/.env` | `EMBEDDING_MODEL` | Future phase | Critical |
| Retrieval top-k | Manual value | `chatbot_service/.env` | `TOP_K_RETRIEVAL` | Future phase | Medium |
| Default provider | Manual value | `chatbot_service/.env` | `DEFAULT_LLM_PROVIDER` | Future phase | High |
| Default model | Manual value | `chatbot_service/.env` | `DEFAULT_LLM_MODEL` | Future phase | High |
| Groq API key | https://console.groq.com | `chatbot_service/.env` | `GROQ_API_KEY` | Future phase | Critical |
| Gemini model name | Manual value | `chatbot_service/.env` | `GEMINI_MODEL` | Future phase | High |
| Google API key | https://aistudio.google.com | `chatbot_service/.env` | `GOOGLE_API_KEY` | Future phase | Critical |
| GitHub token | https://github.com/marketplace/models | `chatbot_service/.env` | `GITHUB_TOKEN` | Future phase | High |
| Mistral API key | https://console.mistral.ai | `chatbot_service/.env` | `MISTRAL_API_KEY` | Future phase | Medium |
| Together AI key | https://api.together.xyz | `chatbot_service/.env` | `TOGETHER_API_KEY` | Future phase | Medium |
| NVIDIA NIM key | https://build.nvidia.com | `chatbot_service/.env` | `NVIDIA_NIM_API_KEY` | Future phase | Medium |
| NVIDIA NIM base URL | Hosted NVIDIA endpoint or self-hosted URL | `chatbot_service/.env` | `NVIDIA_NIM_BASE_URL` | Future phase | Low |
| OpenAI API key | https://platform.openai.com | `chatbot_service/.env` | `OPENAI_API_KEY` | Skip | Low |
| OpenWeather API key | OpenWeather dashboard | `chatbot_service/.env` | `OPENWEATHER_API_KEY` | Future phase | Medium |
| OpenWeather base URL | OpenWeather docs | `chatbot_service/.env` | `OPENWEATHER_BASE_URL` | Future phase | Medium |
| OpenWeather units | Manual value | `chatbot_service/.env` | `OPENWEATHER_UNITS` | Future phase | Low |
| HTTP timeout | Manual value | `chatbot_service/.env` | `HTTP_TIMEOUT_SECONDS` | Future phase | Medium |
| Chatbot user-agent | Manual value | `chatbot_service/.env` | `HTTP_USER_AGENT` | Future phase | Medium |
| Hugging Face token | https://huggingface.co/settings/tokens | `chatbot_service/.env` | `HF_TOKEN` | Future phase | High |
| Cerebras API key | https://cloud.cerebras.ai | `chatbot_service/.env` | `CEREBRAS_API_KEY` | Future phase | High |
| OpenRouter API key | https://openrouter.ai | `chatbot_service/.env` | `OPENROUTER_API_KEY` | Future phase | Medium |

## 5. Map and geospatial runtime stack

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| MapLibre GL JS | https://maplibre.org and npm | [frontend/package.json](C:/Hackathons/IITM/SafeVisionAI/frontend/package.json) | N/A | Wired now | Critical |
| OpenFreeMap Liberty style | https://tiles.openfreemap.org/styles/liberty | [frontend/components/maps/MapLibreCanvas.tsx](C:/Hackathons/IITM/SafeVisionAI/frontend/components/maps/MapLibreCanvas.tsx) and `frontend/.env` | `NEXT_PUBLIC_MAP_STYLE_URL` | Wired now | Critical |
| OpenFreeMap Positron style | https://tiles.openfreemap.org/styles/positron | Future style toggle or theme config | N/A | Future phase | Low |
| Carto Voyager backup style | https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json | Future fallback in `frontend/components/maps/MapLibreCanvas.tsx` | N/A | Future phase | High |
| Carto Dark Matter style | Carto CDN | Future dark-mode style toggle | N/A | Future phase | Medium |
| Photon search geocoder | https://photon.komoot.io/api | [backend/core/config.py](C:/Hackathons/IITM/SafeVisionAI/backend/core/config.py), `backend/.env` | `PHOTON_URL` | Wired now | Critical |
| Nominatim reverse geocoder | https://nominatim.openstreetmap.org | [backend/core/config.py](C:/Hackathons/IITM/SafeVisionAI/backend/core/config.py), `backend/.env` | `NOMINATIM_URL` | Wired now | Critical |
| Overpass API | https://overpass-api.de/api/interpreter | [backend/core/config.py](C:/Hackathons/IITM/SafeVisionAI/backend/core/config.py), `backend/.env` | `OVERPASS_URL` | Wired now | Critical |
| Overpass mirror list | `overpass.kumi.systems`, `overpass.private.coffee` | `backend/.env` | `OVERPASS_URLS` | Wired now | High |
| openrouteservice routing | https://api.openrouteservice.org | [backend/services/routing_service.py](C:/Hackathons/IITM/SafeVisionAI/backend/services/routing_service.py), `backend/.env` | `OPENROUTESERVICE_BASE_URL`, `OPENROUTESERVICE_API_KEY` | Partially wired | Critical |
| PMTiles runtime | https://github.com/protomaps/PMTiles | `frontend/public/maps/india.pmtiles` and future PMTiles loader | N/A | Future phase | Medium |

## 6. Government and public datasets for maps and reporting

Suggested local dataset root: `SafeVisionAI/backend/datasets/`

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| National Hospital Directory CSV | https://data.gov.in/catalog/hospital-directory-national-health-portal | `backend/datasets/hospital_directory_nhp.csv` | `DATA_GOV_API_KEY` if API-based | Needs download | Critical |
| Police Station Directory | data.gov.in search `police stations` | `backend/datasets/police_stations.csv` | `DATA_GOV_API_KEY` if API-based | Needs download | High |
| PMGSY Rural Roads export | data.gov.in search `PMGSY` or PMGSY/OMMAS export | `backend/datasets/pmgsy/pmgsy_<state>.csv` or `.zip` | `DATA_GOV_API_KEY` if API-based | Needs download | High |
| District Boundaries GeoJSON | data.gov.in | `backend/datasets/district_boundaries.geojson` | `DATA_GOV_API_KEY` if API-based | Needs download | Medium |
| NHM Health Facilities | https://nhm.gov.in | `backend/datasets/nhm_health_facilities.csv` | N/A | Future phase | Medium |
| TN road GeoJSON | Your downloaded state road dataset | `backend/datasets/tamil_nadu_roads.geojson` | N/A | Partially wired via importer | Medium |
| KA road GeoJSON | Your downloaded state road dataset | `backend/datasets/karnataka_roads.geojson` | N/A | Partially wired via importer | Medium |
| Maharashtra highways GeoJSON | State portal export | `backend/datasets/maharashtra_highways.geojson` | N/A | Partially wired via importer | Medium |
| City corporation streets CSV | Local body portal export | `backend/datasets/city_corporation_streets.csv` | N/A | Partially wired via importer | Low |

## 7. Accident, risk, and road safety datasets

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| MAARG ONNX model | AI Kosh Project MAARG | `frontend/public/models/maarg-risk.onnx` | N/A | Future phase | High |
| MoRTH accidents by vehicle type 2012-2016 | AI Kosh / MoRTH | `backend/datasets/accidents/morth_vehicle_type_2012_2016.csv` | N/A | Needs download | Critical |
| MoRTH accidents by road features 2014-2016 | AI Kosh / MoRTH | `backend/datasets/accidents/morth_road_features_2014_2016.csv` | N/A | Needs download | Critical |
| Persons injured 2011-2014 | AI Kosh / MoRTH | `backend/datasets/accidents/morth_persons_injured_2011_2014.csv` | N/A | Needs download | Medium |
| India Road Accident with lat/lon | Kaggle `data125661` | `backend/datasets/accidents/india_road_accident_coords.csv` | N/A | Needs download | Medium |
| Road Accident Severity dataset | Kaggle `khushi` | `backend/datasets/accidents/road_accident_severity.csv` | N/A | Future phase | Low |
| Road Accidents India (Manu Gupta) | Kaggle | `backend/datasets/accidents/road_accidents_india_manu_gupta.csv` | N/A | Needs download | Low |
| Crime Review India 2025 | AI Kosh / IndiaAI | `backend/datasets/crime_review_india_2025.csv` | N/A | Future phase | Low |

## 8. Pothole and road damage vision datasets

Keep raw training datasets outside git if possible.

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Potholes YOLOv8 (Anggadwi) | https://kaggle.com/anggadwisunarto/potholes-detection-yolov8 | `C:/datasets/potholes/anggadwi_yolov8/` | N/A | Needs download | High |
| Pothole dataset (Sachin Patel) | https://kaggle.com/sachinpatel21/pothole-image-dataset | `C:/datasets/potholes/sachin_patel/` | N/A | Needs download | Medium |
| Pothole dataset (Andrew) | https://kaggle.com/andrewmvd/pothole-detection | `C:/datasets/potholes/andrew_pascal_voc/` | N/A | Needs download | Low |
| Road Damage Dataset 2025 | https://zenodo.org/records/17834373 | `C:/datasets/road_damage_2025/` | N/A | Needs download | High |
| Potholes + Cracks + Manholes | Kaggle `sabidrahman` | `C:/datasets/potholes_cracks_manholes/` | N/A | Needs download | Low |

## 9. Legal, first-aid, and RAG document corpus

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Motor Vehicles Act 1988 PDF | https://www.indiacode.nic.in | `backend/data/motor_vehicles_act_1988.pdf` | N/A | Needs download | Critical |
| MV Amendment Act 2019 PDF | https://morth.nic.in | `backend/data/mv_amendment_act_2019.pdf` | N/A | Needs download | Critical |
| WHO Trauma Care Guidelines PDF | https://www.who.int | `backend/data/who_trauma_care_guidelines.pdf` | N/A | Needs download | Critical |
| WHO Global Road Safety Report 2023 PDF | https://www.who.int/publications/i/item/9789240086517 | `backend/data/who_road_safety_2023.pdf` | N/A | Needs download | High |
| State amendment PDFs | State transport department websites | `backend/data/state_amendments/<state>.pdf` | N/A | Needs download | High |
| Indian Kanoon MV Act judgments | https://indiankanoon.org | `backend/data/legal_cases/*.pdf` | N/A | Needs download | High |
| BhasaAnuvaad speech corpus | AI Kosh / AI4Bharat | `C:/datasets/bhasaanuvaad/` | N/A | Future phase | Low |
| BharatGen MHQA multilingual QA | AI Kosh / IIT Bombay | `backend/data/bharatgen_mhqa/` | N/A | Future phase | Low |

## 10. Embedding, offline AI, and hosted LLM models

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| all-MiniLM-L6-v2 embeddings | `sentence-transformers/all-MiniLM-L6-v2` on Hugging Face | `chatbot_service/.env` plus future `chatbot_service/rag/embeddings.py` | `EMBEDDING_MODEL` | Future phase | Critical |
| multilingual MiniLM embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Future `chatbot_service/rag/embeddings.py` | `EMBEDDING_MODEL` or upgrade path | Future phase | High |
| Gemma 4 E2B | `google/gemma-4-E2B-it` | [frontend/lib/edge-ai.ts](C:/Hackathons/IITM/SafeVisionAI/frontend/lib/edge-ai.ts) | N/A | Future phase | Critical |
| Gemma 4 E4B | `google/gemma-4-E4B-it` | [frontend/lib/edge-ai.ts](C:/Hackathons/IITM/SafeVisionAI/frontend/lib/edge-ai.ts) or future offline vision module | N/A | Future phase | High |
| Gemma 4 26B A4B | `google/gemma-4-26B-A4B-it` | Future server-side inference path only | N/A | Future phase | Low |
| Gemma 4 31B Dense | `google/gemma-4-31B-it` | Future server-side inference path only | N/A | Future phase | Low |
| Sarvam-30B | AI Kosh / Hugging Face inference | Future `chatbot_service/providers/sarvam_provider.py` | `HF_TOKEN` | Future phase | Critical |
| Sarvam-105B | AI Kosh / Hugging Face inference | Future `chatbot_service/providers/sarvam_provider.py` | `HF_TOKEN` | Future phase | High |
| SarvamM | AI Kosh / Hugging Face inference | Future `chatbot_service/providers/sarvam_provider.py` | `HF_TOKEN` | Future phase | High |
| SarvamTranslate | AI Kosh / Hugging Face inference | Future translation provider | `HF_TOKEN` | Future phase | Medium |
| Shuka-v1 | AI Kosh / Hugging Face inference | Future voice report service | `HF_TOKEN` | Future phase | Medium |
| BharatGen Param-2 17B | `bharatgenai/param2-17b-moe-a2.4b` | Future `chatbot_service/providers/bharatgen_provider.py` | `HF_TOKEN` | Future phase | High |
| BharatGen Sooktam-2 | `bharatgenai/sooktam2` | Future `chatbot_service/voice/speak.py` or `voice/providers/` | `HF_TOKEN` or provider key if using hosted API | Future phase | High |
| BharatGen A2TTS | BharatGen / AI Kosh | Future `chatbot_service/voice/tts/` | N/A | Future phase | Low |
| Whisper large-v3 | Hugging Face | Future ASR fallback in chatbot service | `HF_TOKEN` | Future phase | Medium |

## 11. Voice and ASR models

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| IndicWav2Vec Hindi | AI Kosh / AI4Bharat | Future `chatbot_service/voice/indic_asr.py` and local cache under `chatbot_service/data/asr_models/` | `HF_TOKEN` if hosted | Future phase | Critical |
| IndicWav2Vec Tamil | AI Kosh / AI4Bharat | Same as above | `HF_TOKEN` if hosted | Future phase | Critical |
| IndicWav2Vec Telugu | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | High |
| IndicWav2Vec Gujarati | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | High |
| IndicWav2Vec Marathi | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | High |
| IndicWav2Vec Odia | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | Medium |
| IndicWav2Vec Bengali | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | High |
| IndicConformer Kannada | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | High |
| IndicConformer Maithili | AI Kosh | Same as above | `HF_TOKEN` if hosted | Future phase | Medium |

## 12. LLM provider chain from the document

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Groq provider | https://console.groq.com | `chatbot_service/.env` and future provider module | `GROQ_API_KEY` | Future phase | Critical |
| Cerebras provider | https://cloud.cerebras.ai | `chatbot_service/.env` and future provider module | `CEREBRAS_API_KEY` | Future phase | High |
| Sarvam via HF Inference | Hugging Face | `chatbot_service/.env` and future provider module | `HF_TOKEN` | Future phase | High |
| BharatGen via HF Inference | Hugging Face | `chatbot_service/.env` and future provider module | `HF_TOKEN` | Future phase | Medium |
| Gemini 1.5 Flash | https://aistudio.google.com | `chatbot_service/.env` and future provider module | `GOOGLE_API_KEY`, `GEMINI_MODEL` | Future phase | High |
| GitHub Models | https://github.com/marketplace/models | `chatbot_service/.env` and future provider module | `GITHUB_TOKEN` | Future phase | Medium |
| NVIDIA NIM hosted models | https://build.nvidia.com | `chatbot_service/.env` and future provider module | `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_BASE_URL` | Future phase | Medium |
| OpenRouter | https://openrouter.ai | `chatbot_service/.env` and future provider module | `OPENROUTER_API_KEY` | Future phase | Medium |
| Mistral | https://console.mistral.ai | `chatbot_service/.env` and future provider module | `MISTRAL_API_KEY` | Future phase | Low |
| Together AI | https://api.together.xyz | `chatbot_service/.env` and future provider module | `TOGETHER_API_KEY` | Future phase | Low |

## 13. Offline map and browser-side model artifacts

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| India PMTiles extract | Protomaps / PMTiles downloads | `frontend/public/maps/india.pmtiles` | N/A | Future phase | Medium |
| Gemma 4 browser runtime assets | Hugging Face / Transformers.js runtime cache | Runtime browser cache only | N/A | Future phase | Medium |
| all-MiniLM browser embedding model | Xenova / Transformers.js | Runtime browser cache or future local cache | N/A | Future phase | Medium |
| YOLOv8n browser ONNX | Xenova/yolov8n or your fine-tuned ONNX export | `frontend/public/models/yolov8n.onnx` or `frontend/public/models/pothole-yolov8n.onnx` | N/A | Future phase | High |

## 14. Mobile-only future references from the document

These are not for the current web repo, but they are mentioned in the source document and are included here so nothing is lost.

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Android AICore path for Gemma 4 | Android AICore / Google | N/A (future Android app only) | N/A | Future phase | Low |
| ML Kit GenAI Prompt API | Google ML Kit / Android | N/A (future Android app only) | N/A | Future phase | Low |

## 15. Manual directories you should create locally

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Backend dataset root | Manual local folder | `backend/datasets/` | N/A | Needs download | High |
| Backend accident datasets folder | Manual local folder | `backend/datasets/accidents/` | N/A | Needs download | High |
| Backend legal cases folder | Manual local folder | `backend/data/legal_cases/` | N/A | Needs download | High |
| Backend Chroma vector store | Built by vectorstore job | `backend/data/chroma_db/` | `CHROMA_PERSIST_DIR` or project default path | Future phase | High |
| Frontend model assets folder | Manual local folder | `frontend/public/models/` | N/A | Partially wired | High |
| Frontend offline map assets folder | Manual local folder | `frontend/public/maps/` | N/A | Future phase | Medium |
| Chatbot ASR model cache | Manual local folder | `chatbot_service/data/asr_models/` | N/A | Future phase | Medium |

## 16. Resources the document explicitly says to skip or avoid as the main path

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| MapTiler as primary production map | https://www.maptiler.com | N/A | `NEXT_PUBLIC_MAPTILER_KEY` | Skip | Low |
| Google Maps API as primary map stack | https://mapsplatform.google.com | N/A | N/A | Skip | Low |
| Mapbox as primary map stack | https://www.mapbox.com | N/A | N/A | Skip | Low |
| Firebase Realtime Database | https://firebase.google.com | N/A | N/A | Skip | Low |
| OpenAI GPT-4 as default paid path | https://platform.openai.com | N/A | `OPENAI_API_KEY` | Skip | Low |
| Gnani Vachana TTS | AI Kosh | N/A | N/A | Skip | Low |
| DeepSeek direct API | DeepSeek | N/A | N/A | Skip | Low |
| Phi-3 Mini offline model | Microsoft / Hugging Face | Old offline path in `frontend/lib/edge-ai.ts` | N/A | Skip | Low |
| Sarvam-1 2B original | AI Kosh | N/A | N/A | Skip | Low |
| RomanSetu transliteration | AI Kosh | N/A | N/A | Skip | Low |
| GenLoop 2B small models | AI Kosh | N/A | N/A | Skip | Low |
| Meteorological raw datasets | AI Kosh | N/A | N/A | Skip | Low |

## 17. Recommended collection order

1. Supabase values:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. `REDIS_URL`
3. `OPENROUTESERVICE_API_KEY`
4. `OPENWEATHER_API_KEY`
5. `DATA_GOV_API_KEY`
6. National Hospital Directory CSV
7. 3 MoRTH accident CSVs
8. Police Station Directory
9. PMGSY roads export
10. District Boundaries GeoJSON
11. MAARG ONNX
12. Legal PDFs:
   - MV Act 1988
   - MV Amendment 2019
   - WHO Trauma
   - WHO Road Safety
   - state amendment PDFs
   - Indian Kanoon judgments
13. Chatbot provider keys:
   - Groq
   - Google
   - GitHub Models
   - NVIDIA NIM
   - Mistral
   - Together AI
   - HF token
   - Cerebras
   - OpenRouter
14. Optional later-phase assets:
   - PMTiles India extract
   - pothole training datasets
   - BhasaAnuvaad
   - BharatGen/Sarvam voice and multilingual QA add-ons

## 18. Current repo reality check

This checklist intentionally includes more than the current repo already supports.

Already wired in current code:
- MapLibre renderer
- OpenFreeMap default map style
- Photon + Nominatim pattern
- Overpass emergency POIs
- openrouteservice route plumbing
- emergency seeding scaffold
- road infrastructure import scaffold

Still only partially wired or not wired yet:
- NHP hospital importer
- MoRTH accident ingestion and blackspot tables
- MAARG ONNX heatmap
- PMTiles offline maps
- Gemma 4 offline edge AI replacement
- Cerebras, Sarvam, BharatGen, OpenRouter provider chain
- IndicWav2Vec / IndicConformer / Sooktam-2 voice stack

## 19. Developer tooling, team workflow, and project setup assets

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Shared password manager for keys | Bitwarden or equivalent, as required in chatbot implementation plan | Team vault only | N/A | Reference only | Critical |
| Cursor AI IDE | https://cursor.sh | Developer machine only | N/A | Reference only | Medium |
| Windsurf IDE / extension | https://windsurf.ai | Developer machine only | N/A | Reference only | Medium |
| 21st.dev chat UI reference | https://21st.dev | No repo save path required unless you export components | N/A | Reference only | Low |
| Chatbot `.cursorrules` file | Chatbot implementation plan, Section 3 | `chatbot_service/.cursorrules` | N/A | Future phase | Medium |
| Python 3.11 virtualenv for chatbot service | Python.org / local environment | `chatbot_service/.venv/` | N/A | Future phase | High |
| VS Code Python extension | VS Code Marketplace | Developer machine only | N/A | Reference only | Low |
| VS Code Pylance extension | VS Code Marketplace | Developer machine only | N/A | Reference only | Low |
| Ruff extension / linter support | VS Code Marketplace / Python package | Developer machine only and future `chatbot_service/requirements.txt` | N/A | Future phase | Low |
| Black formatter support | VS Code Marketplace / Python package | Developer machine only and future `chatbot_service/requirements.txt` | N/A | Future phase | Low |
| REST Client extension | VS Code Marketplace | Developer machine only | N/A | Reference only | Low |
| GitHub `develop` integration branch | GitHub repo branch strategy in chatbot implementation plan | Remote branch only | N/A | Reference only | High |
| `chatbot/*` feature branch naming pattern | GitHub workflow in chatbot implementation plan | Remote branches only | N/A | Reference only | High |
| Render staging chatbot instance | https://render.com | Render dashboard only | N/A | Future phase | High |
| Render production chatbot instance | https://render.com | Render dashboard only | N/A | Future phase | High |

## 20. Chatbot service root files and deployment artifacts

Target root: `chatbot_service/` on the chatbot branch.

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Chatbot FastAPI entrypoint | Chatbot implementation plan, Section 5 | `chatbot_service/main.py` | N/A | Future phase | Critical |
| Chatbot Python dependencies | Chatbot implementation plan, Section 5 | `chatbot_service/requirements.txt` | N/A | Future phase | Critical |
| Chatbot Dockerfile | Chatbot implementation plan, Section 5 | `chatbot_service/Dockerfile` | N/A | Future phase | Critical |
| Chatbot env template | Chatbot implementation plan, Section 5 | `chatbot_service/.env.example` | N/A | Partially wired | Critical |
| Chatbot gitignore | Chatbot implementation plan, Section 5 | `chatbot_service/.gitignore` | N/A | Future phase | High |
| Chatbot Render blueprint | Chatbot implementation plan, Section 5 | `chatbot_service/render.yaml` | N/A | Future phase | High |
| Chatbot config module | Chatbot implementation plan, Section 5 | `chatbot_service/config.py` | N/A | Future phase | Critical |
| Chatbot service health endpoint | Chatbot implementation plan, Phase 1 | `chatbot_service/main.py` | N/A | Future phase | High |
| Chatbot service port 8001 binding | Chatbot implementation plan, Section 5 | `chatbot_service/main.py` and `chatbot_service/.env` | `CHATBOT_SERVICE_PORT` | Future phase | High |
| Chroma build baked into Docker image | Chatbot implementation plan, Deployment section | `chatbot_service/Dockerfile` and `chatbot_service/data/build_vectorstore.py` | N/A | Future phase | Medium |

## 21. Chatbot service code artifacts by subsystem

### 21.1 Providers

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Provider base class | Chatbot implementation plan, Section 5 | `chatbot_service/providers/base.py` | N/A | Future phase | Critical |
| Groq provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/groq_provider.py` | `GROQ_API_KEY` | Future phase | Critical |
| Gemini provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/gemini_provider.py` | `GOOGLE_API_KEY`, `GEMINI_MODEL` | Future phase | High |
| GitHub Models provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/github_models_provider.py` | `GITHUB_TOKEN` | Future phase | High |
| NVIDIA NIM provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/nvidia_nim_provider.py` | `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_BASE_URL` | Future phase | Medium |
| Mistral provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/mistral_provider.py` | `MISTRAL_API_KEY` | Future phase | Medium |
| Together AI provider wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/providers/together_provider.py` | `TOGETHER_API_KEY` | Future phase | Medium |
| Provider router with circuit breaker | Chatbot implementation plan, Sections 5 and 6 | `chatbot_service/providers/router.py` | `DEFAULT_LLM_PROVIDER`, `DEFAULT_LLM_MODEL` | Future phase | Critical |

### 21.2 RAG, agent, and orchestration

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Chroma vectorstore manager | Chatbot implementation plan, Section 5 | `chatbot_service/rag/vectorstore.py` | `CHROMA_PERSIST_DIR` | Future phase | Critical |
| Embeddings wrapper | Chatbot implementation plan, Section 5 | `chatbot_service/rag/embeddings.py` | `EMBEDDING_MODEL` | Future phase | Critical |
| Retriever module | Chatbot implementation plan, Section 5 | `chatbot_service/rag/retriever.py` | `TOP_K_RETRIEVAL` | Future phase | High |
| PDF/document loader | Chatbot implementation plan, Section 5 | `chatbot_service/rag/document_loader.py` | `RAG_DATA_DIR` | Future phase | High |
| LangGraph definition | Chatbot implementation plan, Section 5 | `chatbot_service/agent/graph.py` | N/A | Future phase | Critical |
| Agent state schema | Chatbot implementation plan, Section 5 | `chatbot_service/agent/state.py` | N/A | Future phase | High |
| Intent detector | Chatbot implementation plan and guide | `chatbot_service/agent/intent_detector.py` | N/A | Future phase | Critical |
| Context assembler | Chatbot implementation plan and guide | `chatbot_service/agent/context_assembler.py` | N/A | Future phase | Critical |
| Safety checker | Chatbot implementation plan and guide | `chatbot_service/agent/safety_checker.py` | N/A | Future phase | High |

### 21.3 Tools, memory, API, and tests

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Emergency API tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/emergency_tool.py` | `MAIN_BACKEND_BASE_URL` | Future phase | Critical |
| Challan tool | Chatbot implementation plan and guide | `chatbot_service/tools/challan_tool.py` | `MAIN_BACKEND_BASE_URL` | Future phase | Critical |
| Legal search tool | Chatbot implementation plan and guide | `chatbot_service/tools/legal_search_tool.py` | N/A | Future phase | High |
| Road infrastructure tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/road_infra_tool.py` | `MAIN_BACKEND_BASE_URL` | Future phase | High |
| Road issues tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/road_issues_tool.py` | `MAIN_BACKEND_BASE_URL` | Future phase | High |
| First-aid tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/first_aid_tool.py` | N/A | Future phase | High |
| Weather tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/weather_tool.py` | `OPENWEATHER_API_KEY` | Future phase | Medium |
| SOS deep-link tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/sos_tool.py` | N/A | Future phase | High |
| Submit-report tool | Chatbot implementation plan, Section 5 | `chatbot_service/tools/submit_report_tool.py` | `MAIN_BACKEND_BASE_URL` | Future phase | High |
| Redis conversation memory | Chatbot implementation plan, Section 5 | `chatbot_service/memory/redis_memory.py` | `REDIS_URL` | Future phase | High |
| Chat REST and WebSocket API | Chatbot implementation plan, Section 5 | `chatbot_service/api/chat.py` | N/A | Future phase | Critical |
| Chat message endpoint | Chatbot implementation plan, Section 5 | `chatbot_service/api/chat.py` -> `POST /chat/message` | N/A | Future phase | Critical |
| Chat stream endpoint | Chatbot implementation plan and guide | `chatbot_service/api/chat.py` -> `WebSocket /chat/stream` | N/A | Future phase | Critical |
| Chat history endpoint | Chatbot implementation plan, Section 5 | `chatbot_service/api/chat.py` -> `GET /chat/history/{session_id}` | N/A | Future phase | Medium |
| Admin endpoints API | Chatbot implementation plan, Section 5 | `chatbot_service/api/admin.py` | N/A | Future phase | Medium |
| Provider health admin endpoint | Chatbot implementation plan and guide | `chatbot_service/api/admin.py` -> `GET /admin/provider-health` | N/A | Future phase | Medium |
| Vectorstore rebuild admin endpoint | Chatbot implementation plan and guide | `chatbot_service/api/admin.py` -> `POST /admin/rebuild-vectorstore` | N/A | Future phase | Medium |
| Chatbot stats admin endpoint | Chatbot implementation plan | `chatbot_service/api/admin.py` -> `GET /admin/stats` | N/A | Future phase | Medium |
| Provider integration tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_providers.py` | N/A | Future phase | High |
| Intent tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_intent.py` | N/A | Future phase | High |
| Tool contract tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_tools.py` | N/A | Future phase | High |
| RAG retrieval tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_rag.py` | N/A | Future phase | High |
| Voice tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_voice.py` | N/A | Future phase | Medium |
| End-to-end chatbot tests | Chatbot implementation plan, Section 7 | `chatbot_service/tests/test_e2e.py` | N/A | Future phase | Critical |

## 22. Database tables, runtime channels, offline data files, and helper scripts

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| `chat_logs` PostgreSQL table | Chatbot implementation plan and guide | Future DB migration under `chatbot_service/` or main backend migrations | N/A | Future phase | High |
| `first_aid_articles` PostgreSQL table | Chatbot implementation plan | Future DB migration under backend or chatbot service | N/A | Future phase | Medium |
| Redis `road_events` Pub/Sub channel | Chatbot implementation plan and guide | Runtime Redis channel only | `REDIS_URL` | Future phase | High |
| PostgreSQL `NOTIFY` trigger on `road_issues` INSERT | Chatbot implementation plan and guide | Future backend migration / trigger SQL | N/A | Future phase | High |
| Redis geo-grid event keys | Chatbot implementation plan | Runtime Redis keys such as `road_events:{grid_lat}:{grid_lon}` | `REDIS_URL` | Future phase | Medium |
| Vectorstore build script | Chatbot implementation plan and guide | `chatbot_service/data/build_vectorstore.py` | N/A | Future phase | High |
| Offline first-aid JSON corpus | Chatbot implementation plan and guide | `chatbot_service/data/first_aid.json` | N/A | Future phase | High |
| Violations seed CSV | `doc_text.txt` and chatbot guide | `backend/data/violations_seed.csv` | N/A | Future phase | Critical |
| State overrides CSV | `doc_text.txt` and chatbot guide | `backend/data/state_overrides.csv` | N/A | Future phase | Critical |
| Violations reseed script | `doc_text.txt` and chatbot guide | `backend/data/seed_violations.py` | N/A | Future phase | High |
| Offline violations CSV for browser challan | `doc_text.txt` and chatbot guide | `frontend/public/offline-data/violations.csv` | N/A | Future phase | High |
| Offline emergency GeoJSON | `doc_text.txt` | `frontend/public/offline-data/india-emergency.geojson` | N/A | Future phase | High |
| Downloadable city/state emergency bundles | `doc_text.txt` | `frontend/public/offline-data/city-bundles/` or `frontend/public/offline-data/state-packs/` | N/A | Future phase | Medium |
| `AUTHORITY_MATRIX` source file | `doc_text.txt` | Future `backend/services/authority_matrix.py` or `backend/data/authority_matrix.json` | N/A | Future phase | Critical |
| Road safety score / segment risk dataset | `doc_text.txt` | Future `backend/data/road_safety_score/` or DB table | N/A | Future phase | Medium |
| Passive road-quality heatmap storage | `doc_text.txt` | Future DB table / analytics dataset | N/A | Future phase | Low |

## 23. Browser APIs, client-side runtime assets, and offline storage

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| Geolocation one-shot API | `doc_text.txt` and current app architecture | `frontend/lib/geolocation.ts` | N/A | Wired now | Critical |
| Geolocation continuous watch | `doc_text.txt` and current app architecture | `frontend/lib/geolocation.ts` | N/A | Wired now | Critical |
| DeviceMotion crash detection | `doc_text.txt` | `frontend/lib/geolocation.ts` or future crash module | N/A | Future phase | High |
| Service Worker | `doc_text.txt` | `frontend/public/sw.js` or Next PWA layer | N/A | Future phase | High |
| IndexedDB cache | `doc_text.txt` and chatbot guide | Future `frontend/lib/offline-db.ts` and browser storage | N/A | Future phase | High |
| HNSWlib.js for offline RAG | `doc_text.txt` and chatbot guide | Future `frontend/lib/offline-rag.ts` or browser bundle | N/A | Future phase | High |
| DuckDB-Wasm | `doc_text.txt` and chatbot guide | `frontend/lib/duckdb-challan.ts` and browser bundle | N/A | Partially wired | High |
| Browser Cache Storage for offline models | `doc_text.txt` | Browser cache only | N/A | Future phase | Medium |
| WebSocket stream endpoint | Chatbot implementation plan and guide | `chatbot_service/api/chat.py` and frontend chat client | N/A | Future phase | Critical |
| Server-sent events fallback | Chatbot guide | Future frontend chat client / API adapter | N/A | Future phase | Low |
| Chat session ID stored client-side | Chatbot guide and implementation plan | Future `frontend/lib/chat-session.ts` or browser storage | N/A | Future phase | Medium |
| Web Speech API | Chatbot implementation plan and guide | `frontend/components/chat/VoiceInput.tsx` | N/A | Future phase | High |
| Web Speech Synthesis API | Chatbot implementation plan and guide | `frontend/components/chat/VoiceOutput.tsx` | N/A | Future phase | High |
| Browser Notification API | Chatbot guide | Future `frontend/lib/notifications.ts` or alert module | N/A | Future phase | Medium |
| Hands-free mode toggle | Chatbot implementation plan and guide | `frontend/app/settings/page.tsx` and `frontend/components/chat/VoiceOutput.tsx` | N/A | Future phase | Medium |
| Trip history in IndexedDB | Chatbot guide | Future `frontend/lib/trip-history.ts` or IndexedDB store | N/A | Future phase | Medium |
| Feedback thumbs up/down UI | Chatbot guide | Future `frontend/components/chat/FeedbackButtons.tsx` | N/A | Future phase | Medium |
| Voice transcript UI | Chatbot implementation plan | `frontend/components/chat/VoiceInput.tsx` | N/A | Future phase | Medium |
| Route-to-hospital external deep link | `doc_text.txt` | `frontend/components/EmergencyMapInner.tsx` or service popup UI | N/A | Future phase | Medium |

## 24. User profile fields, portals, helplines, and authority-routing integrations

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| User blood group field | `doc_text.txt` | `frontend/app/profile/page.tsx` and profile persistence layer | N/A | Future phase | High |
| User vehicle number field | `doc_text.txt` | `frontend/app/profile/page.tsx` and profile persistence layer | N/A | Future phase | High |
| User emergency contacts | `doc_text.txt` and app feature spec | `frontend/app/profile/page.tsx` and profile persistence layer | N/A | Future phase | High |
| Optional disability / medical info | `doc_text.txt` inspiration from Rakshak | `frontend/app/profile/page.tsx` and profile persistence layer | N/A | Future phase | Medium |
| mParivahan reference portal | https://mparivahan.com or official MoRTH resources | External link only | N/A | Reference only | Low |
| eChallan payment portal | https://echallan.parivahan.gov.in | External link only | N/A | Reference only | Medium |
| NHAI emergency helpline | Official NHAI / Sukhad Yatra references | UI constants and authority matrix | N/A | Wired now | Critical |
| NHAI complaint portal | https://nhai.gov.in/complaint or current official complaint page | External link and authority matrix | N/A | Future phase | High |
| PG Portal grievance fallback | https://pgportal.gov.in | External link and authority matrix | N/A | Future phase | High |
| OMMAS / PMGSY complaint routing | https://ommas.nic.in | External link and authority matrix | N/A | Future phase | High |
| Universal authority-routing matrix | `doc_text.txt` | Future `backend/data/authority_matrix.json` or `backend/services/authority_matrix.py` | N/A | Future phase | Critical |
| Budget source attribution URL | `doc_text.txt` | `road_infrastructure.data_source_url` in DB and UI cards | N/A | Partially wired | High |
| gROADS international road dataset reference | https://datacatalog.worldbank.org/search/dataset/0038014 | Future `backend/datasets/global/groads.*` | N/A | Future phase | Low |
| GRIP international road dataset reference | https://datacatalog.worldbank.org/search/dataset/0038272 | Future `backend/datasets/global/grip.*` | N/A | Future phase | Low |

## 25. Runtime policies, thresholds, safety rules, and quality gates from the docs

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| 6-turn conversation memory window | Chatbot guide | Future `chatbot_service/memory/redis_memory.py` | N/A | Future phase | Medium |
| 24-hour conversation TTL | Chatbot implementation plan and guide | Future `chatbot_service/memory/redis_memory.py` | N/A | Future phase | Medium |
| Provider health polling every 60 seconds | Chatbot guide | Future `chatbot_service/providers/router.py` or health worker | N/A | Future phase | Medium |
| Circuit breaker open period 60 seconds | Chatbot implementation plan | Future `chatbot_service/providers/router.py` | N/A | Future phase | Medium |
| Provider health dashboard target | Chatbot implementation plan | `chatbot_service/api/admin.py` and admin UI if added | N/A | Future phase | Medium |
| Rate limit target: 30 msgs/hour, block 31st | Chatbot implementation plan | `chatbot_service/config.py` and middleware | N/A | Future phase | High |
| 20 concurrent sessions under 5 seconds | Chatbot implementation plan | Load-test target only | N/A | Future phase | High |
| Minimum 500+ Chroma chunks after indexing | Chatbot implementation plan and guide | `chatbot_service/data/build_vectorstore.py` validation | N/A | Future phase | High |
| Voice silence auto-stop 5 seconds | Chatbot implementation plan and guide | `frontend/components/chat/VoiceInput.tsx` | N/A | Future phase | Medium |
| Voice auto-read speed 0.9 | Chatbot implementation plan and guide | `frontend/components/chat/VoiceOutput.tsx` | N/A | Future phase | Medium |
| Proactive alert distance 2km | Chatbot guide | Future alerting module | N/A | Future phase | Medium |
| WebSocket / live map push area 5km | Chatbot guide and implementation plan | Future geo-subscription logic | N/A | Future phase | Medium |
| Road event cache TTL 1 hour | Chatbot implementation plan | Redis runtime keys | `REDIS_URL` | Future phase | Low |
| Crash threshold 2.5G | `doc_text.txt` | `frontend/lib/geolocation.ts` or crash module | N/A | Future phase | High |
| Crash cooldown 30 seconds | `doc_text.txt` | `frontend/lib/geolocation.ts` or crash module | N/A | Future phase | Medium |
| Ignore crash below 10km/h | `doc_text.txt` | `frontend/lib/geolocation.ts` or crash module | N/A | Future phase | High |
| Nearby road issues freshness 90 days | `doc_text.txt` | backend road issues query layer | N/A | Partially wired | Medium |
| GPS auto-refresh after 500m movement | `doc_text.txt` | `frontend/lib/geolocation.ts` and map bootstrap | N/A | Future phase | Medium |
| Honest fallback response mentioning 112 or 1033 | Chatbot guide | `chatbot_service/agent/safety_checker.py` and fallback prompts | N/A | Future phase | High |

## 26. Reference applications and benchmark products mentioned in the docs

These are included so the source material is fully represented, but they are not assets you need to download into the repo.

| Item | Source | Local save path | Env variable name | Status | Priority |
|---|---|---|---|---|---|
| HumSafar Road Safety App | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Rakshak | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Safely Home App | `doc_text.txt` | N/A | N/A | Reference only | Low |
| mParivahan | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Sukhad Yatra | `doc_text.txt` | N/A | N/A | Reference only | Low |
| BreakDown App | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Waze | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Google Maps crash detection reference | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Apple Emergency SOS reference | `doc_text.txt` | N/A | N/A | Reference only | Low |
| Nayan Tech | `doc_text.txt` | N/A | N/A | Reference only | Low |
| LifeSaver | `doc_text.txt` | N/A | N/A | Reference only | Low |
| iRoad / Road Warrior | `doc_text.txt` | N/A | N/A | Reference only | Low |
