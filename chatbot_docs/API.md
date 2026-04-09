# API Reference - Chatbot Service

The Chatbot Service exposes a series of FastAPI endpoints designed for high-performance AI interaction, retrieval, and real-time streaming.

## Endpoint: `/api/v1/chat/message`
- **Method**: `POST`
- **Description**: Main chatbot interaction point. Receives user input, intent classifies, and executes the agentic graph.
- **Request Body**:
  - `message`: User input string.
  - `lat`: User's latitude.
  - `lon`: User's longitude.
  - `session_id`: Unique session identifier.
- **Response**: Aggregated JSON response with assistant text, intent, and tool-gathered context.

## Endpoint: `/ws/chat/stream`
- **Method**: `WebSocket`
- **Description**: Real-time streaming interface for chatbot tokens. Provides smooth, low-latency token generation to the frontend.

## Endpoint: `/api/v1/admin/rebuild-vectorstore`
- **Method**: `POST`
- **Description**: Manually triggers a rebuild of the ChromaDB index when new documents are added to the `/data` folder.

## Endpoint: `/api/v1/admin/provider-health`
- **Method**: `GET`
- **Description**: Returns the current health status of all six LLM providers based on the latest background health checks.
