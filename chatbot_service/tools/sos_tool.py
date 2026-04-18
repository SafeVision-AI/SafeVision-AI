from __future__ import annotations

import asyncio

from tools import BackendToolClient
from tools.geocoding import GeocodingClient
from tools.what3words import What3WordsTool


class SosTool:
    def __init__(
        self,
        backend_client: BackendToolClient,
        w3w_tool: What3WordsTool,
        geocode_client: GeocodingClient,
    ) -> None:
        self.backend_client = backend_client
        self.w3w = w3w_tool
        self.geocode = geocode_client

    async def get_payload(self, *, lat: float, lon: float) -> dict | None:
        # Fetch data in parallel to keep latency low
        backend_coro = self.backend_client.get(
            '/api/v1/emergency/sos',
            params={'lat': lat, 'lon': lon},
        )
        w3w_coro = self.w3w.gps_to_words(lat=lat, lon=lon)
        geo_coro = self.geocode.reverse_geocode(lat=lat, lon=lon)

        payload, w3w_res, geo_res = await asyncio.gather(
            backend_coro, w3w_coro, geo_coro, return_exceptions=True
        )

        if not payload or isinstance(payload, Exception):
            return None

        if not isinstance(w3w_res, Exception) and w3w_res:
            payload['what3words'] = w3w_res

        if not isinstance(geo_res, Exception) and geo_res:
            payload['address'] = geo_res

        return payload
