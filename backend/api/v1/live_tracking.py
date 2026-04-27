from __future__ import annotations

import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core.database import get_async_session
from sqlalchemy import text

logger = logging.getLogger("safevixai.live_tracking")
router = APIRouter(prefix="/api/v1/live-tracking", tags=["Live Tracking"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StartTrackingRequest(BaseModel):
    user_name: str
    blood_group: Optional[str] = None
    vehicle_number: Optional[str] = None
    latitude: float
    longitude: float
    battery_percent: Optional[int] = None


class StartTrackingResponse(BaseModel):
    session_id: str
    tracking_url: str
    expires_at: str


class UpdateLocationRequest(BaseModel):
    session_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed_kmh: Optional[float] = None
    battery_percent: Optional[int] = None


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
async def start_tracking(payload: StartTrackingRequest, request: Request):
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
                    (session_id, user_name, blood_group, vehicle_number,
                     latitude, longitude, battery_percent, expires_at)
                VALUES 
                    (:session_id, :user_name, :blood_group, :vehicle_number,
                     :latitude, :longitude, :battery_percent, :expires_at)
            """),
            {
                "session_id": session_id,
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

    # Build the public family tracking URL
    base_url = str(request.base_url).rstrip("/")
    # For production, this will be the frontend URL
    frontend_url = base_url.replace(":8000", ":3000")  # dev fallback
    tracking_url = f"{frontend_url}/track/{session_id}"

    logger.info(f"Live tracking session started: {session_id} for {payload.user_name}")
    return StartTrackingResponse(
        session_id=session_id,
        tracking_url=tracking_url,
        expires_at=expires_at.isoformat(),
    )


@router.put("/update")
async def update_location(payload: UpdateLocationRequest):
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
                "session_id": payload.session_id,
            }
        )
        await session.commit()
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Tracking session not found or expired")

    return {"status": "updated"}


@router.get("/session/{session_id}", response_model=TrackingSessionResponse)
async def get_session(session_id: str):
    """
    Get the current location for a tracking session.
    PUBLIC endpoint — no authentication required.
    Used by family members who open the tracking link.
    """
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
            {"session_id": session_id}
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
async def stop_tracking(session_id: str):
    """
    Stop (deactivate) a tracking session.
    Called when user confirms they are safe.
    """
    async for session in get_async_session():
        await session.execute(
            text("""
                UPDATE live_tracking 
                SET is_active = false 
                WHERE session_id = :session_id
            """),
            {"session_id": session_id}
        )
        await session.commit()

    logger.info(f"Live tracking session stopped: {session_id}")
    return {"status": "stopped"}
