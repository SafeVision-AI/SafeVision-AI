from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


EmergencyCategory = Literal['hospital', 'police', 'ambulance', 'fire', 'towing', 'pharmacy', 'puncture', 'showroom']
RoadIssueStatus = Literal['open', 'acknowledged', 'in_progress', 'resolved', 'rejected']
RouteProfile = Literal['driving-car', 'cycling-regular', 'foot-walking']


class HealthResponse(BaseModel):
    status: str
    database_available: bool
    chatbot_ready: bool
    chatbot_mode: str
    cache_available: bool
    cache_backend: str
    environment: str
    version: str


class EmergencyNumber(BaseModel):
    service: str
    coverage: str
    notes: str | None = None


class EmergencyNumbersResponse(BaseModel):
    numbers: dict[str, EmergencyNumber]


class EmergencyServiceItem(BaseModel):
    id: str
    name: str
    category: str
    sub_category: str | None = None
    phone: str | None = None
    phone_emergency: str | None = None
    lat: float
    lon: float
    distance_meters: float
    has_trauma: bool = False
    has_icu: bool = False
    is_24hr: bool = True
    address: str | None = None
    source: str = 'database'


class EmergencyResponse(BaseModel):
    services: list[EmergencyServiceItem]
    count: int
    radius_used: int
    source: str


class SosResponse(BaseModel):
    services: list[EmergencyServiceItem]
    count: int
    radius_used: int
    source: str
    numbers: dict[str, EmergencyNumber]


class GeocodeResult(BaseModel):
    display_name: str
    city: str | None = None
    state: str | None = None
    state_code: str | None = None
    country_code: str | None = None
    postcode: str | None = None
    lat: float | None = None
    lon: float | None = None


class GeocodeSearchResponse(BaseModel):
    results: list[GeocodeResult]


class AuthorityPreviewResponse(BaseModel):
    road_type: str
    road_type_code: str
    road_name: str | None = None
    road_number: str | None = None
    authority_name: str
    helpline: str
    complaint_portal: str
    escalation_path: str
    exec_engineer: str | None = None
    exec_engineer_phone: str | None = None
    contractor_name: str | None = None
    budget_sanctioned: int | None = None
    budget_spent: int | None = None
    last_relayed_date: date | None = None
    next_maintenance: date | None = None
    data_source_url: str | None = None
    source: str = 'authority_matrix'


class RoadInfrastructureResponse(BaseModel):
    road_type: str
    road_type_code: str
    road_name: str | None = None
    road_number: str | None = None
    contractor_name: str | None = None
    exec_engineer: str | None = None
    exec_engineer_phone: str | None = None
    budget_sanctioned: int | None = None
    budget_spent: int | None = None
    last_relayed_date: date | None = None
    next_maintenance: date | None = None
    data_source_url: str | None = None
    source: str


class RoadIssueItem(BaseModel):
    uuid: UUID
    issue_type: str
    severity: int
    description: str | None = None
    lat: float
    lon: float
    location_address: str | None = None
    road_name: str | None = None
    road_type: str | None = None
    road_number: str | None = None
    authority_name: str | None = None
    status: RoadIssueStatus
    created_at: datetime
    distance_meters: float


class RoadIssuesResponse(BaseModel):
    issues: list[RoadIssueItem]
    count: int
    radius_used: int


class RoadReportResponse(BaseModel):
    uuid: UUID
    complaint_ref: str | None = None
    authority_name: str
    authority_phone: str
    complaint_portal: str
    road_type: str
    road_type_code: str
    road_number: str | None = None
    road_name: str | None = None
    exec_engineer: str | None = None
    exec_engineer_phone: str | None = None
    contractor_name: str | None = None
    last_relayed_date: date | None = None
    next_maintenance: date | None = None
    budget_sanctioned: int | None = None
    budget_spent: int | None = None
    photo_url: str | None = None
    status: RoadIssueStatus


class RoutePoint(BaseModel):
    lat: float
    lon: float
    label: str | None = None


class RouteBounds(BaseModel):
    south: float
    west: float
    north: float
    east: float


class RouteInstruction(BaseModel):
    index: int
    instruction: str
    distance_meters: float
    duration_seconds: float
    street_name: str | None = None
    instruction_type: int | None = None
    exit_number: int | None = None


class RouteOption(BaseModel):
    route_id: str
    label: str
    distance_meters: float
    duration_seconds: float
    path: list[RoutePoint]
    bounds: RouteBounds
    steps: list[RouteInstruction] = Field(default_factory=list)


class RoutePreviewResponse(BaseModel):
    provider: str
    profile: RouteProfile
    distance_meters: float
    duration_seconds: float
    path: list[RoutePoint]
    bounds: RouteBounds
    origin: RoutePoint
    destination: RoutePoint
    steps: list[RouteInstruction] = Field(default_factory=list)
    routes: list[RouteOption] = Field(default_factory=list)
    selected_route_id: str
    reroute_threshold_meters: float = 75.0
    warnings: list[str] = Field(default_factory=list)


class ServiceCandidate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    lat: float
    lon: float
    distance_meters: float
    address: str | None = None
    phone: str | None = None
    source: str
