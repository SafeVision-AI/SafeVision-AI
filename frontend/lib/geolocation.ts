'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, GpsLocation } from '@/lib/store';

interface GeolocationResult {
  location: GpsLocation | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useGeolocation(): GeolocationResult {
  const { setGpsLocation, setGpsError, gpsLocation, gpsError } = useAppStore((s) => ({
    setGpsLocation: s.setGpsLocation,
    setGpsError: s.setGpsError,
    gpsLocation: s.gpsLocation,
    gpsError: s.gpsError,
  }));
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!window.isSecureContext && !isLocalhost) {
      setGpsError('Location access requires HTTPS or localhost in the browser.');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by your browser.');
      return;
    }

    setLoading(true);
    setGpsError(null);

    clearWatch();

    const handleSuccess = (pos: GeolocationPosition) => {
      setGpsLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
        city: gpsLocation?.city,
        state: gpsLocation?.state,
        displayName: gpsLocation?.displayName,
      });
      setLoading(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      const messages: Record<number, string> = {
        1: 'Location permission denied. Please allow access in browser settings.',
        2: 'Location unavailable. Try again or check GPS signal.',
        3: 'Location request timed out. Please try again.',
      };
      setGpsError(messages[err.code] ?? 'Unknown location error.');
      setLoading(false);
    };

    const resolvePosition = () => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      } as const;

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 5_000,
      });
    };

    if (!navigator.permissions?.query) {
      resolvePosition();
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'denied') {
          clearWatch();
          setGpsError('Location permission is blocked in the browser. Enable it and retry.');
          setLoading(false);
          return;
        }

        resolvePosition();
      })
      .catch(() => {
        resolvePosition();
      });
  }, [clearWatch, gpsLocation?.city, gpsLocation?.displayName, gpsLocation?.state, setGpsLocation, setGpsError]);

  useEffect(() => {
    requestLocation();
    return () => {
      clearWatch();
    };
  }, [clearWatch, requestLocation]);

  return {
    location: gpsLocation,
    error: gpsError,
    loading,
    refresh: requestLocation,
  };
}
