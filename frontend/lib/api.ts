import axios from 'axios';
import { getAddressFromGPS } from './reverse-geocode';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 8_000,
});

export type EmergencyServiceCategory =
  | 'hospital'
  | 'police'
  | 'ambulance'
  | 'fire'
  | 'towing'
  | 'pharmacy'
  | 'puncture'
  | 'showroom';

export type RoadIssueStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type RouteProfile = 'driving-car' | 'cycling-regular' | 'foot-walking';

export interface EmergencyService {
  id: string;
  name: string;
  category: EmergencyServiceCategory | string;
  subCategory?: string | null;
  phone?: string | null;
  phoneEmergency?: string | null;
  lat: number;
  lon: number;
  distanceMeters: number;
  hasTrauma: boolean;
  hasIcu: boolean;
  is24Hr: boolean;
  address?: string | null;
  source: string;
}

export interface EmergencyResponse {
  services: EmergencyService[];
  count: number;
  radiusUsed: number;
  source: string;
}

export interface SosResponse extends EmergencyResponse {
  numbers: Record<
    string,
    {
      service: string;
      coverage: string;
      notes?: string | null;
    }
  >;
}

export interface NearbyServicesParams {
  lat: number;
  lon: number;
  radius?: number;
  categories?: EmergencyServiceCategory | EmergencyServiceCategory[] | string | string[];
  limit?: number;
}

export interface EmergencyNumbersResponse {
  numbers: Record<
    string,
    {
      service: string;
      coverage: string;
      notes?: string | null;
    }
  >;
}

export interface GeocodeResult {
  displayName: string;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
  postcode?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface GeocodeSearchResponse {
  results: GeocodeResult[];
}

export interface ReverseGeocodeResponse extends GeocodeResult {}

export interface RoadIssue {
  uuid: string;
  issueType: string;
  severity: number;
  description?: string | null;
  lat: number;
  lon: number;
  locationAddress?: string | null;
  roadName?: string | null;
  roadType?: string | null;
  roadNumber?: string | null;
  authorityName?: string | null;
  status: RoadIssueStatus;
  createdAt: string;
  distanceMeters: number;
}

export interface RoadIssuesResponse {
  issues: RoadIssue[];
  count: number;
  radiusUsed: number;
}

export interface AuthorityPreviewResponse {
  roadType: string;
  roadTypeCode: string;
  roadName?: string | null;
  roadNumber?: string | null;
  authorityName: string;
  helpline: string;
  complaintPortal: string;
  escalationPath: string;
  execEngineer?: string | null;
  execEngineerPhone?: string | null;
  contractorName?: string | null;
  budgetSanctioned?: number | null;
  budgetSpent?: number | null;
  lastRelayedDate?: string | null;
  nextMaintenance?: string | null;
  dataSourceUrl?: string | null;
  source: string;
}

export interface RoadInfrastructureResponse {
  roadType: string;
  roadTypeCode: string;
  roadName?: string | null;
  roadNumber?: string | null;
  contractorName?: string | null;
  execEngineer?: string | null;
  execEngineerPhone?: string | null;
  budgetSanctioned?: number | null;
  budgetSpent?: number | null;
  lastRelayedDate?: string | null;
  nextMaintenance?: string | null;
  dataSourceUrl?: string | null;
  source: string;
}

export interface ReportPayload {
  lat: number;
  lon: number;
  severity: number;
  description?: string;
  type?: string;
  issue_type?: string;
  photo?: File | Blob | null;
}

export interface RoadReportResponse {
  uuid: string;
  complaintRef?: string | null;
  authorityName: string;
  authorityPhone: string;
  complaintPortal: string;
  roadType: string;
  roadTypeCode: string;
  roadNumber?: string | null;
  roadName?: string | null;
  execEngineer?: string | null;
  execEngineerPhone?: string | null;
  contractorName?: string | null;
  lastRelayedDate?: string | null;
  nextMaintenance?: string | null;
  budgetSanctioned?: number | null;
  budgetSpent?: number | null;
  photoUrl?: string | null;
  status: RoadIssueStatus;
}

export interface RoutePoint {
  lat: number;
  lon: number;
  label?: string | null;
}

export interface RouteBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RouteInstruction {
  index: number;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  streetName?: string | null;
  instructionType?: number | null;
  exitNumber?: number | null;
}

export interface RouteOption {
  routeId: string;
  label: string;
  distanceMeters: number;
  durationSeconds: number;
  path: RoutePoint[];
  bounds: RouteBounds;
  steps: RouteInstruction[];
}

export interface RoutePreviewResponse {
  provider: string;
  profile: RouteProfile | string;
  distanceMeters: number;
  durationSeconds: number;
  path: RoutePoint[];
  bounds: RouteBounds;
  origin: RoutePoint;
  destination: RoutePoint;
  steps: RouteInstruction[];
  routes: RouteOption[];
  selectedRouteId: string;
  rerouteThresholdMeters: number;
  warnings: string[];
}

function csvParam(value?: string | string[]) {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value.join(',') : value;
}

function normalizeEmergencyService(item: {
  id: string;
  name: string;
  category: string;
  sub_category?: string | null;
  phone?: string | null;
  phone_emergency?: string | null;
  lat: number;
  lon: number;
  distance_meters: number;
  has_trauma?: boolean;
  has_icu?: boolean;
  is_24hr?: boolean;
  address?: string | null;
  source?: string;
}): EmergencyService {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subCategory: item.sub_category ?? null,
    phone: item.phone ?? null,
    phoneEmergency: item.phone_emergency ?? null,
    lat: item.lat,
    lon: item.lon,
    distanceMeters: item.distance_meters,
    hasTrauma: Boolean(item.has_trauma),
    hasIcu: Boolean(item.has_icu),
    is24Hr: item.is_24hr ?? true,
    address: item.address ?? null,
    source: item.source ?? 'api',
  };
}

