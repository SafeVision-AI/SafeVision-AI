from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class LocalEmergencyEntry:
    id: str
    name: str
    category: str
    lat: float
    lon: float
    phone: str | None = None
    phone_emergency: str | None = None
    sub_category: str | None = None
    address: str | None = None
    has_trauma: bool = False
    has_icu: bool = False
    is_24hr: bool = True
    source: str = 'local_csv'


def load_local_emergency_catalog(project_root: Path) -> list[LocalEmergencyEntry]:
    chatbot_data_dir = project_root / 'chatbot_service' / 'data'
    catalog: list[LocalEmergencyEntry] = []
    catalog.extend(_load_hospital_directory(chatbot_data_dir / 'hospitals' / 'hospital_directory.csv'))
    catalog.extend(_load_nin_facilities(chatbot_data_dir / 'hospitals' / 'nin-health-facilities.csv'))
    emergency_dir = chatbot_data_dir / 'emergency'
    if emergency_dir.exists():
        for path in sorted(emergency_dir.glob('*.csv')):
            catalog.extend(_load_generic_emergency_csv(path))
    return catalog


def _load_hospital_directory(path: Path) -> list[LocalEmergencyEntry]:
    if not path.exists():
        return []
    entries: list[LocalEmergencyEntry] = []
    with path.open('r', encoding='utf-8-sig', errors='ignore', newline='') as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader, start=1):
            lat_lon = _parse_coordinate_pair(row.get('Location_Coordinates'))
            if lat_lon is None:
                continue
            lat, lon = lat_lon
            name = (row.get('Hospital_Name') or '').strip()
            if not name:
                continue
            entries.append(
                LocalEmergencyEntry(
                    id=f'hospital_directory:{index}',
                    name=name,
                    category='hospital',
                    lat=lat,
                    lon=lon,
                    phone=_pick_first(
                        row,
                        'Emergency_Num',
                        'Ambulance_Phone_No',
                        'Telephone',
                        'Mobile_Number',
                        'Helpline',
                        'Tollfree',
                    ),
                    phone_emergency=_pick_first(row, 'Emergency_Num', 'Ambulance_Phone_No', 'Helpline'),
                    sub_category=_pick_first(row, 'Hospital_Care_Type', 'Hospital_Category'),
                    address=_join_address(
                        row.get('Address_Original_First_Line'),
                        row.get('Location'),
                        row.get('District'),
                        row.get('State'),
                        row.get('Pincode'),
                    ),
                    has_trauma=_contains_any(
                        row.get('Specialties'),
                        row.get('Facilities'),
                        row.get('Emergency_Services'),
                        keywords=('trauma', 'emergency', 'icu'),
                    ),
                    has_icu=_contains_any(row.get('Facilities'), row.get('Specialties'), keywords=('icu',)),
                    is_24hr=_contains_any(
                        row.get('Emergency_Services'),
                        row.get('Facilities'),
                        keywords=('24', 'emergency'),
                    ),
                    source='local:hospital_directory',
                )
            )
    return entries


def _load_nin_facilities(path: Path) -> list[LocalEmergencyEntry]:
    if not path.exists():
        return []
    entries: list[LocalEmergencyEntry] = []
    with path.open('r', encoding='utf-8-sig', errors='ignore', newline='') as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader, start=1):
            lat = _parse_float(row.get('latitude'))
            lon = _parse_float(row.get('longitude'))
            if lat is None or lon is None:
                continue
            name = (row.get('Health Facility Name') or '').strip()
            if not name:
                continue
            entries.append(
                LocalEmergencyEntry(
                    id=f'nin_facilities:{index}',
                    name=name,
                    category='hospital',
                    lat=lat,
                    lon=lon,
                    phone=_pick_first(row, 'landline_number'),
                    sub_category=_pick_first(row, 'Facility Type'),
                    address=_join_address(
                        row.get('Address'),
                        row.get('locality'),
                        row.get('District_Name'),
                        row.get('State_Name'),
                        row.get('pincode'),
                    ),
                    is_24hr=True,
                    source='local:nin_health_facilities',
                )
            )
    return entries


def _load_generic_emergency_csv(path: Path) -> list[LocalEmergencyEntry]:
    category = _guess_category(path)
    if category is None:
        return []
    entries: list[LocalEmergencyEntry] = []
    with path.open('r', encoding='utf-8-sig', errors='ignore', newline='') as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader, start=1):
            lat = _parse_float(row.get('lat') or row.get('latitude'))
            lon = _parse_float(row.get('lon') or row.get('longitude'))
            if lat is None or lon is None:
                coords = _parse_coordinate_pair(row.get('coordinates') or row.get('location_coordinates'))
                if coords is None:
                    continue
                lat, lon = coords
            name = _pick_first(row, 'name', 'title', 'station_name', 'hospital_name')
            if not name:
                continue
            entries.append(
                LocalEmergencyEntry(
                    id=f'{path.stem}:{index}',
                    name=name,
                    category=category,
                    lat=lat,
                    lon=lon,
                    phone=_pick_first(row, 'phone', 'telephone', 'mobile', 'mobile_number'),
                    phone_emergency=_pick_first(row, 'emergency_phone', 'phone_emergency', 'helpline'),
                    sub_category=_pick_first(row, 'sub_category', 'type'),
                    address=_join_address(
                        row.get('address'),
                        row.get('district'),
                        row.get('state'),
                        row.get('pincode'),
                    ),
                    is_24hr=_parse_bool(row.get('is_24hr'), default=True),
                    source=f'local:{path.stem}',
                )
            )
    return entries


def _pick_first(row: dict[str, str], *columns: str) -> str | None:
    for column in columns:
        value = row.get(column)
        if value and value.strip():
            return value.strip()
    return None


def _parse_coordinate_pair(value: str | None) -> tuple[float, float] | None:
    if not value:
        return None
    parts = [part.strip() for part in str(value).split(',')]
    if len(parts) < 2:
        return None
    lat = _parse_float(parts[0])
    lon = _parse_float(parts[1])
    if lat is None or lon is None:
        return None
    return lat, lon


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _parse_bool(value: str | None, *, default: bool) -> bool:
    if value is None:
        return default
    text = str(value).strip().lower()
    if not text:
        return default
    if text in {'1', 'true', 'yes', 'y'}:
        return True
    if text in {'0', 'false', 'no', 'n'}:
        return False
    return default


def _join_address(*parts: str | None) -> str | None:
    values = [str(part).strip() for part in parts if part and str(part).strip()]
    return ', '.join(values) if values else None


def _contains_any(*values: str | None, keywords: tuple[str, ...]) -> bool:
    haystack = ' '.join(str(value).lower() for value in values if value)
    return any(keyword in haystack for keyword in keywords)


def _guess_category(path: Path) -> str | None:
    stem = path.stem.lower()
    if 'police' in stem:
        return 'police'
    if 'fire' in stem:
        return 'fire'
    if 'ambulance' in stem:
        return 'ambulance'
    if 'towing' in stem:
        return 'towing'
    if 'pharmacy' in stem:
        return 'pharmacy'
    if 'hospital' in stem:
        return 'hospital'
    return None
