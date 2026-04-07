from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from models.schemas import GeocodeSearchResponse
from services.geocoding_service import GeocodingError, GeocodingService


router = APIRouter(prefix='/api/v1/geocode', tags=['Geocode'])


def get_geocoding_service(request: Request) -> GeocodingService:
    return request.app.state.geocoding_service


@router.get('/reverse')
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    geocoding_service: GeocodingService = Depends(get_geocoding_service),
):
    try:
        return await geocoding_service.reverse(lat=lat, lon=lon)
    except GeocodingError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get('/search', response_model=GeocodeSearchResponse)
async def search_geocode(
    q: str = Query(..., min_length=2),
    geocoding_service: GeocodingService = Depends(get_geocoding_service),
) -> GeocodeSearchResponse:
    try:
        results = await geocoding_service.search(q)
    except GeocodingError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return GeocodeSearchResponse(results=results)
