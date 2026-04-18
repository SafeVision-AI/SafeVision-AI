# SafeVisionAI Chatbot — Implementation Roadmap

The development of the chatbot service was divided into nine phases to ensure build consistency and avoid conflicts.

## Phase 1: Foundation ✅
- Created `chatbot_service/` folder and setup base directories.
- Configured all 11 LLM provider API wrappers with auto-fallback.
- Verified health checks for all providers.

## Phase 2: RAG Pipeline ✅
- Indexed Motor Vehicles Act and WHO PDFs into ChromaDB.
- Built the document retriever with MMR (Maximal Marginal Relevance) search.
- Committed `data/chroma_db/` to git for Render deployment.

## Phase 3: Intent Detection ✅
- Built rule-based `IntentDetector` using keyword matching and regex patterns.
- 9 intent categories with support for multilingual input.
- No separate LLM call — instant classification (<1ms).

## Phase 4: Agent Tools ✅
- Implemented 9 tools: SOS, Challan, Legal, FirstAid, Weather, RoadInfra, RoadIssues, SubmitReport, GeoFencing.
- Connected all tools to the main backend APIs via `httpx` async client.

## Phase 5: Agent Assembly ✅
- Wired everything into a custom `ChatEngine` class (`agent/graph.py`).
- Implemented conversation memory with Redis (`memory/store.py`).
- Built `ContextAssembler` to orchestrate parallel tool calls.

## Phase 6: Multi-Provider Routing ✅
- Implemented `ProviderRouter` with 11-provider fallback chain.
- Added Sarvam AI auto-routing for Indian languages (regex Unicode detection).
- Added `TemplateProvider` as always-works fallback.

## Phase 7: Indian Language Support ✅
- Integrated Sarvam AI (30B general, 105B legal) for Hindi, Tamil, Telugu, etc.
- Added IndicSeamless speech model for Indian language ASR/TTS.

## Phase 8: Voice Integration ✅
- Added voice input/output on the frontend (Web Speech API).
- Implemented auto-read logic for emergency responses.

## Phase 9: Safety and Hardening ✅
- `SafetyChecker` node with pre/post validation.
- Rate limits and provider health monitoring.
- All phases complete — production-ready for hackathon.
