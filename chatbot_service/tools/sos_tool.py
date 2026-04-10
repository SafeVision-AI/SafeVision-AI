from __future__ import annotations

from tools import BackendToolClient


class SosTool:
    def __init__(self, backend_client: BackendToolClient) -> None:
        self.backend_client = backend_client

    async def get_payload(self, *, lat: float, lon: float) -> dict | None:
        return await self.backend_client.get(
            '/api/v1/emergency/sos',
            params={'lat': lat, 'lon': lon},
        )
