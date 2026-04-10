from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from models.schemas import ChatRequest, ChatResponse
from services.llm_service import LLMService


router = APIRouter(prefix='/api/v1/chat', tags=['Chat'])


def get_llm_service(request: Request) -> LLMService:
    return request.app.state.llm_service


@router.post('/', response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> ChatResponse:
    return await llm_service.send_message(payload)
