# Environment Configuration — Chatbot Service

Create a `.env` file in the `chatbot_service/` root based on `.env.example`. This file should contain all the secret keys and service URLs.

## LLM Provider API Keys (all free tier)

| Variable | Provider | Notes |
|----------|----------|-------|
| `DEFAULT_LLM_PROVIDER` | — | Default provider name: `groq`, `gemini`, `cerebras`, etc. |
| `DEFAULT_LLM_MODEL` | — | Model ID for the chosen provider |
| `GROQ_API_KEY` | Groq | Primary English provider (300+ tok/s) |
| `CEREBRAS_API_KEY` | Cerebras | Speed overflow (2000+ tok/s) |
| `GEMINI_API_KEY` | Google | Gemini 1.5 Flash (1M context) |
| `SARVAM_API_KEY` | Sarvam AI | Indian language specialist (30B/105B) |
| `GITHUB_TOKEN` | GitHub Models | Free with GitHub account |
| `NVIDIA_API_KEY` | NVIDIA NIM | GPU-optimized inference |
| `OPENROUTER_API_KEY` | OpenRouter | Gateway to 20+ models |
| `MISTRAL_API_KEY` | Mistral | 1B tokens/month free |
| `TOGETHER_API_KEY` | Together | $25 free credit bank |

> Only keys for providers you want to enable are needed. The `ProviderRouter` auto-skips providers without keys.

## Backend Connection
- `MAIN_BACKEND_BASE_URL`: URL of the main SafeVisionAI backend (e.g., `http://localhost:8000` for local, or `https://safevisionai-api.onrender.com` for production).

## RAG Configuration
- `CHROMA_PERSIST_DIR`: Path to ChromaDB vectorstore (default: `./data/chroma_db`).
- `EMBEDDING_MODEL`: Sentence-transformers model (default: `sentence-transformers/all-MiniLM-L6-v2`).

## Other Services
- `REDIS_URL`: Redis connection string for session memory (optional — falls back to in-memory).
- `OPENWEATHER_API_KEY`: Required for the `WeatherTool`.

## Local Development vs. Production
- **Local**: Point `MAIN_BACKEND_BASE_URL` to `http://localhost:8000`.
- **Production**: Point to the actual deployed backend URL on Render.com.

> [!WARNING]
> Never commit your `.env` file to the repository. Ensure `.gitignore` is properly configured for the `chatbot_service` folder.
