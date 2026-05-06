from __future__ import annotations

import asyncio
from types import SimpleNamespace

from providers.base import ProviderRequest, ProviderResult, TemplateProvider
from providers.router import ProviderRouter


def test_template_provider_returns_grounded_response():
    provider = TemplateProvider()
    result = asyncio.run(
        provider.generate(
            ProviderRequest(
                message='Help with Section 185',
                intent='challan',
                history=[],
                tool_summaries=['Applicable section: Section 185. Base fine: INR 10000.'],
                document_snippets=['Motor Vehicles Act: Drunk driving is punishable.'],
            )
        )
    )

    assert 'Traffic challan' in result.text
    assert 'Section 185' in result.text


class SlowProvider:
    name = 'slow'

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        await asyncio.sleep(0.05)
        return ProviderResult(text='too late', provider=self.name, model='slow-model')


class FastProvider:
    name = 'fast'

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        return ProviderResult(text='fallback ok', provider=self.name, model='fast-model')


def test_provider_router_times_out_primary_and_uses_fallback():
    settings = SimpleNamespace(default_llm_provider='slow', http_timeout_seconds=0.01)
    router = ProviderRouter(settings)  # type: ignore[arg-type]
    router.providers = {
        'slow': SlowProvider(),  # type: ignore[dict-item]
        'fast': FastProvider(),  # type: ignore[dict-item]
        'template': TemplateProvider(),
    }
    router._fallback_chain = ['slow', 'fast', 'template']

    result = asyncio.run(
        router.generate(
            ProviderRequest(
                message='Need road safety help',
                intent='general',
                history=[],
            )
        )
    )

    assert result.text == 'fallback ok'
    assert result.provider_used == 'fast'
    assert result.fallback_from == 'slow'
