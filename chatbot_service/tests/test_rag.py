from __future__ import annotations

from pathlib import Path

from rag.retriever import Retriever
from rag.vectorstore import LocalVectorStore


def test_retriever_returns_legal_context_from_repo_data(tmp_path: Path):
    data_dir = Path(__file__).resolve().parents[1] / 'data'
    store = LocalVectorStore(tmp_path / 'index', data_dir)
    retriever = Retriever(store, default_top_k=3)

    results = retriever.retrieve('motor vehicles act helmet fine', scopes={'legal'})

    assert results
    assert any('legal/' in item.source for item in results)
