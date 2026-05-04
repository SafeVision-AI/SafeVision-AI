"""
waze_feed.py — Waze CIFS (Closure and Incident Feed Specification) Endpoint

Generates a CIFS-format JSON feed from verified RoadWatch reports.
Waze polls this endpoint every 2 minutes and displays the incidents
as live hazard pins inside Waze AND Google Maps.

CIFS Spec: https://developers.google.com/waze/data-feed/cifs-specification

Feed URL for Waze Partner Hub submission:
    https://safevixai-backend.onrender.com/api/v1/feeds/waze
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feeds", tags=["feeds"])


# ── CIFS Type Mapping ──────────────────────────────────────────────────────────

CIFS_TYPE_MAP: dict[str, str] = {
    "pothole": "HAZARD_ON_ROAD",
    "damaged_road": "HAZARD_ON_ROAD",
    "flooding": "HAZARD_ON_ROAD",
    "waterlogging": "HAZARD_ON_ROAD",
    "broken_barrier": "HAZARD_ON_ROAD",
    "missing_sign": "HAZARD_ON_ROAD",
    "accident": "ACCIDENT",
    "road_closed": "ROAD_CLOSED",
    "construction": "CONSTRUCTION",
    "landslide": "HAZARD_ON_ROAD",
    "debris": "HAZARD_ON_ROAD",
    "stalled_vehicle": "HAZARD_ON_ROAD",
    "other": "HAZARD_ON_ROAD",
}

CIFS_SUBTYPE_MAP: dict[str, str] = {
    "pothole": "HAZARD_ON_ROAD_POT_HOLE",
    "damaged_road": "HAZARD_ON_ROAD_ROAD_KILL",
    "flooding": "HAZARD_WEATHER_FLOOD",
    "waterlogging": "HAZARD_WEATHER_FLOOD",
    "broken_barrier": "HAZARD_ON_ROAD_OBJECT",
    "missing_sign": "HAZARD_ON_ROAD_MISSING_SIGN",
    "accident": "ACCIDENT_MAJOR",
    "road_closed": "ROAD_CLOSED_EVENT",
    "construction": "CONSTRUCTION",
    "landslide": "HAZARD_ON_ROAD_OBJECT",
    "debris": "HAZARD_ON_ROAD_OBJECT",
    "stalled_vehicle": "HAZARD_ON_ROAD_CAR_STOPPED",
    "other": "HAZARD_ON_ROAD_OBJECT",
}


def _to_cifs_type(issue_type: str) -> str:
    """Map RoadWatch issue type to CIFS incident type."""
    return CIFS_TYPE_MAP.get(issue_type.lower().replace(" ", "_"), "HAZARD_ON_ROAD")


def _to_cifs_subtype(issue_type: str) -> str:
    """Map RoadWatch issue type to CIFS incident subtype."""
    return CIFS_SUBTYPE_MAP.get(issue_type.lower().replace(" ", "_"), "HAZARD_ON_ROAD_OBJECT")


def _format_timestamp(iso_str: str | None) -> str:
    """Convert ISO timestamp to CIFS-compatible format."""
    if not iso_str:
        return datetime.now(timezone.utc).strftime("%m/%d/%Y %H:%M:%S")
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%m/%d/%Y %H:%M:%S")
    except (ValueError, AttributeError):
        return datetime.now(timezone.utc).strftime("%m/%d/%Y %H:%M:%S")


# ── CIFS Feed Endpoint ────────────────────────────────────────────────────────


@router.get("/waze", response_class=JSONResponse)
async def get_waze_cifs_feed() -> dict[str, Any]:
    """
    CIFS Feed — Waze polls this every 2 minutes.

    Returns verified road reports from the last 24 hours in CIFS format.
    Reports appear as live hazard pins in both Waze AND Google Maps.

    From Waze docs: "Road closures and supported hazard types submitted to Waze
    will also appear on Google Maps." — ONE integration, TWO platforms.
    """
    try:
        from core.config import settings

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return _empty_feed("Supabase not configured")

        from supabase import create_client

        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        # Fetch verified reports from last 24 hours
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

        result = (
            supabase.table("road_reports")
            .select("id,issue_type,description,lat,lon,road_name,city,created_at,status,severity")
            .gte("created_at", cutoff)
            .in_("status", ["verified", "confirmed"])
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )

        reports = result.data or []

    except Exception as exc:
        logger.warning("CIFS feed — Supabase unavailable: %s", exc)
        reports = []

    # Build CIFS incidents array
    incidents: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    for r in reports:
        lat = r.get("lat")
        lon = r.get("lon")
        if not lat or not lon:
            continue

        # Calculate end time based on severity
        severity = (r.get("severity") or "medium").lower()
        ttl_hours = {"critical": 72, "high": 48, "medium": 24, "low": 12}.get(severity, 24)

        try:
            start_dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            end_dt = start_dt + timedelta(hours=ttl_hours)
        except (ValueError, KeyError):
            start_dt = now
            end_dt = now + timedelta(hours=24)

        # Skip expired incidents
        if end_dt < now:
            continue

        incident: dict[str, Any] = {
            "id": f"SVAI-{r['id']}",
            "type": _to_cifs_type(r.get("issue_type", "other")),
            "subtype": _to_cifs_subtype(r.get("issue_type", "other")),
            "polyline": f"{lat} {lon}",
            "description": (r.get("description") or "Road hazard reported via SafeVixAI")[:200],
            "starttime": _format_timestamp(r.get("created_at")),
            "endtime": end_dt.strftime("%m/%d/%Y %H:%M:%S"),
            "street": r.get("road_name") or "",
            "city": r.get("city") or "",
            "country": "IN",
            "reference": f"https://safevixai.vercel.app/report/{r['id']}",
        }

        incidents.append(incident)

    return {
        "incidents": incidents,
        "timestamp": now.strftime("%m/%d/%Y %H:%M:%S"),
        "source": "SafeVixAI RoadWatch Community Reports",
        "version": "1.0",
        "count": len(incidents),
    }


def _empty_feed(reason: str) -> dict[str, Any]:
    """Return an empty but valid CIFS feed."""
    return {
        "incidents": [],
        "timestamp": datetime.now(timezone.utc).strftime("%m/%d/%Y %H:%M:%S"),
        "source": "SafeVixAI RoadWatch Community Reports",
        "version": "1.0",
        "count": 0,
        "note": reason,
    }
