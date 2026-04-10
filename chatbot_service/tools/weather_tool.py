from __future__ import annotations

import httpx

from config import Settings


class WeatherTool:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client = httpx.AsyncClient(
            timeout=settings.http_timeout_seconds,
            headers={'User-Agent': settings.http_user_agent},
        )

    async def lookup(self, *, lat: float, lon: float) -> dict | None:
        if not self.settings.openweather_api_key:
            return None
        try:
            response = await self._client.get(
                f'{self.settings.openweather_base_url}/weather',
                params={
                    'lat': lat,
                    'lon': lon,
                    'appid': self.settings.openweather_api_key,
                    'units': self.settings.openweather_units,
                },
            )
            response.raise_for_status()
            payload = response.json()
            weather = payload.get('weather') or [{}]
            main = payload.get('main') or {}
            return {
                'summary': weather[0].get('description') or 'Weather unavailable',
                'temperature': main.get('temp'),
            }
        except Exception:
            return None

    async def aclose(self) -> None:
        await self._client.aclose()
