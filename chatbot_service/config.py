from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / '.env')


def _split_csv(value: str | None, *, default: list[str]) -> list[str]:
    if value is None or not value.strip():
        return default
    return [item.strip() for item in value.split(',') if item.strip()]


def _as_path(value: str | None, *, default: Path) -> Path:
    if value is None or not value.strip():
        return default
    path = Path(value.strip())
    if not path.is_absolute():
        path = ROOT_DIR / path
    return path


@dataclass(frozen=True, slots=True)
class Settings:
    environment: str
    service_name: str
    service_port: int
    cors_origins: list[str]
    main_backend_base_url: str
    main_backend_timeout_seconds: float
    redis_url: str | None
    chroma_persist_dir: Path
    rag_data_dir: Path
    embedding_model: str
    top_k_retrieval: int
    default_llm_provider: str
    default_llm_model: str
    openweather_api_key: str | None
    openweather_base_url: str
    openweather_units: str
    http_timeout_seconds: float
    http_user_agent: str
    session_ttl_seconds: int


@lru_cache
def get_settings() -> Settings:
    settings = Settings(
        environment=os.getenv('ENVIRONMENT', 'development'),
        service_name=os.getenv('CHATBOT_SERVICE_NAME', 'SafeVisionAI Chatbot Service'),
        service_port=int(os.getenv('CHATBOT_SERVICE_PORT', '8010')),
        cors_origins=_split_csv(
            os.getenv('CORS_ORIGINS'),
            default=[
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ],
        ),
        main_backend_base_url=os.getenv('MAIN_BACKEND_BASE_URL', 'http://localhost:8000').rstrip('/'),
        main_backend_timeout_seconds=float(os.getenv('MAIN_BACKEND_TIMEOUT_SECONDS', '20')),
        redis_url=os.getenv('REDIS_URL') or None,
        chroma_persist_dir=_as_path(
            os.getenv('CHROMA_PERSIST_DIR'),
            default=ROOT_DIR / 'data' / 'chroma_db',
        ),
        rag_data_dir=_as_path(
            os.getenv('RAG_DATA_DIR'),
            default=ROOT_DIR / 'data',
        ),
        embedding_model=os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),
        top_k_retrieval=int(os.getenv('TOP_K_RETRIEVAL', '5')),
        default_llm_provider=os.getenv('DEFAULT_LLM_PROVIDER', 'template').strip().lower(),
        default_llm_model=os.getenv('DEFAULT_LLM_MODEL', 'deterministic-rag'),
        openweather_api_key=os.getenv('OPENWEATHER_API_KEY') or None,
        openweather_base_url=os.getenv('OPENWEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5').rstrip('/'),
        openweather_units=os.getenv('OPENWEATHER_UNITS', 'metric'),
        http_timeout_seconds=float(os.getenv('HTTP_TIMEOUT_SECONDS', '20')),
        http_user_agent=os.getenv('HTTP_USER_AGENT', 'SafeVisionAIChatbot/1.0'),
        session_ttl_seconds=int(os.getenv('SESSION_TTL_SECONDS', '86400')),
    )
    settings.chroma_persist_dir.mkdir(parents=True, exist_ok=True)
    settings.rag_data_dir.mkdir(parents=True, exist_ok=True)
    return settings
