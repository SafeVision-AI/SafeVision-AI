"""What3Words API — convert GPS to 3-word address for SOS messages.

Requires W3W_API_KEY (free signup at developer.what3words.com).
Returns the iconic ///three.word.address format for exact location sharing.

This is a jury-demo moment: SOS says "Location: ///filled.count.soap"
"""

from __future__ import annotations

import os

import httpx


W3W_BASE_URL = "https://api.what3words.com/v3"


class What3WordsTool:
    """Convert GPS coordinates to a 3-word address and back."""

    def __init__(self, api_key: str | None = None, timeout: float = 10.0) -> None:
        self.api_key = api_key or os.getenv("W3W_API_KEY", "")
        self._client = httpx.AsyncClient(timeout=timeout)

    async def gps_to_words(self, *, lat: float, lon: float) -> dict | None:
        """Convert GPS coordinates to a 3-word address.

        Returns:
            {'words': 'filled.count.soap', 'map_url': 'https://w3w.co/filled.count.soap'}
            or None on failure.
        """
        if not self.api_key:
            return None

        try:
            response = await self._client.get(
                f"{W3W_BASE_URL}/convert-to-3wa",
                params={
                    "coordinates": f"{lat},{lon}",
                    "key": self.api_key,
                },
            )
            response.raise_for_status()
            data = response.json()

            words = data.get("words", "")
            if not words:
                return None

            return {
                "words": words,
                "map_url": f"https://w3w.co/{words}",
                "formatted": f"///{words}",
            }
        except Exception:
            return None

    async def words_to_gps(self, words: str) -> dict | None:
        """Convert a 3-word address back to GPS coordinates.

        Returns:
            {'lat': 13.08, 'lon': 80.27} or None on failure.
        """
        if not self.api_key:
            return None

        try:
            response = await self._client.get(
                f"{W3W_BASE_URL}/convert-to-coordinates",
                params={
                    "words": words.replace("///", ""),
                    "key": self.api_key,
                },
            )
            response.raise_for_status()
            data = response.json()

            coords = data.get("coordinates", {})
            return {
                "lat": coords.get("lat"),
                "lon": coords.get("lng"),
            }
        except Exception:
            return None

    async def aclose(self) -> None:
        await self._client.aclose()
