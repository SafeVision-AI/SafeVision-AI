# Environment Configuration - Chatbot Service

Create a `.env` file in the `chatbot_service/` root based on `.env.example`. This file should contain all the secret keys and service URLs.

## LLM API Providers (all are free tier)
- `GROQ_API_KEY`: Primary provider.
- `GOOGLE_API_KEY`: First fallback (Gemini 1.5 Flash).
- `GITHUB_TOKEN`: Second fallback (GitHub Models).
- `NVIDIA_API_KEY`: Third fallback (NVIDIA NIM).
- `MISTRAL_API_KEY`: Fourth fallback.
- `TOGETHER_API_KEY`: Fifth fallback.

## Real-Time Backend Connection
- `MAIN_BACKEND_URL`: URL of the main RoadSoS backend (e.g., `https://roadsos-backend.onrender.com`).
- `REDIS_URL`: Redis connection string for session memory.

## Other Services
- `OPENWEATHER_API_KEY`: Required for the `weather_tool`.
- `ADMIN_SECRET`: Secret key for accessing `/admin` endpoints.

## Local Development vs. Production
- **Local**: Point `MAIN_BACKEND_URL` to `http://localhost:8000`.
- **Production**: Point to the actual deployed backend URL.

> [!WARNING]
> Never commit your `.env` file to the repository. Ensure `.gitignore` is properly configured for the `chatbot_service` folder.
