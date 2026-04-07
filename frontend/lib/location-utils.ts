import type { GpsLocation } from '@/lib/store';

const APPROXIMATE_LOCATION_THRESHOLD_METERS = 2500;

function formatShortLabel(location: GpsLocation) {
  if (location.city) {
    return `${location.city}${location.state ? `, ${location.state}` : ''}`.replace(/,\s*$/, '');
  }

  if (location.displayName) {
    return location.displayName;
  }

  return `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`;
}

export function isApproximateLocation(location: GpsLocation | null | undefined) {
  return Boolean(location && location.accuracy >= APPROXIMATE_LOCATION_THRESHOLD_METERS);
}

export function formatAccuracyLabel(location: GpsLocation | null | undefined) {
  if (!location) {
    return null;
  }

  if (location.accuracy >= 1000) {
    return `${(location.accuracy / 1000).toFixed(1)} km accuracy`;
  }

  return `${Math.round(location.accuracy)} m accuracy`;
}

export function formatLocationLabel(location: GpsLocation | null | undefined, gpsError: string | null) {
  if (gpsError) {
    return 'Enable Location';
  }

  if (!location) {
    return 'Use My Location';
  }

  const label = formatShortLabel(location);
  return isApproximateLocation(location) ? `Approx. ${label}` : label;
}

export function formatLocationSubtitle(location: GpsLocation | null | undefined) {
  if (!location) {
    return 'Enable location for live nearby results';
  }

  if (isApproximateLocation(location)) {
    return `Approximate browser/device location${location.accuracy ? ` · ${formatAccuracyLabel(location)}` : ''}`;
  }

  return location.displayName ?? formatShortLabel(location);
}
