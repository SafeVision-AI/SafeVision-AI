from __future__ import annotations

from config import Settings
from providers.base import ProviderRequest, ProviderResult, TemplateProvider
from providers.gemini_provider import GeminiProvider
from providers.github_models_provider import GitHubModelsProvider
from providers.groq_provider import GroqProvider
from providers.mistral_provider import MistralProvider
from providers.nvidia_nim_provider import NvidiaNimProvider
from providers.together_provider import TogetherProvider


class ProviderRouter:
    def __init__(self, settings: Settings) -> None:
        self.providers = {
            'template': TemplateProvider(),
            'groq': GroqProvider(),
            'gemini': GeminiProvider(),
            'mistral': MistralProvider(),
            'github': GitHubModelsProvider(),
            'github_models': GitHubModelsProvider(),
            'nvidia': NvidiaNimProvider(),
            'together': TogetherProvider(),
        }
        self.default_provider = settings.default_llm_provider

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        provider = self.providers.get(self.default_provider, self.providers['template'])
        return await provider.generate(request)
