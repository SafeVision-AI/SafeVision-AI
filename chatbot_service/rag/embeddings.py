from __future__ import annotations

import re


TOKEN_PATTERN = re.compile(r'[a-zA-Z][a-zA-Z0-9_]{1,}')


def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


def tokenize(value: str) -> set[str]:
    return {match.group(0).lower() for match in TOKEN_PATTERN.finditer(value)}


def score_query(query: str, text: str) -> float:
    query_tokens = tokenize(query)
    if not query_tokens:
        return 0.0
    text_tokens = tokenize(text)
    if not text_tokens:
        return 0.0
    overlap = len(query_tokens & text_tokens)
    phrase_bonus = 0.0
    lowered_query = normalize_text(query).lower()
    lowered_text = normalize_text(text).lower()
    if lowered_query and lowered_query in lowered_text:
        phrase_bonus = 1.5
    return overlap + phrase_bonus + min(len(lowered_text), 1200) / 5000
