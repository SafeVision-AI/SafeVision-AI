"""Groq Cloud provider — llama-3.1-8b-instant at 300+ tok/s.
Free tier: 14,400 req/day, 500K tok/day. Sign up: console.groq.com
Env vars: GROQ_API_KEY, GROQ_MODEL (optional, default: llama-3.1-8b-instant)
"""
from __future__ import annotations

from providers.base import HttpProvider


class GroqProvider(HttpProvider):
    """Primary provider — fastest for English queries."""

    name = "groq"

    def api_key_env(self) -> str:
        return "GROQ_API_KEY"

    def base_url(self) -> str:
        return "https://api.groq.com/openai/v1/chat/completions"

    def default_model(self) -> str:
        return "llama-3.1-8b-instant"
