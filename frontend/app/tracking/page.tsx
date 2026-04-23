'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { EmergencyMap } from '@/components/EmergencyMap';
import SystemHeader from '@/components/dashboard/SystemHeader';
import { Loader2, Users, MapPin, Navigation } from 'lucide-react';

interface FamilyMember {
  user_id: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export default function TrackingPage() {
  const { gpsLocation, userProfile } = useAppStore();
  const [groupId, setGroupId] = useState('');
  const [userId, setUserId] = useState(userProfile?.name || '');
  const [connected, setConnected] = useState(false);
  const [members, setMembers] = useState<Record<string, FamilyMember>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const centerCoords: [number, number] = gpsLocation ? [gpsLocation.lat, gpsLocation.lon] : [28.6139, 77.2090];

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, []);

  const connectToTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !userId) return;

    let wsUrl = '';
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envApiUrl) {
      // e.g. "https://api.safevix.ai" -> "wss://api.safevix.ai/api/v1/tracking/..."
      const url = new URL(envApiUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}/api/v1/tracking/${groupId}`;
    } else {
      // Fallback for local development if not set
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      wsUrl = `${wsProtocol}//${host}/api/v1/tracking/${groupId}`;
    }
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      
      // Start broadcasting our own location
      trackingIntervalRef.current = setInterval(() => {
        if (navigator.geolocation && ws.readyState === WebSocket.OPEN) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const payload = {
              user_id: userId,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };
            ws.send(JSON.stringify(payload));
          });
        }
      }, 3000); // Poll every 3 seconds
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.user_id && data.lat && data.lon) {
          setMembers((prev) => ({
            ...prev,
            [data.user_id]: {
              user_id: data.user_id,
              lat: data.lat,
              lon: data.lon,
              timestamp: Date.now(),
            },
          }));
        }
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) wsRef.current.close();
    setConnected(false);
    setMembers({});
  };

  const facilitiesList = Object.values(members).map((member) => ({
    id: member.user_id,
    name: member.user_id === userId ? `${member.user_id} (You)` : member.user_id,
    type: 'family',
    coords: [member.lat, member.lon] as [number, number],
    accentColor: member.user_id === userId ? '#2563eb' : '#10b981', // Blue for you, Green for others
    distance: 'Live',
  }));

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#0D1117] flex flex-col font-['Inter'] relative overflow-hidden">
      <SystemHeader title="Live Family Tracking" showBack={true} />

      {!connected ? (
        <main className="flex-1 flex items-center justify-center p-4 z-10 relative">
          <div className="w-full max-w-md bg-white/80 dark:bg-[#1a2133]/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#1A5C38]/10 text-[#1A5C38] dark:text-[#00C896] rounded-2xl flex items-center justify-center">
                <Users size={32} />
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              Join Tracking Group
            </h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8 font-semibold">
              Enter a secure family code to broadcast and view live GPS locations of your group members.
            </p>

            <form onSubmit={connectToTracking} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  Family / Group Code
                </label>
                <input
                  required
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
                  placeholder="e.g. SMITH-FAMILY-24"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  Your Display Name
                </label>
                <input
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
                  placeholder="e.g. John"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A5C38] hover:bg-[#124228] text-white py-3.5 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all mt-4"
              >
                Start Tracking
              </button>
            </form>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col relative z-10 w-full h-full">
          {/* Top Status Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/90 dark:bg-[#0A0E14]/80 backdrop-blur-2xl p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Active Group
              </div>
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                {groupId} 
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-red-500/20"
            >
              Leave
            </button>
          </div>

          <div className="absolute top-24 left-4 z-20 flex flex-col gap-2">
            {Object.values(members).map(member => (
              <div key={member.user_id} className="bg-white/90 dark:bg-[#0A0E14]/80 backdrop-blur-xl px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${member.user_id === userId ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {member.user_id === userId ? 'You' : member.user_id}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 w-full bg-slate-200 dark:bg-[#030e20]">
             <EmergencyMap
                center={centerCoords}
                facilities={facilitiesList}
                currentLocation={
                  gpsLocation
                    ? {
                        lat: gpsLocation.lat,
                        lon: gpsLocation.lon,
                        accuracy: gpsLocation.accuracy,
                        title: 'You',
                        subtitle: 'Broadcasting live',
                      }
                    : null
                }
              />
          </div>
        </main>
      )}
    </div>
  );
}
