from __future__ import annotations

import json
import asyncio
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from agent.graph import ChatEngine
from agent.state import ChatRequest, ChatResponse


router = APIRouter(prefix='/api/v1/chat', tags=['Chat'])


def get_engine(request: Request) -> ChatEngine:
    return request.app.state.chat_engine


@router.post('/', response_model=ChatResponse)
async def chat(
    request: Request,
    payload: ChatRequest,
    engine: ChatEngine = Depends(get_engine),
) -> ChatResponse:
    """Standard blocking chat — returns full response at once."""
    if not payload.client_ip:
        # X-Forwarded-For is set by Render's reverse proxy; prefer it over the direct socket IP
        forwarded = request.headers.get('x-forwarded-for', '')
        payload.client_ip = forwarded.split(',')[0].strip() or (request.client.host if request.client else None)
    return await engine.chat(payload)


@router.post('/stream')
async def chat_stream(
    request: Request,
    payload: ChatRequest,
    engine: ChatEngine = Depends(get_engine),
) -> StreamingResponse:
    """SSE streaming chat — sends tokens as they arrive.
    
    Client should consume text/event-stream and parse JSON events:
      data: {"type": "token", "text": "..."}\n\n
      data: {"type": "done", "intent": "...", "sources": [...], "session_id": "..."}\n\n
      data: {"type": "error", "message": "..."}\n\n
    """
    async def event_generator():
        try:
            if not payload.client_ip and request.client:
                payload.client_ip = request.client.host
            # Run the chat engine (it's not a streaming LLM yet — we simulate
            # character-by-character streaming from the full response for smooth UX)
            result: ChatResponse = await engine.chat(payload)
            full_text: str = result.response

            # Stream word-by-word (looks live to the user, works with any provider)
            words = full_text.split(' ')
            for i, word in enumerate(words):
                chunk = word if i == 0 else ' ' + word
                data = json.dumps({'type': 'token', 'text': chunk})
                yield f'data: {data}\n\n'
                # Tiny delay for smooth UX — 12ms per word ≈ natural reading pace
                await asyncio.sleep(0.012)

            # Final event with metadata
            done_data = json.dumps({
                'type': 'done',
                'intent': result.intent,
                'sources': result.sources,
                'session_id': result.session_id,
            })
            yield f'data: {done_data}\n\n'

        except Exception as exc:
            logger.error(f"Chat stream error: {exc}", exc_info=True)
            err_data = json.dumps({'type': 'error', 'message': 'An internal error occurred while processing your request.'})
            yield f'data: {err_data}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',   # Disable Nginx buffering
            'Connection': 'keep-alive',
        },
    )


@router.get('/history/{session_id}')
async def get_history(
    session_id: str,
    engine: ChatEngine = Depends(get_engine),
) -> dict:
    return {'session_id': session_id, 'messages': await engine.get_history(session_id)}


@router.get('/health')
async def health() -> dict:
    return {'status': 'ok', 'service': 'safevisionai-chatbot'}
