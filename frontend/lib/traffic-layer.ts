import type maplibregl from 'maplibre-gl';
import { logClientWarning } from './client-logger';

const TOMTOM_KEY = process.env.NEXT_PUBLIC_TOMTOM_KEY;

export function addTrafficLayer(map: maplibregl.Map): void {
  if (!TOMTOM_KEY) {
    logClientWarning('[Traffic] NEXT_PUBLIC_TOMTOM_KEY not set; traffic layer disabled');
    return;
  }

  map.addSource('tomtom-traffic-flow', {
    type: 'raster',
    tiles: [
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`,
    ],
    tileSize: 256,
    attribution: 'TomTom Traffic',
  });

  map.addLayer({
    id: 'traffic-flow',
    type: 'raster',
    source: 'tomtom-traffic-flow',
    paint: { 'raster-opacity': 0.7 },
  });

  map.addSource('tomtom-incidents', {
    type: 'raster',
    tiles: [
      `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`,
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: 'traffic-incidents',
    type: 'raster',
    source: 'tomtom-incidents',
    paint: { 'raster-opacity': 0.9 },
  });
}

export function toggleTrafficLayer(map: maplibregl.Map, show: boolean): void {
  if (!map.getLayer('traffic-flow')) return;
  map.setLayoutProperty('traffic-flow', 'visibility', show ? 'visible' : 'none');
  map.setLayoutProperty('traffic-incidents', 'visibility', show ? 'visible' : 'none');
}
