# API Integration

<cite>
**Referenced Files in This Document**
- [backend/main.py](file://backend/main.py)
- [backend/api/v1/__init__.py](file://backend/api/v1/__init__.py)
- [backend/api/v1/emergency.py](file://backend/api/v1/emergency.py)
- [backend/api/v1/routing.py](file://backend/api/v1/routing.py)
- [backend/api/v1/auth.py](file://backend/api/v1/auth.py)
- [backend/api/v1/offline.py](file://backend/api/v1/offline.py)
- [backend/core/config.py](file://backend/core/config.py)
- [backend/core/redis_client.py](file://backend/core/redis_client.py)
- [backend/services/emergency_locator.py](file://backend/services/emergency_locator.py)
- [backend/services/geocoding_service.py](file://backend/services/geocoding_service.py)
- [backend/services/routing_service.py](file://backend/services/routing_service.py)
- [backend/services/overpass_service.py](file://backend/services/overpass_service.py)
- [backend/services/authority_router.py](file://backend/services/authority_router.py)
- [backend/models/schemas.py](file://backend/models/schemas.py)
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

## Introduction
This document explains the API integration patterns and backend communication architecture used by the SafeVixAI backend. It focuses on the REST API client implementations, error handling strategies, request/response transformations, and integrations with emergency services, geocoding APIs, routing services, and government datasets. It also covers authentication, rate limiting, caching, offline fallback APIs, error recovery, and performance optimization via caching and fallback strategies.

## Project Structure
The backend is a FastAPI application that wires up services and exposes REST endpoints grouped by feature. Services encapsulate external API integrations and internal data access, while schemas define request/response contracts.

```mermaid
graph TB
subgraph "FastAPI App"
A_main["backend/main.py<br/>create_app()"]
A_router["backend/api/v1/__init__.py<br/>api_router"]
end
subgraph "Services"
S_geo["services/geocoding_service.py<br/>GeocodingService"]
S_overpass["services/overpass_service.py<br/>OverpassService"]
S_em["services/emergency_locator.py<br/>EmergencyLocatorService"]
S_auth["services/authority_router.py<br/>AuthorityRouter"]
S_route["services/routing_service.py<br/>RoutingService"]
end
subgraph "Core"
C_cfg["core/config.py<br/>Settings"]
C_redis["core/redis_client.py<br/>CacheHelper"]
end
subgraph "Endpoints"
E_em["api/v1/emergency.py"]
E_rt["api/v1/routing.py"]
E_of["api/v1/offline.py"]
E_auth["api/v1/auth.py"]
end
A_main --> A_router
A_main --> C_redis
A_main --> C_cfg
A_router --> E_em
A_router --> E_rt
A_router --> E_of
A_router --> E_auth
E_em --> S_em
E_rt --> S_route
E_of --> S_em
E_auth --> A_main
S_em --> S_geo
S_em --> S_overpass
S_em --> C_redis
S_route --> C_redis
S_auth --> S_overpass
S_auth --> C_redis
S_geo --> C_redis
```

**Diagram sources**
- [backend/main.py:24-128](file://backend/main.py#L24-L128)
- [backend/api/v1/__init__.py:17-27](file://backend/api/v1/__init__.py#L17-L27)
- [backend/api/v1/emergency.py:12-83](file://backend/api/v1/emergency.py#L12-L83)
- [backend/api/v1/routing.py:11-64](file://backend/api/v1/routing.py#L11-L64)
- [backend/api/v1/offline.py:11-28](file://backend/api/v1/offline.py#L11-L28)
- [backend/api/v1/auth.py:6-44](file://backend/api/v1/auth.py#L6-L44)
- [backend/core/config.py:11-181](file://backend/core/config.py#L11-L181)
- [backend/core/redis_client.py:10-140](file://backend/core/redis_client.py#L10-L140)
- [backend/services/emergency_locator.py:161-507](file://backend/services/emergency_locator.py#L161-L507)
- [backend/services/geocoding_service.py:19-170](file://backend/services/geocoding_service.py#L19-L170)
- [backend/services/routing_service.py:20-356](file://backend/services/routing_service.py#L20-L356)
- [backend/services/overpass_service.py:24-249](file://backend/services/overpass_service.py#L24-L249)
- [backend/services/authority_router.py:42-143](file://backend/services/authority_router.py#L42-L143)

**Section sources**
- [backend/main.py:24-128](file://backend/main.py#L24-L128)
- [backend/api/v1/__init__.py:17-27](file://backend/api/v1/__init__.py#L17-L27)

## Core Components
- REST API routers and endpoints for emergency, routing, offline, and authentication.
- Service layer for emergency locator, geocoding, routing, authority routing, and Overpass integration.
- Configuration and caching helpers for timeouts, retries, and cache TTLs.
- Pydantic models defining request/response schemas.

Key responsibilities:
- EmergencyLocatorService: multi-source discovery (database, local catalog, Overpass), merging, caching, and SOS payload assembly.
- GeocodingService: Photon/Nominatim dual fallback with rate limiting and normalization.
- RoutingService: OpenRouteService (with API key) and OSRM fallback with normalization and caching.
- AuthorityRouter: road type classification and authority resolution via OSM and database-backed infrastructure.
- OverpassService: OSM queries for services and road context with retry and classification logic.

**Section sources**
- [backend/api/v1/emergency.py:12-83](file://backend/api/v1/emergency.py#L12-L83)
- [backend/api/v1/routing.py:11-64](file://backend/api/v1/routing.py#L11-L64)
- [backend/api/v1/offline.py:11-28](file://backend/api/v1/offline.py#L11-L28)
- [backend/api/v1/auth.py:6-44](file://backend/api/v1/auth.py#L6-L44)
- [backend/services/emergency_locator.py:161-507](file://backend/services/emergency_locator.py#L161-L507)
- [backend/services/geocoding_service.py:19-170](file://backend/services/geocoding_service.py#L19-L170)
- [backend/services/routing_service.py:20-356](file://backend/services/routing_service.py#L20-L356)
- [backend/services/overpass_service.py:24-249](file://backend/services/overpass_service.py#L24-L249)
- [backend/services/authority_router.py:42-143](file://backend/services/authority_router.py#L42-L143)
- [backend/models/schemas.py:10-288](file://backend/models/schemas.py#L10-L288)

## Architecture Overview
The backend initializes services and caches at startup, mounts routers, and exposes endpoints. Each endpoint delegates to a service, which performs external API calls, applies transformations, and caches results. Error propagation to clients is handled via exceptions mapped to HTTP status codes.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "FastAPI Router"
participant Svc as "Service"
participant Ext as "External API"
participant Cache as "CacheHelper"
Client->>API : HTTP GET /api/v1/emergency/nearby
API->>Svc : find_nearby(...)
Svc->>Cache : get_json(key)
alt cache hit
Cache-->>Svc : payload
Svc-->>API : EmergencyResponse
API-->>Client : 200 OK
else cache miss
Svc->>Ext : HTTP request
Ext-->>Svc : JSON payload
Svc->>Cache : set_json(key, payload, ttl)
Svc-->>API : EmergencyResponse
API-->>Client : 200 OK
end
```

**Diagram sources**
- [backend/api/v1/emergency.py:19-40](file://backend/api/v1/emergency.py#L19-L40)
- [backend/services/emergency_locator.py:187-217](file://backend/services/emergency_locator.py#L187-L217)
- [backend/core/redis_client.py:43-71](file://backend/core/redis_client.py#L43-L71)

## Detailed Component Analysis

### Emergency Locator Service
- Multi-stage discovery:
  - Database with configurable radius steps and minimum results threshold.
  - Local catalog merge with distance sorting.
  - Overpass fallback with category filtering and normalization.
- Merging logic avoids duplicates across sources.
- Caching keys include coordinates, categories, radius, and limit.
- SOS payload composition augments emergency results with national numbers.

```mermaid
flowchart TD
Start(["find_nearby"]) --> Parse["Parse categories"]
Parse --> Steps["Build radius steps"]
Steps --> CacheGet["Cache lookup"]
CacheGet --> |hit| ReturnCached["Return cached EmergencyResponse"]
CacheGet --> |miss| QueryDB["Query database within steps"]
QueryDB --> Enough{"Enough results?"}
Enough --> |yes| MergeLocal["Merge local catalog"]
Enough --> |no| TryOverpass["Try Overpass fallback"]
MergeLocal --> MergeOK{"Enough after merge?"}
MergeOK --> |yes| BuildResp["Build EmergencyResponse"]
MergeOK --> |no| TryOverpass
TryOverpass --> OverpassOK{"Overpass succeeded?"}
OverpassOK --> |yes| MergeAll["Merge Overpass results"]
OverpassOK --> |no| Fail["Raise ExternalServiceError if empty"]
MergeAll --> BuildResp
BuildResp --> CacheSet["Cache JSON with TTL"]
CacheSet --> ReturnResp["Return EmergencyResponse"]
```

**Diagram sources**
- [backend/services/emergency_locator.py:187-374](file://backend/services/emergency_locator.py#L187-L374)
- [backend/core/redis_client.py:43-71](file://backend/core/redis_client.py#L43-L71)

**Section sources**
- [backend/services/emergency_locator.py:161-507](file://backend/services/emergency_locator.py#L161-L507)
- [backend/api/v1/emergency.py:19-75](file://backend/api/v1/emergency.py#L19-L75)

### Geocoding Service
- Dual provider fallback: Photon first, Nominatim second.
- Rate limiting for Nominatim requests using a per-instance lock and sleep.
- Normalization transforms provider payloads into a unified schema.
- Caching with separate TTL for geocoding.

```mermaid
sequenceDiagram
participant API as "Caller"
participant GS as "GeocodingService"
participant Cache as "CacheHelper"
participant Photon as "Photon"
participant Nominatim as "Nominatim"
API->>GS : reverse(lat, lon)
GS->>Cache : get_json("geocode : reverse : ...")
alt cache hit
Cache-->>GS : GeocodeResult
GS-->>API : GeocodeResult
else cache miss
GS->>Photon : GET /reverse
alt Photon fails
GS->>GS : acquire lock
GS->>Nominatim : GET /reverse
Nominatim-->>GS : JSON
GS->>Cache : set_json(...)
GS-->>API : GeocodeResult
else Photon succeeds
Photon-->>GS : JSON
GS->>Cache : set_json(...)
GS-->>API : GeocodeResult
end
end
```

**Diagram sources**
- [backend/services/geocoding_service.py:33-111](file://backend/services/geocoding_service.py#L33-L111)
- [backend/core/redis_client.py:43-71](file://backend/core/redis_client.py#L43-L71)

**Section sources**
- [backend/services/geocoding_service.py:19-170](file://backend/services/geocoding_service.py#L19-L170)

### Routing Service
- Provider selection:
  - OpenRouteService when API key is present; supports alternatives.
  - OSRM public endpoint fallback; limited features.
- Response normalization for both providers into a unified schema.
- Caching with route-specific keys and TTL.

```mermaid
sequenceDiagram
participant API as "Router"
participant RS as "RoutingService"
participant Cache as "CacheHelper"
participant ORS as "OpenRouteService"
participant OSRM as "OSRM"
API->>RS : preview_route(origin, dest, profile, alternatives)
RS->>Cache : get_json("route : preview : ...")
alt cache hit
Cache-->>RS : RoutePreviewResponse
RS-->>API : RoutePreviewResponse
else cache miss
alt has ORS key
RS->>ORS : POST /v2/directions/{profile}
ORS-->>RS : JSON routes
else
RS->>OSRM : GET /route/v1/driving/...
OSRM-->>RS : JSON routes
end
RS->>Cache : set_json("route : preview : ...", ttl)
RS-->>API : RoutePreviewResponse
end
```

**Diagram sources**
- [backend/services/routing_service.py:35-142](file://backend/services/routing_service.py#L35-L142)
- [backend/core/redis_client.py:43-71](file://backend/core/redis_client.py#L43-L71)

**Section sources**
- [backend/services/routing_service.py:20-356](file://backend/services/routing_service.py#L20-L356)
- [backend/api/v1/routing.py:18-41](file://backend/api/v1/routing.py#L18-L41)

### Overpass Service
- Builds Overpass QL queries for services and roads.
- Extracts tags, computes distances, and normalizes attributes (24/7, ICU, trauma).
- Retries across multiple Overpass endpoints with backoff.

```mermaid
flowchart TD
Q["Build query for lat,lon,radius"] --> Exec["POST to Overpass URL(s)"]
Exec --> Resp{"HTTP 200?"}
Resp --> |Yes| Parse["Iterate elements<br/>classify tags<br/>compute distance"]
Parse --> Items["Build EmergencyServiceItem list"]
Resp --> |No| Retry["Backoff and retry next URL"]
Retry --> Exec
Items --> Sort["Sort by priority and distance"]
Sort --> Limit["Apply limit"]
Limit --> Return["Return list"]
```

**Diagram sources**
- [backend/services/overpass_service.py:35-135](file://backend/services/overpass_service.py#L35-L135)

**Section sources**
- [backend/services/overpass_service.py:24-249](file://backend/services/overpass_service.py#L24-L249)

### Authority Router
- Resolves road authority by:
  - Looking up infrastructure within a small radius.
  - Falling back to Overpass road context classification.
- Maps road type codes to authority info and helplines.

```mermaid
flowchart TD
Start(["resolve(lat, lon)"]) --> DB["Lookup infrastructure nearby"]
DB --> Found{"Found?"}
Found --> |Yes| Normalize["Normalize road type"]
Found --> |No| Overpass["Get road context from Overpass"]
Overpass --> OC_OK{"Context found?"}
OC_OK --> |Yes| FromCtx["Build preview from context"]
OC_OK --> |No| Fallback["Fallback to URBAN authority"]
Normalize --> Preview["Build AuthorityPreviewResponse"]
FromCtx --> Preview
Fallback --> Preview
```

**Diagram sources**
- [backend/services/authority_router.py:48-126](file://backend/services/authority_router.py#L48-L126)

**Section sources**
- [backend/services/authority_router.py:42-143](file://backend/services/authority_router.py#L42-L143)

### Authentication
- Demo login endpoint with predefined users and JWT token generation.
- Verification endpoint for auth health checks.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Auth as "Auth Router"
participant Token as "Token Generator"
Client->>Auth : POST /api/v1/auth/login
Auth->>Auth : Validate credentials
Auth->>Token : create_access_token(data, expires_delta)
Token-->>Auth : access_token
Auth-->>Client : {access_token, token_type, operator_name}
```

**Diagram sources**
- [backend/api/v1/auth.py:24-38](file://backend/api/v1/auth.py#L24-L38)

**Section sources**
- [backend/api/v1/auth.py:6-44](file://backend/api/v1/auth.py#L6-L44)

### Offline Bundles
- Endpoint to build and cache a city-specific emergency bundle combining database, local catalog, and Overpass data.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Offline as "Offline Router"
participant EL as "EmergencyLocatorService"
participant Cache as "CacheHelper"
Client->>Offline : GET /api/v1/offline/bundle/{city}
Offline->>EL : build_city_bundle(city)
EL->>Cache : get_json("offline : bundle : {city}")
alt cache miss
EL->>EL : Query DB + Local Catalog + Overpass
EL->>Cache : set_json("offline : bundle : {city}", ttl)
EL-->>Offline : bundle
else cache hit
Cache-->>Offline : bundle
end
Offline-->>Client : bundle JSON
```

**Diagram sources**
- [backend/api/v1/offline.py:18-27](file://backend/api/v1/offline.py#L18-L27)
- [backend/services/emergency_locator.py:241-299](file://backend/services/emergency_locator.py#L241-L299)

**Section sources**
- [backend/api/v1/offline.py:11-28](file://backend/api/v1/offline.py#L11-L28)
- [backend/services/emergency_locator.py:241-299](file://backend/services/emergency_locator.py#L241-L299)

## Dependency Analysis
- Startup wiring initializes services and cache, attaching them to the app state for DI via dependency injection in routers.
- Services depend on Settings for URLs, timeouts, and TTLs; most services also depend on CacheHelper.
- Endpoints depend on services and SQLAlchemy sessions.

```mermaid
graph LR
Cfg["Settings"] --> Geo["GeocodingService"]
Cfg --> Route["RoutingService"]
Cfg --> EL["EmergencyLocatorService"]
Cfg --> AuthR["AuthorityRouter"]
Cfg --> Overpass["OverpassService"]
Redis["CacheHelper"] --> Geo
Redis --> EL
Redis --> Route
Redis --> AuthR
EL --> Overpass
EL --> Geo
AuthR --> Overpass
Main["FastAPI app"] --> EL
Main --> Route
Main --> Geo
Main --> AuthR
Main --> Overpass
```

**Diagram sources**
- [backend/main.py:24-63](file://backend/main.py#L24-L63)
- [backend/core/config.py:11-181](file://backend/core/config.py#L11-L181)
- [backend/core/redis_client.py:10-140](file://backend/core/redis_client.py#L10-L140)

**Section sources**
- [backend/main.py:24-63](file://backend/main.py#L24-L63)
- [backend/core/config.py:11-181](file://backend/core/config.py#L11-L181)
- [backend/core/redis_client.py:10-140](file://backend/core/redis_client.py#L10-L140)

## Performance Considerations
- Caching:
  - Emergency and routing responses are cached with dedicated TTLs.
  - Geocoding results are cached with a longer TTL.
  - CacheHelper supports Redis and in-memory fallback with health tracking.
- Rate limiting:
  - Nominatim requests are rate-limited using a per-instance lock and sleep to respect provider policies.
- Fallback strategies:
  - Emergency locator tries database, then local catalog, then Overpass.
  - Geocoding tries Photon, then falls back to Nominatim.
  - Routing prefers ORS with API key; otherwise uses OSRM.
- Request normalization:
  - Providers’ responses are normalized into unified schemas to reduce downstream complexity.

**Section sources**
- [backend/core/redis_client.py:43-125](file://backend/core/redis_client.py#L43-L125)
- [backend/services/geocoding_service.py:99-111](file://backend/services/geocoding_service.py#L99-L111)
- [backend/services/emergency_locator.py:342-374](file://backend/services/emergency_locator.py#L342-L374)
- [backend/services/routing_service.py:61-105](file://backend/services/routing_service.py#L61-L105)

## Troubleshooting Guide
- Health endpoint:
  - Returns availability of database and cache, plus environment and version.
  - On degraded database state, returns 503 with structured payload.
- Error mapping:
  - ExternalServiceError raised by services is mapped to 503 in routers.
  - ServiceValidationError is mapped to 422 in routing.
- Common issues:
  - Missing ORS API key leads to OSRM fallback; expect reduced features and potential rate limits.
  - Overpass unavailability triggers fallback logic in emergency locator.
  - Nominatim throttling can cause delays; adjust environment variables if needed.
  - Cache unavailability falls back to in-memory store; monitor health via health endpoint.

**Section sources**
- [backend/main.py:103-125](file://backend/main.py#L103-L125)
- [backend/api/v1/emergency.py:38-40](file://backend/api/v1/emergency.py#L38-L40)
- [backend/api/v1/routing.py:37-40](file://backend/api/v1/routing.py#L37-L40)
- [backend/services/exceptions.py:1-7](file://backend/services/exceptions.py#L1-L7)

## Conclusion
The backend implements robust API integration patterns with layered caching, provider fallbacks, and strict error handling. Emergency discovery combines local data, OSM, and geocoding to deliver resilient results. Routing integrates premium and free providers with normalization. The architecture supports offline bundling and health monitoring, enabling reliable operation across varied network conditions.