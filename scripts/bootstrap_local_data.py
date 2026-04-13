from __future__ import annotations

import argparse
from io import BytesIO
import json
import math
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / 'backend'
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from data.seed_violations import (  # noqa: E402
    DEFAULT_RULES,
    OVERRIDE_COLUMNS,
    RULE_COLUMNS,
    _load_override_rows,
    _load_rule_rows,
    _rule_to_row,
    _write_csv,
)
from services.local_emergency_catalog import load_local_emergency_catalog  # noqa: E402


CHATBOT_DATA_DIR = PROJECT_ROOT / 'chatbot_service' / 'data'
FRONTEND_OFFLINE_DIR = PROJECT_ROOT / 'frontend' / 'public' / 'offline-data'
BACKEND_CHALLAN_DIR = PROJECT_ROOT / 'backend' / 'datasets' / 'challan'
ROADS_DIR = CHATBOT_DATA_DIR / 'roads'

OFFLINE_CITY_CENTERS: dict[str, tuple[float, float]] = {
    'chennai': (13.0827, 80.2707),
    'coimbatore': (11.0168, 76.9558),
    'madurai': (9.9252, 78.1198),
    'thiruvananthapuram': (8.5241, 76.9366),
    'kochi': (9.9312, 76.2673),
    'bengaluru': (12.9716, 77.5946),
    'mumbai': (19.0760, 72.8777),
    'pune': (18.5204, 73.8567),
    'nagpur': (21.1458, 79.0882),
    'hyderabad': (17.3850, 78.4867),
    'delhi': (28.6139, 77.2090),
    'jaipur': (26.9124, 75.7873),
    'ahmedabad': (23.0225, 72.5714),
    'surat': (21.1702, 72.8311),
    'vadodara': (22.3072, 73.1812),
    'kolkata': (22.5726, 88.3639),
    'patna': (25.5941, 85.1376),
    'bhopal': (23.2599, 77.4126),
    'indore': (22.7196, 75.8577),
    'lucknow': (26.8467, 80.9462),
    'agra': (27.1767, 78.0081),
    'varanasi': (25.3176, 82.9739),
    'chandigarh': (30.7333, 76.7794),
    'visakhapatnam': (17.6868, 83.2185),
    'bhubaneswar': (20.2961, 85.8245),
}
CITY_RADIUS_METERS = 80_000


def sync_challan_assets() -> None:
    rules_source = CHATBOT_DATA_DIR / 'violations_seed.csv'
    overrides_source = CHATBOT_DATA_DIR / 'state_overrides.csv'
    rule_map = {rule.violation_code: _rule_to_row(rule) for rule in DEFAULT_RULES}
    if rules_source.exists():
        for row in _load_rule_rows(rules_source):
            rule_map[row['violation_code']] = row
    override_rows = _load_override_rows(overrides_source) if overrides_source.exists() else []

    sorted_rules = [rule_map[key] for key in sorted(rule_map)]
    sorted_overrides = sorted(
        override_rows,
        key=lambda row: (row['state_code'], row['violation_code'], row['vehicle_class']),
    )

    BACKEND_CHALLAN_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_OFFLINE_DIR.mkdir(parents=True, exist_ok=True)
    _write_csv(BACKEND_CHALLAN_DIR / 'violations.csv', RULE_COLUMNS, sorted_rules)
    _write_csv(BACKEND_CHALLAN_DIR / 'state_overrides.csv', OVERRIDE_COLUMNS, sorted_overrides)
    _write_csv(FRONTEND_OFFLINE_DIR / 'violations.csv', RULE_COLUMNS, sorted_rules)
    _write_csv(FRONTEND_OFFLINE_DIR / 'state_overrides.csv', OVERRIDE_COLUMNS, sorted_overrides)
    print(f'Challan assets synced: rules={len(sorted_rules)} overrides={len(sorted_overrides)}')


def sync_first_aid_bundle() -> None:
    source = FRONTEND_OFFLINE_DIR / 'first-aid.json'
    target = CHATBOT_DATA_DIR / 'first_aid.json'
    if source.exists() and not target.exists():
        shutil.copyfile(source, target)
        print(f'Copied first aid bundle to {target}')


