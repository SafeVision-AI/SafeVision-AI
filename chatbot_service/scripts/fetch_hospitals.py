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


DEFAULT_OUTPUT = CHATBOT_SERVICE_DIR / 'data' / 'hospitals' / 'hospital_directory.csv'
SELECTORS = [
    'node["amenity"~"hospital|clinic"](area.india);',
    'way["amenity"~"hospital|clinic"](area.india);',
    'relation["amenity"~"hospital|clinic"](area.india);',
    'node["healthcare"~"hospital|clinic"](area.india);',
    'way["healthcare"~"hospital|clinic"](area.india);',
    'relation["healthcare"~"hospital|clinic"](area.india);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India hospital and clinic data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout, retries=args.retries)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, default_category='hospital', fallback_name='Unnamed hospital')) is not None
    ]
    count = write_rows(args.output, rows)
    print_summary(label='hospital', count=count, output=args.output)


if __name__ == '__main__':
    main()
