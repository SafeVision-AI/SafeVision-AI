from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from agent.graph import ChatEngine
from agent.state import ChatRequest, ChatResponse


router = APIRouter(tags=['Chat'])


def get_engine(request: Request) -> ChatEngine:
    return request.app.state.chat_engine


@router.post('/chat', response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    engine: ChatEngine = Depends(get_engine),
) -> ChatResponse:
    return await engine.chat(payload)


@router.get('/history/{session_id}')
async def get_history(
    session_id: str,
    engine: ChatEngine = Depends(get_engine),
) -> dict:
    return {'session_id': session_id, 'messages': await engine.get_history(session_id)}
