import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tracking", tags=["Tracking"])

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
        logger.info(f"Client joined tracking group {group_id}. Total local: {len(self.active_connections[group_id])}")

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
                # Stop pubsub listener
                if group_id in self.pubsub_tasks:
                    self.pubsub_tasks[group_id].cancel()
                    del self.pubsub_tasks[group_id]
            logger.info(f"Client left tracking group {group_id}.")

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
                except Exception as e:
                    logger.error(f"Error sending message to client: {e}")
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
        except Exception as e:
            logger.error(f"PubSub error for {group_id}: {e}")

manager = RedisConnectionManager()

@router.websocket("/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    """
    Enterprise WebSocket endpoint for live GPS polling (Family Tracking).
    Uses Redis Pub/Sub to scale horizontally across multiple instances on Render/Vercel.
    """
    # Lazily inject redis on first connection
    if not manager.redis and hasattr(websocket.app.state, "cache"):
        manager.set_redis(websocket.app.state.cache._client)

    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                await manager.broadcast(payload, group_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
