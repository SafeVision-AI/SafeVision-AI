from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.emergency_locator import EmergencyLocatorService
from services.exceptions import ServiceValidationError


router = APIRouter(prefix='/api/v1/offline', tags=['Offline'])


def get_emergency_service(request: Request) -> EmergencyLocatorService:
    return request.app.state.emergency_service


@router.get('/bundle/{city}')
async def get_offline_bundle(
    city: str,
    db: AsyncSession = Depends(get_db),
    emergency_service: EmergencyLocatorService = Depends(get_emergency_service),
) -> dict:
    try:
        return await emergency_service.build_city_bundle(db=db, city=city)
    except ServiceValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
