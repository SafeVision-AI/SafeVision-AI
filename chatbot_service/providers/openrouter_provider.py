"""OpenRouter provider — gateway to 20+ models with one API key.
Free tier: 50 req/day free. $10 gives 1K req. Sign up: openrouter.ai
Env vars: OPENROUTER_API_KEY, OPENROUTER_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class OpenRouterProvider(HttpProvider):
    """OpenRouter — gateway to 20+ models; auto-selects best free model."""

    name = "openrouter"

    def api_key_env(self) -> str:
        return "OPENROUTER_API_KEY"

    def base_url(self) -> str:
        return "https://openrouter.ai/api/v1/chat/completions"

    def default_model(self) -> str:
        return "meta-llama/llama-3.1-8b-instruct:free"

    def extra_headers(self) -> dict:
        return {
            "HTTP-Referer": "https://github.com/SafeVixAI/SafeVixAI",
            "X-Title": "SafeVixAI",
        }
