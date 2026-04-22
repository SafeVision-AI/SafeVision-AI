"""GitHub Models provider — free with a GitHub account (PAT token).
Free tier: 150K tokens/day per model. Sign up: github.com/marketplace/models
Env vars: GITHUB_MODELS_API_KEY (your PAT), GITHUB_MODELS_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class GitHubModelsProvider(HttpProvider):
    """GitHub Models marketplace — free Llama, Mistral, Phi models via Azure AI."""

    name = "github"

    def api_key_env(self) -> str:
        return "GITHUB_TOKEN"  # .env uses GITHUB_TOKEN

    def base_url(self) -> str:
        return "https://models.inference.ai.azure.com/chat/completions"

    def default_model(self) -> str:
        return "Meta-Llama-3.1-8B-Instruct"

    def extra_headers(self) -> dict:
        return {"User-Agent": "SafeVixAI/1.0"}