function normalizeEmergencyResponse(data: {
  services?: Array<Parameters<typeof normalizeEmergencyService>[0]>;
  count?: number;
  radius_used?: number;
  source?: string;
}): EmergencyResponse {
  const services = (data.services ?? []).map(normalizeEmergencyService);

  return {
    services,
    count: data.count ?? services.length,
    radiusUsed: data.radius_used ?? 0,
    source: data.source ?? 'api',
  };
}

function normalizeGeocodeResult(result: {
  display_name: string;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  country_code?: string | null;
  postcode?: string | null;
  lat?: number | null;
  lon?: number | null;
}): GeocodeResult {
  return {
    displayName: result.display_name,
    city: result.city ?? null,
    state: result.state ?? null,
    stateCode: result.state_code ?? null,
    countryCode: result.country_code ?? null,
    postcode: result.postcode ?? null,
    lat: result.lat ?? null,
    lon: result.lon ?? null,
  };
}

function normalizeRoadIssue(issue: {
  uuid: string;
  issue_type: string;
  severity: number;
  description?: string | null;
  lat: number;
  lon: number;
  location_address?: string | null;
  road_name?: string | null;
  road_type?: string | null;
  road_number?: string | null;
  authority_name?: string | null;
  status: RoadIssueStatus;
  created_at: string;
  distance_meters: number;
}): RoadIssue {
  return {
    uuid: issue.uuid,
    issueType: issue.issue_type,
    severity: issue.severity,
    description: issue.description ?? null,
    lat: issue.lat,
    lon: issue.lon,
    locationAddress: issue.location_address ?? null,
    roadName: issue.road_name ?? null,
    roadType: issue.road_type ?? null,
    roadNumber: issue.road_number ?? null,
    authorityName: issue.authority_name ?? null,
    status: issue.status,
    createdAt: issue.created_at,
    distanceMeters: issue.distance_meters,
  };
}

