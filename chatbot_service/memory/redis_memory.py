from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from redis.asyncio import Redis


class ConversationMemoryStore:
    def __init__(self, redis_url: str | None, *, session_ttl_seconds: int = 86400) -> None:
        self._client = Redis.from_url(redis_url, encoding='utf-8', decode_responses=True) if redis_url else None
        self._memory: dict[str, list[dict[str, Any]]] = {}
        self._redis_healthy = self._client is not None
        self._session_ttl_seconds = session_ttl_seconds

    @property
    def backend_name(self) -> str:
        if self._client is None:
            return 'memory'
        return 'redis' if self._redis_healthy else 'redis+memory'

    async def append_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload = {
            'role': role,
            'content': content,
            'metadata': metadata or {},
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        self._memory.setdefault(session_id, []).append(payload)
        if self._client is not None:
            try:
                await self._client.rpush(self._key(session_id), json.dumps(payload))
                await self._client.expire(self._key(session_id), self._session_ttl_seconds)
                self._redis_healthy = True
            except Exception:
                self._redis_healthy = False
        return payload

    async def get_history(self, session_id: str, *, limit: int = 20) -> list[dict[str, Any]]:
        if self._client is not None:
            try:
                items = await self._client.lrange(self._key(session_id), -limit, -1)
                self._redis_healthy = True
                if items:
                    return [json.loads(item) for item in items]
            except Exception:
                self._redis_healthy = False
        history = self._memory.get(session_id, [])
        return history[-limit:]

    async def clear_session(self, session_id: str) -> None:
        self._memory.pop(session_id, None)
        if self._client is not None:
            try:
                await self._client.delete(self._key(session_id))
                self._redis_healthy = True
            except Exception:
                self._redis_healthy = False

    async def ping(self) -> bool:
        if self._client is None:
            return True  # in-memory fallback is always available
        try:
            await self._client.ping()
            self._redis_healthy = True
            return True
        except Exception:
            self._redis_healthy = False
            return False  # Redis is genuinely unreachable

    async def close(self) -> None:
        if self._client is None:
            return
        try:
            await self._client.aclose()
            self._redis_healthy = False
        except Exception:
            return

    @staticmethod
    def _key(session_id: str) -> str:
        return f'chat:session:{session_id}'
