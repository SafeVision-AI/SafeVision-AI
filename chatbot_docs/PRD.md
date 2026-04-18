# Product Requirements Document (PRD) — SafeVisionAI Chatbot

The SafeVisionAI AI Chatbot is a core component of the SafeVisionAI safety platform, designed to provide real-time, authoritative assistant services for road users in India.

## Problem Statement
Road accidents in India are often followed by critical delays in locating emergency services, lack of legal clarity on traffic fines, and a lack of transparency in infrastructure reporting. Users need an intelligent, high-availability assistant to bridge these gaps.

## Target Audience
- Drivers and commuters on Indian highways.
- First responders and bystanders at accident scenes.
- Citizens interested in road infrastructure transparency.

## User Requirements
- **Immediate Response**: Quick access to nearest hospital and 112 services.
- **Authoritative Data**: Accurate legal information on traffic laws and fines (deterministic, not LLM-generated).
- **Ease of Use**: Hands-free voice interaction for drivers and those in trauma.
- **Local Context**: Personalized info based on GPS (local hospitals, state-specific fines).
- **Indian Languages**: Native support for Hindi, Tamil, Telugu, Kannada, Bengali, and more via Sarvam AI.

## System Performance Goals
- **Response Latency**: Under 3 seconds for initial token generation (Groq 300+ tok/s).
- **Availability**: 100% uptime through 11-provider LLM fallback chain.
- **Accuracy**: Minimal hallucination by strictly using RAG-backed facts and deterministic DuckDB SQL for fines.
- **Multi-language**: Seamless interaction in 10+ Indian languages via Sarvam AI auto-routing.
- **Offline**: First-aid and basic legal info available via WebLLM Phi-3 Mini when offline.

## Success Metrics
- **Response Utility**: High user ratings (thumbs up) for AI accuracy.
- **Emergency Speed**: Reduction in time taken to locate and call nearest services.
- **Community Growth**: Increase in infrastructure issue reports via the chatbot.
