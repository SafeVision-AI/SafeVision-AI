# SafeVixAI Chatbot — Agent Documentation

The SafeVixAI Chatbot is designed as an **Agentic AI Assistant**, moving beyond simple chat interfaces to a system that can take real-world actions in emergencies.

## Core Architecture: RAG + Agent Tools

Instead of fine-tuning, which is static and compute-intensive, we use a **Retrieval-Augmented Generation (RAG)** combined with an **Agentic workflow** powered by 9 specialized tools.

### Why Agentic?
- **Action-Oriented**: The chatbot doesn't just answer; it calls emergency APIs, calculates fines, and triggers SOS alerts.
- **Real-Time Data**: It has contextual awareness of the user's GPS coordinates, nearby hospitals, and community reports.
- **Dynamic Decision Logic**: Using a custom `ChatEngine` class, the agent follows a deterministic graph to decide which tools to use and how to synthesize the response.

## Agent Orchestration (ChatEngine)

The agent follows a deterministic yet flexible execution sequence defined in `agent/graph.py`:

1. **SafetyChecker**: Evaluates the message for harmful content. Blocks if necessary.
2. **IntentDetector**: Classifies the message using rule-based keyword matching into one of 9 intents (e.g., `FIND_HOSPITAL`, `CHALLAN_QUERY`). Instant — no LLM call needed.
3. **ContextAssembler**: Based on the detected intent, determines which tools to invoke and gathers context.
4. **Tool Execution**: Runs selected tools concurrently (using `asyncio`) to gather real-time data from the backend API, ChromaDB, or external services.
5. **ProviderRouter**: Selects the optimal LLM provider based on language detection and available API keys. Builds the final prompt with system instructions + tool context + conversation history.
6. **LLM Generation**: Calls the selected provider (one of 11 in the fallback chain) for final response synthesis.
7. **Safety Post-Check**: Ensures emergency responses include contact numbers (112) and nearest hospital info.
8. **Memory Persistence**: Stores the turn in Redis conversation memory (24hr TTL).

## 9 Agent Tools

| Tool | What It Does | Data Source |
|------|-------------|-------------|
| SosTool | Finds nearest emergency services | Backend API → PostGIS + Overpass |
| ChallanTool | Calculates traffic fines deterministically | Backend API → DuckDB SQL |
| LegalSearchTool | Searches MV Act and traffic regulations | ChromaDB vector search |
| FirstAidTool | Provides WHO-based first-aid protocols | Static JSON data |
| WeatherTool | Gets current weather conditions | OpenWeather API |
| RoadInfrastructureTool | Returns contractor/budget/engineer info | Backend API → data.gov.in |
| RoadIssuesTool | Lists community-reported road issues | Backend API → PostGIS |
| SubmitReportTool | Submits road damage reports | Backend API → PostgreSQL |
| GeoFencingTool | Determines state-specific legal variations | GPS → reverse geocode |

> **Note**: The `GeoFencingTool` name is historical. In the current codebase, its functionality is handled by `EmergencyTool` (`tools/emergency_tool.py`), which also provides direct emergency service lookups.

## Key Capabilities
- **Parallel Tool Calling**: Reduces response time for complex queries (e.g., finding both hospitals and police simultaneously).
- **11-Provider LLM Fallback**: Groq → Cerebras → Gemini → Sarvam AI → GitHub → NVIDIA → OpenRouter → Mistral → Together → Template.
- **Indian Language Auto-Routing**: Hindi, Tamil, Telugu, etc. automatically routed to **Sarvam AI** (30B/105B).
- **Multilingual Support**: Built-in support for 10+ Indian languages via Sarvam AI and regex-based script detection.
