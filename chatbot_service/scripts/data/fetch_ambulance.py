from __future__ import annotations

from _overpass_utils import (
    CHATBOT_SERVICE_DIR,
    build_arg_parser,
    build_india_query,
    fetch_elements,
    normalize_row,
    print_summary,
    write_rows,
)


DEFAULT_OUTPUT = CHATBOT_SERVICE_DIR / 'data' / 'emergency' / 'ambulance_stations.csv'
SELECTORS = [
    'node["emergency"="ambulance_station"](area.india);',
    'way["emergency"="ambulance_station"](area.india);',
    'relation["emergency"="ambulance_station"](area.india);',
    'node["amenity"="ambulance_station"](area.india);',
    'way["amenity"="ambulance_station"](area.india);',
    'relation["amenity"="ambulance_station"](area.india);',
    'node["healthcare"="ambulance_station"](area.india);',
    'way["healthcare"="ambulance_station"](area.india);',
    'relation["healthcare"="ambulance_station"](area.india);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India ambulance station data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout, retries=args.retries)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, fallback_name='Unnamed ambulance station')) is not None
    ]
    count = write_rows(args.output, rows)
    print_summary(label='ambulance station', count=count, output=args.output)


if __name__ == '__main__':
    main()
