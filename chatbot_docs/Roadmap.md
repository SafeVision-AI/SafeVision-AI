# RoadSoS Chatbot - Implementation Roadmap

The development of the chatbot service is divided into nine phases to ensure build consistency and avoid conflicts.

## Phase 1: Foundation (Days 1-3)
- Create `chatbot_service/` folder and setup base directories.
- Configure all six LLM provider API wrappers.
- Verify health checks for all providers.

## Phase 2: RAG Pipeline (Days 4-7)
- Index Motor Vehicles Act and WHO PDFs into ChromaDB.
- Build the document retriever with MMR (Maximal Marginal Relevance) search.

## Phase 3: Intent Detection (Days 8-10)
- Categorize user messages into one of 10 intents using `llama3-8b`.
- Support for Hindi, Tamil, and Hinglish.

## Phase 4: Agent Tools (Days 11-15)
- Implementation of emergency, challan, and legal search tools.
- Connection of tools to the main backend APIs.

## Phase 5: Agent Assembly (Days 16-19)
- Wire everything into a LangGraph state machine.
- Implement conversation memory with Redis.

## Phase 6: Streaming (Days 20-22)
- Add WebSocket token streaming for low-latency feedback.

## Phase 7: Real-Time Data (Days 23-26)
- Connect to live road issues via PostgreSQL triggers and Redis Pub/Sub.

## Phase 8: Voice Integration (Days 27-30)
- Add voice input/output on the frontend.
- Implement auto-read logic for emergency responses.

## Phase 9: Safety and Hardening (Days 31-35)
- Safety check nodes, rate limits, and provider health monitoring.
