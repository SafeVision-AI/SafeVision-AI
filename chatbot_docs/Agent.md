# RoadSoS AI Chatbot - Agent Documentation

The RoadSoS Chatbot is designed as an **Agentic AI Assistant**, moving beyond simple chat interfaces to a system that can take real-world actions in emergencies.

## Core Architecture: RAG + Agent
Instead of fine-tuning, which is static and compute-intensive, we use a **Retrieval-Augmented Generation (RAG)** combined with an **Agentic workflow**.

### Why Agentic?
- **Action-Oriented**: The chatbot doesn't just answer; it calls emergency APIs, calculates fines, and triggers SOS alerts.
- **Real-Time Data**: It contextually awareness of the user's GPS coordinates, nearby hospitals, and community reports.
- **Dynamic Decision Logic**: Using **LangGraph**, the agent follows a state machine to decide which tools to use and how to synthesize the response.

## Agent Orchestration (LangGraph)
The agent follows a deterministic yet flexible graph-based sequence:
1. **Input Node**: Receives the message, session ID, and GPS coordinates.
2. **Intent Node**: Classifies the message using a lightweight model (`llama3-8b`) to identify the query type (e.g., `FIND_HOSPITAL`, `CHALLAN_QUERY`).
3. **Tool Router**: Based on the detected intent, it determines which tools (APIs, legal search, weather) to invoke.
4. **Tool Execution**: Runs selected tools in parallel (using `asyncio`) to gather real-time data.
5. **Context Assembler**: Combines tool results, conversation history, and system prompts.
6. **LLM Generation**: Calls the primary model (`llama3-70b`) via Groq for final response synthesis.
7. **Safety Check**: A mandatory node that ensures emergency responses include contact numbers (like 112) and hospital info.
8. **Output Node**: Streams the final response to the user and logs the session.

## Key Capabilities
- **Parallel Tool Calling**: Reduces response time for complex queries (e.g., finding both hospitals and police simultaneously).
- **Proactive Alerts**: Can warn users of nearby road hazards detected via WebSocket pushes.
- **Multilingual Support**: Built-in support for Hindi, Tamil, and other Indian languages.
