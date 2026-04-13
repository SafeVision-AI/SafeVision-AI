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
from memory.redis_memory import ConversationMemoryStore
from providers.router import ProviderRouter
from rag.retriever import Retriever
from rag.vectorstore import LocalVectorStore
from services import IndicSeamlessService
from tools import (
    BackendToolClient,
    ChallanTool,
    FirstAidTool,
    LegalSearchTool,
    RoadInfrastructureTool,
    RoadIssuesTool,
    SosTool,
    SubmitReportTool,
    WeatherTool,
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
        context_assembler = ContextAssembler(
            retriever=retriever,
            sos_tool=SosTool(backend_client),
            challan_tool=ChallanTool(backend_client),
            legal_search_tool=LegalSearchTool(retriever),
            first_aid_tool=FirstAidTool(settings),
            road_infra_tool=RoadInfrastructureTool(backend_client),
            road_issues_tool=RoadIssuesTool(backend_client),
            submit_report_tool=SubmitReportTool(),
            weather_tool=weather_tool,
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
            await memory_store.close()

    app = FastAPI(title=settings.service_name, version='1.0.0', lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    app.include_router(api_router)
    return app


app = create_app()
