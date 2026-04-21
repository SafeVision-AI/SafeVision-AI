from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent.context_assembler import ContextAssembler
from agent.graph import ChatEngine
from agent.intent_detector import IntentDetector
from agent.safety_checker import SafetyChecker
from api import api_router
from config import get_settings
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

from memory.redis_memory import ConversationMemoryStore
from providers.router import ProviderRouter
from rag.retriever import Retriever
from rag.vectorstore import LocalVectorStore
from services import IndicSeamlessService
from tools import (
    BackendToolClient,
    ChallanTool,
    DrugInfoTool,
    FirstAidTool,
    GeocodingClient,
    LegalSearchTool,
    RoadInfrastructureTool,
    RoadIssuesTool,
    SosTool,
    SubmitReportTool,
    WeatherTool,
    What3WordsTool,
)


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        backend_client = BackendToolClient(settings)
        memory_store = ConversationMemoryStore(
            settings.redis_url,
            session_ttl_seconds=settings.session_ttl_seconds,
        )
        vectorstore = LocalVectorStore(settings.chroma_persist_dir, settings.rag_data_dir)
        retriever = Retriever(vectorstore, default_top_k=settings.top_k_retrieval)
        weather_tool = WeatherTool(settings)
        speech_service = IndicSeamlessService(settings)
        w3w_tool = What3WordsTool(api_key=settings.w3w_api_key)
        geocode_client = GeocodingClient(opencage_key=settings.opencage_api_key)
        drug_info_tool = DrugInfoTool()
        
        context_assembler = ContextAssembler(
            retriever=retriever,
            sos_tool=SosTool(backend_client, w3w_tool, geocode_client),
            challan_tool=ChallanTool(backend_client),
            legal_search_tool=LegalSearchTool(retriever),
            first_aid_tool=FirstAidTool(settings),
            road_infra_tool=RoadInfrastructureTool(backend_client),
            road_issues_tool=RoadIssuesTool(backend_client),
            submit_report_tool=SubmitReportTool(),
            weather_tool=weather_tool,
            drug_info_tool=drug_info_tool,
        )
        chat_engine = ChatEngine(
            memory_store=memory_store,
            vectorstore=vectorstore,
            intent_detector=IntentDetector(),
            safety_checker=SafetyChecker(),
            context_assembler=context_assembler,
            provider_router=ProviderRouter(settings),
        )

        app.state.memory_store = memory_store
        app.state.chat_engine = chat_engine
        app.state.speech_service = speech_service

        try:
            yield
        finally:
            await weather_tool.aclose()
            await backend_client.aclose()
            await w3w_tool.aclose()
            await geocode_client.aclose()
            await drug_info_tool.aclose()
            await memory_store.close()

    app = FastAPI(title=settings.service_name, version='1.0.0', lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.get('/health', tags=['System'])
    async def health() -> dict:
        """Root health check for Render/load-balancer liveness probes."""
        memory_store = getattr(app.state, 'memory_store', None)
        memory_ok = await memory_store.ping() if memory_store else True
        return {
            'status': 'ok',
            'service': 'safevisionai-chatbot',
            'memory_available': memory_ok,
        }

    @app.get('/', tags=['System'])
    async def root() -> dict:
        return {
            'service': 'RoadSoS / SafeVisionAI — Chatbot Service',
            'version': '1.0.0',
            'status': 'online',
            'description': (
                'Agentic RAG-powered road safety assistant for India. '
                'Multi-provider LLM fallback chain (Groq, Gemini, HuggingFace). '
                'Covers emergency response, MV Act legal queries, first aid, road reporting and more.'
            ),
            'docs': '/docs',
            'health': '/health',
            'endpoints': {
                'chat':          'POST /api/v1/chat/',
                'chat_stream':   'POST /api/v1/chat/stream',
                'chat_history':  'GET  /api/v1/chat/history/{session_id}',
                'chat_health':   'GET  /api/v1/chat/health',
                'speech_status': 'GET  /speech/status',
                'rebuild_index': 'POST /admin/rebuild-index',
            },
            'rag_index': {
                'note': 'Hit /health for live chunk count and memory backend info',
            },
            'built_for': 'IIT Madras Road Safety Hackathon 2026',
        }

    app.include_router(api_router)
    return app


app = create_app()
