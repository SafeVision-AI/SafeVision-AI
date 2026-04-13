from __future__ import annotations

from _overpass_utils import (
    BACKEND_DIR,
    build_arg_parser,
    build_india_query,
    fetch_elements,
    normalize_row,
    print_summary,
    write_rows,
)


DEFAULT_OUTPUT = BACKEND_DIR / 'datasets' / 'emergency' / 'fire_stations.csv'
SELECTORS = [
    'node["amenity"="fire_station"](area.india);',
    'way["amenity"="fire_station"](area.india);',
    'relation["amenity"="fire_station"](area.india);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India fire station data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout, retries=args.retries)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, default_category='fire_station', fallback_name='Unnamed fire station')) is not None
    ]
    count = write_rows(args.output, rows)
    print_summary(label='fire service', count=count, output=args.output)


if __name__ == '__main__':
    main()
