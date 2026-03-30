# SafeVisionAI  Architecture

## System Architecture Overview

```

                        USER DEVICE                               
                                                                   
     
                Next.js 14 PWA (Vercel CDN)                     
                                                                
               
    Emergency  AI Chat    Challan     Road           
    Locator    (Online)   Calc        Reporter       
               
                                                            
    ----    
                  Browser Offline Layer                        
      WebLLM (Phi-3)    DuckDB-Wasm    HNSWlib.js          
      GeoJSON Turf.js   IndexedDB      Service Worker       
        
     

                               HTTPS
                              -

                    FastAPI Backend (Render.com)                   
                                                                   
        
   Emergency       Chat Router      Challan Service        
   API             (LangChain       (DuckDB SQL)           
   (PostGIS +       + Groq)                                
    Overpass)                       RoadWatch Service      
       (Overpass +           
                                       Authority Matrix)     
  --     
           Core Services                                         
    Redis Cache  PostGIS Queries                                
    Nominatim    ChromaDB RAG                                   
                                

                              
                              -

                    External Services (All Free)                   
                                                                   
  Supabase DB    Upstash Redis    Groq API    OSM Overpass        
  (PostgreSQL    (10K cmds/day)   (70B LLM    (POI data)         
  + PostGIS)     API caching)     free tier)                      
                                                                   
  Nominatim      HuggingFace Hub  data.gov.in  PMGSY OMMAS       
  (Geocoding)    (WebLLM CDN)     (NHAI data)  (road infra)      

```

---

## Dual-Layer AI Architecture

The most technically significant decision in SafeVisionAI. No other road safety app globally has implemented this approach.

```
User sends message
        
        -
  Is network available?
        
  
  YES           NO
                
  -              -
  
 FastAPI     WebLLM (Phi-3 Mini 3.8B)     
 Groq        Running on USER'S DEVICE      
 llama3-                                  
 70b-8192    + HNSWlib.js vector search   
               on IndexedDB first-aid data 
 ChromaDB                                 
 RAG         + Turf.js GeoJSON for POI    
  
                           
       
                -
       Same chat interface
       same intent detection
       same user experience
```

| Aspect | Online (Layer 1) | Offline (Layer 2) |
|---|---|---|
| LLM | Groq llama3-70b-8192 | WebLLM Phi-3-mini-4k (4-bit) |
| Parameters | 70 billion | 3.8 billion |
| Runs on | Groq cloud (free API) | User's browser (WebGPU) |
| Context | 8,192 tokens | 4,096 tokens |
| First token | 1-2 seconds | 3-5s (GPU) / 8-15s (CPU) |
| RAG | ChromaDB on server | HNSWlib.js in browser |
| POI Search | PostGIS ST_DWithin | Turf.js haversine on GeoJSON |
| Challan | DuckDB SQL on server | DuckDB-Wasm in browser |
| Cost | 0 (Groq free tier) | 0 (local device compute) |

---

## 5-Layer Offline Architecture

```
Layer 1: App Shell
  All UI, JS, CSS, fonts  Workbox precache at install
   Available from FIRST visit, zero config

Layer 2: Emergency POI Data
  india-emergency.geojson (25 cities) + Turf.js
   Available from first visit, no extra download

Layer 3: Challan Calculator
  DuckDB-Wasm + violations.csv + state_overrides.csv
   Available from first visit, files cached by Service Worker

Layer 4: AI Chatbot
  WebLLM Phi-3 Mini (~2.2GB) + HNSWlib.js + first-aid.json
   Available after one-time download (user-initiated)

Layer 5: Road Reports (Offline Queue)
  IndexedDB + Background Sync API
   Always  queues offline, auto-submits when online
```

---

## Data Flow: Emergency Locator (Online)

```
1. User opens /emergency page
        
2. navigator.geolocation.getCurrentPosition()
    lat, lon stored in Zustand
        
3. /api/v1/geocode/reverse
    city "Chennai", state "Tamil Nadu"
        
4. /api/v1/emergency/nearby?lat=X&lon=Y
        
   -
    FastAPI emergency.py             
                                     
    1. Check Redis cache             
       key: nearby:13.0827:80.2707.. 
       HIT  return cached result    
       MISS  continue               
                                     
    2. PostGIS ST_DWithin query      
       GIST index  < 50ms           
                                     
    3. If count < 3  expand radius  
       500m1km5km10km25km50km  
                                     
    4. If still < 3  Overpass API   
       fallback  merge + dedup      
                                     
    5. Cache result in Redis 1hr     
       Return EmergencyResponse      
   
        
5. Frontend renders Leaflet markers
   color-coded by category
```

---

## Data Flow: AI Chatbot (Online)

```
User types/speaks message
        
Web Speech API  text input (if voice)
        
POST /api/v1/chat/message
        
   -
    FastAPI chat.py                 
                                    
    1. detect_intent(message)       
        Prompt Groq to return JSON 
        one of 9 intent labels     
                                    
    2. If FIND_* intent:            
        call /emergency/nearby     
        format services as context 
                                    
    3. ChromaDB MMR search          
        top-5 diverse law/med chunks
                                    
    4. Build prompt:                
       system + retrieved context   
       + chat_history + user message
                                    
    5. Groq llama3-70b generates    
       grounded response            
                                    
    6. Store in Redis chat history  
    7. Return answer + intent + src 
   
```

---

## RAG Pipeline Architecture

```
PHASE 1: INDEX BUILD (once, ~10 minutes)

PDF Documents  PyPDFLoader  LangChain Documents
                                    
                              Add metadata
                          (source, type, page)
                                    
                     RecursiveCharacterTextSplitter
                     (chunk_size=1000, overlap=150)
                                    
                    sentence-transformers/all-MiniLM-L6-v2
                     384-dimensional embeddings
                                    
                            ChromaDB Storage
                         data/chroma_db/ (persistent)


PHASE 2: QUERY HANDLING (every chat message)

User message  all-MiniLM embedding  384-dim vector
                                            
                              ChromaDB MMR search
                              (balance relevance + diversity)
                                            
                              Top 5 relevant law/medical chunks
                                            
                    Injected into Groq prompt as context:
                    "Using ONLY these sections, answer: [chunks]
                     Question: [user message]"
                                            
                         Groq llama3-70b generates
                         grounded response with section numbers
```

---

## PWA Service Worker Caching Strategy

```
Resource Type          Strategy           Cache Name        TTL

App shell (HTML/JS/CSS) Precache          app-shell          (versioned)
/api/v1/emergency/*    NetworkFirst       emergency-api     3600s
*.geojson files        CacheFirst         geojson-data      
*.onnx/*.bin/*.wasm    CacheFirst         model-weights     
OSM tile URLs          StaleWhileReval.   osm-tiles         500 entries max
/api/v1/challan/*      NetworkFirst       challan-api       86400s
Road issue photos      Background Sync    (IndexedDB queue) 
/offline-data/*.json   CacheFirst         offline-content   
```

---

## Monorepo Folder Structure

```
SafeVisionAI/
 backend/           FastAPI Python 3.11 application
 frontend/          Next.js 14 TypeScript PWA
 docs/              Technical documentation (this folder)
 .github/
    workflows/
        ci.yml    GitHub Actions CI/CD
 render.yaml        Render.com deployment config
 .gitignore
 README.md
```

---

*Document version: 1.0 | IIT Madras Road Safety Hackathon 2026*