def build_emergency_geojson() -> None:
    catalog = load_local_emergency_catalog(PROJECT_ROOT)
    features = []
    for entry in catalog:
        city, distance = _nearest_city(entry.lat, entry.lon)
        if city is None or distance > CITY_RADIUS_METERS:
            continue
        features.append(
            {
                'type': 'Feature',
                'id': entry.id,
                'geometry': {'type': 'Point', 'coordinates': [entry.lon, entry.lat]},
                'properties': {
                    'city': city.title(),
                    'name': entry.name,
                    'category': entry.category,
                    'sub_category': entry.sub_category,
                    'phone': entry.phone,
                    'phone_emergency': entry.phone_emergency,
                    'address': entry.address,
                    'has_trauma': entry.has_trauma,
                    'has_icu': entry.has_icu,
                    'is_24hr': entry.is_24hr,
                    'source': entry.source,
                },
            }
        )

    payload = {
        'type': 'FeatureCollection',
        'properties': {
            'generated_from': 'chatbot_service/data local CSV catalog',
            'feature_count': len(features),
            'cities': [city.title() for city in OFFLINE_CITY_CENTERS],
        },
        'features': features,
    }
    output_path = FRONTEND_OFFLINE_DIR / 'india-emergency.geojson'
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Emergency GeoJSON written: features={len(features)} path={output_path}')


def export_pmgsy_geojson() -> None:
    source = ROADS_DIR / 'pmgsy-geosadak-master.zip'
    target = ROADS_DIR / 'pmgsy_roads.geojson'
    if not source.exists():
        print('PMGSY archive not found; skipping pmgsy_roads.geojson export')
        return

    try:
        import geopandas as gpd
        import pandas as pd
    except Exception:
        print('geopandas/pandas are not installed in the active Python; skipping pmgsy_roads.geojson export')
        return

    frames = []
    with zipfile.ZipFile(source) as outer, tempfile.TemporaryDirectory() as tmp_dir_name:
        tmp_dir = Path(tmp_dir_name)
        for member in sorted(name for name in outer.namelist() if name.endswith('.zip') and '/Road_DRRP/' in name):
            if member.endswith('-split.zip'):
                continue
            state_name = Path(member).stem
            inner_dir = tmp_dir / state_name
            inner_dir.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(BytesIO(outer.read(member))) as inner:
                inner.extractall(inner_dir)
            shp_files = list(inner_dir.glob('*.shp'))
            if not shp_files:
                continue
            frame = gpd.read_file(shp_files[0])
            frame['pmgsy_state'] = state_name
            frames.append(frame)

    if not frames:
        print('No PMGSY shapefiles could be extracted; skipping pmgsy_roads.geojson export')
        return

    merged = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), geometry='geometry', crs=frames[0].crs)
    merged.to_file(target, driver='GeoJSON')
    print(f'PMGSY GeoJSON exported: rows={len(merged)} path={target}')


def export_national_highways_csv() -> None:
    target = ROADS_DIR / 'national_highways.csv'
    if target.exists() and target.stat().st_size > 0:
        print(f'National highways CSV already present: {target}')
        return

    candidates = sorted(
        path for path in ROADS_DIR.glob('*.csv')
        if path.name != target.name and any(token in path.stem.lower() for token in ('nh', 'highway', 'nhai'))
    )
    if not candidates:
        print('No local national-highway source file found in chatbot_service/data/roads; skipping national_highways.csv export')
        return

    shutil.copyfile(candidates[0], target)
    print(f'National highways CSV copied from {candidates[0].name} to {target}')


def _nearest_city(lat: float, lon: float) -> tuple[str | None, float]:
    best_city = None
    best_distance = float('inf')
    for city, (city_lat, city_lon) in OFFLINE_CITY_CENTERS.items():
        distance = _distance_meters(lat, lon, city_lat, city_lon)
        if distance < best_distance:
            best_city = city
            best_distance = distance
    return best_city, best_distance


def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def main() -> None:
    parser = argparse.ArgumentParser(description='Build app-facing assets from chatbot_service/data local datasets.')
    parser.add_argument('--skip-pmgsy', action='store_true', help='Skip extracting PMGSY shapefiles into GeoJSON.')
    args = parser.parse_args()

    sync_challan_assets()
    sync_first_aid_bundle()
    build_emergency_geojson()
    export_national_highways_csv()
    if not args.skip_pmgsy:
        export_pmgsy_geojson()


if __name__ == '__main__':
    main()
