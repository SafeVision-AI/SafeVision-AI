import asyncio
from fastapi import APIRouter, Path, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging
from redis.asyncio import Redis
from jose import JWTError, jwt

from core.config import get_settings
from core.security import ALGORITHM, SECRET_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tracking", tags=["Tracking"])
MAX_TRACKING_MESSAGE_BYTES = 4096
MAX_TRACKING_GROUP_ID_LENGTH = 80


def _is_valid_location(value: object, *, minimum: float, maximum: float) -> bool:
    if value is None:
        return True
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return False
    return minimum <= numeric <= maximum


def _is_valid_tracking_payload(payload: object) -> bool:
    if not isinstance(payload, dict):
        return False
    lat = payload.get("lat", payload.get("latitude"))
    lon = payload.get("lon", payload.get("longitude"))
    return _is_valid_location(lat, minimum=-90, maximum=90) and _is_valid_location(lon, minimum=-180, maximum=180)


def _origin_allowed(origin: str | None) -> bool:
    settings = get_settings()
    allowed = settings.cors_origins
    if '*' in allowed:
        return settings.environment != 'production'
    return bool(origin and origin.rstrip('/') in {item.rstrip('/') for item in allowed})


def _is_valid_ws_token(token: str | None) -> bool:
    if not token:
        return False
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return bool(payload.get("sub"))
    except JWTError:
        return False

class RedisConnectionManager:
    def __init__(self):
        # group_id -> set of active websocket connections locally
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # group_id -> asyncio task handling pubsub
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}
        self.redis: Redis | None = None

    def set_redis(self, redis_client: Redis | None):
        self.redis = redis_client

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = set()
            # Start pubsub listener if redis is available
            if self.redis:
                task = asyncio.create_task(self._listen_to_pubsub(group_id))
                self.pubsub_tasks[group_id] = task

        self.active_connections[group_id].add(websocket)
        logger.info("Client joined tracking group %s. Total local: %s", group_id, len(self.active_connections[group_id]))

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
                # Stop pubsub listener
                if group_id in self.pubsub_tasks:
                    self.pubsub_tasks[group_id].cancel()
                    del self.pubsub_tasks[group_id]
            logger.info("Client left tracking group %s.", group_id)

    async def broadcast(self, message: dict, group_id: str):
        # If we have Redis, publish to the entire cluster
        if self.redis:
            await self.redis.publish(f"tracking:{group_id}", json.dumps(message))
        else:
            # Fallback to local memory broadcast if no Redis
            await self._local_broadcast(message, group_id)

    async def _local_broadcast(self, message: dict, group_id: str):
        if group_id in self.active_connections:
            disconnected = set()
            payload = json.dumps(message)
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    logger.exception("Error sending tracking update to client")
                    disconnected.add(connection)
            
            for conn in disconnected:
                self.disconnect(conn, group_id)

    async def _listen_to_pubsub(self, group_id: str):
        if not self.redis:
            return
        try:
            pubsub = self.redis.pubsub()
            await pubsub.subscribe(f"tracking:{group_id}")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    payload = json.loads(message["data"])
                    await self._local_broadcast(payload, group_id)
        except asyncio.CancelledError:
            if pubsub:
                await pubsub.unsubscribe(f"tracking:{group_id}")
                await pubsub.close()
        except Exception:
            logger.exception("PubSub error for tracking group %s", group_id)

manager = RedisConnectionManager()

@router.websocket("/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: str = Path(min_length=1, max_length=MAX_TRACKING_GROUP_ID_LENGTH, pattern=r"^[A-Za-z0-9_-]+$"),
):
    """
    Enterprise WebSocket endpoint for live GPS polling (Family Tracking).
    Uses Redis Pub/Sub to scale horizontally across multiple instances on Render/Vercel.
    """
    if not _origin_allowed(websocket.headers.get("origin")):
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    if not _is_valid_ws_token(websocket.query_params.get("token")):
        await websocket.close(code=1008, reason="Authentication required")
        return

    # Lazily inject redis on first connection
    if not manager.redis and hasattr(websocket.app.state, "cache"):
        manager.set_redis(websocket.app.state.cache._client)

    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            if len(data.encode("utf-8")) > MAX_TRACKING_MESSAGE_BYTES:
                await websocket.close(code=1009, reason="Message too large")
                return
            try:
                payload = json.loads(data)
                if not _is_valid_tracking_payload(payload):
                    await websocket.send_json({"type": "error", "message": "Invalid tracking payload"})
                    continue
                await manager.broadcast(payload, group_id)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
