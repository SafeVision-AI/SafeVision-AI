"""Mistral AI provider — mistral-small at 1B tokens/month free.
Free tier: 1B tok/month (La Plateforme). Sign up: console.mistral.ai
Env vars: MISTRAL_API_KEY, MISTRAL_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class MistralProvider(HttpProvider):
    """Mistral AI — strong multilingual model, good for European + South Asian languages."""

    name = "mistral"

    def api_key_env(self) -> str:
        return "MISTRAL_API_KEY"

    def base_url(self) -> str:
        return "https://api.mistral.ai/v1/chat/completions"

    def default_model(self) -> str:
        return "mistral-small-latest"
