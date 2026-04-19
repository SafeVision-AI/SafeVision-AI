import type maplibregl from 'maplibre-gl';

const SAFE_SPACE_COLORS: Record<string, string> = {
  restaurant: '#F59E0B',
  cafe: '#F59E0B',
  pharmacy: '#10B981',
  hospital: '#EF4444',
  police: '#3B82F6',
  fire_station: '#F97316',
  supermarket: '#8B5CF6',
  convenience: '#8B5CF6',
};

export async function addSafeSpacesLayer(
  map: maplibregl.Map,
  lat: number,
  lon: number
): Promise<void> {
  const res = await fetch(`/api/v1/emergency/safe-spaces?lat=${lat}&lon=${lon}&radius=1000`);
  const spaces: Array<{ name: string; type: string; lat: number; lon: number; phone?: string }> = await res.json();

  const features = spaces.map(s => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
    properties: { name: s.name, type: s.type, phone: s.phone ?? '' },
  }));

  if (map.getSource('safe-spaces')) {
    (map.getSource('safe-spaces') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
    return;
  }

  map.addSource('safe-spaces', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  });

  map.addLayer({
    id: 'safe-spaces-circles',
    type: 'circle',
    source: 'safe-spaces',
    paint: {
      'circle-radius': 8,
      'circle-color': [
        'match',
        ['get', 'type'],
        'restaurant', '#F59E0B',
        'cafe', '#F59E0B',
        'pharmacy', '#10B981',
        'hospital', '#EF4444',
        'police', '#3B82F6',
        '#8B5CF6', // default
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  });
}
