from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tracking", tags=["Tracking"])

# In an enterprise multi-worker deployment, this in-memory store should be backed by Redis Pub/Sub.
# For the scope of this hackathon, an in-memory connection manager handles real-time broadcasting.
class ConnectionManager:
    def __init__(self):
        # group_id -> set of active websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = set()
        self.active_connections[group_id].add(websocket)
        logger.info(f"Client joined tracking group {group_id}. Total: {len(self.active_connections[group_id])}")

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
            logger.info(f"Client left tracking group {group_id}.")

    async def broadcast(self, message: dict, group_id: str):
        if group_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to client: {e}")
                    disconnected.add(connection)
            
            # Clean up dead connections
            for conn in disconnected:
                self.disconnect(conn, group_id)

manager = ConnectionManager()

@router.websocket("/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    """
    WebSocket endpoint for live GPS polling (Family Tracking).
    Clients connect to a specific group_id (e.g., a family code or incident UUID).
    Whenever a client sends their coordinates, it is broadcast to everyone else in the group.
    """
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting a JSON payload with { "user_id": "...", "lat": ..., "lon": ... }
            try:
                payload = json.loads(data)
                # Broadcast the location update to the rest of the group
                await manager.broadcast(payload, group_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
