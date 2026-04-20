from __future__ import annotations

import contextlib
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from geoalchemy2 import Geography, WKTElement
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.redis_client import CacheHelper
from models.road_issue import RoadInfrastructure, RoadIssue
from models.schemas import (
    AuthorityPreviewResponse,
    RoadInfrastructureResponse,
    RoadIssueItem,
    RoadIssuesResponse,
    RoadReportResponse,
)
from services.authority_router import ROAD_TYPE_LABELS, AuthorityRouter
from services.exceptions import ExternalServiceError, ServiceValidationError
from services.geocoding_service import GeocodingService


ACTIVE_ROAD_ISSUE_STATUSES = ['open', 'acknowledged', 'in_progress']
ALL_ROAD_ISSUE_STATUSES = {'open', 'acknowledged', 'in_progress', 'resolved', 'rejected'}
ISSUES_CACHE_VERSION_KEY = 'roads:issues:version'
UPLOAD_EXTENSION_BY_CONTENT_TYPE = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
}

# Known image file signatures (magic bytes)
_IMAGE_MAGIC_SIGNATURES: list[bytes] = [
    b'\xff\xd8\xff',                     # JPEG
    b'\x89PNG\r\n\x1a\n',               # PNG
    b'RIFF',                             # WebP (RIFF....WEBP)
]


def _is_valid_image_magic(header: bytes) -> bool:
    """Returns True if the first bytes match a known image format signature."""
    for sig in _IMAGE_MAGIC_SIGNATURES:
        if header.startswith(sig):
            # Extra check for WebP: bytes 8-11 must be 'WEBP'
            if sig == b'RIFF' and header[8:12] != b'WEBP':
                continue
            return True
    return False


