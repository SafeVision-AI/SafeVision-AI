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

import os
from providers.base import TemplateProvider

# Languages that should auto-route to Sarvam
INDIAN_LANGUAGE_CODES = {
    'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn',
    'pa', 'or', 'as', 'ur', 'sa', 'mai', 'kok', 'doi',
    'ks', 'sd', 'ne', 'si', 'mni', 'brx',
}

# High-stakes intents → use Sarvam-105B (larger, more accurate for legal)
HIGH_STAKES_INTENTS = {'LEGAL_INFO', 'CHALLAN_QUERY', 'MV_ACT_SECTION'}

# Sarvam Direct API base URL
SARVAM_DIRECT_BASE = "https://api.sarvam.ai/v1"
# HuggingFace Inference API base URL (fallback)
HF_INFERENCE_BASE = "https://api-inference.huggingface.co/models"


class SarvamProvider(TemplateProvider):
    """Sarvam-2B via Direct API (primary) → HuggingFace (fallback).

    Priority:
      1. If SARVAM_API_KEY is set → use console.sarvam.ai directly (fastest)
      2. Otherwise → use HF_TOKEN via api-inference.huggingface.co (free, works now)
    """

    def __init__(self, model_size: str = "30b") -> None:
        super().__init__()
        self.model_size = model_size

    def _use_direct_api(self) -> bool:
        key = os.environ.get("SARVAM_API_KEY", "").strip()
        return bool(key and not key.startswith("YOUR_"))

    def api_key_setting(self) -> str:
        # Use direct Sarvam key if available, else HF token
        return "sarvam_api_key" if self._use_direct_api() else "hf_token"

    def model_setting(self) -> str:
        return "sarvam_105b_model" if self.model_size == "105b" else "sarvam_30b_model"

    def default_model(self) -> str:
        return "sarvamai/sarvam-105b" if self.model_size == "105b" else "sarvamai/sarvam-2b"

    def build_headers(self, api_key: str) -> dict:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def build_url(self) -> str:
        model = self.default_model()
        if self._use_direct_api():
            # Direct Sarvam API endpoint
            return f"{SARVAM_DIRECT_BASE}/chat/completions"
        # HuggingFace Inference API fallback
        return f"{HF_INFERENCE_BASE}/{model}"


class Sarvam105BProvider(SarvamProvider):
    """Sarvam-105B — legal queries in Indian languages.
    More accurate but slower than 30B. Activates for HIGH_STAKES_INTENTS.
    """
    def __init__(self) -> None:
        super().__init__(model_size="105b")
