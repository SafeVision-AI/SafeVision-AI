'use client';

import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { addTrafficLayer, toggleTrafficLayer } from '@/lib/traffic-layer';
import { addSafeSpacesLayer } from '@/lib/safe-spaces-layer';
import { startLocationTracking } from '@/lib/location-tracker';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const OPENFREEMAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty';
const ACCURACY_SOURCE_ID = 'svai-current-location-accuracy';
const ACCURACY_FILL_LAYER_ID = 'svai-current-location-accuracy-fill';
const ACCURACY_LINE_LAYER_ID = 'svai-current-location-accuracy-line';
const ROUTE_SOURCE_ID = 'svai-active-route';
const ROUTE_ALT_CASING_LAYER_ID = 'svai-alt-route-casing';
const ROUTE_ALT_LINE_LAYER_ID = 'svai-alt-route-line';
const ROUTE_CASING_LAYER_ID = 'svai-active-route-casing';
const ROUTE_LINE_LAYER_ID = 'svai-active-route-line';
const FACILITY_SOURCE_ID = 'svai-facilities';
const FACILITY_CLUSTER_LAYER_ID = 'svai-facility-clusters';
const FACILITY_CLUSTER_COUNT_LAYER_ID = 'svai-facility-cluster-count';
const FACILITY_UNCLUSTERED_LAYER_ID = 'svai-facility-points';
const FACILITY_SELECTED_LAYER_ID = 'svai-facility-selected';

type MapStyleCandidate = {
  kind: 'maptiler-vector' | 'maptiler-raster' | 'openfreemap';
  label: string;
  style: unknown;
};

function buildMapTilerRasterStyle(tileUrl: string) {
  return {
    version: 8,
    name: 'SafeVisionAI MapTiler Streets Raster Fallback',
    glyphs: MAPTILER_KEY
      ? `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`
      : undefined,
    sources: {
      'svai-maptiler-raster': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 22,
        attribution:
          '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
      },
    },
    layers: [
      {
        id: 'svai-maptiler-raster-background',
        type: 'background',
        paint: {
          'background-color': '#eef2f7',
        },
      },
      {
        id: 'svai-maptiler-raster-layer',
        type: 'raster',
        source: 'svai-maptiler-raster',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

function buildFacilityCollection(
  facilities: MapLibreFacility[],
  selectedFacilityId: string | null
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: facilities
      .filter((facility) => facility.coords && facility.coords.length >= 2)
      .map((facility) => ({
        type: 'Feature',
        properties: {
          id: facility.id,
          name: facility.name,
          type: facility.type,
          accentColor: facility.accentColor,
          icon: facility.icon || iconForType(facility.type),
          distance: facility.distance ?? '',
          address: facility.address ?? '',
          phone: facility.phone ?? '',
          selected: facility.id === selectedFacilityId ? 1 : 0,
        },
        geometry: {
          type: 'Point',
          coordinates: [facility.coords![1], facility.coords![0]],
        },
      })),
  };
}



export interface MapLibreFacility {
  id: string;
  name: string;
  coords: [number, number] | null;
  type: string;
  accentColor: string;
  distance?: string;
  address?: string;
  phone?: string;
  icon?: string;
}

export interface MapLibreIssue {
  id: string;
  label: string;
  coords: [number, number];
  accentColor: string;
  icon?: string;
  overline?: string;
  description?: string;
  status?: string;
  roadName?: string;
}

export interface MapLibreCurrentLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  title?: string;
  subtitle?: string;
}

export interface MapLibreRoutePoint {
  lat: number;
  lon: number;
}

export interface MapLibreRoute {
  routeId?: string;
  label?: string;
  path: MapLibreRoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
}

type PolygonFeature = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

interface MapLibreCanvasProps {
  center: [number, number];
  zoom?: number;
  facilities?: MapLibreFacility[];
  issues?: MapLibreIssue[];
  currentLocation?: MapLibreCurrentLocation | null;
  route?: MapLibreRoute | null;
  alternativeRoutes?: MapLibreRoute[];
  selectedFacilityId?: string | null;
  viewportMode?: 'center' | 'fit';
  navigationPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

function iconForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('hospital')) return 'local_hospital';
  if (normalized.includes('ambulance')) return 'emergency';
  if (normalized.includes('pharmacy')) return 'medication';
  if (normalized.includes('police')) return 'local_police';
  if (normalized.includes('fire')) return 'local_fire_department';
  if (normalized.includes('tow')) return 'tow';
  if (normalized.includes('mechanic')) return 'build';
  return 'place';
}

