'use client';

import React, { useMemo } from 'react';

import { MapLibreCanvas, MapLibreFacility, MapLibreIssue } from '@/components/maps/MapLibreCanvas';
import { formatLocationSubtitle, isApproximateLocation } from '@/lib/location-utils';
import { FALLBACK_MAP_CENTER, FALLBACK_MAP_ZOOM, LIVE_MAP_ZOOM } from '@/lib/map-defaults';
import { NearbyRoadIssue, NearbyService, useAppStore } from '@/lib/store';

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function serviceIcon(category: NearbyService['category']) {
  switch (category) {
    case 'hospital':
      return 'local_hospital';
    case 'police':
      return 'local_police';
    case 'ambulance':
      return 'emergency';
    case 'fire':
      return 'local_fire_department';
    case 'pharmacy':
      return 'medication';
    case 'puncture':
      return 'tire_repair';
    case 'showroom':
      return 'directions_car';
    case 'towing':
    default:
      return 'tow';
  }
}

function serviceColor(category: NearbyService['category']) {
  switch (category) {
    case 'hospital':
      return '#ef4444';
    case 'police':
      return '#3b82f6';
    case 'ambulance':
      return '#10b981';
    case 'fire':
      return '#f97316';
    case 'pharmacy':
      return '#06b6d4';
    case 'puncture':
      return '#8b5cf6';
    case 'showroom':
      return '#64748b';
    case 'towing':
    default:
      return '#f59e0b';
  }
}

function issueColor(issue: NearbyRoadIssue) {
  if (issue.severity >= 4) {
    return '#ff5545';
  }

  const normalizedType = issue.issueType.toLowerCase();
  if (normalizedType.includes('flood') || normalizedType.includes('rain')) {
    return '#3b82f6';
  }
  if (normalizedType.includes('traffic') || normalizedType.includes('accident')) {
    return '#f97316';
  }
  return '#f59e0b';
}

function issueIcon(issue: NearbyRoadIssue) {
  if (issue.severity >= 4) {
    return 'warning';
  }

  const normalizedType = issue.issueType.toLowerCase();
  if (normalizedType.includes('flood') || normalizedType.includes('rain')) {
    return 'rainy';
  }
  if (normalizedType.includes('traffic') || normalizedType.includes('accident')) {
    return 'traffic';
  }
  return 'report_problem';
}

export default function MapBackgroundInner() {
  const { gpsLocation, nearbyRoadIssues, nearbyServices } = useAppStore((state) => ({
    gpsLocation: state.gpsLocation,
    nearbyServices: state.nearbyServices,
    nearbyRoadIssues: state.nearbyRoadIssues,
  }));

  const center: [number, number] = gpsLocation
    ? [gpsLocation.lat, gpsLocation.lon]
    : FALLBACK_MAP_CENTER;
  const approximateLocation = isApproximateLocation(gpsLocation);

  const facilities = useMemo<MapLibreFacility[]>(
    () =>
      nearbyServices.map((service) => ({
        id: service.id,
        name: service.name,
        coords: [service.lat, service.lon],
        type: service.category,
        accentColor: serviceColor(service.category),
        distance: formatDistance(service.distance),
        address: service.address,
        phone: service.phone,
        icon: serviceIcon(service.category),
      })),
    [nearbyServices]
  );

  const issues = useMemo<MapLibreIssue[]>(
    () =>
      nearbyRoadIssues.map((issue) => ({
        id: issue.uuid,
        label: issue.issueType,
        coords: [issue.lat, issue.lon],
        accentColor: issueColor(issue),
        icon: issueIcon(issue),
        overline: `Severity ${issue.severity} - ${formatDistance(issue.distance)}`,
        description: issue.description,
        status: issue.status.replaceAll('_', ' '),
        roadName: issue.roadName,
      })),
    [nearbyRoadIssues]
  );

  return (
    <div className="absolute inset-0 z-0 h-full min-h-full w-full overflow-hidden">
      <MapLibreCanvas
        center={center}
        zoom={gpsLocation ? LIVE_MAP_ZOOM : FALLBACK_MAP_ZOOM}
        facilities={facilities}
        issues={issues}
        currentLocation={
          gpsLocation
            ? {
                lat: gpsLocation.lat,
                lon: gpsLocation.lon,
                accuracy: gpsLocation.accuracy,
                title: 'Current location',
                subtitle: formatLocationSubtitle(gpsLocation),
              }
            : null
        }
        viewportMode="center"
        navigationPosition="bottom-left"
      />
      {!gpsLocation ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <div className="rounded-full border border-white/20 bg-slate-950/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-xl">
            Enable location for live nearby results
          </div>
        </div>
      ) : approximateLocation ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <div className="rounded-full border border-amber-300/35 bg-slate-950/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100 backdrop-blur-xl">
            Approximate device location · move outdoors or enable precise GPS
          </div>
        </div>
      ) : null}
    </div>
  );
}
