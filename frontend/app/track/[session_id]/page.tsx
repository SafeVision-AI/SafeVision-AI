'use client';

import { use, useEffect, useRef, useState } from 'react';
import { subscribeToTracking, LiveLocation } from '@/lib/live-tracking';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Load map without SSR (Leaflet requires browser)
const EmergencyMap = dynamic(
  () => import('@/components/EmergencyMap').then((m) => m.EmergencyMap),
  { ssr: false, loading: () => <div className="flex-1 bg-slate-900 animate-pulse" /> }
);

interface PageProps {
  params: Promise<{ session_id: string }>;
}

export default function FamilyTrackingPage({ params }: PageProps) {
  const { session_id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!session_id || !token) {
      setExpired(true);
      setLoading(false);
      return;
    }

    stopRef.current = subscribeToTracking(
      session_id,
      token,
      (loc) => {
        setLocation(loc);
        setLastUpdated(new Date());
        setLoading(false);
      },
      () => {
        setExpired(true);
        setLoading(false);
      },
      5000
    );

    return () => stopRef.current?.();
  }, [session_id, token]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const mapFacilities = location
    ? [
        {
          id: 'victim',
          name: `${location.user_name} — LIVE`,
          type: 'sos' as const,
          coords: [location.latitude, location.longitude] as [number, number],
          accentColor: '#ef4444',
          distance: 'LIVE',
        },
      ]
    : [];

  // ── Expired ──────────────────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-white font-black text-xl mb-2">Session Ended</h1>
          <p className="text-slate-400 text-sm">
            The emergency tracking session has been closed. The person is likely safe.
          </p>
          <p className="text-slate-500 text-xs mt-4">
            If you still cannot reach them, call 112.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h1 className="text-white font-black text-xl mb-2">Connecting to Live Tracking...</h1>
          <p className="text-slate-400 text-sm">Finding location. This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  // ── Live View ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-red-600 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-red-100 text-[10px] font-bold uppercase tracking-widest">
            🆘 Emergency Live Tracking
          </div>
          <div className="text-white font-black text-lg leading-tight">
            {location?.user_name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>
      </header>

      {/* Vital Info Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">Blood Group</div>
          <div className="text-white font-black text-base">
            {location?.blood_group || '—'}
          </div>
        </div>
        <div className="text-center border-x border-slate-700">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">Speed</div>
          <div className="text-white font-black text-base">
            {location?.speed_kmh != null ? `${Math.round(location.speed_kmh)} km/h` : '— km/h'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">Battery</div>
          <div
            className={`font-black text-base ${
              (location?.battery_percent ?? 100) < 20 ? 'text-red-400' : 'text-white'
            }`}
          >
            {location?.battery_percent != null ? `${location.battery_percent}%` : '—'}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[50vh]">
        {location && (
          <EmergencyMap
            center={[location.latitude, location.longitude]}
            facilities={mapFacilities}
            currentLocation={null}
          />
        )}

        {/* Last Updated Chip */}
        {lastUpdated && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            Last updated: {formatTime(lastUpdated)}
          </div>
        )}
      </div>

      {/* Vehicle Info + Emergency CTA */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
        {location?.vehicle_number && (
          <div className="text-center text-slate-400 text-xs">
            Vehicle: <span className="text-white font-bold">{location.vehicle_number}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:112"
            className="bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
          >
            📞 Call 112
          </a>
          <a
            href="tel:108"
            className="bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
          >
            🚑 Call 108
          </a>
        </div>

        <p className="text-slate-500 text-[10px] text-center">
          Location updates every 5 seconds · Session valid for 4 hours · Powered by SafeVixAI
        </p>
      </div>
    </div>
  );
}