function normalizeAuthorityPreview(data: {
  road_type: string;
  road_type_code: string;
  road_name?: string | null;
  road_number?: string | null;
  authority_name: string;
  helpline: string;
  complaint_portal: string;
  escalation_path: string;
  exec_engineer?: string | null;
  exec_engineer_phone?: string | null;
  contractor_name?: string | null;
  budget_sanctioned?: number | null;
  budget_spent?: number | null;
  last_relayed_date?: string | null;
  next_maintenance?: string | null;
  data_source_url?: string | null;
  source: string;
}): AuthorityPreviewResponse {
  return {
    roadType: data.road_type,
    roadTypeCode: data.road_type_code,
    roadName: data.road_name ?? null,
    roadNumber: data.road_number ?? null,
    authorityName: data.authority_name,
    helpline: data.helpline,
    complaintPortal: data.complaint_portal,
    escalationPath: data.escalation_path,
    execEngineer: data.exec_engineer ?? null,
    execEngineerPhone: data.exec_engineer_phone ?? null,
    contractorName: data.contractor_name ?? null,
    budgetSanctioned: data.budget_sanctioned ?? null,
    budgetSpent: data.budget_spent ?? null,
    lastRelayedDate: data.last_relayed_date ?? null,
    nextMaintenance: data.next_maintenance ?? null,
    dataSourceUrl: data.data_source_url ?? null,
    source: data.source,
  };
}

function normalizeInfrastructure(data: {
  road_type: string;
  road_type_code: string;
  road_name?: string | null;
  road_number?: string | null;
  contractor_name?: string | null;
  exec_engineer?: string | null;
  exec_engineer_phone?: string | null;
  budget_sanctioned?: number | null;
  budget_spent?: number | null;
  last_relayed_date?: string | null;
  next_maintenance?: string | null;
  data_source_url?: string | null;
  source: string;
}): RoadInfrastructureResponse {
  return {
    roadType: data.road_type,
    roadTypeCode: data.road_type_code,
    roadName: data.road_name ?? null,
    roadNumber: data.road_number ?? null,
    contractorName: data.contractor_name ?? null,
    execEngineer: data.exec_engineer ?? null,
    execEngineerPhone: data.exec_engineer_phone ?? null,
    budgetSanctioned: data.budget_sanctioned ?? null,
    budgetSpent: data.budget_spent ?? null,
    lastRelayedDate: data.last_relayed_date ?? null,
    nextMaintenance: data.next_maintenance ?? null,
    dataSourceUrl: data.data_source_url ?? null,
    source: data.source,
  };
}

function normalizeRoadReport(data: {
  uuid: string;
  complaint_ref?: string | null;
  authority_name: string;
  authority_phone: string;
  complaint_portal: string;
  road_type: string;
  road_type_code: string;
  road_number?: string | null;
  road_name?: string | null;
  exec_engineer?: string | null;
  exec_engineer_phone?: string | null;
  contractor_name?: string | null;
  last_relayed_date?: string | null;
  next_maintenance?: string | null;
  budget_sanctioned?: number | null;
  budget_spent?: number | null;
  photo_url?: string | null;
  status: RoadIssueStatus;
}): RoadReportResponse {
  return {
    uuid: data.uuid,
    complaintRef: data.complaint_ref ?? null,
    authorityName: data.authority_name,
    authorityPhone: data.authority_phone,
    complaintPortal: data.complaint_portal,
    roadType: data.road_type,
    roadTypeCode: data.road_type_code,
    roadNumber: data.road_number ?? null,
    roadName: data.road_name ?? null,
    execEngineer: data.exec_engineer ?? null,
    execEngineerPhone: data.exec_engineer_phone ?? null,
    contractorName: data.contractor_name ?? null,
    lastRelayedDate: data.last_relayed_date ?? null,
    nextMaintenance: data.next_maintenance ?? null,
    budgetSanctioned: data.budget_sanctioned ?? null,
    budgetSpent: data.budget_spent ?? null,
    photoUrl: data.photo_url ?? null,
    status: data.status,
  };
}

function normalizeRoutePoint(point: {
  lat: number;
  lon: number;
  label?: string | null;
}): RoutePoint {
  return {
    lat: point.lat,
    lon: point.lon,
    label: point.label ?? null,
  };
}

