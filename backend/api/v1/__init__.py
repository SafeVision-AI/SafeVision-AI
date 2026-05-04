from __future__ import annotations

from fastapi import APIRouter

from api.v1.chat import router as chat_router
from api.v1.challan import router as challan_router
from api.v1.emergency import router as emergency_router
from api.v1.geocode import router as geocode_router
from api.v1.offline import router as offline_router
from api.v1.roadwatch import router as roadwatch_router
from api.v1.routing import router as routing_router
from api.v1.user import router as user_router
from api.v1.tracking import router as tracking_router
from api.v1.auth import router as auth_router
from api.v1.live_tracking import router as live_tracking_router
from api.v1.waze_feed import router as waze_feed_router


api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(challan_router)
api_router.include_router(emergency_router)
api_router.include_router(roadwatch_router)
api_router.include_router(geocode_router)
api_router.include_router(offline_router)
api_router.include_router(routing_router)
api_router.include_router(user_router)
api_router.include_router(tracking_router)
api_router.include_router(auth_router)
api_router.include_router(live_tracking_router)
api_router.include_router(waze_feed_router)

