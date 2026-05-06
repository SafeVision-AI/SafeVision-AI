from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.v1 import api_router
from core.config import get_settings
from core.database import check_database
from core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.redis_client import create_cache
from models.schemas import HealthResponse
from services.authority_router import AuthorityRouter
from services.challan_service import ChallanService
from services.emergency_locator import EmergencyLocatorService
from services.geocoding_service import GeocodingService
from services.llm_service import LLMService
from services.overpass_service import OverpassService
from services.roadwatch_service import RoadWatchService
from services.routing_service import RoutingService


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        cache = create_cache(settings.redis_url)
        overpass_service = OverpassService(settings)
        geocoding_service = GeocodingService(settings, cache)
        authority_router = AuthorityRouter(settings, overpass_service, cache)
        emergency_service = EmergencyLocatorService(settings=settings, cache=cache, overpass_service=overpass_service)
        routing_service = RoutingService(settings=settings, cache=cache)
        challan_service = ChallanService(settings=settings)
        llm_service = LLMService(settings=settings)
        roadwatch_service = RoadWatchService(
            settings=settings,
            cache=cache,
            geocoding_service=geocoding_service,
            authority_router=authority_router,
        )

        app.state.cache = cache
        app.state.overpass_service = overpass_service
        app.state.geocoding_service = geocoding_service
        app.state.authority_router = authority_router
        app.state.emergency_service = emergency_service
        app.state.routing_service = routing_service
        app.state.challan_service = challan_service
        app.state.llm_service = llm_service
        app.state.roadwatch_service = roadwatch_service

        try:
            yield
        finally:
            from services.safe_spaces import close_safe_spaces_client
            await close_safe_spaces_client()
            await llm_service.aclose()
            await routing_service.aclose()
            await geocoding_service.aclose()
            await overpass_service.aclose()
            await cache.close()

    docs_url = None if settings.environment == 'production' else '/docs'
    redoc_url = None if settings.environment == 'production' else '/redoc'
    openapi_url = None if settings.environment == 'production' else '/openapi.json'
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        lifespan=lifespan,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    app.mount('/uploads', StaticFiles(directory=settings.upload_dir), name='uploads')

    @app.get('/', tags=['System'])
    async def root() -> dict:
        return {
            'service': 'SafeVixAI / SafeVixAI — Backend API',
            'version': settings.version,
            'status': 'online',
            'description': (
                'AI-powered road safety platform for India. '
                'Real-time emergency locator, road issue reporting, '
                'challan calculator, and smart routing.'
            ),
            'docs': docs_url,
            'health': '/health',
            'endpoints': {
                'emergency_nearby':    'GET  /api/v1/emergency/nearby?lat=&lon=',
                'emergency_sos':       'POST /api/v1/emergency/sos?lat=&lon=',
                'emergency_numbers':   'GET  /api/v1/emergency/numbers',
                'challan_calculate':   'POST /api/v1/challan/calculate',
                'road_issues':         'GET  /api/v1/roads/issues?lat=&lon=',
                'road_report':         'POST /api/v1/roads/report',
                'road_infrastructure': 'GET  /api/v1/roads/infrastructure?lat=&lon=',
                'routing_preview':     'GET  /api/v1/routing/preview?origin_lat=&origin_lon=&destination_lat=&destination_lon=',
                'geocode_search':      'GET  /api/v1/geocode/search?q=',
                'chat':                'POST /api/v1/chat/',
                'mcp_server_sse':      'GET  /mcp/sse',
                'mcp_server_msg':      'POST /mcp/messages',
            },
            'built_for': 'IIT Madras Road Safety Hackathon 2026',
        }

    @app.get('/health', response_model=HealthResponse, tags=['System'])
    async def health() -> HealthResponse:
        database_available = await check_database()
        cache_available = False
        cache_backend = 'disabled'
        cache = getattr(app.state, 'cache', None)
        if cache is not None:
            cache_available = await cache.ping()
            cache_backend = getattr(cache, 'backend_name', 'unknown')
        resp = HealthResponse(
            status='ok' if database_available else 'degraded',
            database_available=database_available,
            chatbot_ready=settings.chatbot_ready,
            chatbot_mode=settings.chatbot_mode,
            cache_available=cache_available,
            cache_backend=cache_backend,
            environment=settings.environment,
            version=settings.version,
        )
        if not database_available:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=503, content=resp.model_dump())
        return resp

    app.include_router(api_router)
    
    # Mount Model Context Protocol (MCP) Server
    from api.v1.mcp_server import sse_app as mcp_app
    app.mount('/mcp', mcp_app)
    
    return app


app = create_app()
