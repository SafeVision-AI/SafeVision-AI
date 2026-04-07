from __future__ import annotations

from collections.abc import Iterable
import json

from geoalchemy2 import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.redis_client import CacheHelper
from models.emergency import EmergencyService
from models.schemas import (
    EmergencyNumber,
    EmergencyNumbersResponse,
    EmergencyResponse,
    EmergencyServiceItem,
    SosResponse,
)
from services.exceptions import ExternalServiceError
from services.exceptions import ServiceValidationError
from services.overpass_service import OverpassService


SUPPORTED_CATEGORIES = {
    'hospital',
    'police',
    'ambulance',
    'fire',
    'towing',
    'pharmacy',
    'puncture',
    'showroom',
}

CITY_CENTERS: dict[str, tuple[float, float]] = {
    'agartala': (23.8315, 91.2868),
    'ahmedabad': (23.0225, 72.5714),
    'aizawl': (23.7271, 92.7176),
    'amritsar': (31.6340, 74.8723),
    'bengaluru': (12.9716, 77.5946),
    'bhopal': (23.2599, 77.4126),
    'bhubaneswar': (20.2961, 85.8245),
    'chandigarh': (30.7333, 76.7794),
    'chennai': (13.0827, 80.2707),
    'coimbatore': (11.0168, 76.9558),
    'dehradun': (30.3165, 78.0322),
    'delhi': (28.6139, 77.2090),
    'gangtok': (27.3389, 88.6065),
    'gurugram': (28.4595, 77.0266),
    'guwahati': (26.1445, 91.7362),
    'hyderabad': (17.3850, 78.4867),
    'imphal': (24.8170, 93.9368),
    'indore': (22.7196, 75.8577),
    'itanagar': (27.0844, 93.6053),
    'jaipur': (26.9124, 75.7873),
    'jammu': (32.7266, 74.8570),
    'kochi': (9.9312, 76.2673),
    'kohima': (25.6751, 94.1086),
    'kolkata': (22.5726, 88.3639),
    'lucknow': (26.8467, 80.9462),
    'madurai': (9.9252, 78.1198),
    'mangaluru': (12.9141, 74.8560),
    'mumbai': (19.0760, 72.8777),
    'mysuru': (12.2958, 76.6394),
    'nagpur': (21.1458, 79.0882),
    'noida': (28.5355, 77.3910),
    'panaji': (15.4909, 73.8278),
    'patna': (25.5941, 85.1376),
    'pune': (18.5204, 73.8567),
    'raipur': (21.2514, 81.6296),
    'ranchi': (23.3441, 85.3096),
    'shillong': (25.5788, 91.8933),
    'siliguri': (26.7271, 88.3953),
    'srinagar': (34.0837, 74.7973),
    'surat': (21.1702, 72.8311),
    'thiruvananthapuram': (8.5241, 76.9366),
    'tiruchirappalli': (10.7905, 78.7047),
    'vijayawada': (16.5062, 80.6480),
    'visakhapatnam': (17.6868, 83.2185),
}

EMERGENCY_NUMBERS = EmergencyNumbersResponse(
    numbers={
        'national_emergency': EmergencyNumber(service='112', coverage='Pan-India', notes='Unified emergency response'),
        'ambulance': EmergencyNumber(service='108', coverage='Most states', notes='Ambulance and medical emergency'),
        'police': EmergencyNumber(service='100', coverage='Pan-India', notes='Police control room'),
        'fire': EmergencyNumber(service='101', coverage='Pan-India', notes='Fire and rescue'),
        'women_helpline': EmergencyNumber(service='1091', coverage='Pan-India', notes='Women safety helpline'),
        'road_accident': EmergencyNumber(service='1033', coverage='National highways', notes='NHAI emergency helpline'),
    }
)


