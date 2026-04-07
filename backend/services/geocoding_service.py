from __future__ import annotations

import asyncio
import time
from urllib.parse import quote_plus

import httpx

from core.config import Settings
from core.redis_client import CacheHelper
from models.schemas import GeocodeResult
from services.exceptions import ExternalServiceError


class GeocodingError(ExternalServiceError):
    pass


class GeocodingService:
    def __init__(self, settings: Settings, cache: CacheHelper) -> None:
        self.settings = settings
        self.cache = cache
        self._client = httpx.AsyncClient(
            timeout=settings.request_timeout_seconds,
            headers={'User-Agent': settings.http_user_agent},
        )
        self._rate_limit_lock = asyncio.Lock()
        self._last_nominatim_request_at = 0.0

    async def aclose(self) -> None:
        await self._client.aclose()

    async def reverse(self, *, lat: float, lon: float) -> GeocodeResult:
        cache_key = f'geocode:reverse:{lat:.4f}:{lon:.4f}'
        cached = await self.cache.get_json(cache_key)
        if cached:
            return GeocodeResult.model_validate(cached)

        try:
            result = await self._reverse_photon(lat=lat, lon=lon)
        except GeocodingError:
            result = await self._reverse_nominatim(lat=lat, lon=lon)

        await self.cache.set_json(cache_key, result.model_dump(mode='json'), self.settings.geocode_cache_ttl_seconds)
        return result

    async def search(self, query: str) -> list[GeocodeResult]:
        cache_key = f'geocode:search:{quote_plus(query.lower())}'
        cached = await self.cache.get_json(cache_key)
        if cached:
            return [GeocodeResult.model_validate(item) for item in cached]

        try:
            results = await self._search_photon(query)
        except GeocodingError:
            results = await self._search_nominatim(query)

        await self.cache.set_json(
            cache_key,
            [result.model_dump(mode='json') for result in results],
            self.settings.geocode_cache_ttl_seconds,
        )
        return results

    async def _search_photon(self, query: str) -> list[GeocodeResult]:
        payload = await self._get(self.settings.photon_url, '/api/', {'q': query, 'limit': 5, 'lang': 'en'})
        features = payload.get('features') if isinstance(payload, dict) else None
        if not features:
            raise GeocodingError('Photon geocoding unavailable')
        return [self._normalize_photon(feature) for feature in features if feature]

    async def _reverse_photon(self, *, lat: float, lon: float) -> GeocodeResult:
        payload = await self._get(self.settings.photon_url, '/reverse', {'lat': lat, 'lon': lon, 'limit': 1})
        features = payload.get('features') if isinstance(payload, dict) else None
        if not features:
            raise GeocodingError('Photon geocoding unavailable')
        return self._normalize_photon(features[0])

    async def _search_nominatim(self, query: str) -> list[GeocodeResult]:
        params = {
            'q': query,
            'format': 'jsonv2',
            'addressdetails': 1,
            'limit': 5,
        }
        payload = await self._get_nominatim('/search', params)
        return [self._normalize_nominatim(item) for item in payload]

    async def _reverse_nominatim(self, *, lat: float, lon: float) -> GeocodeResult:
        params = {
            'lat': lat,
            'lon': lon,
            'format': 'jsonv2',
            'addressdetails': 1,
        }
        payload = await self._get_nominatim('/reverse', params)
        return self._normalize_nominatim(payload)

    async def _get_nominatim(self, path: str, params: dict) -> dict | list:
        async with self._rate_limit_lock:
            elapsed = time.monotonic() - self._last_nominatim_request_at
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            try:
                response = await self._client.get(f'{self.settings.nominatim_url}{path}', params=params)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                raise GeocodingError('Nominatim geocoding unavailable') from exc
            finally:
                self._last_nominatim_request_at = time.monotonic()
        return response.json()

    async def _get(self, base_url: str, path: str, params: dict) -> dict | list:
        try:
            response = await self._client.get(f'{base_url}{path}', params=params)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise GeocodingError('Photon geocoding unavailable') from exc
        return response.json()

    @staticmethod
    def _normalize_photon(feature: dict) -> GeocodeResult:
        properties = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        coordinates = geometry.get('coordinates') or [None, None]
        lon = float(coordinates[0]) if coordinates[0] is not None else None
        lat = float(coordinates[1]) if coordinates[1] is not None else None

        city = (
            properties.get('city')
            or properties.get('district')
            or properties.get('county')
            or properties.get('state_district')
            or properties.get('locality')
        )
        state_code = properties.get('statecode') or properties.get('state_code')
        country_code = (properties.get('countrycode') or '').upper() or None
        name = properties.get('name')
        street = ' '.join(part for part in [properties.get('street'), properties.get('housenumber')] if part)
        display_parts = [name, street or None, city, properties.get('state'), properties.get('country')]
        display_name = ', '.join(part for part in display_parts if part) or 'Unknown location'

        return GeocodeResult(
            display_name=display_name,
            city=city,
            state=properties.get('state'),
            state_code=state_code,
            country_code=country_code,
            postcode=properties.get('postcode'),
            lat=lat,
            lon=lon,
        )

    @staticmethod
    def _normalize_nominatim(payload: dict) -> GeocodeResult:
        address = payload.get('address', {})
        state_code = address.get('ISO3166-2-lvl4')
        if state_code and '-' in state_code:
            state_code = state_code.split('-')[-1]
        return GeocodeResult(
            display_name=payload.get('display_name', 'Unknown location'),
            city=address.get('city') or address.get('town') or address.get('village') or address.get('county'),
            state=address.get('state'),
            state_code=state_code,
            country_code=(address.get('country_code') or '').upper() or None,
            postcode=address.get('postcode'),
            lat=float(payload['lat']) if payload.get('lat') is not None else None,
            lon=float(payload['lon']) if payload.get('lon') is not None else None,
        )
