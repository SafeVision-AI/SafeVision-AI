# Agent Specialization Overview

The RoadSoS Chatbot operates as a unified interface but adapts its persona and tools dynamically according to the user's current module: RoadSoS, DriveLegal, or RoadWatch.

## Unified Agent Interface
- **Brain**: Driven by the primary LLM (`llama3-70b` on Groq).
- **Orchestration**: Managed by a LangGraph state machine.
- **Tools**: 9 distinct tools specialized for different domains.

## Specialized Agent Personas

### 1. RoadSoS - Emergency Navigator
Focused on critical life-saving tasks. It prioritizes nearby service location and first-aid instructions.
- **Key Tools**: `emergency_tool`, `sos_tool`, `first_aid_tool`.
- **Knowledge Base**: WHO Trauma Care Guidelines, PostGIS emergency data.

### 2. DriveLegal - Traffic Law Expert
A high-authority legal assistant designed to provide accurate fine and regulation info.
- **Key Tools**: `challan_tool`, `legal_search_tool`, `geo_fencing`.
- **Knowledge Base**: Motor Vehicles Act (1988, 2019), state gazette notifications.

### 3. RoadWatch - Infrastructure Guide
Empowers citizens to monitor and report road conditions. Acts as a bridge to road authorities.
- **Key Tools**: `road_infra_tool`, `road_issues_tool`, `submit_report_tool`.
- **Knowledge Base**: PMGSY/NHAI project data, community incident reports.

## Intent-Based Persona Switching
The chatbot dynamically switches personas using a lightweight `llama3-8b` intent classifier. This ensures the correct system prompt and context are applied within milliseconds of receiving a message.
 - **FIND_HOSPITAL** → RoadSoS Persona
 - **CHALLAN_QUERY** → DriveLegal Persona
 - **REPORT_ISSUE** → RoadWatch Persona
 - **OTHER** → General Assistant