class EmergencyLocatorService:
    def __init__(self, *, settings: Settings, cache: CacheHelper, overpass_service: OverpassService) -> None:
        self.settings = settings
        self.cache = cache
        self.overpass_service = overpass_service

    def parse_categories(self, categories: str | Iterable[str] | None) -> list[str]:
        if categories is None:
            return ['hospital', 'police', 'ambulance', 'towing']
        if isinstance(categories, str):
            requested = [part.strip().lower() for part in categories.split(',') if part.strip()]
        else:
            requested = [str(part).strip().lower() for part in categories if str(part).strip()]
        normalized = [category for category in requested if category in SUPPORTED_CATEGORIES]
        return normalized or ['hospital', 'police', 'ambulance', 'towing']

    def build_radius_steps(self, radius: int | None = None) -> list[int]:
        if radius is None:
            return list(self.settings.emergency_radius_steps)
        capped = min(int(radius), self.settings.max_radius)
        steps = [step for step in self.settings.emergency_radius_steps if step <= capped]
        if not steps or steps[-1] != capped:
            steps.append(capped)
        return steps

    async def find_nearby(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        categories: str | Iterable[str] | None,
        radius: int | None = None,
        limit: int = 20,
    ) -> EmergencyResponse:
        parsed_categories = self.parse_categories(categories)
        radius_steps = self.build_radius_steps(radius)
        cache_key = (
            f'emergency:nearby:{lat:.4f}:{lon:.4f}:{",".join(parsed_categories)}:'
            f'{radius_steps[-1]}:{limit}'
        )
        cached = await self.cache.get_json(cache_key)
        if cached:
            return EmergencyResponse.model_validate(cached)

        response = await self._find_nearby_uncached(
            db=db,
            lat=lat,
            lon=lon,
            categories=parsed_categories,
            radius_steps=radius_steps,
            limit=limit,
        )
        await self.cache.set_json(cache_key, response.model_dump(mode='json'), self.settings.cache_ttl_seconds)
        return response

    async def build_sos_payload(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
    ) -> SosResponse:
        nearby = await self.find_nearby(
            db=db,
            lat=lat,
            lon=lon,
            categories=['hospital', 'police', 'ambulance'],
            radius=self.settings.default_radius,
            limit=8,
        )
        return SosResponse(
            services=nearby.services,
            count=nearby.count,
            radius_used=nearby.radius_used,
            source=nearby.source,
            numbers=EMERGENCY_NUMBERS.numbers,
        )

    async def build_city_bundle(self, *, db: AsyncSession, city: str) -> dict:
        lookup_key = city.strip().lower()
        cache_key = f'offline:bundle:{lookup_key}'
        cached = await self.cache.get_json(cache_key)
        if cached:
            return cached
        center = CITY_CENTERS.get(lookup_key)
        if center is None:
            raise ServiceValidationError(f'Unknown offline bundle city: {city}')
        lat, lon = center
        categories = ['hospital', 'police', 'ambulance', 'fire', 'towing', 'pharmacy']
        database_items = await self._query_database(
            db=db,
            lat=lat,
            lon=lon,
            categories=categories,
            radius_meters=self.settings.max_radius,
            limit=150,
        )
        services = list(database_items)
        source = 'database'

        if len(services) < 75:
            try:
                fallback = await self.overpass_service.search_services(
                    lat=lat,
                    lon=lon,
                    radius=self.settings.max_radius,
                    categories=categories,
                    limit=150,
                )
            except ExternalServiceError:
                fallback = []
            if fallback:
                services = self._merge_results(services, fallback, 150)
                source = 'database+overpass' if database_items else 'overpass'

        bundle = {
            'city': city,
            'center': {'lat': lat, 'lon': lon},
            'services': [item.model_dump(mode='json') for item in services],
            'numbers': EMERGENCY_NUMBERS.model_dump(mode='json')['numbers'],
            'source': source,
        }
        await self.cache.set_json(cache_key, bundle, self.settings.cache_ttl_seconds)
        bundle_path = self.settings.offline_bundle_dir / f'{lookup_key}.json'
        bundle_path.write_text(json.dumps(bundle, indent=2), encoding='utf-8')
        return bundle

    async def _find_nearby_uncached(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        categories: list[str],
        radius_steps: list[int],
        limit: int,
    ) -> EmergencyResponse:
        best: list[EmergencyServiceItem] = []
        best_radius = radius_steps[-1]
        source = 'database'

        for step in radius_steps:
            best = await self._query_database(
                db=db,
                lat=lat,
                lon=lon,
                categories=categories,
                radius_meters=step,
                limit=limit,
            )
            best_radius = step
            if len(best) >= self.settings.emergency_min_results:
                break

        if len(best) < self.settings.emergency_min_results:
            try:
                fallback = await self.overpass_service.search_services(
                    lat=lat,
                    lon=lon,
                    radius=best_radius,
                    categories=categories,
                    limit=limit,
                )
            except ExternalServiceError:
                fallback = []
                if not best:
                    raise
            best = self._merge_results(best, fallback, limit)
            if fallback:
                source = 'database+overpass' if best else 'overpass'
            else:
                source = 'database' if best else source
        elif best:
            source = 'database'

        return EmergencyResponse(
            services=best,
            count=len(best),
            radius_used=best_radius,
            source=source,
        )

    async def _query_database(
        self,
        *,
        db: AsyncSession,
        lat: float,
        lon: float,
        categories: list[str],
        radius_meters: int,
        limit: int,
    ) -> list[EmergencyServiceItem]:
        point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        point_geography = cast(point, Geography)
        service_geography = cast(EmergencyService.location, Geography)
        distance_expr = func.ST_Distance(service_geography, point_geography).label('distance_meters')
        lat_expr = func.ST_Y(EmergencyService.location).label('lat')
        lon_expr = func.ST_X(EmergencyService.location).label('lon')

        stmt = (
            select(EmergencyService, lat_expr, lon_expr, distance_expr)
            .where(EmergencyService.category.in_(categories))
            .where(func.ST_DWithin(service_geography, point_geography, radius_meters))
            .order_by(EmergencyService.has_trauma.desc(), EmergencyService.is_24hr.desc(), distance_expr.asc())
            .limit(limit)
        )

        rows = (await db.execute(stmt)).all()
        items: list[EmergencyServiceItem] = []
        for service, item_lat, item_lon, distance in rows:
            items.append(
                EmergencyServiceItem(
                    id=str(service.id),
                    name=service.name,
                    category=service.category,
                    sub_category=service.sub_category,
                    phone=service.phone,
                    phone_emergency=service.phone_emergency,
                    lat=float(item_lat),
                    lon=float(item_lon),
                    distance_meters=float(distance),
                    has_trauma=service.has_trauma,
                    has_icu=service.has_icu,
                    is_24hr=service.is_24hr,
                    address=service.address,
                    source=service.source,
                )
            )
        return items

    @staticmethod
    def _merge_results(
        database_items: list[EmergencyServiceItem],
        fallback_items: list[EmergencyServiceItem],
        limit: int,
    ) -> list[EmergencyServiceItem]:
        merged: list[EmergencyServiceItem] = list(database_items)
        seen = {
            (
                item.name.strip().lower(),
                item.category,
                round(item.lat, 4),
                round(item.lon, 4),
            )
            for item in database_items
        }
        for item in fallback_items:
            key = (item.name.strip().lower(), item.category, round(item.lat, 4), round(item.lon, 4))
            if key in seen:
                continue
            seen.add(key)
            merged.append(item)
            if len(merged) >= limit:
                break
        merged.sort(key=lambda item: (0 if item.has_trauma else 1, 0 if item.is_24hr else 1, item.distance_meters))
        return merged[:limit]
