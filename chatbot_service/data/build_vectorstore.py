from __future__ import annotations

from config import get_settings
from rag.vectorstore import LocalVectorStore


def main() -> None:
    settings = get_settings()
    vectorstore = LocalVectorStore(settings.chroma_persist_dir, settings.rag_data_dir)
    vectorstore.build_index(force=True)
    print(vectorstore.stats())


if __name__ == '__main__':
    main()
