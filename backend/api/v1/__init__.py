from __future__ import annotations

from fastapi import APIRouter

from api.v1.emergency import router as emergency_router
from api.v1.geocode import router as geocode_router
from api.v1.offline import router as offline_router
from api.v1.roadwatch import router as roadwatch_router
from api.v1.routing import router as routing_router


api_router = APIRouter()
api_router.include_router(emergency_router)
api_router.include_router(roadwatch_router)
api_router.include_router(geocode_router)
api_router.include_router(offline_router)
api_router.include_router(routing_router)
