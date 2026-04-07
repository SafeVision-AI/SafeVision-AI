from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import EmergencyNumbersResponse, EmergencyResponse, SosResponse
from services.emergency_locator import EMERGENCY_NUMBERS, EmergencyLocatorService
from services.exceptions import ExternalServiceError


router = APIRouter(prefix='/api/v1/emergency', tags=['Emergency'])


def get_emergency_service(request: Request) -> EmergencyLocatorService:
    return request.app.state.emergency_service


@router.get('/nearby', response_model=EmergencyResponse)
async def get_nearby_services(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    categories: str | None = Query(default=None, description='Comma-separated emergency categories'),
    radius: int | None = Query(default=None, ge=100, le=50000),
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    emergency_service: EmergencyLocatorService = Depends(get_emergency_service),
) -> EmergencyResponse:
    try:
        return await emergency_service.find_nearby(
            db=db,
            lat=lat,
            lon=lon,
            categories=categories,
            radius=radius,
            limit=limit,
        )
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get('/sos', response_model=SosResponse)
async def get_sos_payload(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    emergency_service: EmergencyLocatorService = Depends(get_emergency_service),
) -> SosResponse:
    try:
        return await emergency_service.build_sos_payload(db=db, lat=lat, lon=lon)
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get('/numbers', response_model=EmergencyNumbersResponse)
async def get_emergency_numbers() -> EmergencyNumbersResponse:
    return EMERGENCY_NUMBERS
