from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import ChallanQuery, ChallanResponse
from services.challan_service import ChallanService
from services.exceptions import ServiceValidationError


router = APIRouter(prefix='/api/v1/challan', tags=['Challan'])


def get_challan_service(request: Request) -> ChallanService:
    return request.app.state.challan_service


@router.post('/calculate', response_model=ChallanResponse)
async def calculate_challan(
    payload: ChallanQuery,
    db: AsyncSession = Depends(get_db),
    challan_service: ChallanService = Depends(get_challan_service),
) -> ChallanResponse:
    try:
        return await challan_service.calculate_with_db(payload, db=db)
    except ServiceValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
