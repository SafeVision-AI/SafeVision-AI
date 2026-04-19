"""
prepare_road_sources.py
=======================
Pre-processes local road data files that have only lat/lon point geometry
into LineString-based GeoJSON files that import_road_infrastructure.py can
actually import into the road_infrastructure PostGIS table.

Sources handled:
  1. chatbot_service/data/roads/toll_plazas.csv
       → backend/datasets/roads/toll_plazas_linestring.geojson
  2. backend/datasets/accidents/blackspot_seed.csv  (if present)
       → backend/datasets/roads/blackspot_linestring.geojson

Each point is expanded into a tiny 0.001-degree stub LineString so it
satisfies the LINESTRING geometry constraint while preserving the location.

Usage:
    cd backend/
    python scripts/prepare_road_sources.py
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # SafeVisionAI/backend/
CHATBOT_DATA = ROOT.parent / "chatbot_service" / "data"
OUT_DIR = ROOT / "datasets" / "roads"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def point_to_stub_linestring(lat: float, lon: float, delta: float = 0.001) -> dict:
    """Return a GeoJSON geometry that is a tiny LineString centred on the point."""
    return {
        "type": "LineString",
        "coordinates": [
            [lon - delta / 2, lat],
            [lon + delta / 2, lat],
        ],
    }


# ---------------------------------------------------------------------------
# 1.  Toll Plazas
# ---------------------------------------------------------------------------
def convert_toll_plazas() -> Path:
    src = CHATBOT_DATA / "roads" / "toll_plazas.csv"
    out = OUT_DIR / "toll_plazas_linestring.geojson"

    if not src.exists():
        print(f"[SKIP] toll_plazas.csv not found at {src}")
        return out

    features = []
    skipped = 0
    with src.open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            try:
                lat = float(row["lat"])
                lon = float(row["lon"])
            except (KeyError, ValueError):
                skipped += 1
                continue

            props = {
                "road_id":       f"toll-{row.get('id', len(features)+1)}",
                "road_name":     row.get("name", ""),
                "road_type":     "toll_plaza",
                "road_number":   row.get("id", ""),
                "state_code":    "IN",
                "contractor_name": row.get("contractor_name", ""),
                "project_source": "NHAI Toll Plazas — geohacker/toll-plazas-india",
                "data_source_url":
                    "https://github.com/geohacker/toll-plazas-india",
            }
            features.append({
                "type": "Feature",
                "geometry": point_to_stub_linestring(lat, lon),
                "properties": props,
            })

    fc = {"type": "FeatureCollection", "features": features}
    out.write_text(json.dumps(fc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Toll plazas: {len(features)} features -> {out.relative_to(ROOT)}"
          + (f"  ({skipped} skipped)" if skipped else ""))
    return out


# ---------------------------------------------------------------------------
# 2.  Blackspot seed CSV  (backend/datasets/accidents/blackspot_seed.csv)
# ---------------------------------------------------------------------------
def convert_blackspots() -> Path | None:
    src = ROOT / "datasets" / "accidents" / "blackspot_seed.csv"
    out = OUT_DIR / "blackspot_linestring.geojson"

    if not src.exists():
        print(f"[SKIP] blackspot_seed.csv not found at {src}")
        return None

    features = []
    skipped = 0
    with src.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        cols = reader.fieldnames or []
        lat_col = next((c for c in cols if c.lower() in ("lat", "latitude")), None)
        lon_col = next((c for c in cols if c.lower() in ("lon", "longitude")), None)
        if not lat_col or not lon_col:
            print(f"[SKIP] blackspot_seed.csv has no lat/lon columns (found: {cols})")
            return None

        for idx, row in enumerate(reader, start=1):
            try:
                lat = float(row[lat_col])
                lon = float(row[lon_col])
            except ValueError:
                skipped += 1
                continue

            props = {
                "road_id":        f"blackspot-{row.get('id', idx)}",
                "road_name":      row.get("location", row.get("road_name", "")),
                "road_type":      "blackspot",
                "state_code":     row.get("state_code", "IN"),
                "project_source": "MoRTH Blackspot Seed Data",
                "data_source_url":
                    "https://morth.nic.in/road-accident-black-spot",
            }
            features.append({
                "type": "Feature",
                "geometry": point_to_stub_linestring(lat, lon),
                "properties": props,
            })

    fc = {"type": "FeatureCollection", "features": features}
    out.write_text(json.dumps(fc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Blackspots:  {len(features)} features -> {out.relative_to(ROOT)}"
          + (f"  ({skipped} skipped)" if skipped else ""))
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=== prepare_road_sources.py ===")
    toll_out  = convert_toll_plazas()
    bs_out    = convert_blackspots()

    # Write a ready-to-use manifest for import_official_road_sources.py
    sources = []

    # Source 1: PMGSY rural roads (GeoJSON LineStrings — direct import, no conversion needed)
    pmgsy_path = CHATBOT_DATA / "roads" / "pmgsy_roads.geojson"
    if pmgsy_path.exists():
        sources.append({
            "name": "pmgsy_rural_roads",
            "path": str(pmgsy_path.resolve()),
            "format": "json",
            "default_state_code": "IN",
            "default_project_source": "PMGSY GeoSadak — datameet/pmgsy-geosadak",
            "default_data_source_url": "https://github.com/datameet/pmgsy-geosadak",
        })
        print(f"[OK] PMGSY source added ({pmgsy_path.name})")
    else:
        print(f"[SKIP] PMGSY not found at {pmgsy_path}")

    # Source 2: Toll plazas (converted to LineString)
    sources.append({
        "name": "nhai_toll_plazas",
        "path": str(toll_out.resolve()),
        "format": "json",
        "default_state_code": "IN",
        "default_project_source": "NHAI Toll Plazas — geohacker/toll-plazas-india",
        "default_data_source_url": "https://github.com/geohacker/toll-plazas-india",
    })

    # Source 3: Blackspots (if converted)
    if bs_out and bs_out.exists():
        sources.append({
            "name": "morth_blackspots",
            "path": str(bs_out.resolve()),
            "format": "json",
            "default_state_code": "IN",
            "default_project_source": "MoRTH Accident Blackspots",
            "default_data_source_url": "https://morth.nic.in/road-accident-black-spot",
        })

    manifest_path = ROOT / "scripts" / "road_sources.json"
    manifest_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[OK] Manifest written: {manifest_path.relative_to(ROOT)}")
    print(f"     Contains {len(sources)} source(s)")
    print("\nNow run:")
    print(f"  python scripts/import_official_road_sources.py --manifest scripts/road_sources.json")
