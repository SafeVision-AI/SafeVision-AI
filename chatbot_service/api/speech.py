from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from services.speech_translation import IndicSeamlessService, speech_result_to_dict


router = APIRouter(prefix='/speech', tags=['Speech'])


def get_speech_service(request: Request) -> IndicSeamlessService:
    return request.app.state.speech_service


@router.get('/status')
async def speech_status(request: Request) -> dict:
    service = get_speech_service(request)
    return service.status()


@router.post('/translate')
async def translate_speech(
    request: Request,
    target_language: str | None = Query(default=None),
) -> dict:
    service = get_speech_service(request)
    audio_bytes = await request.body()
    try:
        result = service.translate_audio_bytes(audio_bytes, target_language=target_language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    payload = speech_result_to_dict(result)
    payload['content_type'] = request.headers.get('content-type')
    return payload
