from __future__ import annotations

import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from core.config import get_settings
from core.database import get_async_session
from core.security import ALGORITHM, SECRET_KEY, create_access_token, get_current_user
from sqlalchemy import text

logger = logging.getLogger("safevixai.live_tracking")
router = APIRouter(prefix="/api/v1/live-tracking", tags=["Live Tracking"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StartTrackingRequest(BaseModel):
    user_name: str = Field(min_length=1, max_length=80)
    blood_group: Optional[str] = Field(default=None, max_length=12)
    vehicle_number: Optional[str] = Field(default=None, max_length=20, pattern=r"^[A-Za-z0-9 -]+$")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    battery_percent: Optional[int] = Field(default=None, ge=0, le=100)


class StartTrackingResponse(BaseModel):
    session_id: str
    tracking_url: str
    expires_at: str


class UpdateLocationRequest(BaseModel):
    session_id: uuid.UUID
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: Optional[float] = Field(default=None, ge=0, le=10000)
    speed_kmh: Optional[float] = Field(default=None, ge=0, le=300)
    battery_percent: Optional[int] = Field(default=None, ge=0, le=100)


class TrackingSessionResponse(BaseModel):
    session_id: str
    user_name: str
    blood_group: Optional[str]
    vehicle_number: Optional[str]
    latitude: float
    longitude: float
    accuracy: Optional[float]
    speed_kmh: Optional[float]
    battery_percent: Optional[int]
    is_active: bool
    updated_at: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start", response_model=StartTrackingResponse)
async def start_tracking(
    payload: StartTrackingRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Start a live tracking session. Returns a shareable public link.
    Called when SOS is triggered or crash is detected.
    The returned URL works WITHOUT login for family members.
    """
    session_id = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=4)

    async for session in get_async_session():
        await session.execute(
            text("""
                INSERT INTO live_tracking 
                    (session_id, user_id, user_name, blood_group, vehicle_number,
                     latitude, longitude, battery_percent, expires_at)
                VALUES 
                    (:session_id, :user_id, :user_name, :blood_group, :vehicle_number,
                     :latitude, :longitude, :battery_percent, :expires_at)
            """),
            {
                "session_id": session_id,
                "user_id": str(current_user["sub"]),
                "user_name": payload.user_name,
                "blood_group": payload.blood_group,
                "vehicle_number": payload.vehicle_number,
                "latitude": payload.latitude,
                "longitude": payload.longitude,
                "battery_percent": payload.battery_percent,
                "expires_at": expires_at.isoformat(),
            }
        )
        await session.commit()

    settings = get_settings()
    frontend_url = settings.frontend_url or str(request.base_url).rstrip("/").replace(":8000", ":3000")
    view_token = create_access_token(
        data={"sub": session_id, "purpose": "tracking_view"},
        expires_delta=timedelta(hours=4),
    )
    tracking_url = f"{frontend_url}/track/{session_id}?token={view_token}"

    logger.info("Live tracking session started: %s", session_id)
    return StartTrackingResponse(
        session_id=session_id,
        tracking_url=tracking_url,
        expires_at=expires_at.isoformat(),
    )


@router.put("/update")
async def update_location(
    payload: UpdateLocationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the GPS location for an active tracking session.
    Called every 5 seconds from the victim's device.
    """
    async for session in get_async_session():
        result = await session.execute(
            text("""
                UPDATE live_tracking 
                SET latitude = :lat, longitude = :lon, accuracy = :accuracy,
                    speed_kmh = :speed, battery_percent = :battery,
                    updated_at = NOW()
                WHERE session_id = :session_id 
                  AND user_id = :user_id
                  AND is_active = true 
                  AND expires_at > NOW()
                RETURNING session_id
            """),
            {
                "lat": payload.latitude,
                "lon": payload.longitude,
                "accuracy": payload.accuracy,
                "speed": payload.speed_kmh,
                "battery": payload.battery_percent,
                "session_id": str(payload.session_id),
                "user_id": str(current_user["sub"]),
            }
        )
        await session.commit()
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Tracking session not found or expired")

    return {"status": "updated"}


@router.get("/session/{session_id}", response_model=TrackingSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    token: str = Query(..., min_length=20, max_length=4096),
):
    """
    Get the current location for a tracking session.
    PUBLIC endpoint — no authentication required.
    Used by family members who open the signed tracking link.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "tracking_view" or payload.get("sub") != str(session_id):
            raise HTTPException(status_code=403, detail="Invalid tracking link")
    except JWTError as exc:
        raise HTTPException(status_code=403, detail="Invalid or expired tracking link") from exc

    async for session in get_async_session():
        result = await session.execute(
            text("""
                SELECT session_id, user_name, blood_group, vehicle_number,
                       latitude, longitude, accuracy, speed_kmh, battery_percent,
                       is_active, updated_at
                FROM live_tracking
                WHERE session_id = :session_id
                  AND is_active = true
                  AND expires_at > NOW()
            """),
            {"session_id": str(session_id)}
        )
        row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Tracking session not found or expired")

    return TrackingSessionResponse(
        session_id=str(row.session_id),
        user_name=row.user_name,
        blood_group=row.blood_group,
        vehicle_number=row.vehicle_number,
        latitude=row.latitude,
        longitude=row.longitude,
        accuracy=row.accuracy,
        speed_kmh=row.speed_kmh,
        battery_percent=row.battery_percent,
        is_active=row.is_active,
        updated_at=row.updated_at.isoformat() if row.updated_at else "",
    )


@router.delete("/session/{session_id}")
async def stop_tracking(
    session_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
):
    """
    Stop (deactivate) a tracking session.
    Called when user confirms they are safe.
    """
    async for session in get_async_session():
        result = await session.execute(
            text("""
                UPDATE live_tracking 
                SET is_active = false 
                WHERE session_id = :session_id
                  AND user_id = :user_id
                RETURNING session_id
            """),
            {"session_id": str(session_id), "user_id": str(current_user["sub"])}
        )
        await session.commit()
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Tracking session not found")

    logger.info("Live tracking session stopped: %s", session_id)
    return {"status": "stopped"}
