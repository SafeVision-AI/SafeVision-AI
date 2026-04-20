"""Fetches nearby safe public spaces using Overpass API with graceful fallback."""
from __future__ import annotations

import httpx

# Shared long-lived client — avoids creating a new TCP connection on every request
_CLIENT = httpx.AsyncClient(timeout=20.0)


async def get_safe_spaces(lat: float, lon: float, radius_m: int = 1000) -> dict:
    """
    Returns nearby safe spaces: restaurants, cafes, pharmacies, hospitals, police.
    Uses Overpass API — free, no key, real-time OSM data.
    Falls back to an empty list with a warning if all endpoints are rate-limited.
    """
    query = f"""
[out:json][timeout:15];
(
  node[amenity~"restaurant|cafe|pharmacy|hospital|police|fire_station"][name]
      (around:{radius_m},{lat},{lon});
  node[shop~"supermarket|convenience|medical|mall"][name]
      (around:{radius_m},{lat},{lon});
);
out body;
""".strip()

    endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
    ]

    last_error: str = ''
    for endpoint in endpoints:
        try:
            r = await _CLIENT.post(endpoint, data={'data': query})

            # Rate limit — try next mirror
            if r.status_code in (406, 429, 503):
                last_error = f'Rate limited by {endpoint} (HTTP {r.status_code})'
                continue

            # Any other HTTP error
            if r.status_code >= 400:
                last_error = f'HTTP {r.status_code} from {endpoint}'
                continue

            elements = r.json().get('elements', [])
            places = [
                {
                    'name': e['tags'].get('name', 'Unknown'),
                    'type': e['tags'].get('amenity', e['tags'].get('shop', 'place')),
                    'lat': e['lat'],
                    'lon': e['lon'],
                    'phone': e['tags'].get('phone') or e['tags'].get('contact:phone'),
                    'open_hours': e['tags'].get('opening_hours'),
                }
                for e in elements
                if 'lat' in e and 'lon' in e
            ]
            return {
                'places': places,
                'count': len(places),
                'radius_meters': radius_m,
                'source': 'openstreetmap',
            }

        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            logger.warning('Overpass API request failed: %s', exc)
            continue

    # All endpoints failed — return graceful empty response (never 500)
    return {
        'places': [],
        'count': 0,
        'radius_meters': radius_m,
        'source': 'openstreetmap',
        'warning': (
            'Safe spaces data temporarily unavailable '
            f'(Overpass API rate limit). Try again shortly.'
        ),
    }
