from __future__ import annotations

from _overpass_utils import ROOT_DIR, build_arg_parser, build_india_query, fetch_elements, normalize_row, write_rows


DEFAULT_OUTPUT = ROOT_DIR / 'chatbot_service' / 'data' / 'emergency' / 'fire_stations.csv'
SELECTORS = [
    'node["amenity"="fire_station"](area.searchArea);',
    'way["amenity"="fire_station"](area.searchArea);',
    'relation["amenity"="fire_station"](area.searchArea);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India fire station data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, default_type='fire_station', fallback_name='Unnamed fire station')) is not None
    ]
    count = write_rows(args.output, rows)
    print(f'Saved {count} fire station records to {args.output}')


if __name__ == '__main__':
    main()
