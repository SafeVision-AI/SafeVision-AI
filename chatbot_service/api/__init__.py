from fastapi import APIRouter

from api.admin import router as admin_router
from api.chat import router as chat_router


api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(admin_router)

__all__ = ['api_router']
