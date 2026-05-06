from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path

from rag.document_loader import LoadedDocument, load_documents
from rag.embeddings import LocalHashEmbeddingFunction, normalize_text, score_query

try:
    import chromadb
except Exception:  # pragma: no cover - exercised only when optional dependency is unavailable
    chromadb = None

logger = logging.getLogger(__name__)


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
        self._embedding_function = LocalHashEmbeddingFunction()
        self._collection = None

    def ensure_index(self) -> list[DocumentChunk]:
        if self._chunks:
            return self._chunks

        collection = self._get_collection()
        if collection is not None:
            try:
                if collection.count() > 0:
                    if self.index_path.exists():
                        raw = json.loads(self.index_path.read_text(encoding='utf-8'))
                        self._chunks = [DocumentChunk(**item) for item in raw]
                        return self._chunks
            except Exception as exc:
                logger.warning('Unable to read Chroma collection metadata: %s', exc)

        if self.index_path.exists():
            raw = json.loads(self.index_path.read_text(encoding='utf-8'))
            self._chunks = [DocumentChunk(**item) for item in raw]
            if collection is not None:
                self._upsert_chroma(collection, self._chunks)
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
        collection = self._get_collection()
        if collection is not None:
            self._upsert_chroma(collection, chunks)
        return self._chunks

    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        scopes: set[str] | None = None,
    ) -> list[tuple[DocumentChunk, float]]:
        chunks = self.ensure_index()
        chroma_results = self._search_chroma(query, top_k=top_k, scopes=scopes)
        if chroma_results:
            return chroma_results

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
        chroma_chunks = 0
        collection = self._get_collection()
        if collection is not None:
            try:
                chroma_chunks = collection.count()
            except Exception as exc:
                logger.warning('Unable to count Chroma chunks: %s', exc)
        return {'chunks': len(chunks), 'categories': len(categories), 'chroma_chunks': chroma_chunks}

    def _get_collection(self):
        if chromadb is None:
            return None
        if self._collection is not None:
            return self._collection
        try:
            self.persist_dir.mkdir(parents=True, exist_ok=True)
            client = chromadb.PersistentClient(path=str(self.persist_dir))
            self._collection = client.get_or_create_collection(
                name='safevixai_rag',
                embedding_function=self._embedding_function,
                metadata={'hnsw:space': 'cosine'},
            )
            return self._collection
        except Exception as exc:
            logger.warning('ChromaDB unavailable, using lexical retrieval fallback: %s', exc)
            return None

    @staticmethod
    def _metadata(chunk: DocumentChunk) -> dict[str, str]:
        return {
            'source': chunk.source,
            'title': chunk.title,
            'category': chunk.category,
        }

    def _upsert_chroma(self, collection, chunks: list[DocumentChunk]) -> None:
        if not chunks:
            return
        try:
            collection.upsert(
                ids=[chunk.chunk_id for chunk in chunks],
                documents=[chunk.content for chunk in chunks],
                metadatas=[self._metadata(chunk) for chunk in chunks],
            )
        except Exception as exc:
            logger.warning('Unable to upsert RAG chunks into ChromaDB: %s', exc)

    def _search_chroma(
        self,
        query: str,
        *,
        top_k: int,
        scopes: set[str] | None,
    ) -> list[tuple[DocumentChunk, float]]:
        collection = self._get_collection()
        if collection is None:
            return []
        try:
            where = {'category': {'$in': sorted(scopes)}} if scopes else None
            kwargs = {
                'query_texts': [query],
                'n_results': max(1, top_k),
                'include': ['documents', 'metadatas', 'distances'],
            }
            if where is not None:
                kwargs['where'] = where
            results = collection.query(**kwargs)
        except Exception as exc:
            logger.warning('ChromaDB query failed, using lexical retrieval fallback: %s', exc)
            return []

        ids = (results.get('ids') or [[]])[0]
        documents = (results.get('documents') or [[]])[0]
        metadatas = (results.get('metadatas') or [[]])[0]
        distances = (results.get('distances') or [[]])[0]

        matches: list[tuple[DocumentChunk, float]] = []
        for chunk_id, content, metadata, distance in zip(ids, documents, metadatas, distances):
            metadata = metadata or {}
            chunk = DocumentChunk(
                chunk_id=chunk_id,
                source=str(metadata.get('source') or 'unknown'),
                title=str(metadata.get('title') or 'SafeVixAI Knowledge Base'),
                category=str(metadata.get('category') or 'general'),
                content=content or '',
            )
            score = 1.0 / (1.0 + float(distance or 0.0))
            matches.append((chunk, score))
        return matches

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
