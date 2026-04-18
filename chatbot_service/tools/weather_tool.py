"""Weather Tool — Open-Meteo (primary) + OpenWeatherMap (fallback).

Provides weather data for risk assessment and chatbot context.
Open-Meteo is free with no API key. OWM is the fallback if Open-Meteo fails.
"""

from __future__ import annotations

import httpx

from config import Settings
from tools.open_meteo import OpenMeteoClient


class WeatherTool:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._open_meteo = OpenMeteoClient(settings)
        self._owm_client = httpx.AsyncClient(
            timeout=settings.http_timeout_seconds,
            headers={'User-Agent': settings.http_user_agent},
        )

    async def lookup(self, *, lat: float, lon: float) -> dict | None:
        """Try Open-Meteo first (free, no key), fall back to OpenWeatherMap."""

        # Primary: Open-Meteo — free, unlimited, no key
        result = await self._open_meteo.lookup(lat=lat, lon=lon)
        if result is not None:
            return result

        # Fallback: OpenWeatherMap — needs API key
        return await self._owm_lookup(lat=lat, lon=lon)

    async def _owm_lookup(self, *, lat: float, lon: float) -> dict | None:
        """OpenWeatherMap fallback — requires OPENWEATHER_API_KEY."""
        if not self.settings.openweather_api_key:
            return None
        try:
            response = await self._owm_client.get(
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
                'source': 'openweathermap',
            }
        except Exception:
            return None

    async def aclose(self) -> None:
        await self._open_meteo.aclose()
        await self._owm_client.aclose()