function normalizeRouteInstruction(step: {
  index: number;
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  street_name?: string | null;
  instruction_type?: number | null;
  exit_number?: number | null;
}): RouteInstruction {
  return {
    index: step.index,
    instruction: step.instruction,
    distanceMeters: step.distance_meters,
    durationSeconds: step.duration_seconds,
    streetName: step.street_name ?? null,
    instructionType: step.instruction_type ?? null,
    exitNumber: step.exit_number ?? null,
  };
}

function normalizeRouteOption(route: {
  route_id: string;
  label: string;
  distance_meters: number;
  duration_seconds: number;
  path: Array<{ lat: number; lon: number; label?: string | null }>;
  bounds: RouteBounds;
  steps?: Array<{
    index: number;
    instruction: string;
    distance_meters: number;
    duration_seconds: number;
    street_name?: string | null;
    instruction_type?: number | null;
    exit_number?: number | null;
  }>;
}): RouteOption {
  return {
    routeId: route.route_id,
    label: route.label,
    distanceMeters: route.distance_meters,
    durationSeconds: route.duration_seconds,
    path: (route.path ?? []).map(normalizeRoutePoint),
    bounds: route.bounds,
    steps: (route.steps ?? []).map(normalizeRouteInstruction),
  };
}

function normalizeRoutePreview(data: {
  provider: string;
  profile: RouteProfile | string;
  distance_meters: number;
  duration_seconds: number;
  path: Array<{ lat: number; lon: number; label?: string | null }>;
  bounds: RouteBounds;
  origin: { lat: number; lon: number; label?: string | null };
  destination: { lat: number; lon: number; label?: string | null };
  steps?: Array<{
    index: number;
    instruction: string;
    distance_meters: number;
    duration_seconds: number;
    street_name?: string | null;
    instruction_type?: number | null;
    exit_number?: number | null;
  }>;
  routes?: Array<{
    route_id: string;
    label: string;
    distance_meters: number;
    duration_seconds: number;
    path: Array<{ lat: number; lon: number; label?: string | null }>;
    bounds: RouteBounds;
    steps?: Array<{
      index: number;
      instruction: string;
      distance_meters: number;
      duration_seconds: number;
      street_name?: string | null;
      instruction_type?: number | null;
      exit_number?: number | null;
    }>;
  }>;
  selected_route_id?: string;
  reroute_threshold_meters?: number;
  warnings?: string[];
}): RoutePreviewResponse {
  const routes = (data.routes ?? []).map(normalizeRouteOption);
  return {
    provider: data.provider,
    profile: data.profile,
    distanceMeters: data.distance_meters,
    durationSeconds: data.duration_seconds,
    path: (data.path ?? []).map(normalizeRoutePoint),
    bounds: data.bounds,
    origin: normalizeRoutePoint(data.origin),
    destination: normalizeRoutePoint(data.destination),
    steps: (data.steps ?? []).map(normalizeRouteInstruction),
    routes,
    selectedRouteId: data.selected_route_id ?? routes[0]?.routeId ?? 'route-1',
    rerouteThresholdMeters: data.reroute_threshold_meters ?? 75,
    warnings: data.warnings ?? [],
  };
}

// Emergency
export async function fetchNearbyServices(params: NearbyServicesParams): Promise<EmergencyResponse> {
  const { data } = await client.get('/api/v1/emergency/nearby', {
    params: {
      lat: params.lat,
      lon: params.lon,
      radius: params.radius,
      categories: csvParam(params.categories),
      limit: params.limit,
    },
  });

  return normalizeEmergencyResponse(data);
}

export async function fetchSosPayload(params: {
  lat: number;
  lon: number;
}): Promise<SosResponse> {
  const { data } = await client.get('/api/v1/emergency/sos', { params });
  return {
    ...normalizeEmergencyResponse(data),
    numbers: data.numbers ?? {},
  };
}

export async function fetchEmergencyNumbers(): Promise<EmergencyNumbersResponse> {
  const { data } = await client.get('/api/v1/emergency/numbers');
  return data;
}

