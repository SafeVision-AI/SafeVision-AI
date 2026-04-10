from __future__ import annotations

from tools import BackendToolClient


class EmergencyTool:
    def __init__(self, backend_client: BackendToolClient) -> None:
        self.backend_client = backend_client

    async def find_nearby(self, *, lat: float, lon: float, limit: int = 5) -> dict | None:
        return await self.backend_client.get(
            '/api/v1/emergency/nearby',
            params={'lat': lat, 'lon': lon, 'limit': limit},
        )