function buildMarkerElement({
  color,
  icon,
  kind = 'standard',
  selected = false,
}: {
  color: string;
  icon: string;
  kind?: 'standard' | 'issue' | 'current';
  selected?: boolean;
}) {
  const marker = document.createElement('div');
  const shell = document.createElement('div');
  const glyph = document.createElement('span');

  marker.style.transform = 'translate(-50%, -50%)';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';

  shell.style.width = kind === 'current' ? '24px' : '38px';
  shell.style.height = kind === 'current' ? '24px' : '38px';
  shell.style.borderRadius = '999px';
  shell.style.display = 'flex';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.background = kind === 'current' ? color : 'rgba(7, 19, 37, 0.92)';
  shell.style.border =
    kind === 'current' ? '3px solid rgba(255,255,255,0.92)' : `2px solid ${color}`;
  shell.style.boxShadow =
    kind === 'current'
      ? '0 0 0 8px rgba(37, 99, 235, 0.16), 0 10px 24px rgba(2, 6, 23, 0.25)'
      : `0 12px 28px rgba(2, 6, 23, 0.28), 0 0 0 6px color-mix(in srgb, ${color} 18%, transparent)`;
  if (selected && kind !== 'current') {
    shell.style.transform = 'scale(1.08)';
    shell.style.boxShadow = `0 16px 34px rgba(2, 6, 23, 0.34), 0 0 0 8px color-mix(in srgb, ${color} 24%, transparent)`;
  }

  glyph.className = 'material-symbols-outlined';
  glyph.textContent = kind === 'current' ? 'my_location' : icon;
  glyph.style.fontVariationSettings = "'FILL' 1, 'wght' 500, 'opsz' 24";
  glyph.style.fontSize = kind === 'current' ? '13px' : kind === 'issue' ? '18px' : '19px';
  glyph.style.lineHeight = '1';
  glyph.style.color = kind === 'current' ? '#ffffff' : color;

  shell.appendChild(glyph);
  marker.appendChild(shell);
  return marker;
}

function buildPopupContent(title: string, overline?: string, details: string[] = []) {
  const wrapper = document.createElement('div');
  const heading = document.createElement('div');

  wrapper.style.minWidth = '220px';
  wrapper.style.maxWidth = '220px';
  wrapper.style.fontFamily = 'Inter, sans-serif';
  wrapper.style.color = '#0f172a';

  heading.textContent = title;
  heading.style.fontWeight = '800';
  heading.style.fontSize = '14px';
  heading.style.letterSpacing = '-0.02em';
  heading.style.whiteSpace = 'nowrap';
  heading.style.overflow = 'hidden';
  heading.style.textOverflow = 'ellipsis';
  wrapper.appendChild(heading);

  if (overline) {
    const label = document.createElement('div');
    label.textContent = overline;
    label.style.marginTop = '4px';
    label.style.fontSize = '11px';
    label.style.fontWeight = '700';
    label.style.color = '#475569';
    wrapper.appendChild(label);
  }

  details.filter(Boolean).forEach((detail, index) => {
    const row = document.createElement('div');
    row.textContent = detail;
    row.style.marginTop = index === 0 ? '10px' : '6px';
    row.style.fontSize = '12px';
    row.style.lineHeight = '1.45';
    row.style.color = '#334155';
    row.style.whiteSpace = 'nowrap';
    row.style.overflow = 'hidden';
    row.style.textOverflow = 'ellipsis';
    wrapper.appendChild(row);
  });

  return wrapper;
}

