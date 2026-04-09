# Database Schema and Management

The chatbot service doesn't have its own primary database but interacts with three critical systems: PostgreSQL (PostGIS), Redis, and ChromaDB.

## PostgreSQL (with PostGIS)
- **Functions**: Stores and queries spatial data for emergency services and road issues.
- **Tools**:
  - `emergency_tool.py`: Queries nearby hospitals, police stations, etc.
  - `road_issues_tool.py`: Queries recent community-reported potholes and road closures.
- **Triggers**: PostgreSQL `LISTEN/NOTIFY` used to push real-time road events to the chatbot via Redis.

## Redis (for Session Memory)
- **Functions**: Stores the conversation history for every user session.
- **Configuration**:
  - `TTL`: Conversations are stored for 24 hours.
  - `Memory`: Each session tracks the last 6 turns of the conversation.
- **Provider Health Cache**: Tracks the current health status and rate limits of each LLM provider.

## ChromaDB (Vectorstore)
- **Functions**: Serves as the indexed knowledge base for RAG (Retrieval-Augmented Generation).
- **Setup**:
  - `Documents`: Motor Vehicles Act (1988, 2019), WHO Guidelines, state amendments.
  - `Embeddings`: Using `sentence-transformers/all-MiniLM-L6-v2` for vectorized indexing.
  - `Storage`: Stored on disk in the `data/chroma_db` folder (added to `.gitignore`).
- **Management**: Rebuilt automatically during the Docker build process or via an admin endpoint.
