from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.schemas import (
    AuthorityPreviewResponse,
    RoadInfrastructureResponse,
    RoadIssuesResponse,
    RoadReportResponse,
)
from services.roadwatch_service import RoadWatchService
from services.exceptions import ServiceValidationError
from services.roadwatch_service import ALL_ROAD_ISSUE_STATUSES


router = APIRouter(prefix='/api/v1/roads', tags=['RoadWatch'])


def get_roadwatch_service(request: Request) -> RoadWatchService:
    return request.app.state.roadwatch_service


@router.get('/issues', response_model=RoadIssuesResponse)
async def get_nearby_issues(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius: int = Query(default=5000, ge=100, le=50000),
    limit: int = Query(default=50, ge=1, le=100),
    statuses: str | None = Query(default='open,acknowledged,in_progress'),
    db: AsyncSession = Depends(get_db),
    roadwatch_service: RoadWatchService = Depends(get_roadwatch_service),
) -> RoadIssuesResponse:
    parsed_statuses = [part.strip() for part in (statuses or '').split(',') if part.strip()]
    invalid_statuses = sorted(set(parsed_statuses) - ALL_ROAD_ISSUE_STATUSES)
    if invalid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f'Unsupported statuses: {", ".join(invalid_statuses)}',
        )
    return await roadwatch_service.find_nearby_issues(
        db=db,
        lat=lat,
        lon=lon,
        radius=radius,
        limit=limit,
        statuses=parsed_statuses,
    )


@router.get('/authority', response_model=AuthorityPreviewResponse)
async def get_authority_preview(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    roadwatch_service: RoadWatchService = Depends(get_roadwatch_service),
) -> AuthorityPreviewResponse:
    return await roadwatch_service.get_authority(db=db, lat=lat, lon=lon)


@router.get('/infrastructure', response_model=RoadInfrastructureResponse)
async def get_road_infrastructure(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    db: AsyncSession = Depends(get_db),
    roadwatch_service: RoadWatchService = Depends(get_roadwatch_service),
) -> RoadInfrastructureResponse:
    return await roadwatch_service.get_infrastructure(db=db, lat=lat, lon=lon)


@router.post('/report', response_model=RoadReportResponse)
async def submit_road_issue(
    lat: float = Form(..., ge=-90, le=90),
    lon: float = Form(..., ge=-180, le=180),
    issue_type: str = Form(..., min_length=2, max_length=64),
    severity: int = Form(..., ge=1, le=5),
    description: str | None = Form(default=None),
    photo: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    roadwatch_service: RoadWatchService = Depends(get_roadwatch_service),
) -> RoadReportResponse:
    try:
        return await roadwatch_service.submit_report(
            db=db,
            lat=lat,
            lon=lon,
            issue_type=issue_type,
            severity=severity,
            description=description,
            photo=photo,
        )
    except ServiceValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
