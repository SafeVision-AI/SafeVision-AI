from __future__ import annotations

import os

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from agent.graph import ChatEngine
from config import get_settings
from memory.redis_memory import ConversationMemoryStore


router = APIRouter(tags=['Admin'])


def get_engine(request: Request) -> ChatEngine:
    return request.app.state.chat_engine


def get_memory(request: Request) -> ConversationMemoryStore:
    return request.app.state.memory_store


def _require_admin(x_admin_key: str = Header(default='')) -> None:
    """Validate admin API key from X-Admin-Key header."""
    secret = get_settings().admin_secret
    if not secret:
        raise HTTPException(status_code=503, detail='Admin endpoint is disabled (ADMIN_SECRET not configured).')
    if x_admin_key != secret:
        raise HTTPException(status_code=403, detail='Invalid admin key.')


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
async def rebuild_index(
    _: None = Depends(_require_admin),
    engine: ChatEngine = Depends(get_engine),
) -> dict:
    stats = engine.rebuild_index()
    return {'status': 'rebuilt', 'index': stats}
