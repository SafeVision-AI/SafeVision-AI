# Deployment Guide - Chatbot Service

The Chatbot Service runs on its own independent instance on [Render.com](https://render.com). This separation ensures high availability and performance.

## Prerequisites
- A GitHub organization account connected to Render.
- Access to all primary LLM API keys (Groq, Gemini, etc.).
- A running Redis instance for conversation memory.

## Steps for Deployment
1. **New Web Service**: Click `New` → `Web Service` on Render.
2. **Setup**:
   - **Root Directory**: `SafeVisionAI/chatbot_service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
   - **Instance Type**: `Free tier` (512MB RAM, shared CPU) is sufficient for initial testing.
3. **Environment**: Input all `.env` variables from the dashboard Environment panel.
4. **Health Check**: Set health check path to `/health`.

## Production ChromaDB Strategy
For the hackathon, ChromaDB is stored as part of the Docker image:
- **Dockerfile**: Includes a step to run `build_vectorstore.py` during the build phase.
- **Persistence**: Baked-in vector data avoids reliance on ephemeral disk storage.
- **Startup**: Loads from the local baked-in index in under 5 seconds.

## CI/CD Pipeline
- **Staging**: Merges to `develop` trigger a deployment to the staging environment.
- **Production**: Merges to `main` trigger a deployment to the production environment.
- **Testing**: Deployment only occurs if all `pytest` suites in `/tests` pass.
