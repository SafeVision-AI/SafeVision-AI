# SafeVixAI Chatbot — Architecture

The SafeVixAI AI chatbot is a **separate Python service** (port 8010) that connects the frontend to advanced LLM behavior and real-time backend data.

## System Components
1. **Frontend (Next.js 15)**: Provides the Chat UI and API interface.
2. **Main Backend (FastAPI :8000)**: Manages PostgreSQL, PostGIS, and user data.
3. **Chatbot Service (FastAPI :8010)**: Independently manages the AI agent pipeline.
4. **Vectorstore (ChromaDB)**: Houses indexed legal and first-aid documents for retrieval.
5. **Memory (Redis)**: Stores conversation history for session-based persistence.

## Data Flow
1. **User Query**: Message sent from frontend with GPS coordinates.
2. **Safety Check**: `SafetyChecker` evaluates for harmful content.
3. **Intent Analysis**: Rule-based `IntentDetector` classifies the query type (Emergency, Legal, etc.).
4. **Tool Interaction**: `ContextAssembler` runs concurrent calls to backend APIs and ChromaDB for live data.
5. **Provider Selection**: `ProviderRouter` detects language and selects optimal LLM provider.
6. **Response Generation**: LLM generates grounded response with tool context.
7. **Persistence**: The turn is saved to the Redis memory store (24hr TTL).

## Reliability: 11-Provider Fallback Chain

To maintain maximum uptime, the service automatically cycles through **eleven** LLM providers:

| Order | Provider | Speed | Specialty |
|-------|----------|-------|-----------|
| 1 | **Groq** | 300+ tok/s | Primary English |
| 2 | **Cerebras** | 2000+ tok/s | Speed overflow |
| 3 | **Gemini** | Varies | Large context (1M tokens) |
| — | **Sarvam AI 30B** | Varies | Indian languages (auto-routed) |
| — | **Sarvam AI 105B** | Varies | Legal queries in Indian languages |
| 4 | **GitHub Models** | Varies | Free with GitHub account |
| 5 | **NVIDIA NIM** | Varies | GPU-optimized inference |
| 6 | **OpenRouter** | Varies | Gateway to 20+ models |
| 7 | **Mistral** | Varies | 1B tokens/month free |
| 8 | **Together** | Varies | $25 free credit bank |
| 9 | **Template** | Instant | Deterministic fallback — always works |

> **Indian languages** (Hindi, Tamil, Telugu, Kannada, Bengali, etc.) are detected via regex Unicode script ranges and auto-routed to Sarvam AI — they bypass the main fallback chain entirely.
