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


DEFAULT_OUTPUT = CHATBOT_SERVICE_DIR / 'data' / 'hospitals' / 'blood_bank_directory.csv'
SELECTORS = [
    'node["amenity"="blood_bank"](area.india);',
    'way["amenity"="blood_bank"](area.india);',
    'relation["amenity"="blood_bank"](area.india);',
    'node["healthcare"="blood_bank"](area.india);',
    'way["healthcare"="blood_bank"](area.india);',
    'relation["healthcare"="blood_bank"](area.india);',
    'node["blood_bank"="yes"](area.india);',
    'way["blood_bank"="yes"](area.india);',
    'relation["blood_bank"="yes"](area.india);',
]


def main() -> None:
    parser = build_arg_parser('Fetch India blood bank data from Overpass.', DEFAULT_OUTPUT)
    args = parser.parse_args()

    query = build_india_query(SELECTORS, timeout=args.timeout)
    elements = fetch_elements(query, endpoint=args.endpoint, timeout=args.timeout, retries=args.retries)
    rows = [
        row
        for element in elements
        if (row := normalize_row(element, fallback_name='Unnamed blood bank')) is not None
    ]
    count = write_rows(args.output, rows)
    print_summary(label='blood bank', count=count, output=args.output)


if __name__ == '__main__':
    main()
