from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from models.schemas import RoutePreviewResponse, RouteProfile
from services.exceptions import ExternalServiceError, ServiceValidationError
from services.routing_service import RoutingService
from services.safe_routing import get_safe_route


router = APIRouter(prefix='/api/v1/routing', tags=['Routing'])


def get_routing_service(request: Request) -> RoutingService:
    return request.app.state.routing_service


@router.get('/preview', response_model=RoutePreviewResponse)
async def preview_route(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lon: float = Query(..., ge=-180, le=180),
    destination_lat: float = Query(..., ge=-90, le=90),
    destination_lon: float = Query(..., ge=-180, le=180),
    profile: RouteProfile = Query(default='driving-car'),
    alternatives: int = Query(default=2, ge=0, le=2),
    routing_service: RoutingService = Depends(get_routing_service),
) -> RoutePreviewResponse:
    try:
        return await routing_service.preview_route(
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            destination_lat=destination_lat,
            destination_lon=destination_lon,
            profile=profile,
            alternatives=alternatives,
        )
    except ServiceValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get('/safe-route')
async def get_safe_route_endpoint(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lon: float = Query(..., ge=-180, le=180),
    destination_lat: float = Query(..., ge=-90, le=90),
    destination_lon: float = Query(..., ge=-180, le=180),
    prefer_safety: bool = Query(default=False),
):
    """
    Returns a safe route prioritizing well-lit, non-isolated roads using ORS.
    """
    try:
        return await get_safe_route(
            origin=(origin_lat, origin_lon),
            dest=(destination_lat, destination_lon),
            prefer_safety=prefer_safety,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Safe routing unavailable: {str(exc)}") from exc
