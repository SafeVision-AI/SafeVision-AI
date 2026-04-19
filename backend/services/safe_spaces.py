"""Fetches nearby safe public spaces using Overpass API."""
from __future__ import annotations

import httpx

async def get_safe_spaces(lat: float, lon: float, radius_m: int = 1000) -> list[dict]:
    """
    Returns nearby safe spaces: restaurants, cafes, pharmacies, hospitals, police.
    Uses Overpass API — free, no key, real-time OSM data.
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

    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': query},
        )
        r.raise_for_status()
        elements = r.json().get('elements', [])

    return [
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