// Geocode
export async function reverseGeocode(params: {
  lat: number;
  lon: number;
}): Promise<ReverseGeocodeResponse> {
  // Use BigDataCloud purely on the frontend to avoid backend load
  const result = await getAddressFromGPS(params.lat, params.lon);
  if (!result) {
    return { displayName: 'Unknown Location', lat: params.lat, lon: params.lon };
  }
  return {
    displayName: result.displayAddress,
    city: result.city,
    state: result.state,
    lat: params.lat,
    lon: params.lon,
  };
}

export async function searchGeocode(q: string): Promise<GeocodeSearchResponse> {
  const { data } = await client.get('/api/v1/geocode/search', { params: { q } });
  return {
    results: (data.results ?? []).map(normalizeGeocodeResult),
  };
}

// RoadWatch
export async function fetchRoadIssues(params: {
  lat: number;
  lon: number;
  radius?: number;
  limit?: number;
  statuses?: RoadIssueStatus | RoadIssueStatus[] | string | string[];
}): Promise<RoadIssuesResponse> {
  const { data } = await client.get('/api/v1/roads/issues', {
    params: {
      lat: params.lat,
      lon: params.lon,
      radius: params.radius,
      limit: params.limit,
      statuses: csvParam(params.statuses),
    },
  });

  const issues = (data.issues ?? []).map(normalizeRoadIssue);

  return {
    issues,
    count: data.count ?? issues.length,
    radiusUsed: data.radius_used ?? 0,
  };
}

export async function fetchAuthorityPreview(params: {
  lat: number;
  lon: number;
}): Promise<AuthorityPreviewResponse> {
  const { data } = await client.get('/api/v1/roads/authority', { params });
  return normalizeAuthorityPreview(data);
}

export async function fetchRoadInfrastructure(params: {
  lat: number;
  lon: number;
}): Promise<RoadInfrastructureResponse> {
  const { data } = await client.get('/api/v1/roads/infrastructure', { params });
  return normalizeInfrastructure(data);
}

export async function submitReport(payload: ReportPayload): Promise<RoadReportResponse> {
  const issueType = payload.issue_type ?? payload.type;
  if (!issueType) {
    throw new Error('submitReport requires either "issue_type" or "type".');
  }

  const formData = new FormData();
  formData.append('lat', String(payload.lat));
  formData.append('lon', String(payload.lon));
  formData.append('issue_type', issueType);
  formData.append('severity', String(payload.severity));

  if (payload.description?.trim()) {
    formData.append('description', payload.description.trim());
  }

  if (payload.photo) {
    formData.append('photo', payload.photo);
  }

  const { data } = await client.post('/api/v1/roads/report', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return normalizeRoadReport(data);
}

// Routing
export async function fetchRoutePreview(params: {
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
  profile?: RouteProfile;
  alternatives?: number;
}): Promise<RoutePreviewResponse> {
  const { data } = await client.get('/api/v1/routing/preview', {
    params: {
      origin_lat: params.originLat,
      origin_lon: params.originLon,
      destination_lat: params.destinationLat,
      destination_lon: params.destinationLon,
      profile: params.profile ?? 'driving-car',
      alternatives: params.alternatives ?? 2,
    },
  });

  return normalizeRoutePreview(data);
}

// Chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  lat?: number;
  lon?: number;
}

export interface ChatResponse {
  response: string;
  intent?: string;
  sources?: string[];
  session_id: string;
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const { data } = await client.post('/api/v1/chat/', req);
  return data;
}

// Challan
export interface ChallanQuery {
  violation_code: string;
  vehicle_class: string;
  state_code: string;
  is_repeat: boolean;
}

export interface ChallanResult {
  base_fine: number;
  repeat_fine: number | null;
  section: string;
  description: string;
  state_override?: string;
}

export async function calculateChallan(query: ChallanQuery): Promise<ChallanResult> {
  const { data } = await client.post('/api/v1/challan/calculate', query);
  return data;
}
