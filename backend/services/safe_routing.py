"""Safe routing — avoids isolated road stretches at night using ORS or OSRM fallback."""
from __future__ import annotations

import os
from datetime import datetime

import httpx


def is_nighttime() -> bool:
    """Returns True between 8pm and 6am."""
    hour = datetime.now().hour
    return hour >= 20 or hour <= 6


async def get_safe_route(
    origin: tuple[float, float],    # (lat, lon)
    dest: tuple[float, float],       # (lat, lon)
    prefer_safety: bool = False,
) -> dict:
    """
    Safe routing for night travel.
    - Uses ORS when OPENROUTESERVICE_API_KEY is present (avoids tracks/fords).
    - Falls back gracefully to free OSRM when no ORS key is configured.
    """
    ors_key = os.getenv('OPENROUTESERVICE_API_KEY', '').strip()
    safety_mode = prefer_safety or is_nighttime()

    if ors_key:
        url = 'https://api.openrouteservice.org/v2/directions/driving-car/json'
        body: dict = {
            'coordinates': [[origin[1], origin[0]], [dest[1], dest[0]]],
            'preference': 'recommended',
            'extra_info': ['waycategory', 'waytype'],
        }
        if safety_mode:
            body['options'] = {'avoid_features': ['tracks', 'fords']}

        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                url,
                json=body,
                headers={'Authorization': ors_key, 'Content-Type': 'application/json'},
            )
            r.raise_for_status()
            data = r.json()

        route = data['routes'][0]
        return {
            'provider': 'ors_safe',
            'safety_mode': safety_mode,
            'note': (
                'Route optimized for safety — avoids isolated tracks and roads'
                if safety_mode else 'Standard ORS route'
            ),
            'distance_meters': route['summary']['distance'],
            'duration_seconds': route['summary']['duration'],
            'geometry': route['geometry'],
        }

    # ── OSRM free fallback (no API key required) ──────────────────────────────
    osrm_url = (
        f'https://router.project-osrm.org/route/v1/driving/'
        f'{origin[1]},{origin[0]};{dest[1]},{dest[0]}'
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            osrm_url,
            params={'overview': 'full', 'geometries': 'geojson', 'steps': 'false'},
        )
        r.raise_for_status()
        data = r.json()

    routes = data.get('routes') or []
    if not routes:
        raise RuntimeError('OSRM returned no route for the given coordinates.')

    route = routes[0]
    return {
        'provider': 'osrm_fallback',
        'safety_mode': safety_mode,
        'note': (
            'Safety routing unavailable without ORS key — using standard OSRM route.'
            if safety_mode else 'Standard OSRM route (no ORS key configured).'
        ),
        'distance_meters': route.get('distance', 0),
        'duration_seconds': route.get('duration', 0),
        'geometry': route.get('geometry', {}),
    }
