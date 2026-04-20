"""Sarvam AI provider — India's sovereign language model.

Routing priority for Indian languages:
  1. Direct Sarvam API (console.sarvam.ai) — fastest, free credits
  2. HuggingFace Inference API (HF_TOKEN) — fallback if Sarvam API key missing

Supported Indian languages (ISO 639-1 codes):
  hi=Hindi  ta=Tamil  te=Telugu  kn=Kannada  ml=Malayalam  mr=Marathi
  gu=Gujarati  bn=Bengali  pa=Punjabi  or=Odia  as=Assamese  ur=Urdu
  sa=Sanskrit  mai=Maithili  kok=Konkani  doi=Dogri  ks=Kashmiri
"""

from __future__ import annotations

INDIAN_LANGUAGE_CODES = {
    'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ur',
    'sa', 'mai', 'kok', 'doi', 'ks'
}

HIGH_STAKES_INTENTS = {
    'LEGAL_ADVICE', 'EMERGENCY_REPORT', 'FIR_FILING', 'CHALLAN_DISPUTE'
}

import logging
import os

import httpx
from providers.base import HttpProvider, ProviderRequest, ProviderResult, build_messages

logger = logging.getLogger(__name__)

# Sarvam Direct API base URL
SARVAM_DIRECT_BASE = "https://api.sarvam.ai/v1"
# HuggingFace Inference API base URL (fallback)
HF_INFERENCE_BASE = "https://api-inference.huggingface.co/models"

_MAX_TOKENS = 800
_TEMPERATURE = 0.5


class SarvamProvider(HttpProvider):
    """Sarvam-2B via Direct API (primary) → HuggingFace (fallback).

    Priority:
      1. If SARVAM_API_KEY is set → use api.sarvam.ai directly (fastest)
      2. Otherwise → use HF_TOKEN via api-inference.huggingface.co (free, works now)
    """

    name = "sarvam"
    _client: httpx.AsyncClient | None = None

    def __init__(self, model_size: str = "30b") -> None:
        self.model_size = model_size

    def _use_direct_api(self) -> bool:
        key = os.environ.get("SARVAM_API_KEY", "").strip()
        return bool(key and not key.startswith("YOUR_"))

    def _get_api_key(self) -> str:  # type: ignore[override]
        if self._use_direct_api():
            return os.environ.get("SARVAM_API_KEY", "").strip()
        token = os.environ.get("HF_TOKEN", "").strip()
        if not token:
            raise RuntimeError("SarvamProvider: Neither SARVAM_API_KEY nor HF_TOKEN is set")
        return token

    def default_model(self) -> str:
        return "sarvamai/sarvam-105b" if self.model_size == "105b" else "sarvamai/sarvam-2b"

    def base_url(self) -> str:
        if self._use_direct_api():
            return f"{SARVAM_DIRECT_BASE}/chat/completions"
        # HuggingFace Inference API — OpenAI-compatible endpoint
        return "https://api-inference.huggingface.co/v1/chat/completions"

    def api_key_env(self) -> str:
        return "SARVAM_API_KEY" if self._use_direct_api() else "HF_TOKEN"

    def extra_headers(self) -> dict:
        if not self._use_direct_api():
            # HuggingFace requires explicit model routing via x-use-cache header
            return {"x-use-cache": "false"}
        return {}

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        """Call Sarvam direct API or HuggingFace inference endpoint."""
        api_key = self._get_api_key()
        model = self.default_model()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            **self.extra_headers(),
        }

        # HuggingFace chat completions need the model in the body
        payload = {
            "model": model,
            "messages": build_messages(request),
            "max_tokens": _MAX_TOKENS,
            "temperature": _TEMPERATURE,
        }

        url = self.base_url()
        client = self._get_client()

        logger.debug("SarvamProvider → %s (model=%s, direct=%s)", url, model, self._use_direct_api())
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()

        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        return ProviderResult(text=text, provider=self.name, model=model, india_badge=True)


class Sarvam105BProvider(SarvamProvider):
    """Sarvam-105B — legal queries in Indian languages.
    More accurate but slower than 2B. Activates for HIGH_STAKES_INTENTS.
    """
    def __init__(self) -> None:
        super().__init__(model_size="105b")
