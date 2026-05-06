from __future__ import annotations

import re
import math
import hashlib


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


def hash_embedding(value: str, *, dimensions: int = 384) -> list[float]:
    """Deterministic local embedding used for both Chroma ingestion and retrieval."""
    vector = [0.0] * dimensions
    for token in tokenize(value):
        index = int(hashlib.sha256(token.encode('utf-8')).hexdigest()[:8], 16) % dimensions
        vector[index] += 1.0
    norm = math.sqrt(sum(item * item for item in vector))
    if norm == 0:
        return vector
    return [item / norm for item in vector]


class LocalHashEmbeddingFunction:
    def __init__(self, dimensions: int = 384) -> None:
        self.dimensions = dimensions

    def __call__(self, input: list[str]) -> list[list[float]]:
        return [hash_embedding(item, dimensions=self.dimensions) for item in input]

    @staticmethod
    def name() -> str:
        return 'safevixai-local-hash'

    @staticmethod
    def build_from_config(config: dict[str, int]) -> 'LocalHashEmbeddingFunction':
        return LocalHashEmbeddingFunction(dimensions=int(config.get('dimensions', 384)))

    def get_config(self) -> dict[str, int]:
        return {'dimensions': self.dimensions}

    def default_space(self) -> str:
        return 'cosine'

    def supported_spaces(self) -> list[str]:
        return ['cosine']

    def is_legacy(self) -> bool:
        return False
