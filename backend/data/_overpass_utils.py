from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / 'backend'

DEFAULT_ENDPOINTS = (
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
)
DEFAULT_HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    'User-Agent': 'SafeVisionAI backend data fetcher/1.0',
}
CSV_COLUMNS = [
    'name',
    'lat',
    'lon',
    'phone',
    'address',
    'city',
    'state',
    'operator',
    'osm_id',
    'osm_type',
    'category',
    'opening_hours',
    'website',
    'email',
    'postcode',
    'source',
]


def build_arg_parser(description: str, default_output: Path) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        '--output',
        type=Path,
        default=default_output,
        help=f'CSV path to write. Defaults to {default_output}',
    )
    parser.add_argument(
        '--endpoint',
        help='Optional Overpass endpoint override. Defaults to the built-in endpoint fallback list.',
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=180,
        help='HTTP timeout in seconds. Defaults to 180.',
    )
    parser.add_argument(
        '--retries',
        type=int,
        default=2,
        help='Retries per endpoint before failing over. Defaults to 2.',
    )
    return parser


def build_india_query(selectors: Iterable[str], *, timeout: int) -> str:
    joined = '\n  '.join(selector.strip() for selector in selectors if selector.strip())
    return (
        f'[out:json][timeout:{timeout}];\n'
        'area["ISO3166-1"="IN"][admin_level=2]->.india;\n'
        '(\n'
        f'  {joined}\n'
        ');\n'
        'out center tags;'
    )


def fetch_elements(
    query: str,
    *,
    endpoint: str | None,
    timeout: int,
    retries: int,
) -> list[dict]:
    payload = urllib.parse.urlencode({'data': query}).encode('utf-8')
    endpoints = [endpoint] if endpoint else list(DEFAULT_ENDPOINTS)
    last_error: Exception | None = None

    for url in endpoints:
        for attempt in range(1, retries + 1):
            request = urllib.request.Request(url, data=payload, headers=DEFAULT_HEADERS, method='POST')
            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    decoded = response.read().decode('utf-8')
                data = json.loads(decoded)
                return list(data.get('elements', []))
            except Exception as exc:  # pragma: no cover - network path
                last_error = exc
                if attempt < retries:
                    time.sleep(min(attempt, 3))

    raise SystemExit(f'Unable to fetch data from Overpass. Last error: {last_error}')


def extract_point(element: dict) -> tuple[float | None, float | None]:
    if 'lat' in element and 'lon' in element:
        return float(element['lat']), float(element['lon'])

    center = element.get('center') or {}
    if 'lat' in center and 'lon' in center:
        return float(center['lat']), float(center['lon'])

    return None, None


def first_non_empty(*values: str | None) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ''


def compose_address(tags: dict[str, str]) -> str:
    return first_non_empty(
        tags.get('addr:full'),
        ', '.join(
            part
            for part in [
                tags.get('addr:housenumber'),
                tags.get('addr:street'),
                tags.get('addr:suburb'),
                first_non_empty(tags.get('addr:city'), tags.get('addr:town'), tags.get('addr:village')),
                first_non_empty(tags.get('addr:district'), tags.get('addr:county')),
                tags.get('addr:state'),
                tags.get('addr:postcode'),
            ]
            if part
        ),
    )


def normalize_row(element: dict, *, default_category: str, fallback_name: str) -> dict | None:
    lat, lon = extract_point(element)
    if lat is None or lon is None:
        return None

    tags = element.get('tags', {})
    return {
        'name': first_non_empty(tags.get('name'), fallback_name),
        'lat': f'{lat:.6f}',
        'lon': f'{lon:.6f}',
        'phone': first_non_empty(tags.get('phone'), tags.get('contact:phone'), tags.get('emergency:phone')),
        'address': compose_address(tags),
        'city': first_non_empty(tags.get('addr:city'), tags.get('addr:town'), tags.get('addr:village')),
        'state': first_non_empty(tags.get('addr:state')),
        'operator': first_non_empty(tags.get('operator')),
        'osm_id': str(element.get('id', '')),
        'osm_type': str(element.get('type', '')),
        'category': first_non_empty(
            tags.get('amenity'),
            tags.get('healthcare'),
            tags.get('office'),
            tags.get('emergency'),
            default_category,
        ),
        'opening_hours': first_non_empty(tags.get('opening_hours')),
        'website': first_non_empty(tags.get('website'), tags.get('contact:website')),
        'email': first_non_empty(tags.get('email'), tags.get('contact:email')),
        'postcode': first_non_empty(tags.get('addr:postcode')),
        'source': 'overpass',
    }


def dedupe_rows(rows: Iterable[dict]) -> list[dict]:
    seen: set[tuple[str, str, str, str]] = set()
    deduped: list[dict] = []
    for row in rows:
        key = (
            row.get('name', '').strip().lower(),
            row.get('category', '').strip().lower(),
            row.get('lat', ''),
            row.get('lon', ''),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    deduped.sort(key=lambda item: (item.get('state', ''), item.get('city', ''), item.get('name', '')))
    return deduped


def write_rows(path: Path, rows: Iterable[dict]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    materialized = dedupe_rows(rows)
    with path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(materialized)
    return len(materialized)


def print_summary(*, label: str, count: int, output: Path) -> None:
    print(f'Saved {count} {label} records to {output}')