class RoadWatchService:
    def __init__(
        self,
        *,
        settings: Settings,
        cache: CacheHelper,
        geocoding_service: GeocodingService,
        authority_router: AuthorityRouter,
    ) -> None:
        self.settings = settings
        self.cache = cache
        self.geocoding_service = geocoding_service
        self.authority_router = authority_router

    async def get_authority(self, *, db: AsyncSession, lat: float, lon: float) -> AuthorityPreviewResponse:
        cache_key = f'roads:authority:{lat:.4f}:{lon:.4f}'
        cached = await self.cache.get_json(cache_key)
        if cached:
            return AuthorityPreviewResponse.model_validate(cached)
        preview = await self.authority_router.resolve(db=db, lat=lat, lon=lon)
        await self.cache.set_json(cache_key, preview.model_dump(mode='json'), self.settings.authority_cache_ttl_seconds)
        return preview

    async def get_infrastructure(self, *, db: AsyncSession, lat: float, lon: float) -> RoadInfrastructureResponse:
        cache_key = f'roads:infra:{lat:.4f}:{lon:.4f}'
        cached = await self.cache.get_json(cache_key)
        if cached:
            return RoadInfrastructureResponse.model_validate(cached)

        infrastructure = await self._lookup_infrastructure(db=db, lat=lat, lon=lon)
        if infrastructure is not None:
            road_type_code = self.authority_router.normalize_road_type(
                infrastructure.road_type,
                infrastructure.road_number,
            )
            result = RoadInfrastructureResponse(
                road_type=ROAD_TYPE_LABELS.get(road_type_code, road_type_code),
                road_type_code=road_type_code,
                road_name=infrastructure.road_name,
                road_number=infrastructure.road_number,
                contractor_name=infrastructure.contractor_name,
                exec_engineer=infrastructure.exec_engineer,
                exec_engineer_phone=infrastructure.exec_engineer_phone,
                budget_sanctioned=infrastructure.budget_sanctioned,
                budget_spent=infrastructure.budget_spent,
                last_relayed_date=infrastructure.last_relayed_date,
                next_maintenance=infrastructure.next_maintenance,
                data_source_url=infrastructure.data_source_url,
                source='road_infrastructure',
            )
        else:
            preview = await self.authority_router.resolve(db=db, lat=lat, lon=lon)
            result = RoadInfrastructureResponse(
                road_type=preview.road_type,
                road_type_code=preview.road_type_code,
                road_name=preview.road_name,
                road_number=preview.road_number,
                contractor_name=None,
                exec_engineer=None,
                exec_engineer_phone=None,
                budget_sanctioned=None,
                budget_spent=None,
                last_relayed_date=None,
                next_maintenance=None,
                data_source_url=None,
                source=preview.source,
            )

        await self.cache.set_json(cache_key, result.model_dump(mode='json'), self.settings.authority_cache_ttl_seconds)
        return result

    async def find_nearby_issues(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        radius: int,
        limit: int = 50,
        statuses: list[str] | None = None,
    ) -> RoadIssuesResponse:
        normalized_statuses = statuses or ACTIVE_ROAD_ISSUE_STATUSES
        cache_version = await self.cache.get_int(ISSUES_CACHE_VERSION_KEY, default=0)
        cache_key = (
            f'roads:issues:v{cache_version}:{lat:.4f}:{lon:.4f}:{radius}:'
            f'{",".join(sorted(normalized_statuses))}:{limit}'
        )
        cached = await self.cache.get_json(cache_key)
        if cached:
            return RoadIssuesResponse.model_validate(cached)

        point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        point_geography = cast(point, Geography)
        issue_geography = cast(RoadIssue.location, Geography)
        distance_expr = func.ST_Distance(issue_geography, point_geography).label('distance_meters')
        lat_expr = func.ST_Y(RoadIssue.location).label('lat')
        lon_expr = func.ST_X(RoadIssue.location).label('lon')

        stmt = (
            select(RoadIssue, lat_expr, lon_expr, distance_expr)
            .where(func.ST_DWithin(issue_geography, point_geography, radius))
            .where(RoadIssue.status.in_(normalized_statuses))
            .order_by(distance_expr.asc(), RoadIssue.created_at.desc())
            .limit(limit)
        )

        rows = (await db.execute(stmt)).all()
        issues = [
            RoadIssueItem(
                uuid=issue.uuid,
                issue_type=issue.issue_type,
                severity=issue.severity,
                description=issue.description,
                lat=float(item_lat),
                lon=float(item_lon),
                location_address=issue.location_address,
                road_name=issue.road_name,
                road_type=issue.road_type,
                road_number=issue.road_number,
                authority_name=issue.authority_name,
                status=issue.status,
                created_at=issue.created_at,
                distance_meters=float(distance),
            )
            for issue, item_lat, item_lon, distance in rows
        ]
        response = RoadIssuesResponse(issues=issues, count=len(issues), radius_used=radius)
        await self.cache.set_json(cache_key, response.model_dump(mode='json'), self.settings.cache_ttl_seconds)
        return response

    async def submit_report(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        issue_type: str,
        severity: int,
        description: str | None,
        photo: UploadFile | None,
    ) -> RoadReportResponse:
        normalized_issue_type = issue_type.strip()
        if len(normalized_issue_type) < 2:
            raise ServiceValidationError('issue_type must contain at least 2 non-space characters')
        normalized_description = description.strip() if description and description.strip() else None

        preview = await self.get_authority(db=db, lat=lat, lon=lon)
        try:
            geocode = await self.geocoding_service.reverse(lat=lat, lon=lon)
            location_address = geocode.display_name
        except ExternalServiceError:
            location_address = None
        issue_uuid = uuid.uuid4()
        complaint_ref = f'RS-{issue_uuid.hex[:10].upper()}'
        photo_url = await self._save_photo(issue_uuid=issue_uuid, photo=photo)

        issue = RoadIssue(
            uuid=issue_uuid,
            issue_type=normalized_issue_type,
            severity=severity,
            description=normalized_description,
            location=WKTElement(f'POINT({lon} {lat})', srid=4326),
            location_address=location_address,
            road_name=preview.road_name,
            road_type=preview.road_type,
            road_number=preview.road_number,
            photo_url=photo_url,
            authority_name=preview.authority_name,
            authority_phone=preview.helpline,
            complaint_ref=complaint_ref,
            status='open',
        )

        db.add(issue)
        await db.commit()
        await db.refresh(issue)
        await self.cache.increment(ISSUES_CACHE_VERSION_KEY)

        return RoadReportResponse(
            uuid=issue.uuid,
            complaint_ref=issue.complaint_ref,
            authority_name=preview.authority_name,
            authority_phone=preview.helpline,
            complaint_portal=preview.complaint_portal,
            road_type=preview.road_type,
            road_type_code=preview.road_type_code,
            road_number=preview.road_number,
            road_name=preview.road_name,
            exec_engineer=preview.exec_engineer,
            exec_engineer_phone=preview.exec_engineer_phone,
            contractor_name=preview.contractor_name,
            last_relayed_date=preview.last_relayed_date,
            next_maintenance=preview.next_maintenance,
            budget_sanctioned=preview.budget_sanctioned,
            budget_spent=preview.budget_spent,
            photo_url=photo_url,
            status=issue.status,
        )

    async def _lookup_infrastructure(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        radius_meters: int = 150,
    ) -> RoadInfrastructure | None:
        point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        point_geography = cast(point, Geography)
        geometry_geography = cast(RoadInfrastructure.geometry, Geography)
        distance_expr = func.ST_Distance(geometry_geography, point_geography)
        stmt = (
            select(RoadInfrastructure)
            .where(func.ST_DWithin(geometry_geography, point_geography, radius_meters))
            .order_by(distance_expr.asc())
            .limit(1)
        )
        return (await db.execute(stmt)).scalar_one_or_none()

    async def _save_photo(self, *, issue_uuid: uuid.UUID, photo: UploadFile | None) -> str | None:
        if photo is None or not photo.filename:
            return None

        target: Path | None = None
        try:
            content_type = (photo.content_type or '').lower()
            if content_type and content_type not in self.settings.allowed_upload_content_types:
                raise ServiceValidationError(
                    f'Unsupported photo content type "{content_type}". '
                    f'Allowed types: {", ".join(self.settings.allowed_upload_content_types)}'
                )

            suffix = Path(photo.filename).suffix.lower() or UPLOAD_EXTENSION_BY_CONTENT_TYPE.get(content_type, '.jpg')
            file_name = f'{issue_uuid}{suffix}'
            target = self.settings.upload_dir / file_name
            max_bytes = self.settings.max_upload_bytes
            written = 0

            async with aiofiles.open(target, 'wb') as handle:
                first_chunk = True
                while True:
                    chunk = await photo.read(1024 * 1024)
                    if not chunk:
                        break
                    # Validate magic bytes on first chunk before writing anything to disk
                    if first_chunk:
                        first_chunk = False
                        header = chunk[:12]
                        if not _is_valid_image_magic(header):
                            raise ServiceValidationError(
                                'Uploaded file does not appear to be a valid JPEG, PNG, or WebP image.'
                            )
                    written += len(chunk)
                    if written > max_bytes:
                        raise ServiceValidationError(
                            f'Photo exceeds max upload size of {max_bytes // (1024 * 1024)} MB'
                        )
                    await handle.write(chunk)
        except Exception:
            if target is not None:
                with contextlib.suppress(FileNotFoundError):
                    target.unlink()
            raise
        finally:
            await photo.close()

        if self.settings.local_upload_base_url:
            return f'{self.settings.local_upload_base_url}/{file_name}'
        return f'/uploads/{file_name}'
