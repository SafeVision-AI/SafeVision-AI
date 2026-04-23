# Testing Strategy

<cite>
**Referenced Files in This Document**
- [backend/pytest.ini](file://backend/pytest.ini)
- [chatbot_service/pytest.ini](file://chatbot_service/pytest.ini)
- [frontend/jest.config.js](file://frontend/jest.config.js)
- [backend/tests/conftest.py](file://backend/tests/conftest.py)
- [chatbot_service/tests/conftest.py](file://chatbot_service/tests/conftest.py)
- [.github/workflows/backend.yml](file://.github/workflows/backend.yml)
- [.github/workflows/chatbot.yml](file://.github/workflows/chatbot.yml)
- [.github/workflows/frontend.yml](file://.github/workflows/frontend.yml)
- [.github/workflows/e2e.yml](file://.github/workflows/e2e.yml)
- [.github/workflows/security.yml](file://.github/workflows/security.yml)
- [backend/tests/test_chatbot.py](file://backend/tests/test_chatbot.py)
- [backend/tests/test_routing.py](file://backend/tests/test_routing.py)
- [chatbot_service/tests/test_e2e.py](file://chatbot_service/tests/test_e2e.py)
- [chatbot_service/tests/test_intent.py](file://chatbot_service/tests/test_intent.py)
- [chatbot_service/tests/test_rag.py](file://chatbot_service/tests/test_rag.py)
- [frontend/tests/home.test.tsx](file://frontend/tests/home.test.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document defines the comprehensive testing strategy for SafeVixAI across its multi-service stack. It covers unit testing, integration testing, and end-to-end validation using FastAPI Pytest, Next.js Jest/Vitest, and specialized chatbot testing frameworks. It also documents mock setups, test data management, continuous integration pipelines, performance and security testing, coverage expectations, and operational validation practices. The goal is to enable both beginners and QA engineers to confidently contribute to and maintain high-quality software.

## Project Structure
SafeVixAI is organized into three major services:
- Backend API service built with FastAPI
- Chatbot service with RAG, tools, and provider integrations
- Frontend Next.js application

Each service maintains its own test configuration and CI workflows, enabling independent and focused testing.

```mermaid
graph TB
subgraph "Backend API"
B_Pytest["backend/pytest.ini"]
B_Conftest["backend/tests/conftest.py"]
B_Tests["backend/tests/*.py"]
end
subgraph "Chatbot Service"
C_Pytest["chatbot_service/pytest.ini"]
C_Conftest["chatbot_service/tests/conftest.py"]
C_Tests["chatbot_service/tests/*.py"]
end
subgraph "Frontend"
F_Jest["frontend/jest.config.js"]
F_Tests["frontend/tests/*.tsx"]
end
subgraph "CI Workflows"
W_Backend[".github/workflows/backend.yml"]
W_Chatbot[".github/workflows/chatbot.yml"]
W_Frontend[".github/workflows/frontend.yml"]
W_E2E[".github/workflows/e2e.yml"]
W_Security[".github/workflows/security.yml"]
end
B_Pytest --> B_Conftest --> B_Tests
C_Pytest --> C_Conftest --> C_Tests
F_Jest --> F_Tests
W_Backend --> B_Tests
W_Chatbot --> C_Tests
W_Frontend --> F_Tests
W_E2E --> F_Tests
W_Security --> B_Tests
W_Security --> C_Tests
```

**Diagram sources**
- [backend/pytest.ini:1-5](file://backend/pytest.ini#L1-L5)
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [backend/tests/conftest.py:1-31](file://backend/tests/conftest.py#L1-L31)
- [chatbot_service/tests/conftest.py:1-10](file://chatbot_service/tests/conftest.py#L1-L10)
- [.github/workflows/backend.yml:1-55](file://.github/workflows/backend.yml#L1-L55)
- [.github/workflows/chatbot.yml:1-55](file://.github/workflows/chatbot.yml#L1-L55)
- [.github/workflows/frontend.yml:1-43](file://.github/workflows/frontend.yml#L1-L43)
- [.github/workflows/e2e.yml:1-43](file://.github/workflows/e2e.yml#L1-L43)
- [.github/workflows/security.yml:1-64](file://.github/workflows/security.yml#L1-L64)

**Section sources**
- [backend/pytest.ini:1-5](file://backend/pytest.ini#L1-L5)
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [backend/tests/conftest.py:1-31](file://backend/tests/conftest.py#L1-L31)
- [chatbot_service/tests/conftest.py:1-10](file://chatbot_service/tests/conftest.py#L1-L10)
- [.github/workflows/backend.yml:1-55](file://.github/workflows/backend.yml#L1-L55)
- [.github/workflows/chatbot.yml:1-55](file://.github/workflows/chatbot.yml#L1-L55)
- [.github/workflows/frontend.yml:1-43](file://.github/workflows/frontend.yml#L1-L43)
- [.github/workflows/e2e.yml:1-43](file://.github/workflows/e2e.yml#L1-L43)
- [.github/workflows/security.yml:1-64](file://.github/workflows/security.yml#L1-L64)

## Core Components
- Backend FastAPI service
  - Pytest configuration and fixtures for app bootstrapping and dependency overrides
  - Endpoint-specific tests validating routing, chatbot integration, and business logic
- Chatbot service
  - Pytest configuration optimized for async workflows
  - Comprehensive end-to-end tests simulating conversational flows, tools, and provider routing
  - Unit tests for intent detection, retrieval, and provider behavior
- Frontend Next.js
  - Jest configuration for DOM environment and setup
  - UI component tests verifying structural rendering and module presence

Key testing artifacts:
- Backend app fixture and dependency override pattern
- Chatbot async app lifecycle and extensive mock factories
- Frontend DOM assertions and component rendering checks

**Section sources**
- [backend/tests/conftest.py:18-31](file://backend/tests/conftest.py#L18-L31)
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [chatbot_service/tests/test_e2e.py:219-236](file://chatbot_service/tests/test_e2e.py#L219-L236)
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [frontend/tests/home.test.tsx:1-25](file://frontend/tests/home.test.tsx#L1-L25)

## Architecture Overview
The testing architecture integrates per-service test suites with dedicated CI jobs. Security scanning is performed independently, and frontend unit tests are executed via Vitest in a separate workflow.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant GH as "GitHub Actions"
participant BE as "Backend Pytest"
participant CS as "Chatbot Pytest"
participant FE as "Frontend Jest/Vitest"
participant SEC as "Security Audit"
Dev->>GH : Push/Pull Request
GH->>BE : Trigger backend.yml
GH->>CS : Trigger chatbot.yml
GH->>FE : Trigger frontend.yml + e2e.yml
GH->>SEC : Trigger security.yml
BE-->>GH : Test results
CS-->>GH : Test results
FE-->>GH : Test results
SEC-->>GH : Security scan report
```

**Diagram sources**
- [.github/workflows/backend.yml:1-55](file://.github/workflows/backend.yml#L1-L55)
- [.github/workflows/chatbot.yml:1-55](file://.github/workflows/chatbot.yml#L1-L55)
- [.github/workflows/frontend.yml:1-43](file://.github/workflows/frontend.yml#L1-L43)
- [.github/workflows/e2e.yml:1-43](file://.github/workflows/e2e.yml#L1-L43)
- [.github/workflows/security.yml:1-64](file://.github/workflows/security.yml#L1-L64)

## Detailed Component Analysis

### Backend API Testing
- Pytest configuration
  - Sets test discovery path and asyncio mode for async fixtures
- App fixture and dependency override
  - Creates a FastAPI app instance and injects a dummy DB session to bypass persistence
- Example tests
  - Chat endpoint test mocks the LLM service and asserts response shape and fields
  - Routing preview test validates route computation and invalid profile handling

```mermaid
sequenceDiagram
participant TC as "TestClient"
participant APP as "FastAPI App Fixture"
participant SVC as "LLM/Service Under Test"
participant RESP as "HTTP Response"
TC->>APP : Initialize TestClient(app)
APP->>APP : Override get_db with DummySession
TC->>SVC : POST /api/v1/chat/
SVC-->>TC : JSON payload
TC-->>RESP : Assert status and payload fields
```

**Diagram sources**
- [backend/tests/conftest.py:22-31](file://backend/tests/conftest.py#L22-L31)
- [backend/tests/test_chatbot.py:16-33](file://backend/tests/test_chatbot.py#L16-L33)

**Section sources**
- [backend/pytest.ini:1-5](file://backend/pytest.ini#L1-L5)
- [backend/tests/conftest.py:18-31](file://backend/tests/conftest.py#L18-L31)
- [backend/tests/test_chatbot.py:1-33](file://backend/tests/test_chatbot.py#L1-L33)
- [backend/tests/test_routing.py:1-97](file://backend/tests/test_routing.py#L1-L97)

### Chatbot Service Testing
- Pytest configuration
  - Strict asyncio mode and function-scoped loop for deterministic async tests
- End-to-end test suite
  - Extensive mock factories simulate memory stores, vector store, retrievers, tools, and provider routers
  - Async client lifecycle ensures proper lifespan management during tests
  - Tests cover English/Tamil queries, emergency routing with coordinates, and tool integration
- Unit tests
  - Intent detection classification for emergency and challan-related queries
  - Retrieval accuracy against legal knowledge base content

```mermaid
sequenceDiagram
participant AC as "AsyncClient"
participant APP as "Chatbot App Fixture"
participant MR as "Mock Router"
participant MT as "Mock Tools"
participant RESP as "Chat Response"
AC->>APP : POST /api/v1/chat/
APP->>MR : generate(request)
MR-->>APP : ProviderResult(text, provider, model)
APP->>MT : Invoke tools (sos/weather/legal/etc.)
MT-->>APP : Tool payloads
APP-->>AC : JSON {response, intent, sources, session_id}
AC-->>RESP : Assert response characteristics
```

**Diagram sources**
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [chatbot_service/tests/test_e2e.py:219-236](file://chatbot_service/tests/test_e2e.py#L219-L236)
- [chatbot_service/tests/test_e2e.py:247-309](file://chatbot_service/tests/test_e2e.py#L247-L309)

**Section sources**
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [chatbot_service/tests/test_e2e.py:1-309](file://chatbot_service/tests/test_e2e.py#L1-L309)
- [chatbot_service/tests/test_intent.py:1-14](file://chatbot_service/tests/test_intent.py#L1-L14)
- [chatbot_service/tests/test_rag.py:1-18](file://chatbot_service/tests/test_rag.py#L1-L18)

### Frontend Testing
- Jest configuration
  - Uses next/jest to load Next.js config and sets jsdom environment
  - Imports a setup file for global test utilities
- UI test example
  - Renders the home page and asserts presence of key headings and module labels
  - Mocks external components (e.g., navigation) to isolate UI assertions

```mermaid
flowchart TD
Start(["Render Home Page"]) --> MockLink["Mock external components"]
MockLink --> RenderUI["Render UI tree"]
RenderUI --> AssertTitle["Assert main heading present"]
AssertTitle --> AssertModules["Assert core module labels present"]
AssertModules --> End(["Pass/Fail"])
```

**Diagram sources**
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [frontend/tests/home.test.tsx:5-10](file://frontend/tests/home.test.tsx#L5-L10)
- [frontend/tests/home.test.tsx:12-24](file://frontend/tests/home.test.tsx#L12-L24)

**Section sources**
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [frontend/tests/home.test.tsx:1-25](file://frontend/tests/home.test.tsx#L1-L25)

### Continuous Integration Testing
- Backend CI
  - Installs dependencies, runs Pytest, and supplies stub environment variables for configuration
- Chatbot CI
  - Installs dependencies, runs Pytest, and supplies stub environment variables for settings
- Frontend CI
  - Lints and type-checks TypeScript; does not run unit tests in this workflow
- E2E CI
  - Runs Vitest for frontend unit tests
- Security CI
  - Performs npm audit, Python Bandit SAST scans, and Safety dependency CVE checks across both backend and chatbot services

```mermaid
graph LR
BE_YML["backend.yml"] --> BE_DEPS["Install backend deps"]
BE_DEPS --> BE_TEST["Run pytest tests"]
CS_YML["chatbot.yml"] --> CS_DEPS["Install chatbot deps"]
CS_DEPS --> CS_TEST["Run pytest tests"]
FE_YML["frontend.yml"] --> FE_LINT["ESLint + TypeScript"]
E2E_YML["e2e.yml"] --> FE_VITEST["Vitest unit tests"]
SEC_YML["security.yml"] --> NPM_AUDIT["npm audit"]
SEC_YML --> BANDIT["bandit (Python SAST)"]
SEC_YML --> SAFETY["safety (CVE scan)"]
```

**Diagram sources**
- [.github/workflows/backend.yml:32-55](file://.github/workflows/backend.yml#L32-L55)
- [.github/workflows/chatbot.yml:32-55](file://.github/workflows/chatbot.yml#L32-L55)
- [.github/workflows/frontend.yml:36-43](file://.github/workflows/frontend.yml#L36-L43)
- [.github/workflows/e2e.yml:35-43](file://.github/workflows/e2e.yml#L35-L43)
- [.github/workflows/security.yml:30-64](file://.github/workflows/security.yml#L30-L64)

**Section sources**
- [.github/workflows/backend.yml:1-55](file://.github/workflows/backend.yml#L1-L55)
- [.github/workflows/chatbot.yml:1-55](file://.github/workflows/chatbot.yml#L1-L55)
- [.github/workflows/frontend.yml:1-43](file://.github/workflows/frontend.yml#L1-L43)
- [.github/workflows/e2e.yml:1-43](file://.github/workflows/e2e.yml#L1-L43)
- [.github/workflows/security.yml:1-64](file://.github/workflows/security.yml#L1-L64)

## Dependency Analysis
- Backend
  - Test app fixture depends on the FastAPI application factory and database dependency override
  - Endpoint tests rely on TestClient and injected service mocks
- Chatbot
  - Async app fixture manages lifespan and ASGI transport for AsyncClient
  - Extensive monkeypatching replaces real components with deterministic mocks
- Frontend
  - Tests depend on jsdom environment and component rendering utilities

```mermaid
graph TB
B_Conf["backend/tests/conftest.py"] --> B_App["FastAPI app"]
B_App --> B_TestC["backend/tests/test_chatbot.py"]
B_App --> B_TestR["backend/tests/test_routing.py"]
C_Conf["chatbot_service/tests/conftest.py"] --> C_App["Chatbot app fixture"]
C_App --> C_TestE["chatbot_service/tests/test_e2e.py"]
C_App --> C_TestI["chatbot_service/tests/test_intent.py"]
C_App --> C_TestR["chatbot_service/tests/test_rag.py"]
F_JestCfg["frontend/jest.config.js"] --> F_Test["frontend/tests/home.test.tsx"]
```

**Diagram sources**
- [backend/tests/conftest.py:14-31](file://backend/tests/conftest.py#L14-L31)
- [backend/tests/test_chatbot.py:16-33](file://backend/tests/test_chatbot.py#L16-L33)
- [backend/tests/test_routing.py:67-97](file://backend/tests/test_routing.py#L67-L97)
- [chatbot_service/tests/conftest.py:1-10](file://chatbot_service/tests/conftest.py#L1-L10)
- [chatbot_service/tests/test_e2e.py:219-236](file://chatbot_service/tests/test_e2e.py#L219-L236)
- [chatbot_service/tests/test_intent.py:6-14](file://chatbot_service/tests/test_intent.py#L6-L14)
- [chatbot_service/tests/test_rag.py:9-18](file://chatbot_service/tests/test_rag.py#L9-L18)
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)
- [frontend/tests/home.test.tsx:1-25](file://frontend/tests/home.test.tsx#L1-L25)

**Section sources**
- [backend/tests/conftest.py:1-31](file://backend/tests/conftest.py#L1-L31)
- [chatbot_service/tests/conftest.py:1-10](file://chatbot_service/tests/conftest.py#L1-L10)
- [frontend/jest.config.js:1-16](file://frontend/jest.config.js#L1-L16)

## Performance Considerations
- Current test suite focuses on correctness and integration rather than performance or load testing.
- Recommended additions:
  - Introduce synthetic latency in service mocks to detect slow endpoints
  - Use profiling tools to measure test execution time and identify hotspots
  - Add load tests using Locust or k6 against staging environments for critical paths (chat, routing)
  - Monitor memory usage during long-running test sessions
- Keep performance tests out of CI by default; run them on scheduled pipelines or developer machines.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Async fixture scope issues
  - Ensure asyncio mode matches the service configuration (auto for backend, strict for chatbot)
- Missing environment variables
  - CI workflows supply stub environment variables; locally, mirror the same keys with placeholder values
- Test isolation failures
  - Use function-scoped fixtures and avoid global mutable state
- Mock mismatches
  - Verify that all external dependencies are patched consistently across tests
- Frontend rendering errors
  - Confirm jsdom environment and component mocking align with actual runtime behavior

**Section sources**
- [backend/pytest.ini:2-4](file://backend/pytest.ini#L2-L4)
- [chatbot_service/pytest.ini:1-4](file://chatbot_service/pytest.ini#L1-L4)
- [.github/workflows/backend.yml:47-55](file://.github/workflows/backend.yml#L47-L55)
- [.github/workflows/chatbot.yml:47-55](file://.github/workflows/chatbot.yml#L47-L55)
- [frontend/jest.config.js:9-12](file://frontend/jest.config.js#L9-L12)

## Conclusion
SafeVixAI’s testing strategy leverages per-service test suites and CI workflows to ensure correctness across the backend, chatbot, and frontend. The documented patterns—fixtures, mocks, and async lifecycles—provide a strong foundation for unit, integration, and end-to-end validation. By extending current practices with performance and security-focused tests, and by maintaining robust CI hygiene, the project can sustain high quality and reliability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Test Data Management
- Use temporary directories for vector store indices and local databases in tests
- Seed minimal datasets for retrieval and tool tests to keep runs fast and deterministic
- Centralize shared fixtures for repeated setup across related tests

**Section sources**
- [chatbot_service/tests/test_rag.py:9-18](file://chatbot_service/tests/test_rag.py#L9-L18)

### Coverage and Quality Metrics
- Enforce minimum coverage thresholds per service and gate PRs on coverage checks
- Track duplication and complexity via static analysis in CI
- Maintain clean diffs by avoiding noisy test output and focusing on meaningful assertions

**Section sources**
- [.github/workflows/security.yml:42-64](file://.github/workflows/security.yml#L42-L64)

### Production Validation
- Run smoke tests against staging endpoints before releases
- Validate critical flows (chat, SOS, routing) end-to-end with real or realistic mocks
- Monitor CI failure rates and address regressions promptly

**Section sources**
- [.github/workflows/backend.yml:39-46](file://.github/workflows/backend.yml#L39-L46)
- [.github/workflows/chatbot.yml:39-46](file://.github/workflows/chatbot.yml#L39-L46)
- [.github/workflows/e2e.yml:35-43](file://.github/workflows/e2e.yml#L35-L43)