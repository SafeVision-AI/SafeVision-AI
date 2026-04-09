# RoadSoS Chatbot Architecture

The RoadSoS AI chatbot is a separate Python service that connects the frontend to advanced LLM behavior and real-time backend data.

## System Components
1. **Frontend (Next.js)**: Provides the Chat UI and WebSocket interface.
2. **Main Backend (FastAPI)**: Manages PostgreSQL, PostGIS, and user data.
3. **Chatbot Service (FastAPI)**: Independently manages the AI agent state machine.
4. **Vectorstore (ChromaDB)**: Houses indexed legal and first-aid documents for retrieval.
5. **Memory (Redis)**: Stores conversation history for session-based persistence.

## Data Flow
1. **User Query**: Message sent from frontend with GPS coordinates.
2. **Intent Analysis**: Identification of the query type (Emergency, Legal, etc.).
3. **Tool Interaction**: Concurrent calls to the Main Backend for live service info.
4. **Context Injection**: Preparation of the final prompt for the LLM.
5. **Response Generation**: Token streaming via WebSocket for low-latency feedback.
6. **Persistence**: The turn is saved to the Redis memory store.

## Reliability: Fallback Routing
To maintain 100% uptime, the service automatically cycles through six LLM providers:
- Groq (Primary)
- Google Gemini (First Fallback)
- GitHub Models (Second Fallback)
- NVIDIA NIM (Third Fallback)
- Mistral AI
- Together AI
