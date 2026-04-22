# SafeVixAI Chatbot — Key Features

The SafeVixAI AI chatbot provides a robust set of features categorized by module: SafeVixAI (Emergency), DriveLegal (Traffic Law), and RoadWatch (Infrastructure).

## Emergency Response (SafeVixAI)
- **Service Locator**: Finds the nearest hospital, police station, or ambulance center in real-time via PostGIS + Overpass API.
- **SOS Creation**: Generates WhatsApp emergency messages with GPS coordinates and nearby contacts.
- **First Aid Guidance**: Provides step-by-step, WHO-based instructions for accidents and injuries.
- **Weather Awareness**: Integrates current weather data to provide contextual safety advice.

## Traffic Law Legal Info (DriveLegal)
- **Legal Q&A**: Answers queries on the Motor Vehicles Act (1988, 2019) with exact section citations via ChromaDB RAG.
- **Challan Calculator**: Deterministic calculation of traffic fines based on violation code, vehicle type, and state — uses DuckDB SQL, never LLM-generated amounts.
- **Geo-fencing**: Automatically applies state-specific fine variations based on the user's GPS location.

## Infrastructure Insights (RoadWatch)
- **Contractor Accountability**: Displays contractor info, budget data, and last maintenance details for a road segment.
- **Issue Submission**: Guides users through reporting potholes or infrastructure failures to the correct authority (NHAI/PWD/Municipal).
- **Community Issues**: Shows nearby community-reported road issues with status tracking.

## Core Interaction Features
- **Voice I/O**: Support for voice input (Web Speech API) and automatic response read-out in emergency scenarios.
- **Indian Language Speech**: IndicSeamless model for Indian language ASR/TTS.
- **Multilingual Support**: 10+ Indian languages — auto-routed to **Sarvam AI** (30B/105B) for best quality.
- **11-Provider Fallback**: Zero downtime through automatic LLM provider cascading.
- **Conversation Memory**: Redis-backed session persistence with 24hr TTL.
- **Offline RAG**: Browser-native fallback for first-aid information when internet connectivity is lost (WebLLM + HNSWlib.js).
