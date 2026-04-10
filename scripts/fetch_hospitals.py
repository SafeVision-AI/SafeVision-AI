from __future__ import annotations

from _overpass_utils import ROOT_DIR, build_arg_parser, build_india_query, fetch_elements, normalize_row, write_rows


DEFAULT_OUTPUT = ROOT_DIR / 'chatbot_service' / 'data' / 'hospitals' / 'hospital_directory.csv'
SELECTORS = [
    'node["amenity"~"hospital|clinic"](area.searchArea);',
    'way["amenity"~"hospital|clinic"](area.searchArea);',
    'relation["amenity"~"hospital|clinic"](area.searchArea);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India hospital and clinic data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, default_type='hospital', fallback_name='Unnamed hospital')) is not None
    ]
    count = write_rows(args.output, rows)
    print(f'Saved {count} hospital records to {args.output}')


if __name__ == '__main__':
    main()
