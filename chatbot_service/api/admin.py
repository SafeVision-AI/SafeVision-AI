from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from agent.graph import ChatEngine
from memory.redis_memory import ConversationMemoryStore


router = APIRouter(tags=['Admin'])


def get_engine(request: Request) -> ChatEngine:
    return request.app.state.chat_engine


def get_memory(request: Request) -> ConversationMemoryStore:
    return request.app.state.memory_store


@router.get('/health')
async def health(
    engine: ChatEngine = Depends(get_engine),
    memory_store: ConversationMemoryStore = Depends(get_memory),
) -> dict:
    return {
        'status': 'ok',
        'index': engine.stats(),
        'memory_backend': memory_store.backend_name,
        'memory_available': await memory_store.ping(),
    }


@router.post('/admin/rebuild-index')
async def rebuild_index(engine: ChatEngine = Depends(get_engine)) -> dict:
    stats = engine.rebuild_index()
    return {'status': 'rebuilt', 'index': stats}
