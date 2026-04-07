from __future__ import annotations

from typing import Any

import httpx

from core.config import Settings
from core.redis_client import CacheHelper
from models.schemas import (
    RouteBounds,
    RouteInstruction,
    RouteOption,
    RoutePoint,
    RoutePreviewResponse,
    RouteProfile,
)
from services.exceptions import ExternalServiceError, ServiceValidationError


class RoutingService:
    def __init__(self, settings: Settings, cache: CacheHelper) -> None:
        self.settings = settings
        self.cache = cache
        self._client = httpx.AsyncClient(
            timeout=settings.request_timeout_seconds,
            headers={
                'Accept': 'application/json',
                'User-Agent': settings.http_user_agent,
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def preview_route(
        self,
        *,
        origin_lat: float,
        origin_lon: float,
        destination_lat: float,
        destination_lon: float,
        profile: RouteProfile = 'driving-car',
        alternatives: int = 2,
    ) -> RoutePreviewResponse:
        if self._same_point(origin_lat, origin_lon, destination_lat, destination_lon):
            raise ServiceValidationError('Origin and destination are too close to calculate a route.')

        requested_alternatives = max(0, min(int(alternatives), 2))
        cache_key = (
            'route:preview:'
            f'{profile}:{requested_alternatives}:'
            f'{origin_lat:.5f}:{origin_lon:.5f}:{destination_lat:.5f}:{destination_lon:.5f}'
        )
        cached = await self.cache.get_json(cache_key)
        if cached:
            return RoutePreviewResponse.model_validate(cached)

        api_key = self.settings.openrouteservice_api_key
        if not api_key:
            raise ExternalServiceError('Routing is not configured. Add OPENROUTESERVICE_API_KEY in backend .env.')

        url = f'{self.settings.openrouteservice_base_url}/v2/directions/{profile}/geojson'
        payload = {
            'coordinates': [
                [origin_lon, origin_lat],
                [destination_lon, destination_lat],
            ],
            'instructions': True,
            'instructions_format': 'text',
            'elevation': False,
            'units': 'm',
        }
        if requested_alternatives > 0 and profile == 'driving-car':
            payload['alternative_routes'] = {
                'target_count': requested_alternatives,
                'share_factor': 0.6,
                'weight_factor': 1.6,
            }

        warnings: list[str] = []

        try:
            response = await self._client.post(
                url,
                json=payload,
                headers={'Authorization': api_key},
            )
        except httpx.HTTPError as exc:
            raise ExternalServiceError('Unable to reach routing provider right now.') from exc

        if response.status_code >= 400 and requested_alternatives > 0:
            degraded_message = self._message_from_response(response)
            payload.pop('alternative_routes', None)
            warnings.append(
                f'Alternative routes unavailable: {degraded_message}. Showing the primary route only.'
            )
            try:
                response = await self._client.post(
                    url,
                    json=payload,
                    headers={'Authorization': api_key},
                )
            except httpx.HTTPError as exc:
                raise ExternalServiceError('Unable to reach routing provider right now.') from exc

        if response.status_code >= 400:
            raise ExternalServiceError(self._message_from_response(response))

        data = response.json()
        route = self._normalize_response(
            data,
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            destination_lat=destination_lat,
            destination_lon=destination_lon,
            profile=profile,
            warnings=warnings,
        )
        await self.cache.set_json(
            cache_key,
            route.model_dump(mode='json'),
            self.settings.route_cache_ttl_seconds,
        )
        return route

    @staticmethod
    def _same_point(
        origin_lat: float,
        origin_lon: float,
        destination_lat: float,
        destination_lon: float,
    ) -> bool:
        return abs(origin_lat - destination_lat) < 1e-5 and abs(origin_lon - destination_lon) < 1e-5

    @staticmethod
    def _message_from_response(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict):
            message = payload.get('error') or payload.get('message')
            if isinstance(message, dict):
                message = message.get('message')
            if isinstance(message, str) and message.strip():
                return message.strip()
        if response.status_code == 401:
            return 'Routing provider rejected the API key.'
        if response.status_code == 429:
            return 'Routing provider rate limit reached. Please try again in a moment.'
        return 'Routing provider could not generate a route right now.'

    def _normalize_response(
        self,
        payload: dict[str, Any],
        *,
        origin_lat: float,
        origin_lon: float,
        destination_lat: float,
        destination_lon: float,
        profile: RouteProfile,
        warnings: list[str] | None = None,
    ) -> RoutePreviewResponse:
        features = payload.get('features') or []
        if not features:
            raise ExternalServiceError('Routing provider returned no route.')

        routes = [self._normalize_feature(feature, index=index) for index, feature in enumerate(features, start=1)]
        selected_route = routes[0]
        return RoutePreviewResponse(
            provider='openrouteservice',
            profile=profile,
            distance_meters=selected_route.distance_meters,
            duration_seconds=selected_route.duration_seconds,
            path=selected_route.path,
            bounds=selected_route.bounds,
            origin=RoutePoint(lat=origin_lat, lon=origin_lon, label='Current location'),
            destination=RoutePoint(lat=destination_lat, lon=destination_lon, label='Destination'),
            steps=selected_route.steps,
            routes=routes,
            selected_route_id=selected_route.route_id,
            warnings=warnings or [],
        )

    def _normalize_feature(self, feature: dict[str, Any], *, index: int) -> RouteOption:
        geometry = feature.get('geometry') or {}
        coordinates = geometry.get('coordinates') or []
        if len(coordinates) < 2:
            raise ExternalServiceError('Routing provider returned an incomplete route path.')

        properties = feature.get('properties') or {}
        summary = properties.get('summary') or {}
        segments = properties.get('segments') or []
        path = [
            RoutePoint(lat=float(coord[1]), lon=float(coord[0]))
            for coord in coordinates
            if isinstance(coord, list) and len(coord) >= 2
        ]
        if len(path) < 2:
            raise ExternalServiceError('Routing provider returned invalid path coordinates.')

        steps: list[RouteInstruction] = []
        for segment in segments:
            for step_index, step in enumerate(segment.get('steps') or [], start=len(steps) + 1):
                steps.append(
                    RouteInstruction(
                        index=step_index,
                        instruction=str(step.get('instruction') or 'Continue'),
                        distance_meters=float(step.get('distance') or 0.0),
                        duration_seconds=float(step.get('duration') or 0.0),
                        street_name=step.get('name') or None,
                        instruction_type=int(step['type']) if step.get('type') is not None else None,
                        exit_number=int(step['exit_number']) if step.get('exit_number') is not None else None,
                    )
                )

        label = 'Primary route' if index == 1 else f'Alternative {index - 1}'
        return RouteOption(
            route_id=f'route-{index}',
            label=label,
            distance_meters=float(summary.get('distance') or 0.0),
            duration_seconds=float(summary.get('duration') or 0.0),
            path=path,
            bounds=self._build_bounds(path),
            steps=steps,
        )

    @staticmethod
    def _build_bounds(path: list[RoutePoint]) -> RouteBounds:
        lats = [point.lat for point in path]
        lons = [point.lon for point in path]
        return RouteBounds(
            south=min(lats),
            west=min(lons),
            north=max(lats),
            east=max(lons),
        )
