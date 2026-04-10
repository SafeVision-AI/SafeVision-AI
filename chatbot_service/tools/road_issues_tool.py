from __future__ import annotations

from tools import BackendToolClient


class RoadIssuesTool:
    def __init__(self, backend_client: BackendToolClient) -> None:
        self.backend_client = backend_client

    async def lookup(self, *, lat: float, lon: float, radius: int = 5000, limit: int = 5) -> dict | None:
        return await self.backend_client.get(
            '/api/v1/roads/issues',
            params={'lat': lat, 'lon': lon, 'radius': radius, 'limit': limit},
        )
