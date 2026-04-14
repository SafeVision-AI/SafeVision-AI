from __future__ import annotations

import argparse
import asyncio
import json
import os
import zipfile
from pathlib import Path
from typing import Any

import httpx

from core.config import get_settings
from scripts.import_road_infrastructure import (
    _load_records,
    _normalize_record,
    import_records,
)


def _resolve_manifest_path(path: str | None) -> Path:
    if path:
        return Path(path).resolve()
    return Path(__file__).resolve().with_name('road_sources.example.json')


def _pick_extract_member(source: dict[str, Any], archive: zipfile.ZipFile) -> str:
    configured = source.get('extract_member')
    if configured:
        return str(configured)

    candidates = [
        member
        for member in archive.namelist()
        if member.lower().endswith(('.csv', '.json', '.geojson'))
    ]
    if not candidates:
        raise ValueError(f'Archive for {source["name"]} does not contain CSV/JSON/GeoJSON data')
    return candidates[0]


async def _download_source(source: dict[str, Any], settings) -> Path:
    url = source.get('url')
    if not url:
        local_path = source.get('path')
        if not local_path:
            raise ValueError(f'Source "{source["name"]}" must define either "path" or "url"')
        return Path(local_path).resolve()

    headers = {'User-Agent': settings.http_user_agent}
    params = dict(source.get('query_params') or {})
    api_key_env = source.get('api_key_env')
    api_key_param = source.get('api_key_param')
    api_key_header = source.get('api_key_header')
    api_key = os.getenv(api_key_env) if api_key_env else settings.data_gov_api_key
    if api_key:
        if api_key_param:
            params[api_key_param] = api_key
        if api_key_header:
            headers[api_key_header] = api_key

    target_dir = settings.data_dir / 'official_downloads'
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f'{source["name"]}{Path(url).suffix or ".dat"}'

    async with httpx.AsyncClient(
        timeout=max(settings.request_timeout_seconds, 60),
        headers=headers,
        follow_redirects=True,
    ) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        target_path.write_bytes(response.content)
    return target_path


async def _materialize_source(source: dict[str, Any], settings) -> Path:
    downloaded = await _download_source(source, settings)
    if downloaded.suffix.lower() != '.zip':
        return downloaded

    with zipfile.ZipFile(downloaded) as archive:
        member = _pick_extract_member(source, archive)
        target_dir = settings.data_dir / 'official_downloads' / source['name']
        target_dir.mkdir(parents=True, exist_ok=True)
        archive.extract(member, path=target_dir)
        return (target_dir / member).resolve()


async def _import_source(source: dict[str, Any], settings) -> tuple[int, int]:
    input_path = await _materialize_source(source, settings)
    fmt = source.get('format', 'auto')
    raw_records = _load_records(input_path, fmt)

    records = []
    skipped = 0
    for index, raw_record in enumerate(raw_records, start=1):
        try:
            records.append(
                _normalize_record(
                    raw_record,
                    default_state_code=source.get('default_state_code'),
                    default_project_source=source.get('default_project_source') or source['name'],
                    default_data_source_url=source.get('default_data_source_url') or source.get('url'),
                    index=index,
                )
            )
        except Exception as exc:
            skipped += 1
            print(f'[{source["name"]}] Skipping row {index}: {exc}')

    imported = await import_records(records)
    return imported, skipped


async def main() -> None:
    parser = argparse.ArgumentParser(
        description='Download and import official road infrastructure datasets using a manifest file.',
    )
    parser.add_argument(
        '--manifest',
        help='Path to a JSON manifest describing official road datasets to import.',
    )
    args = parser.parse_args()

    settings = get_settings()
    manifest_path = _resolve_manifest_path(args.manifest)
    if not manifest_path.exists():
        raise SystemExit(f'Manifest not found: {manifest_path}')

    sources = json.loads(manifest_path.read_text(encoding='utf-8'))
    if not isinstance(sources, list):
        raise SystemExit('Manifest must contain a JSON array of source definitions')

    total_imported = 0
    total_skipped = 0
    for source in sources:
        imported, skipped = await _import_source(source, settings)
        total_imported += imported
        total_skipped += skipped
        print(f'[{source["name"]}] imported={imported} skipped={skipped}')

    print(f'Official road import complete. imported={total_imported} skipped={total_skipped}')


if __name__ == '__main__':
    asyncio.run(main())
