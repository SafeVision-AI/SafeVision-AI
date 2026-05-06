from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


EmergencyCategory = Literal['hospital', 'police', 'ambulance', 'fire', 'towing', 'pharmacy', 'puncture', 'showroom']
RoadIssueStatus = Literal['open', 'acknowledged', 'in_progress', 'resolved', 'rejected']
RouteProfile = Literal['driving-car', 'cycling-regular', 'foot-walking']
BloodGroup = Literal['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']


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
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    label: str | None = Field(default=None, max_length=120)


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


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = Field(default=None, min_length=1, max_length=128)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)


class ChatResponse(BaseModel):
    response: str
    intent: str | None = None
    sources: list[str] = Field(default_factory=list)
    session_id: str


class ChallanQuery(BaseModel):
    violation_code: str = Field(min_length=1, max_length=32)
    vehicle_class: str = Field(min_length=1, max_length=32)
    state_code: str = Field(min_length=1, max_length=64)
    is_repeat: bool = False


class ChallanResponse(BaseModel):
    violation_code: str
    vehicle_class: str
    state_code: str
    base_fine: int
    repeat_fine: int | None = None
    amount_due: int
    section: str
    description: str
    state_override: str | None = None


class EmergencyContact(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=7, max_length=20, pattern=r'^\+?[0-9][0-9\s-]{5,18}[0-9]$')
    relation: str | None = Field(default=None, max_length=40)


class UserProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    blood_group: BloodGroup | None = None
    emergency_contacts: list[EmergencyContact] = Field(default_factory=list, max_length=5)
    allergies: str | None = Field(default=None, max_length=500)
    vehicle_details: str | None = Field(default=None, max_length=120)
    medical_notes: str | None = Field(default=None, max_length=1000)

    @field_validator('blood_group', mode='before')
    @classmethod
    def normalize_blood_group(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper().replace(' POSITIVE', '+').replace(' NEGATIVE', '-')
        normalized = normalized.replace('POSITIVE', '+').replace('NEGATIVE', '-').replace(' ', '')
        return normalized


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    blood_group: BloodGroup | None = None
    emergency_contacts: list[EmergencyContact] | None = Field(default=None, max_length=5)
    allergies: str | None = Field(default=None, max_length=500)
    vehicle_details: str | None = Field(default=None, max_length=120)
    medical_notes: str | None = Field(default=None, max_length=1000)

    @field_validator('blood_group', mode='before')
    @classmethod
    def normalize_blood_group(cls, value: str | None) -> str | None:
        return UserProfileCreate.normalize_blood_group(value)


class UserProfileResponse(UserProfileCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
