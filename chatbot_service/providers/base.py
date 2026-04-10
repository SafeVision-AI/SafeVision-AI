from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class ProviderRequest:
    message: str
    intent: str
    history: list[dict]
    tool_summaries: list[str] = field(default_factory=list)
    document_snippets: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ProviderResult:
    text: str
    provider: str
    model: str


class TemplateProvider:
    name = 'template'
    model = 'deterministic-rag'

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        lines: list[str] = []
        if request.intent == 'emergency':
            lines.append('Emergency guidance:')
        elif request.intent == 'first_aid':
            lines.append('First-aid guidance:')
        elif request.intent == 'challan':
            lines.append('Challan guidance:')
        elif request.intent == 'legal':
            lines.append('Legal guidance:')

        if request.tool_summaries:
            lines.extend(request.tool_summaries[:3])
        if request.document_snippets:
            lines.append('Relevant references:')
            lines.extend(request.document_snippets[:3])
        if not lines:
            lines.append(
                'I can help with road safety, emergency response, challans, first aid, and nearby authority lookups. '
                'Please share a bit more detail so I can narrow it down.'
            )
        else:
            lines.append('Use emergency services immediately for urgent medical or crash situations.')
        return ProviderResult(
            text='\n'.join(lines),
            provider=self.name,
            model=self.model,
        )
