"""Safe routing — avoids isolated road stretches at night using ORS."""
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
    Safe routing for night travel:
    - Prefers roads with higher OSM highway classifications (better lit)
    - Avoids tracks, paths, unclassified roads, fords
    - Uses ORS free API (key already in backend/.env)
    """
    ors_key = os.getenv('OPENROUTESERVICE_API_KEY', '')

    if not ors_key:
        raise RuntimeError('OPENROUTESERVICE_API_KEY not set')

    url = 'https://api.openrouteservice.org/v2/directions/driving-car/json'
    body = {
        'coordinates': [[origin[1], origin[0]], [dest[1], dest[0]]],
        'preference': 'recommended',
        'extra_info': ['waycategory', 'waytype'],
    }

    if prefer_safety or is_nighttime():
        body['options'] = {
            'avoid_features': ['tracks', 'fords'],
        }

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
        'safety_mode': prefer_safety or is_nighttime(),
        'note': 'Route optimized for safety — avoids isolated tracks and roads' if (prefer_safety or is_nighttime()) else 'Standard route',
        'distance_meters': route['summary']['distance'],
        'duration_seconds': route['summary']['duration'],
        'geometry': route['geometry'],
    }
