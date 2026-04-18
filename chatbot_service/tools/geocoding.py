"""Geocoding Utility — Nominatim (primary) + OpenCage (fallback).

Central geocoding for the chatbot service:
  - Nominatim: Free, 1 req/sec, requires User-Agent
  - OpenCage: Free tier 2500/day, needs OPENCAGE_API_KEY

Used by: crash detection, SOS message builder, context assembler.
"""

from __future__ import annotations

import os

import httpx


class GeocodingClient:
    """Reverse geocoding with Nominatim primary + OpenCage fallback."""

    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
    OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json"

    def __init__(
        self,
        *,
        opencage_key: str | None = None,
        timeout: float = 10.0,
        user_agent: str = "RoadSoS/1.0 (team@roadsos.in)",
    ) -> None:
        self.opencage_key = opencage_key or os.getenv("OPENCAGE_API_KEY", "")
        self._client = httpx.AsyncClient(
            timeout=timeout,
            headers={"User-Agent": user_agent},
        )

    async def reverse_geocode(self, *, lat: float, lon: float) -> dict | None:
        """Convert GPS coordinates to address. Tries Nominatim first, then OpenCage.

        Returns:
            {'road': '...', 'city': '...', 'state': '...', 'postcode': '...', 'display': '...'} or None
        """
        result = await self._nominatim_reverse(lat=lat, lon=lon)
        if result is not None:
            return result

        return await self._opencage_reverse(lat=lat, lon=lon)

    async def _nominatim_reverse(self, *, lat: float, lon: float) -> dict | None:
        """Nominatim reverse geocoding — free, 1 req/sec."""
        try:
            response = await self._client.get(
                self.NOMINATIM_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1,
                },
            )
            response.raise_for_status()
            data = response.json()
            addr = data.get("address", {})

            road = addr.get("road", "")
            city = addr.get("city") or addr.get("town") or addr.get("village", "")
            state = addr.get("state", "")
            postcode = addr.get("postcode", "")

            parts = [p for p in [road, city, state] if p]
            display = ", ".join(parts) or data.get("display_name", "Unknown")

            return {
                "road": road,
                "city": city,
                "state": state,
                "postcode": postcode,
                "display": display,
                "source": "nominatim",
            }
        except Exception:
            return None

    async def _opencage_reverse(self, *, lat: float, lon: float) -> dict | None:
        """OpenCage fallback — 2500/day free, better for small Indian towns."""
        if not self.opencage_key:
            return None
        try:
            response = await self._client.get(
                self.OPENCAGE_URL,
                params={
                    "q": f"{lat}+{lon}",
                    "key": self.opencage_key,
                    "no_annotations": 1,
                    "language": "en",
                },
            )
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])
            if not results:
                return None

            first = results[0]
            comp = first.get("components", {})

            road = comp.get("road", "")
            city = comp.get("city") or comp.get("town") or comp.get("village", "")
            state = comp.get("state", "")
            postcode = comp.get("postcode", "")
            display = first.get("formatted", "Unknown")

            return {
                "road": road,
                "city": city,
                "state": state,
                "postcode": postcode,
                "display": display,
                "source": "opencage",
            }
        except Exception:
            return None

    async def aclose(self) -> None:
        await self._client.aclose()