function buildAccuracyFeature(lat: number, lon: number, accuracyMeters: number): PolygonFeature {
  const steps = 48;
  const earthRadiusMeters = 6_378_137;
  const angularDistance = accuracyMeters / earthRadiusMeters;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 0.00001);

  const coordinates = Array.from({ length: steps + 1 }, (_, index) => {
    const bearing = (index / steps) * Math.PI * 2;
    const latOffset = angularDistance * Math.cos(bearing);
    const lonOffset = (angularDistance * Math.sin(bearing)) / cosLat;

    return [lon + (lonOffset * 180) / Math.PI, lat + (latOffset * 180) / Math.PI];
  });

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}

export function MapLibreCanvas({
  center,
  zoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 13),
  facilities = [],
  issues = [],
  currentLocation,
  route = null,
  alternativeRoutes = [],
  selectedFacilityId = null,
  viewportMode = 'center',
  navigationPosition = 'bottom-left',
  className = 'absolute inset-0 h-full w-full',
}: MapLibreCanvasProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const facilityPopupRef = useRef<maplibregl.Popup | null>(null);
  const activeStyleIndexRef = useRef(0);
  const styleReadyRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>('Loading map...');
  const [styleRevision, setStyleRevision] = useState(0);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSafeSpaces, setShowSafeSpaces] = useState(false);
  const { resolvedTheme } = useTheme();

  const STYLE_CANDIDATES = useMemo<MapStyleCandidate[]>(() => {
    // Read the explicit styles from the .env file!
    const lightStyle = process.env.NEXT_PUBLIC_MAPTILER_STYLE_LIGHT ?? 'streets-v2';
    const darkStyle = process.env.NEXT_PUBLIC_MAPTILER_STYLE_DARK ?? 'dataviz-dark';
    
    const styleId = resolvedTheme === 'dark' ? darkStyle : lightStyle;

    const mapTilerStyleUrl = MAPTILER_KEY
      ? `https://api.maptiler.com/maps/${styleId}/style.json?key=${MAPTILER_KEY}`
      : null;
    const mapTilerRasterUrl = MAPTILER_KEY
      ? `https://api.maptiler.com/maps/${styleId}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      : null;

    return [
      ...(mapTilerRasterUrl
        ? [
            {
              kind: 'maptiler-raster',
              label: 'MapTiler Streets',
              style: buildMapTilerRasterStyle(mapTilerRasterUrl),
            } as MapStyleCandidate,
          ]
        : []),
      ...(mapTilerStyleUrl
        ? [
            {
              kind: 'maptiler-vector',
              label: 'MapTiler Streets vector',
              style: mapTilerStyleUrl,
            } as MapStyleCandidate,
          ]
        : []),
      {
        kind: 'openfreemap',
        label: 'OpenFreeMap Liberty',
        style: OPENFREEMAP_STYLE_URL,
      },
    ];
  }, [resolvedTheme]);

  const candidatesRef = useRef(STYLE_CANDIDATES);
  useEffect(() => {
    candidatesRef.current = STYLE_CANDIDATES;
  }, [STYLE_CANDIDATES]);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const activeCandidate = STYLE_CANDIDATES[activeStyleIndexRef.current];
      if (activeCandidate) {
        styleReadyRef.current = false;
        mapRef.current.setStyle(activeCandidate.style as maplibregl.StyleSpecification);
      }
    }
  }, [STYLE_CANDIDATES]);

  const liveFacilities = useMemo(
    () => facilities.filter((facility) => facility.coords),
    [facilities]
  );

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    let disposed = false;
    let map: maplibregl.Map | null = null;
    let stopLocationTracking: (() => void) | null = null;

    async function initializeMap() {
      setStatus('loading');
      setStatusMessage('Loading map...');
      activeStyleIndexRef.current = 0;
      styleReadyRef.current = false;

      if (disposed || !mapNodeRef.current) {
        return;
      }

      const getActiveCandidate = () => candidatesRef.current[activeStyleIndexRef.current];

      map = new maplibregl.Map({
        container: mapNodeRef.current,
        style: getActiveCandidate().style as maplibregl.StyleSpecification,
        center: [center[1], center[0]],
        zoom,
        maxZoom: 18,
        minZoom: 3,
        renderWorldCopies: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
        fadeDuration: 0,
      });

      const applyNextStyle = (message: string) => {
        if (!map) {
          return;
        }

        const nextIndex = activeStyleIndexRef.current + 1;
        if (nextIndex >= candidatesRef.current.length) {
          setStatus('error');
          setStatusMessage('Map service is unavailable right now.');
          return;
        }

        activeStyleIndexRef.current = nextIndex;
        styleReadyRef.current = false;
        setStatus('loading');
        setStatusMessage(message);
        setStyleRevision((revision) => revision + 1);
        map.setStyle(candidatesRef.current[nextIndex].style as maplibregl.StyleSpecification);
      };

      const handleMapError = (event: unknown) => {
        const errorEvent = event as {
          error?: { message?: string; status?: number };
          sourceId?: string;
        };
        const message = (errorEvent?.error?.message ?? '').toLowerCase();
        const activeCandidate = getActiveCandidate();
        const isMapTilerFailure =
          message.includes('maptiler') ||
          message.includes('401') ||
          message.includes('403') ||
          message.includes('sprite') ||
          message.includes('glyph') ||
          message.includes('style') ||
          message.includes('source') ||
          message.includes('tilejson') ||
          message.includes('raster') ||
          message.includes('image');

        if (activeCandidate.kind === 'maptiler-raster' && isMapTilerFailure) {
          applyNextStyle('MapTiler tiles unavailable, trying vector fallback...');
          return;
        }

        if (activeCandidate.kind === 'maptiler-vector' && isMapTilerFailure) {
          applyNextStyle('MapTiler tiles unavailable, switching to OpenFreeMap...');
          return;
        }

        if (!styleReadyRef.current) {
          setStatus('error');
          setStatusMessage('Map service is unavailable right now.');
        }
      };

      const handleStyleImageMissing = (event: unknown) => {
        const imageEvent = event as { id?: string };
        const activeCandidate = getActiveCandidate();
        const missingId = typeof imageEvent?.id === 'string' ? imageEvent.id.trim() : '';

        if (activeCandidate.kind === 'maptiler-vector' && missingId.length === 0) {
          applyNextStyle('MapTiler vector assets unavailable, switching to OpenFreeMap...');
        }
      };

      const syncReadyState = () => {
        if (!map || styleReadyRef.current) {
          return;
        }

        if (map.isStyleLoaded() && map.areTilesLoaded()) {
          styleReadyRef.current = true;
          setStatus('ready');
        }
      };

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
          visualizePitch: false,
        }),
        navigationPosition
      );
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.once('load', () => {
        map?.resize();
        map?.jumpTo({
          center: [center[1], center[0]],
          zoom,
        });
        if (map) {
          addTrafficLayer(map);
          toggleTrafficLayer(map, showTraffic);
          stopLocationTracking = startLocationTracking(map);
        }
      });
      map.on('idle', syncReadyState);
      map.on('sourcedata', syncReadyState);
      map.on('error', handleMapError);
      map.on('styleimagemissing', handleStyleImageMissing);

      mapRef.current = map;

      window.setTimeout(() => {
        if (!disposed && map && !styleReadyRef.current) {
          const activeCandidate = getActiveCandidate();
          if (activeCandidate.kind === 'maptiler-raster') {
            applyNextStyle('MapTiler raster style timed out, trying vector fallback...');
            return;
          }
          if (activeCandidate.kind === 'maptiler-vector') {
            applyNextStyle('MapTiler fallback timed out, switching to OpenFreeMap...');
            return;
          }
          setStatus('error');
          setStatusMessage('Map style did not finish loading.');
        }
      }, 7000);
    }

    initializeMap().catch(() => {
      if (!disposed) {
        setStatus('error');
        setStatusMessage('Unable to initialize the map.');
      }
    });

    return () => {
      disposed = true;
      stopLocationTracking?.();   // clear geolocation.watchPosition
      map?.remove();
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      mapRef.current = null;
      activeStyleIndexRef.current = 0;
      styleReadyRef.current = false;
    };
  }, [center, navigationPosition, zoom, showTraffic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const syncAccuracyOverlay = () => {
      const hasSource = Boolean(map.getSource(ACCURACY_SOURCE_ID));

      if (!currentLocation?.accuracy) {
        if (map.getLayer(ACCURACY_FILL_LAYER_ID)) {
          map.removeLayer(ACCURACY_FILL_LAYER_ID);
        }
        if (map.getLayer(ACCURACY_LINE_LAYER_ID)) {
          map.removeLayer(ACCURACY_LINE_LAYER_ID);
        }
        if (hasSource) {
          map.removeSource(ACCURACY_SOURCE_ID);
        }
        return;
      }

      const circleFeature = buildAccuracyFeature(
        currentLocation.lat,
        currentLocation.lon,
        Math.max(currentLocation.accuracy, 35)
      );

      if (hasSource) {
        const source = map.getSource(ACCURACY_SOURCE_ID) as maplibregl.GeoJSONSource;
        source.setData(circleFeature);
        return;
      }

      map.addSource(ACCURACY_SOURCE_ID, {
        type: 'geojson',
        data: circleFeature,
      });
      map.addLayer({
        id: ACCURACY_FILL_LAYER_ID,
        type: 'fill',
        source: ACCURACY_SOURCE_ID,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.12,
        },
      });
      map.addLayer({
        id: ACCURACY_LINE_LAYER_ID,
        type: 'line',
        source: ACCURACY_SOURCE_ID,
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
          'line-opacity': 0.55,
        },
      });
    };

    if (map.isStyleLoaded()) {
      syncAccuracyOverlay();
      return;
    }

    map.once('load', syncAccuracyOverlay);
    return () => {
      map.off('load', syncAccuracyOverlay);
    };
  }, [currentLocation, styleRevision]);

  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && mapRef.current) {
        mapRef.current.flyTo({
          center: [customEvent.detail.lng, customEvent.detail.lat],
          zoom: 16,
          essential: true,
        });
      }
    };
    window.addEventListener('svai:fly-to', handleFlyTo);
    return () => window.removeEventListener('svai:fly-to', handleFlyTo);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const syncRouteOverlay = () => {
      const hasSource = Boolean(map.getSource(ROUTE_SOURCE_ID));

      const alternativeFeatures = alternativeRoutes
        .filter((candidate) => candidate.path?.length && candidate.path.length >= 2)
        .map((candidate) => ({
          type: 'Feature',
          properties: {
            kind: 'alternative',
            routeId: candidate.routeId ?? '',
          },
          geometry: {
            type: 'LineString',
            coordinates: candidate.path.map((point) => [point.lon, point.lat]),
          },
        }));

      if (!route?.path?.length || route.path.length < 2) {
        if (map.getLayer(ROUTE_LINE_LAYER_ID)) {
          map.removeLayer(ROUTE_LINE_LAYER_ID);
        }
        if (map.getLayer(ROUTE_CASING_LAYER_ID)) {
          map.removeLayer(ROUTE_CASING_LAYER_ID);
        }
        if (map.getLayer(ROUTE_ALT_LINE_LAYER_ID)) {
          map.removeLayer(ROUTE_ALT_LINE_LAYER_ID);
        }
        if (map.getLayer(ROUTE_ALT_CASING_LAYER_ID)) {
          map.removeLayer(ROUTE_ALT_CASING_LAYER_ID);
        }
        if (hasSource) {
          map.removeSource(ROUTE_SOURCE_ID);
        }
        return;
      }

      const routeFeatures = [
        ...alternativeFeatures,
        {
          type: 'Feature',
          properties: {
            kind: 'primary',
            routeId: route.routeId ?? '',
          },
          geometry: {
            type: 'LineString',
            coordinates: route.path.map((point) => [point.lon, point.lat]),
          },
        },
      ] as GeoJSON.Feature<GeoJSON.LineString>[];

      const routeCollection = {
        type: 'FeatureCollection',
        features: routeFeatures,
      } as GeoJSON.FeatureCollection<GeoJSON.LineString>;

      if (hasSource) {
        const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource;
        source.setData(routeCollection);
        return;
      }

      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: routeCollection,
      });
      if (!map.getLayer(ROUTE_ALT_CASING_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_ALT_CASING_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'alternative'],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'rgba(255,255,255,0.7)',
            'line-width': 7,
            'line-opacity': 0.75,
          },
        });
      }
      if (!map.getLayer(ROUTE_ALT_LINE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_ALT_LINE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'alternative'],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#7c93d7',
            'line-width': 4,
            'line-opacity': 0.45,
            'line-dasharray': [1, 1.4],
          },
        });
      }

      if (!map.getLayer(ROUTE_CASING_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_CASING_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'primary'],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'rgba(255,255,255,0.92)',
            'line-width': 10,
            'line-opacity': 0.96,
          },
        });
      }
      if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LINE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'primary'],
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#2563eb',
            'line-width': 6,
            'line-opacity': 0.98,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      syncRouteOverlay();
      return;
    }

    map.once('load', syncRouteOverlay);
    return () => {
      map.off('load', syncRouteOverlay);
    };
  }, [alternativeRoutes, route, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const popup =
      facilityPopupRef.current ?? new maplibregl.Popup({ closeButton: false, offset: 22 });
    facilityPopupRef.current = popup;
    const collection = buildFacilityCollection(liveFacilities, selectedFacilityId);
    let handlersBound = false;

    const syncFacilityLayers = () => {
      const existingSource = map.getSource(FACILITY_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(collection);
      } else {
        map.addSource(FACILITY_SOURCE_ID, {
          type: 'geojson',
          data: collection,
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 48,
        });
      }

      if (!map.getLayer(FACILITY_CLUSTER_LAYER_ID)) {
        map.addLayer({
          id: FACILITY_CLUSTER_LAYER_ID,
          type: 'circle',
          source: FACILITY_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#2563eb',
              8,
              '#1d4ed8',
              16,
              '#1e3a8a',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              8,
              22,
              16,
              28,
            ],
            'circle-opacity': 0.92,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
      }

      if (!map.getLayer(FACILITY_CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: FACILITY_CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: FACILITY_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });
      }

      if (!map.getLayer(FACILITY_SELECTED_LAYER_ID)) {
        map.addLayer({
          id: FACILITY_SELECTED_LAYER_ID,
          type: 'circle',
          source: FACILITY_SOURCE_ID,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'selected'], 1]],
          paint: {
            'circle-color': ['get', 'accentColor'],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              18,
              14,
              22,
            ],
            'circle-opacity': 0.28,
            'circle-stroke-width': 0,
          },
        });
      }

      if (!map.getLayer(FACILITY_UNCLUSTERED_LAYER_ID)) {
        map.addLayer({
          id: FACILITY_UNCLUSTERED_LAYER_ID,
          type: 'circle',
          source: FACILITY_SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'accentColor'],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5,
              7,
              11,
              9,
              16,
              11,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-opacity': 0.95,
          },
        });
      }
    };

    const handleClusterClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId == null) {
        return;
      }

      const source = map.getSource(FACILITY_SOURCE_ID) as maplibregl.GeoJSONSource & {
        getClusterExpansionZoom: (
          clusterId: number,
          callback: (error: Error | null, zoom: number) => void
        ) => void;
      };

      source.getClusterExpansionZoom(clusterId, (error, expansionZoom) => {
        if (error || !feature || feature.geometry.type !== 'Point') {
          return;
        }

        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: Math.max(expansionZoom, 14),
          duration: 650,
        });
      });
    };

    const handleFacilityClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') {
        return;
      }

      const properties = feature.properties as Record<string, string>;
      popup
        .setLngLat(feature.geometry.coordinates as [number, number])
        .setDOMContent(
          buildPopupContent(
            properties.name ?? 'Emergency service',
            [properties.type, properties.distance].filter(Boolean).join(' - '),
            [properties.address, properties.phone ? `Call: ${properties.phone}` : undefined].filter(
              Boolean
            ) as string[]
          )
        )
        .addTo(map);
    };

    const handlePointerEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handlePointerLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    const bindHandlers = () => {
      if (handlersBound) {
        return;
      }

      map.on('click', FACILITY_CLUSTER_LAYER_ID, handleClusterClick);
      map.on('click', FACILITY_UNCLUSTERED_LAYER_ID, handleFacilityClick);
      map.on('mouseenter', FACILITY_CLUSTER_LAYER_ID, handlePointerEnter);
      map.on('mouseenter', FACILITY_UNCLUSTERED_LAYER_ID, handlePointerEnter);
      map.on('mouseleave', FACILITY_CLUSTER_LAYER_ID, handlePointerLeave);
      map.on('mouseleave', FACILITY_UNCLUSTERED_LAYER_ID, handlePointerLeave);
      handlersBound = true;
    };

    const initializeFacilities = () => {
      syncFacilityLayers();
      bindHandlers();
    };

    if (map.isStyleLoaded()) {
      initializeFacilities();
    } else {
      map.once('load', initializeFacilities);
    }

    return () => {
      map.off('load', initializeFacilities);
      if (handlersBound) {
        map.off('click', FACILITY_CLUSTER_LAYER_ID, handleClusterClick);
        map.off('click', FACILITY_UNCLUSTERED_LAYER_ID, handleFacilityClick);
        map.off('mouseenter', FACILITY_CLUSTER_LAYER_ID, handlePointerEnter);
        map.off('mouseenter', FACILITY_UNCLUSTERED_LAYER_ID, handlePointerEnter);
        map.off('mouseleave', FACILITY_CLUSTER_LAYER_ID, handlePointerLeave);
        map.off('mouseleave', FACILITY_UNCLUSTERED_LAYER_ID, handlePointerLeave);
      }
    };
  }, [liveFacilities, selectedFacilityId, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    if (currentLocation) {
      const popup = new maplibregl.Popup({ offset: 18 }).setDOMContent(
        buildPopupContent(
          currentLocation.title ?? 'Current location',
          currentLocation.subtitle,
          currentLocation.accuracy ? [`Accuracy: ${Math.round(currentLocation.accuracy)} m`] : []
        )
      );

      markerRefs.current.push(
        new maplibregl.Marker({
          element: buildMarkerElement({
            color: '#2563eb',
            icon: 'my_location',
            kind: 'current',
          }),
          anchor: 'center',
        })
          .setLngLat([currentLocation.lon, currentLocation.lat])
          .setPopup(popup)
          .addTo(map)
      );
    }

    issues.forEach((issue) => {
      const [lat, lon] = issue.coords;
      const popup = new maplibregl.Popup({ offset: 22 }).setDOMContent(
        buildPopupContent(
          issue.label,
          issue.overline,
          [issue.roadName, issue.description, issue.status ? `Status: ${issue.status}` : undefined].filter(
            Boolean
          ) as string[]
        )
      );

      markerRefs.current.push(
        new maplibregl.Marker({
          element: buildMarkerElement({
            color: issue.accentColor,
            icon: issue.icon ?? 'warning',
            kind: 'issue',
          }),
          anchor: 'center',
        })
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map)
      );
    });

    if (selectedFacilityId) {
      const selected = liveFacilities.find((f) => f.id === selectedFacilityId);
      if (selected && selected.coords) {
        markerRefs.current.push(
          new maplibregl.Marker({
            element: buildMarkerElement({
              color: selected.accentColor,
              icon: selected.icon || iconForType(selected.type),
              kind: 'standard',
              selected: true,
            }),
            anchor: 'center',
          })
            .setLngLat([selected.coords[1], selected.coords[0]])
            .addTo(map)
        );
      }
    }
  }, [currentLocation, issues, styleRevision, liveFacilities, selectedFacilityId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const allPoints: Array<[number, number]> = [];

    if (currentLocation) {
      allPoints.push([currentLocation.lon, currentLocation.lat]);
    }
    liveFacilities.forEach((facility) => {
      if (facility.coords) {
        allPoints.push([facility.coords[1], facility.coords[0]]);
      }
    });
    issues.forEach((issue) => {
      allPoints.push([issue.coords[1], issue.coords[0]]);
    });
    if (route?.path?.length) {
      route.path.forEach((point) => {
        allPoints.push([point.lon, point.lat]);
      });
    }
    alternativeRoutes.forEach((candidate) => {
      candidate.path.forEach((point) => {
        allPoints.push([point.lon, point.lat]);
      });
    });

    if ((viewportMode === 'fit' || route?.path?.length) && allPoints.length > 1) {
      const bounds = allPoints.reduce(
        (acc, point) => acc.extend(point),
        new maplibregl.LngLatBounds(allPoints[0], allPoints[0])
      );

      map.fitBounds(bounds, {
        padding: { top: 72, right: 56, bottom: 72, left: 56 },
        duration: 900,
        maxZoom: 15.5,
      });
      return;
    }

    map.easeTo({
      center: [center[1], center[0]],
      zoom,
      duration: 850,
      essential: true,
    });
  }, [alternativeRoutes, center, currentLocation, issues, liveFacilities, route, styleRevision, viewportMode, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);
    const timeout = window.setTimeout(handleResize, 150);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      toggleTrafficLayer(mapRef.current, showTraffic);
    }
  }, [showTraffic, styleRevision]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded() || !currentLocation) return;
    
    if (showSafeSpaces) {
      // Only add the layer if it doesn't already exist (prevents duplicate on re-render)
      if (!mapRef.current.getLayer('safe-spaces-circles')) {
        addSafeSpacesLayer(mapRef.current, currentLocation.lat, currentLocation.lon).catch((err) => {
          console.error(err);
          setStatus('error');
          setStatusMessage('Failed to load safe spaces overlay. Please try again later.');
        });
      }
    }
  }, [showSafeSpaces, currentLocation, styleRevision]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    const hasLayer = mapRef.current.getLayer('safe-spaces-circles');
    if (hasLayer) {
      mapRef.current.setLayoutProperty('safe-spaces-circles', 'visibility', showSafeSpaces ? 'visible' : 'none');
    }
  }, [showSafeSpaces, styleRevision]);

  return (
    <div className={className}>
      <div ref={mapNodeRef} className="absolute inset-0 h-full w-full overflow-hidden" />
      {status !== 'ready' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/18 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-white/10 bg-[#071325]/85 px-4 py-3 text-center shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
              {status === 'error' ? 'Map Offline' : 'Initializing Map'}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-100">{statusMessage}</div>
          </div>
        </div>
      ) : null}
      
      {/* Toggles Overlay */}
      {status === 'ready' && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => setShowTraffic(t => !t)}
            className={`px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-colors border ${
              showTraffic 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {showTraffic ? '🚦 Traffic: ON' : '🚦 Traffic: OFF'}
          </button>
          
          <button
            onClick={() => setShowSafeSpaces(s => !s)}
            className={`px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-colors border ${
              showSafeSpaces 
                ? 'bg-emerald-500 text-white border-emerald-600' 
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {showSafeSpaces ? '🛡️ Safe Spaces: ON' : '🛡️ Safe Spaces: OFF'}
          </button>
        </div>
      )}
    </div>
  );
}
