from __future__ import annotations

from dataclasses import dataclass

from rag.vectorstore import LocalVectorStore


@dataclass(slots=True)
class RetrievalResult:
    source: str
    title: str
    category: str
    content: str
    score: float


class Retriever:
    def __init__(self, vectorstore: LocalVectorStore, *, default_top_k: int = 5) -> None:
        self.vectorstore = vectorstore
        self.default_top_k = default_top_k

    def retrieve(
        self,
        query: str,
        *,
        top_k: int | None = None,
        scopes: set[str] | None = None,
    ) -> list[RetrievalResult]:
        matches = self.vectorstore.search(query, top_k=top_k or self.default_top_k, scopes=scopes)
        return [
            RetrievalResult(
                source=chunk.source,
                title=chunk.title,
                category=chunk.category,
                content=chunk.content,
                score=score,
            )
            for chunk, score in matches
        ]
