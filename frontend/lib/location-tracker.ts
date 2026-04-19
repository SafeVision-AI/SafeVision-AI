import type maplibregl from 'maplibre-gl';

interface TrackerOptions {
  onUpdate?: (pos: GeolocationPosition) => void;
  onError?: (err: GeolocationPositionError) => void;
}

export function startLocationTracking(map: maplibregl.Map, options: TrackerOptions = {}): () => void {
  // Add living dot source for user
  if (!map.getSource('user-location')) {
    map.addSource('user-location', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: {},
      },
    });

    // Outer pulse ring
    map.addLayer({
      id: 'user-dot-pulse',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 14, 18, 22],
        'circle-color': '#1A5C38',
        'circle-opacity': 0.25,
      },
    });

    // Inner solid dot
    map.addLayer({
      id: 'user-dot',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 18, 12],
        'circle-color': '#22C55E',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
      },
    });
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      (map.getSource('user-location') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: { accuracy: pos.coords.accuracy },
      });
      options.onUpdate?.(pos);
    },
    (err) => {
      console.error('[LocationTracker] Error:', err);
      options.onError?.(err);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );

  // Return cleanup function
  return () => navigator.geolocation.clearWatch(watchId);
}
