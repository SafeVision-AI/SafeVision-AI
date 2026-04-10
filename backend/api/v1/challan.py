from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from models.schemas import ChallanQuery, ChallanResponse
from services.challan_service import ChallanService
from services.exceptions import ServiceValidationError


router = APIRouter(prefix='/api/v1/challan', tags=['Challan'])


def get_challan_service(request: Request) -> ChallanService:
    return request.app.state.challan_service


@router.post('/calculate', response_model=ChallanResponse)
async def calculate_challan(
    payload: ChallanQuery,
    challan_service: ChallanService = Depends(get_challan_service),
) -> ChallanResponse:
    try:
        return challan_service.calculate(payload)
    except ServiceValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
