from __future__ import annotations

from uuid import uuid4

from agent.context_assembler import ContextAssembler
from agent.intent_detector import IntentDetector
from agent.safety_checker import SafetyChecker
from agent.state import ChatRequest, ChatResponse
from memory.redis_memory import ConversationMemoryStore
from providers.base import ProviderRequest
from providers.router import ProviderRouter
from rag.vectorstore import LocalVectorStore


class ChatEngine:
    def __init__(
        self,
        *,
        memory_store: ConversationMemoryStore,
        vectorstore: LocalVectorStore,
        intent_detector: IntentDetector,
        safety_checker: SafetyChecker,
        context_assembler: ContextAssembler,
        provider_router: ProviderRouter,
    ) -> None:
        self.memory_store = memory_store
        self.vectorstore = vectorstore
        self.intent_detector = intent_detector
        self.safety_checker = safety_checker
        self.context_assembler = context_assembler
        self.provider_router = provider_router

    async def chat(self, payload: ChatRequest) -> ChatResponse:
        session_id = payload.session_id or str(uuid4())
        await self.memory_store.append_message(session_id, 'user', payload.message)
        history = await self.memory_store.get_history(session_id, limit=12)

        safety = self.safety_checker.evaluate(payload.message)
        if safety.blocked:
            await self.memory_store.append_message(session_id, 'assistant', safety.response or '')
            return ChatResponse(
                response=safety.response or 'I cannot help with that request.',
                intent='blocked',
                sources=['policy:safety'],
                session_id=session_id,
            )

        intent = self.intent_detector.detect(payload.message)
        context = await self.context_assembler.assemble(
            session_id=session_id,
            message=payload.message,
            intent=intent,
            lat=payload.lat,
            lon=payload.lon,
            history=history,
        )

        provider_result = await self.provider_router.generate(
            ProviderRequest(
                message=payload.message,
                intent=intent,
                history=history,
                tool_summaries=[item.summary for item in context.tools],
                document_snippets=[
                    f'{item.title} ({item.source}): {item.snippet}'
                    for item in context.retrieved
                ],
            )
        )

        sources = self._dedupe_sources(
            [source for tool in context.tools for source in tool.sources]
            + [item.source for item in context.retrieved]
        )
        await self.memory_store.append_message(
            session_id,
            'assistant',
            provider_result.text,
            metadata={'intent': intent, 'sources': sources},
        )
        return ChatResponse(
            response=provider_result.text,
            intent=intent,
            sources=sources,
            session_id=session_id,
        )

    async def get_history(self, session_id: str) -> list[dict]:
        return await self.memory_store.get_history(session_id, limit=30)

    def rebuild_index(self) -> dict[str, int]:
        self.vectorstore.build_index(force=True)
        return self.vectorstore.stats()

    def stats(self) -> dict[str, int]:
        return self.vectorstore.stats()

    @staticmethod
    def _dedupe_sources(values: list[str]) -> list[str]:
        seen: set[str] = set()
        deduped: list[str] = []
        for value in values:
            if not value or value in seen:
                continue
            seen.add(value)
            deduped.append(value)
        return deduped
