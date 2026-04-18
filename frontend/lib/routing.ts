/**
 * OSRM Routing — FREE open-source routing, no API key.
 *
 * Provides driving directions between two GPS points using OpenStreetMap data.
 * Used for "Get Directions to Hospital" button on the map.
 *
 * @see https://project-osrm.org/
 */

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
  /** Total distance in meters */
  distanceMeters: number;
  /** Total distance formatted (e.g. "3.2 km") */
  distanceFormatted: string;
  /** Total duration in seconds */
  durationSeconds: number;
  /** Duration formatted (e.g. "8 min") */
  durationFormatted: string;
  /** GeoJSON geometry for rendering on MapLibre */
  geometry: GeoJSON.Geometry;
}

/**
 * Get driving route from point A to point B.
 * Uses OSRM public demo server — free for development/hackathon.
 *
 * Note: OSRM uses (lon,lat) order in the URL.
 */
export async function getRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<RouteResult | null> {
  try {
    // OSRM: {lon},{lat};{lon},{lat}
    const url = `${OSRM_URL}/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const distanceMeters = route.distance || 0;
    const durationSeconds = route.duration || 0;

    return {
      distanceMeters,
      distanceFormatted: formatDistance(distanceMeters),
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      geometry: route.geometry,
    };
  } catch {
    return null;
  }
}

/**
 * Format distance in meters to human-readable string.
 */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to human-readable string.
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

/**
 * Add a route polyline to a MapLibre map.
 * Call this after getRoute() to render the route visually.
 */
export function addRouteToMap(
  map: any, // maplibregl.Map
  geometry: GeoJSON.Geometry,
  options: {
    sourceId?: string;
    layerId?: string;
    color?: string;
    width?: number;
  } = {}
): void {
  const {
    sourceId = 'route-source',
    layerId = 'route-layer',
    color = '#ef4444',
    width = 4,
  } = options;

  // Remove existing route if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry,
    },
  });

  map.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': color,
      'line-width': width,
      'line-opacity': 0.8,
    },
  });
}

/**
 * Remove a route from the map.
 */
export function removeRouteFromMap(
  map: any,
  sourceId: string = 'route-source',
  layerId: string = 'route-layer'
): void {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}
