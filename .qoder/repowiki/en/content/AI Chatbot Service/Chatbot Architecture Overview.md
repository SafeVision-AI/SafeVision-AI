# Chatbot Architecture Overview

<cite>
**Referenced Files in This Document**
- [chatbot_service/main.py](file://chatbot_service/main.py)
- [chatbot_service/config.py](file://chatbot_service/config.py)
- [chatbot_service/agent/__init__.py](file://chatbot_service/agent/__init__.py)
- [chatbot_service/agent/context_assembler.py](file://chatbot_service/agent/context_assembler.py)
- [chatbot_service/agent/graph.py](file://chatbot_service/agent/graph.py)
- [chatbot_service/agent/intent_detector.py](file://chatbot_service/agent/intent_detector.py)
- [chatbot_service/agent/safety_checker.py](file://chatbot_service/agent/safety_checker.py)
- [chatbot_service/providers/router.py](file://chatbot_service/providers/router.py)
- [chatbot_service/providers/base.py](file://chatbot_service/providers/base.py)
- [chatbot_service/memory/redis_memory.py](file://chatbot_service/memory/redis_memory.py)
- [chatbot_service/rag/retriever.py](file://chatbot_service/rag/retriever.py)
- [chatbot_service/rag/vectorstore.py](file://chatbot_service/rag/vectorstore.py)
- [chatbot_service/api/chat.py](file://chatbot_service/api/chat.py)
- [chatbot_service/api/admin.py](file://chatbot_service/api/admin.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the AI Chatbot Service architecture for SafeVixAI, focusing on the agentic Retrieval-Augmented Generation (RAG) pipeline, FastAPI application structure, and service lifecycle management. It explains the modular design separating context assembly, intent detection, provider routing, and memory management, along with system boundaries, component interactions, and data flow patterns. It also covers dependency injection for service initialization, scalability considerations, error handling strategies, and performance optimizations.

## Project Structure
The chatbot service is organized into cohesive modules:
- Application entrypoint and lifecycle: FastAPI app creation, middleware, and dependency injection via lifespan.
- Agent subsystem: intent detection, safety checks, context assembly, and orchestration.
- Providers: multi-provider routing with fallback and language-aware selection.
- Memory: Redis-backed conversation storage with in-memory fallback.
- RAG: vectorized retrieval augmented by a local vector store and retriever.
- Tools: external integrations for SOS, challan calculation, weather, road infrastructure, and legal search.
- API: chat endpoints (blocking and streaming), admin endpoints, and health checks.

```mermaid
graph TB
subgraph "FastAPI App"
M["main.py<br/>create_app()"]
CFG["config.py<br/>Settings"]
API_CHAT["api/chat.py<br/>/api/v1/chat/*"]
API_ADMIN["api/admin.py<br/>/admin/*"]
end
subgraph "Agent"
INTENT["agent/intent_detector.py"]
SAFETY["agent/safety_checker.py"]
CTX["agent/context_assembler.py"]
ENGINE["agent/graph.py<br/>ChatEngine"]
end
subgraph "Providers"
ROUTER["providers/router.py<br/>ProviderRouter"]
BASE["providers/base.py<br/>HttpProvider, TemplateProvider"]
end
subgraph "Memory"
MEM["memory/redis_memory.py<br/>ConversationMemoryStore"]
end
subgraph "RAG"
VSTORE["rag/vectorstore.py<br/>LocalVectorStore"]
RETRIEVE["rag/retriever.py<br/>Retriever"]
end
subgraph "Tools"
BT["tools/__init__.py<br/>BackendToolClient"]
end
M --> API_CHAT
M --> API_ADMIN
M --> CFG
M --> MEM
M --> ENGINE
ENGINE --> INTENT
ENGINE --> SAFETY
ENGINE --> CTX
ENGINE --> ROUTER
CTX --> RETRIEVE
CTX --> BT
RETRIEVE --> VSTORE
ROUTER --> BASE
```

**Diagram sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/config.py:69-126](file://chatbot_service/config.py#L69-L126)
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)
- [chatbot_service/agent/context_assembler.py:17-215](file://chatbot_service/agent/context_assembler.py#L17-L215)
- [chatbot_service/providers/router.py:75-199](file://chatbot_service/providers/router.py#L75-L199)
- [chatbot_service/providers/base.py:90-206](file://chatbot_service/providers/base.py#L90-L206)
- [chatbot_service/memory/redis_memory.py:10-90](file://chatbot_service/memory/redis_memory.py#L10-L90)
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)

**Section sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/config.py:69-126](file://chatbot_service/config.py#L69-L126)

## Core Components
- FastAPI application with dependency injection during lifespan, CORS middleware, rate limiting, and health endpoints.
- Agent orchestration encapsulated in ChatEngine, coordinating intent detection, safety checks, context assembly, provider routing, and memory persistence.
- ProviderRouter implementing a 11-provider fallback chain with language-aware routing and Indian-language specialization.
- ContextAssembler assembling conversation context from RAG snippets and tool outputs based on detected intent.
- Memory abstraction via ConversationMemoryStore supporting Redis and in-memory fallback.
- RAG stack with LocalVectorStore and Retriever for semantic search and document scoring.
- Tools integrating with backend APIs and external services for SOS, weather, road infrastructure, legal search, and more.
- API surface exposing chat endpoints (blocking and streaming) and admin endpoints for index rebuilding and health.

**Section sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)
- [chatbot_service/providers/router.py:75-199](file://chatbot_service/providers/router.py#L75-L199)
- [chatbot_service/agent/context_assembler.py:17-215](file://chatbot_service/agent/context_assembler.py#L17-L215)
- [chatbot_service/memory/redis_memory.py:10-90](file://chatbot_service/memory/redis_memory.py#L10-L90)
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)

## Architecture Overview
The system follows an agentic RAG pipeline:
- Input enters via FastAPI routes, injected into ChatEngine through app.state.
- ChatEngine evaluates safety, detects intent, assembles context, selects a provider, and streams or returns the response.
- ContextAssembly enriches prompts with RAG snippets and tool outputs scoped by intent.
- ProviderRouter applies language detection and intent-aware routing with robust fallback.
- Memory persists user-assistant messages with TTL and supports health checks.
- RAG retrieves semantically similar chunks and builds a compact context window.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "FastAPI Router (/api/v1/chat)"
participant Engine as "ChatEngine"
participant Safety as "SafetyChecker"
participant Intent as "IntentDetector"
participant Assembler as "ContextAssembler"
participant RAG as "Retriever/VectorStore"
participant Tools as "Tools"
participant Router as "ProviderRouter"
participant Prov as "LLM Provider"
participant Mem as "ConversationMemoryStore"
Client->>API : POST /chat or /chat/stream
API->>Engine : chat(payload)
Engine->>Mem : append_message(user)
Engine->>Mem : get_history(limit)
Engine->>Safety : evaluate(message)
alt blocked
Safety-->>Engine : SafetyDecision(blocked)
Engine->>Mem : append_message(assistant, policy response)
Engine-->>API : ChatResponse(blocked)
API-->>Client : response
else allowed
Engine->>Intent : detect(message)
Engine->>Assembler : assemble(session_id, message, intent, coords, history)
Assembler->>RAG : retrieve(query, top_k, scopes)
Assembler->>Tools : call SOS/Weather/Legal/Road/etc.
Assembler-->>Engine : ConversationContext
Engine->>Router : generate(ProviderRequest)
Router->>Prov : generate(request)
Prov-->>Router : ProviderResult
Router-->>Engine : ProviderResult
Engine->>Mem : append_message(assistant, result.text)
Engine-->>API : ChatResponse
API-->>Client : response or SSE stream
end
```

**Diagram sources**
- [chatbot_service/api/chat.py:28-97](file://chatbot_service/api/chat.py#L28-L97)
- [chatbot_service/agent/graph.py:33-87](file://chatbot_service/agent/graph.py#L33-L87)
- [chatbot_service/agent/safety_checker.py:12-31](file://chatbot_service/agent/safety_checker.py#L12-L31)
- [chatbot_service/agent/intent_detector.py:9-25](file://chatbot_service/agent/intent_detector.py#L9-L25)
- [chatbot_service/agent/context_assembler.py:43-81](file://chatbot_service/agent/context_assembler.py#L43-L81)
- [chatbot_service/rag/retriever.py:22-39](file://chatbot_service/rag/retriever.py#L22-L39)
- [chatbot_service/providers/router.py:154-199](file://chatbot_service/providers/router.py#L154-L199)
- [chatbot_service/providers/base.py:129-159](file://chatbot_service/providers/base.py#L129-L159)
- [chatbot_service/memory/redis_memory.py:23-44](file://chatbot_service/memory/redis_memory.py#L23-L44)

## Detailed Component Analysis

### FastAPI Application and Lifecycle Management
- Application factory creates FastAPI with CORS and rate-limiting middleware.
- Lifespan initializes services: memory store, vector store, retriever, tools, context assembler, and ChatEngine.
- Services are attached to app.state for global access via dependency injection.
- Health endpoints expose service status and memory availability.
- API routers mounted for chat and admin operations.

```mermaid
flowchart TD
Start(["create_app()"]) --> LoadCfg["Load Settings"]
LoadCfg --> InitServices["Initialize Services in lifespan()"]
InitServices --> AttachState["Attach to app.state"]
AttachState --> MountAPI["Mount API Routers"]
MountAPI --> Health["Expose /health and root"]
Health --> Ready(["Application Ready"])
```

**Diagram sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/config.py:69-126](file://chatbot_service/config.py#L69-L126)

**Section sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/config.py:69-126](file://chatbot_service/config.py#L69-L126)

### Agent Orchestration (ChatEngine)
- Coordinates safety evaluation, intent detection, context assembly, provider routing, and memory persistence.
- Builds a de-duplicated sources list for provenance tracking.
- Exposes history retrieval and index rebuild/stats.

```mermaid
classDiagram
class ChatEngine {
+memory_store : ConversationMemoryStore
+vectorstore : LocalVectorStore
+intent_detector : IntentDetector
+safety_checker : SafetyChecker
+context_assembler : ContextAssembler
+provider_router : ProviderRouter
+chat(payload) ChatResponse
+get_history(session_id) list
+rebuild_index() dict
+stats() dict
}
```

**Diagram sources**
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)

**Section sources**
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)

### Intent Detection
- Rule-based classifier categorizing user messages into emergency, first_aid, challan, legal, road_issue, or general.

```mermaid
flowchart TD
A["Input message"] --> B["Lowercase & tokenize"]
B --> C{"Contains emergency terms?"}
C --> |Yes| E["intent=emergency"]
C --> |No| D{"Contains first_aid terms?"}
D --> |Yes| F["intent=first_aid"]
D --> |No| G{"Matches challan pattern?"}
G --> |Yes| H["intent=challan"]
G --> |No| I{"Contains legal terms?"}
I --> |Yes| J["intent=legal"]
I --> |No| K{"Contains road_issue terms?"}
K --> |Yes| L["intent=road_issue"]
K --> |No| M["intent=general"]
```

**Diagram sources**
- [chatbot_service/agent/intent_detector.py:9-25](file://chatbot_service/agent/intent_detector.py#L9-L25)

**Section sources**
- [chatbot_service/agent/intent_detector.py:9-25](file://chatbot_service/agent/intent_detector.py#L9-L25)

### Safety Checker
- Blocks harmful prompts and returns a policy-compliant response.

```mermaid
flowchart TD
S["Input message"] --> T["Lowercase"]
T --> U{"Blocked pattern matched?"}
U --> |Yes| V["Return blocked=True + policy response"]
U --> |No| W["Return blocked=False"]
```

**Diagram sources**
- [chatbot_service/agent/safety_checker.py:12-31](file://chatbot_service/agent/safety_checker.py#L12-L31)

**Section sources**
- [chatbot_service/agent/safety_checker.py:12-31](file://chatbot_service/agent/safety_checker.py#L12-L31)

### Context Assembly
- Assembles ConversationContext with retrieved RAG snippets and tool outputs.
- Adds SOS, weather, first aid, challan, road infrastructure, road issues, and submission guidance depending on intent and coordinates.

```mermaid
flowchart TD
CA["assemble(session_id, message, intent, lat, lon, history)"] --> DetectIntent["Intent switch"]
DetectIntent --> EM{"emergency?"}
EM --> |Yes| AddEmerg["Add SOS + nearby services + weather"]
EM --> |No| FA{"first_aid?"}
FA --> |Yes| AddFA["Add first aid steps + drug info"]
FA --> |No| CH{"challan?"}
CH --> |Yes| AddChallan["Add challan inference"]
CH --> |No| LE{"legal?"}
LE --> |Yes| AddLegal["Add legal search results"]
LE --> |No| RI{"road_issue?"}
RI --> |Yes| AddRoad["Add road infra + issues + report guidance"]
RI --> |No| AddGen["Add general retrieval"]
AddEmerg --> BuildCtx["Build ConversationContext"]
AddFA --> BuildCtx
AddChallan --> BuildCtx
AddLegal --> BuildCtx
AddRoad --> BuildCtx
AddGen --> BuildCtx
```

**Diagram sources**
- [chatbot_service/agent/context_assembler.py:43-81](file://chatbot_service/agent/context_assembler.py#L43-L81)
- [chatbot_service/agent/context_assembler.py:83-215](file://chatbot_service/agent/context_assembler.py#L83-L215)

**Section sources**
- [chatbot_service/agent/context_assembler.py:17-215](file://chatbot_service/agent/context_assembler.py#L17-L215)

### Provider Routing and Language-Aware Selection
- Detects Indian language scripts and routes to specialized providers for legal and general queries.
- Implements a strict fallback chain across 11 providers with deterministic template fallback.
- Attaches routing metadata to results.

```mermaid
flowchart TD
P["generate(request)"] --> Lang["detect_lang(message)"]
Lang --> Sel["select_provider_name(intent, detected_lang, hint)"]
Sel --> Prim["Primary provider"]
Prim --> TryPrim{"Generate succeeds?"}
TryPrim --> |Yes| Meta["Attach provider_used, detected_lang, india_badge"]
Meta --> Done["Return ProviderResult"]
TryPrim --> |No| Fallback["Iterate fallback chain"]
Fallback --> TryFB{"Next provider succeeds?"}
TryFB --> |Yes| FBMeta["Attach provider_used, fallback_from"]
FBMeta --> Done
TryFB --> |No| RetryChain["Continue or raise error"]
RetryChain --> Done
```

**Diagram sources**
- [chatbot_service/providers/router.py:48-73](file://chatbot_service/providers/router.py#L48-L73)
- [chatbot_service/providers/router.py:125-153](file://chatbot_service/providers/router.py#L125-L153)
- [chatbot_service/providers/router.py:154-199](file://chatbot_service/providers/router.py#L154-L199)

**Section sources**
- [chatbot_service/providers/router.py:75-199](file://chatbot_service/providers/router.py#L75-L199)
- [chatbot_service/providers/base.py:90-206](file://chatbot_service/providers/base.py#L90-L206)

### Memory Management
- ConversationMemoryStore persists messages with timestamps and metadata.
- Supports Redis-backed storage with in-memory fallback and TTL.
- Provides health checks and graceful degradation.

```mermaid
classDiagram
class ConversationMemoryStore {
-_client : Redis | None
-_memory : dict
-_redis_healthy : bool
-_session_ttl_seconds : int
+append_message(session_id, role, content, metadata) dict
+get_history(session_id, limit) list
+clear_session(session_id) void
+ping() bool
+close() void
+backend_name() str
}
```

**Diagram sources**
- [chatbot_service/memory/redis_memory.py:10-90](file://chatbot_service/memory/redis_memory.py#L10-L90)

**Section sources**
- [chatbot_service/memory/redis_memory.py:10-90](file://chatbot_service/memory/redis_memory.py#L10-L90)

### RAG Pipeline
- LocalVectorStore loads and persists document chunks; builds index from data directory.
- Retriever performs semantic search with optional category scopes and top-k selection.
- Scoring and chunking strategies optimize relevance and context window fit.

```mermaid
flowchart TD
VS["LocalVectorStore"] --> EnsureIdx{"Index exists?"}
EnsureIdx --> |Yes| UseIdx["Use existing chunks"]
EnsureIdx --> |No| BuildIdx["load_documents -> _chunk_document -> persist"]
UseIdx --> Search["search(query, top_k, scopes)"]
BuildIdx --> Search
Search --> Score["score_query -> sort -> top_k"]
Score --> Results["Return (chunk, score) list"]
```

**Diagram sources**
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)

**Section sources**
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)

### API Surface
- Chat endpoints: blocking and streaming with SSE; streaming simulates token delivery for UX.
- History endpoint: retrieve conversation history for a session.
- Admin endpoints: health and rebuild index guarded by admin secret.

```mermaid
sequenceDiagram
participant Client as "Client"
participant ChatAPI as "/api/v1/chat"
participant Stream as "/api/v1/chat/stream"
participant Admin as "/admin/rebuild-index"
Client->>ChatAPI : POST /
ChatAPI-->>Client : ChatResponse
Client->>Stream : POST /stream
Stream-->>Client : SSE tokens + done event
Client->>Admin : POST /admin/rebuild-index (X-Admin-Key)
Admin-->>Client : Index rebuilt stats
```

**Diagram sources**
- [chatbot_service/api/chat.py:28-97](file://chatbot_service/api/chat.py#L28-L97)
- [chatbot_service/api/admin.py:45-52](file://chatbot_service/api/admin.py#L45-L52)

**Section sources**
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)

## Dependency Analysis
- Cohesion: Each module has a single responsibility (routing, memory, RAG, tools, agent orchestration).
- Coupling: Low coupling via dependency injection (app.state) and explicit constructor wiring.
- External dependencies: Redis, HTTP clients, vector store persistence, and multiple LLM providers.
- Provider abstractions: HttpProvider and TemplateProvider decouple routing logic from provider specifics.

```mermaid
graph LR
MAIN["main.py"] --> CFG["config.py"]
MAIN --> MEM["memory/redis_memory.py"]
MAIN --> ENGINE["agent/graph.py"]
ENGINE --> INTENT["agent/intent_detector.py"]
ENGINE --> SAFETY["agent/safety_checker.py"]
ENGINE --> CTX["agent/context_assembler.py"]
ENGINE --> ROUTER["providers/router.py"]
CTX --> RETRIEVER["rag/retriever.py"]
CTX --> TOOLS["tools/*"]
RETRIEVER --> VSTORE["rag/vectorstore.py"]
ROUTER --> BASE["providers/base.py"]
API["api/chat.py"] --> ENGINE
ADMIN["api/admin.py"] --> ENGINE
ADMIN --> MEM
```

**Diagram sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)
- [chatbot_service/providers/router.py:75-199](file://chatbot_service/providers/router.py#L75-L199)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)

**Section sources**
- [chatbot_service/main.py:41-145](file://chatbot_service/main.py#L41-L145)
- [chatbot_service/agent/graph.py:15-109](file://chatbot_service/agent/graph.py#L15-L109)
- [chatbot_service/providers/router.py:75-199](file://chatbot_service/providers/router.py#L75-L199)
- [chatbot_service/rag/retriever.py:17-40](file://chatbot_service/rag/retriever.py#L17-L40)
- [chatbot_service/rag/vectorstore.py:20-110](file://chatbot_service/rag/vectorstore.py#L20-L110)
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)

## Performance Considerations
- Streaming UX: Simulated streaming via word-delimited chunks to improve perceived latency.
- Prompt construction: Limits history length and response tokens to control cost and latency.
- Retrieval tuning: Adjustable top_k and category-scoped retrieval reduce noise and improve relevance.
- Provider fallback: Fast primary providers (e.g., Groq) with overflow to higher-throughput providers (e.g., Cerebras) maintain throughput.
- Memory TTL: Session expiration prevents unbounded growth; Redis health monitoring enables failback to in-memory storage.
- Indexing: On-demand index building and persistence minimize cold-start costs.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Health checks: Use /health for service readiness and memory backend status; use /admin/health for index and memory diagnostics.
- Admin rebuild: Trigger index rebuild with admin secret via /admin/rebuild-index.
- Rate limiting: Requests are throttled; excessive errors indicate misconfiguration or upstream provider issues.
- Safety blocks: Harmful prompts are rejected; adjust client messaging to align with policy.
- Provider errors: ProviderRouter falls back across providers; persistent failures indicate missing API keys or network issues.

**Section sources**
- [chatbot_service/main.py:106-115](file://chatbot_service/main.py#L106-L115)
- [chatbot_service/api/admin.py:32-52](file://chatbot_service/api/admin.py#L32-L52)
- [chatbot_service/agent/safety_checker.py:12-31](file://chatbot_service/agent/safety_checker.py#L12-L31)
- [chatbot_service/providers/router.py:154-199](file://chatbot_service/providers/router.py#L154-L199)

## Conclusion
The SafeVixAI Chatbot Service employs a clean, modular architecture centered on an agentic RAG pipeline. Dependency injection ensures robust initialization and lifecycle management, while intent detection, safety checks, and context assembly deliver precise, policy-compliant responses. The provider router’s language-aware routing and extensive fallback chain guarantee reliability, and the RAG stack with Redis-backed memory provides scalable, contextual assistance for road safety scenarios across India.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Endpoint summary:
  - Chat: POST /api/v1/chat/, POST /api/v1/chat/stream, GET /api/v1/chat/history/{session_id}, GET /api/v1/chat/health
  - Admin: GET /admin/health, POST /admin/rebuild-index
  - System: GET /health, GET /

**Section sources**
- [chatbot_service/api/chat.py:16-111](file://chatbot_service/api/chat.py#L16-L111)
- [chatbot_service/api/admin.py:12-52](file://chatbot_service/api/admin.py#L12-L52)
- [chatbot_service/main.py:106-142](file://chatbot_service/main.py#L106-L142)