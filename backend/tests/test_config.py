from __future__ import annotations

from core.config import Settings


def test_settings_normalize_supabase_database_url():
    settings = Settings(
        database_url='postgresql://postgres:secret@db.example.supabase.co:5432/postgres',
    )

    assert settings.database_url.startswith('postgresql+asyncpg://')


def test_settings_normalize_local_upload_base_url():
    settings = Settings(
        local_upload_base_url='LOCAL_UPLOAD_BASE_URL=http://localhost:8000/uploads',
    )

    assert settings.local_upload_base_url == 'http://localhost:8000/uploads'


def test_settings_parse_overpass_urls():
    settings = Settings(
        _env_file=None,
        OVERPASS_URLS='https://a.example/api, https://b.example/api',
    )

    assert settings.overpass_urls == ['https://a.example/api', 'https://b.example/api']


def test_settings_blank_offline_bundle_dir_uses_default():
    settings = Settings(
        _env_file=None,
        offline_bundle_dir='',
    )

    assert settings.offline_bundle_dir.name == 'offline_bundles'
