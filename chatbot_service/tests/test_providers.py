from __future__ import annotations

import asyncio

from providers.base import ProviderRequest, TemplateProvider


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
