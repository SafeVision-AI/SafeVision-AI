"""Cerebras Cloud provider — llama-3.3-70b at 2000+ tok/s. Fastest LLM on earth.
Free tier: 1M tokens/day, 30 RPM. Sign up: cloud.cerebras.ai
Env vars: CEREBRAS_API_KEY, CEREBRAS_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class CerebrasProvider(HttpProvider):
    """Cerebras — speed overflow for Groq rate-limiting; 2000+ tok/s."""

    name = "cerebras"

    def api_key_env(self) -> str:
        return "CEREBRAS_API_KEY"

    def base_url(self) -> str:
        return "https://api.cerebras.ai/v1/chat/completions"

    def default_model(self) -> str:
        return "llama-3.3-70b"
