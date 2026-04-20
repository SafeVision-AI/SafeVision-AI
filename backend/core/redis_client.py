from __future__ import annotations

import json
import time
from typing import Any

from redis.asyncio import Redis


class CacheHelper:
    def __init__(self, client: Redis | None = None) -> None:
        self._client = client
        self._memory_store: dict[str, tuple[float | None, str]] = {}
        self._redis_healthy = client is not None

    @property
    def enabled(self) -> bool:
        return True

    @property
    def backend_name(self) -> str:
        if self._client is None:
            return 'memory'
        return 'redis' if self._redis_healthy else 'redis+memory'

    def _memory_get(self, key: str) -> str | None:
        entry = self._memory_store.get(key)
        if entry is None:
            return None
        expires_at, payload = entry
        if expires_at is not None and expires_at <= time.monotonic():
            self._memory_store.pop(key, None)
            return None
        return payload

    def _memory_set(self, key: str, payload: str, ttl_seconds: int | None = None) -> None:
        expires_at = None if ttl_seconds is None else time.monotonic() + ttl_seconds
        self._memory_store[key] = (expires_at, payload)

    def _memory_delete(self, key: str) -> None:
        self._memory_store.pop(key, None)

    async def get_json(self, key: str) -> Any | None:
        payload = None
        if self._client:
            try:
                payload = await self._client.get(key)
                self._redis_healthy = True
            except Exception:
                self._redis_healthy = False
                payload = None
        if payload is None:
            payload = self._memory_get(key)
        if payload is None:
            return None
        if isinstance(payload, bytes):
            payload = payload.decode('utf-8')
        return json.loads(payload)

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        payload = json.dumps(value, default=str)
        self._memory_set(key, payload, ttl_seconds)
        if not self._client:
            return
        try:
            await self._client.setex(key, ttl_seconds, payload)
            self._redis_healthy = True
        except Exception:
            self._redis_healthy = False
            return

    async def delete(self, key: str) -> None:
        self._memory_delete(key)
        if not self._client:
            return
        try:
            await self._client.delete(key)
            self._redis_healthy = True
        except Exception:
            self._redis_healthy = False
            return

    async def increment(self, key: str) -> int | None:
        current = await self.get_int(key, default=0) + 1
        self._memory_set(key, str(current))
        if not self._client:
            return current
        try:
            current = int(await self._client.incr(key))
            self._redis_healthy = True
            self._memory_set(key, str(current))
            return current
        except Exception:
            self._redis_healthy = False
            return current

    async def get_int(self, key: str, default: int = 0) -> int:
        value = None
        if self._client:
            try:
                value = await self._client.get(key)
                self._redis_healthy = True
            except Exception:
                self._redis_healthy = False
                value = None
        if value is None:
            value = self._memory_get(key)
        if value is None:
            return default
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    async def ping(self) -> bool:
        if not self._client:
            return True
        try:
            await self._client.ping()
            self._redis_healthy = True
            return True
        except Exception:
            self._redis_healthy = False
            return False

    async def close(self) -> None:
        if not self._client:
            return
        try:
            await self._client.aclose()
            self._redis_healthy = False
        except Exception:
            return


def create_cache(redis_url: str | None) -> CacheHelper:
    if not redis_url:
        return CacheHelper()
    return CacheHelper(Redis.from_url(redis_url, encoding='utf-8', decode_responses=True))
