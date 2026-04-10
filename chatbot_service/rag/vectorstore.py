from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from rag.document_loader import LoadedDocument, load_documents
from rag.embeddings import normalize_text, score_query


@dataclass(slots=True)
class DocumentChunk:
    chunk_id: str
    source: str
    title: str
    category: str
    content: str


class LocalVectorStore:
    def __init__(self, persist_dir: Path, data_dir: Path) -> None:
        self.persist_dir = persist_dir
        self.data_dir = data_dir
        self.index_path = persist_dir / 'simple_index.json'
        self._chunks: list[DocumentChunk] = []

    def ensure_index(self) -> list[DocumentChunk]:
        if self._chunks:
            return self._chunks
        if self.index_path.exists():
            raw = json.loads(self.index_path.read_text(encoding='utf-8'))
            self._chunks = [DocumentChunk(**item) for item in raw]
            return self._chunks
        return self.build_index(force=True)

    def build_index(self, *, force: bool = False) -> list[DocumentChunk]:
        if self._chunks and not force:
            return self._chunks
        documents = load_documents(self.data_dir)
        chunks: list[DocumentChunk] = []
        for document in documents:
            chunks.extend(self._chunk_document(document))
        self._chunks = chunks
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.index_path.write_text(
            json.dumps([asdict(chunk) for chunk in chunks], ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        return self._chunks

    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        scopes: set[str] | None = None,
    ) -> list[tuple[DocumentChunk, float]]:
        chunks = self.ensure_index()
        scored: list[tuple[DocumentChunk, float]] = []
        for chunk in chunks:
            if scopes and chunk.category not in scopes:
                continue
            score = score_query(query, chunk.content)
            if score > 0:
                scored.append((chunk, score))
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[:top_k]

    def stats(self) -> dict[str, int]:
        chunks = self.ensure_index()
        categories = {chunk.category for chunk in chunks}
        return {'chunks': len(chunks), 'categories': len(categories)}

    @staticmethod
    def _chunk_document(document: LoadedDocument) -> list[DocumentChunk]:
        paragraphs = [normalize_text(item) for item in document.text.split('\n') if normalize_text(item)]
        if not paragraphs:
            paragraphs = [document.text]
        chunks: list[DocumentChunk] = []
        current: list[str] = []
        current_length = 0
        chunk_index = 1
        for paragraph in paragraphs:
            if current and current_length + len(paragraph) > 900:
                chunks.append(
                    DocumentChunk(
                        chunk_id=f'{document.source}:{chunk_index}',
                        source=document.source,
                        title=document.title,
                        category=document.category,
                        content='\n'.join(current),
                    )
                )
                chunk_index += 1
                current = []
                current_length = 0
            current.append(paragraph)
            current_length += len(paragraph)
        if current:
            chunks.append(
                DocumentChunk(
                    chunk_id=f'{document.source}:{chunk_index}',
                    source=document.source,
                    title=document.title,
                    category=document.category,
                    content='\n'.join(current),
                )
            )
        return chunks
