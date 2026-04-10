from __future__ import annotations

from tools import BackendToolClient


class RoadInfrastructureTool:
    def __init__(self, backend_client: BackendToolClient) -> None:
        self.backend_client = backend_client

    async def lookup(self, *, lat: float, lon: float) -> dict | None:
        return await self.backend_client.get(
            '/api/v1/roads/infrastructure',
            params={'lat': lat, 'lon': lon},
        )
