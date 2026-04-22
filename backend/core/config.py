from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'SafeVixAI Backend'
    version: str = '1.0.0'
    environment: str = 'development'
    api_v1_prefix: str = '/api/v1'
    cors_origins_env: str = Field(default='*', validation_alias='CORS_ORIGINS')
    admin_secret: str | None = None

    database_url: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/safevixai'
    redis_url: str | None = None
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout_seconds: float = 30.0
    db_pool_recycle_seconds: int = 1800

    default_radius: int = 5000
    max_radius: int = 50000
    emergency_min_results: int = 3
    emergency_radius_steps_env: str = Field(
        default='500,1000,5000,10000,25000,50000',
        validation_alias='EMERGENCY_RADIUS_STEPS',
    )
    cache_ttl_seconds: int = 3600
    geocode_cache_ttl_seconds: int = 86400
    authority_cache_ttl_seconds: int = 3600
    route_cache_ttl_seconds: int = 900

    overpass_url: str = 'https://overpass-api.de/api/interpreter'
    overpass_urls_env: str | None = Field(default=None, validation_alias='OVERPASS_URLS')
    photon_url: str = 'https://photon.komoot.io'
    nominatim_url: str = 'https://nominatim.openstreetmap.org'
    openrouteservice_base_url: str = 'https://api.openrouteservice.org'
    openrouteservice_api_key: str | None = None
    http_user_agent: str = 'SafeVixAI/1.0'
    request_timeout_seconds: float = 20.0
    upstream_retry_attempts: int = 2
    upstream_retry_backoff_seconds: float = 1.5
    data_gov_api_key: str | None = None

    chatbot_mode: str = 'external_service'
    chatbot_ready: bool = False
    chatbot_service_url: str = 'http://localhost:8010'
    chatbot_request_timeout_seconds: float = 20.0

    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1] / 'data')
    upload_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1] / 'data' / 'uploads')
    offline_bundle_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[1] / 'data' / 'offline_bundles')
    local_upload_base_url: str | None = None
    max_upload_bytes: int = 5 * 1024 * 1024
    allowed_upload_content_types_env: str = Field(
        default='image/jpeg,image/png,image/webp',
        validation_alias='ALLOWED_UPLOAD_CONTENT_TYPES',
    )

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore',
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> list[str]:
        value = self.cors_origins_env
        if value is None or value == '':
            return ['*']
        if value.strip() == '*':
            if self.environment == 'production':
                import logging
                logging.getLogger(__name__).warning(
                    'CORS_ORIGINS=* in production — set it to your frontend URL in Render env vars.'
                )
            return ['*']
        return [item.strip() for item in value.split(',') if item.strip()]

    @field_validator('database_url', mode='before')
    @classmethod
    def normalize_database_url(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError('database_url must be a string')
        normalized = value.strip()
        if normalized.startswith('postgres://'):
            normalized = normalized.replace('postgres://', 'postgresql://', 1)
        if normalized.startswith('postgresql://'):
            normalized = normalized.replace('postgresql://', 'postgresql+asyncpg://', 1)
        return normalized

    @property
    def emergency_radius_steps(self) -> list[int]:
        return [int(item.strip()) for item in self.emergency_radius_steps_env.split(',') if item.strip()]

    @property
    def overpass_urls(self) -> list[str]:
        value = self.overpass_urls_env
        if value is None or not value.strip():
            return [self.overpass_url]
        urls = [item.strip() for item in value.split(',') if item.strip()]
        return urls or [self.overpass_url]

    @property
    def allowed_upload_content_types(self) -> list[str]:
        value = self.allowed_upload_content_types_env
        if value is None or value == '':
            return ['image/jpeg', 'image/png', 'image/webp']
        return [item.strip().lower() for item in value.split(',') if item.strip()]

    @field_validator('local_upload_base_url', mode='before')
    @classmethod
    def normalize_upload_base_url(cls, value: Any) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError('local_upload_base_url must be a string')
        normalized = value.strip()
        if not normalized:
            return None
        if normalized.startswith('LOCAL_UPLOAD_BASE_URL='):
            normalized = normalized.split('=', 1)[1].strip()
        return normalized.rstrip('/')

    @field_validator('openrouteservice_base_url', mode='before')
    @classmethod
    def normalize_openrouteservice_base_url(cls, value: Any) -> str:
        if value is None:
            return 'https://api.openrouteservice.org'
        if not isinstance(value, str):
            raise ValueError('openrouteservice_base_url must be a string')
        normalized = value.strip()
        if not normalized:
            return 'https://api.openrouteservice.org'
        return normalized.rstrip('/')

    @field_validator('offline_bundle_dir', mode='before')
    @classmethod
    def normalize_offline_bundle_dir(cls, value: Any) -> Path:
        default = Path(__file__).resolve().parents[1] / 'data' / 'offline_bundles'
        if value is None:
            return default
        if isinstance(value, Path):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return default
            return Path(normalized)
        raise ValueError('offline_bundle_dir must be a path-like string')

    @field_validator('chatbot_service_url', mode='before')
    @classmethod
    def normalize_chatbot_service_url(cls, value: Any) -> str:
        if value is None:
            return 'http://localhost:8010'
        if not isinstance(value, str):
            raise ValueError('chatbot_service_url must be a string')
        normalized = value.strip()
        if not normalized:
            return 'http://localhost:8010'
        return normalized.rstrip('/')


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    try:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        settings.offline_bundle_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
    return settings
