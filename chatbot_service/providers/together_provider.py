"""Together AI provider — $25 free credit on sign-up.
Free tier: $25 credits (thousands of queries). Sign up: api.together.xyz
Env vars: TOGETHER_API_KEY, TOGETHER_MODEL (optional)
"""
from __future__ import annotations

from providers.base import HttpProvider


class TogetherProvider(HttpProvider):
    """Together AI — wide model selection including Llama, Qwen, Mistral."""

    name = "together"

    def api_key_env(self) -> str:
        return "TOGETHER_API_KEY"

    def base_url(self) -> str:
        return "https://api.together.xyz/v1/chat/completions"

    def default_model(self) -> str:
        return "meta-llama/Llama-3.2-3B-Instruct-Turbo"
