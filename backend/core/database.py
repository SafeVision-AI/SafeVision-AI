from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()

# NOTE: Use `prepared_statement_cache_size=0` (not `statement_cache_size`) in
# the DATABASE_URL query string — that is the correct SQLAlchemy asyncpg
# dialect parameter for Supabase's transaction pooler.
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout_seconds,
    pool_recycle=settings.db_pool_recycle_seconds,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        yield session


# Alias used by live_tracking and other routers
get_async_session = get_db


async def check_database() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text('SELECT 1'))
        return True
    except Exception:
        return False
