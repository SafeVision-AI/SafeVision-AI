"""Google Gemini provider — gemini-1.5-flash with 1M token context window.
Free tier: 1,500 req/day, 1M tok/min. Sign up: aistudio.google.com
Env vars: GEMINI_API_KEY, GEMINI_MODEL (optional, default: gemini-1.5-flash)

NOTE: Gemini uses its own REST endpoint format, not the OpenAI-compatible one.
We translate the OpenAI messages format to Gemini's contents format here.
"""
from __future__ import annotations

import os

import httpx
from providers.base import HttpProvider, ProviderRequest, ProviderResult, build_messages

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider(HttpProvider):
    """Gemini 1.5 Flash — used for large-context queries (legal PDFs, long conversations)."""

    name = "gemini"
    _client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=40.0)
        return self._client

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        if not api_key:
            raise RuntimeError("GeminiProvider: Missing env var 'GEMINI_API_KEY' or 'GOOGLE_API_KEY'")

        model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

        # Convert OpenAI-style messages → Gemini contents format
        oai_messages = build_messages(request)
        contents = []
        system_text_parts: list[str] = []

        for msg in oai_messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                system_text_parts.append(content)
            elif role == "user":
                contents.append({"role": "user", "parts": [{"text": content}]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": content}]})

        # Gemini takes system instruction separately
        body: dict = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": 800,
                "temperature": 0.5,
            },
        }
        if system_text_parts:
            body["systemInstruction"] = {
                "parts": [{"text": "\n\n".join(system_text_parts)}]
            }

        url = f"{GEMINI_BASE}/{model}:generateContent?key={api_key}"
        resp = await self._get_client().post(url, json=body)
        resp.raise_for_status()

        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return ProviderResult(text=text, provider=self.name, model=model)
