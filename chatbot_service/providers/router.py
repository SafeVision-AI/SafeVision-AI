"""Provider Router — 11-provider fallback chain with Indian language routing.

Auto-routing rules (in priority order):
  1. User speaks Indian language → Sarvam-30B (Indic specialist)
  2. Legal/challan query in Indian language → Sarvam-105B
  3. Default online → Groq (fastest English, 300+ tok/s)
  4. Groq rate-limited → Cerebras (2000+ tok/s overflow)
  5. High-context (legal PDFs > 50K tokens) → Gemini 1.5 Flash (1M ctx)
  6. Further fallbacks → GitHub → NVIDIA → OpenRouter → Mistral → Together
"""

from __future__ import annotations

import re

from config import Settings
from providers.base import ProviderRequest, ProviderResult, TemplateProvider
from providers.cerebras_provider import CerebrasProvider
from providers.gemini_provider import GeminiProvider
from providers.github_models_provider import GitHubModelsProvider
from providers.groq_provider import GroqProvider
from providers.mistral_provider import MistralProvider
from providers.nvidia_nim_provider import NvidiaNimProvider
from providers.openrouter_provider import OpenRouterProvider
from providers.sarvam_provider import (
    INDIAN_LANGUAGE_CODES,
    HIGH_STAKES_INTENTS,
    Sarvam105BProvider,
    SarvamProvider,
)
from providers.together_provider import TogetherProvider


# ── Language detection (lightweight — no NLTK dependency) ─────────────────
# Script ranges for Indian languages
_DEVANAGARI = re.compile(r'[\u0900-\u097f]')   # Hindi, Marathi, Sanskrit, etc.
_TAMIL = re.compile(r'[\u0b80-\u0bff]')
_TELUGU = re.compile(r'[\u0c00-\u0c7f]')
_KANNADA = re.compile(r'[\u0c80-\u0cff]')
_MALAYALAM = re.compile(r'[\u0d00-\u0d7f]')
_BENGALI = re.compile(r'[\u0980-\u09ff]')
_GUJARATI = re.compile(r'[\u0a80-\u0aff]')
_PUNJABI = re.compile(r'[\u0a00-\u0a7f]')
_ODIA = re.compile(r'[\u0b00-\u0b7f]')
_URDU = re.compile(r'[\u0600-\u06ff]')  # Arabic script — includes Urdu


def detect_lang(text: str) -> str | None:
    """Detect if the text contains Indian language script.
    Returns ISO 639-1 code or None (English/unknown).
    """
    if _DEVANAGARI.search(text):
        return 'hi'  # Default Devanagari → Hindi
    if _TAMIL.search(text):
        return 'ta'
    if _TELUGU.search(text):
        return 'te'
    if _KANNADA.search(text):
        return 'kn'
    if _MALAYALAM.search(text):
        return 'ml'
    if _BENGALI.search(text):
        return 'bn'
    if _GUJARATI.search(text):
        return 'gu'
    if _PUNJABI.search(text):
        return 'pa'
    if _ODIA.search(text):
        return 'or'
    if _URDU.search(text):
        return 'ur'
    return None


class ProviderRouter:
    """Routes requests through the 11-provider fallback chain.

    Key routing decisions:
    - Indian language input → Sarvam AI (trained on 4 trillion Indic tokens)
    - Legal/challan in Indian lang → Sarvam-105B (more accurate for legal)
    - English → Groq → Cerebras → Gemini → GitHub → NVIDIA → OpenRouter
                     → Mistral → Together
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

        # All 11 providers + Sarvam variants
        self.providers: dict[str, TemplateProvider] = {
            # Tier 1 — Critical
            'groq': GroqProvider(),
            'cerebras': CerebrasProvider(),
            'gemini': GeminiProvider(),
            # Indian language routing
            'sarvam': SarvamProvider(),
            'sarvam_30b': SarvamProvider(),
            'sarvam_105b': Sarvam105BProvider(),
            # Tier 2 — High
            'github': GitHubModelsProvider(),
            'github_models': GitHubModelsProvider(),
            'nvidia': NvidiaNimProvider(),
            'nvidia_nim': NvidiaNimProvider(),
            # Tier 3 — Medium
            'openrouter': OpenRouterProvider(),
            'mistral': MistralProvider(),
            'together': TogetherProvider(),
            # Template / testing
            'template': TemplateProvider(),
        }
        self.default_provider = settings.default_llm_provider

        # Fallback chain — tried in order when provider fails
        self._fallback_chain = [
            'groq',        # 1. Fastest English — 300+ tok/s
            'cerebras',    # 2. Speed overflow — 2000+ tok/s
            'gemini',      # 3. Large context, 1M tok/day
            'github',      # 4. Free with GitHub account
            'nvidia',      # 5. GPU-optimized
            'openrouter',  # 6. Gateway to 20+ models
            'mistral',     # 7. 1B tok/month free
            'together',    # 8. $25 credit bank
            'template',    # 9. Always works (deterministic fallback)
        ]

    def _select_provider_name(
        self,
        request: ProviderRequest,
        *,
        detected_lang: str | None = None,
    ) -> str:
        """Apply routing logic to pick the best provider.

        Routing priority:
          1. Indian language → Sarvam
          2. Legal intent + Indian lang → Sarvam-105B
          3. Explicit provider hint in request → use it
          4. Default configured provider
        """
        # ── Indian language routing ──────────────────────────────────────────
        if detected_lang and detected_lang in INDIAN_LANGUAGE_CODES:
            # Check for high-stakes legal intent
            intent = getattr(request, 'intent', '') or ''
            if intent.upper() in HIGH_STAKES_INTENTS:
                return 'sarvam_105b'
            return 'sarvam_30b'

        # ── Explicit provider override ────────────────────────────────────────
        hint = getattr(request, 'provider_hint', None)
        if hint and hint in self.providers:
            return hint

        return self.default_provider

    async def generate(
        self,
        request: ProviderRequest,
        *,
        detected_lang: str | None = None,
        try_fallbacks: bool = True,
    ) -> ProviderResult:
        """Generate a response using the selected provider with automatic fallback."""

        # Auto-detect language from request content if not provided
        if detected_lang is None and hasattr(request, 'messages') and request.messages:
            last_content = str(request.messages[-1].get('content', ''))
            detected_lang = detect_lang(last_content)
        elif detected_lang is None and hasattr(request, 'prompt'):
            detected_lang = detect_lang(request.prompt or '')

        primary = self._select_provider_name(request, detected_lang=detected_lang)
        provider = self.providers.get(primary, self.providers['groq'])

        try:
            result = await provider.generate(request)
            # Attach routing metadata
            result.provider_used = primary  # type: ignore[attr-defined]
            result.detected_lang = detected_lang  # type: ignore[attr-defined]
            # Add 🇮🇳 badge when Sarvam is used
            if primary.startswith('sarvam'):
                result.india_badge = True  # type: ignore[attr-defined]
            return result
        except Exception as primary_err:
            if not try_fallbacks:
                raise

            # Try fallback chain
            for fallback_name in self._fallback_chain:
                if fallback_name == primary:
                    continue
                try:
                    fallback = self.providers[fallback_name]
                    result = await fallback.generate(request)
                    result.provider_used = fallback_name  # type: ignore[attr-defined]
                    result.fallback_from = primary  # type: ignore[attr-defined]
                    return result
                except Exception:
                    continue

            raise RuntimeError(
                f"All providers exhausted. Primary error: {primary_err}"
            ) from primary_err
