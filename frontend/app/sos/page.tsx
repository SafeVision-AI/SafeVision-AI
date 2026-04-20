'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { generateSosWhatsAppLink, generateSosSmsLink } from '@/lib/sos-share';
import TopSearch from '@/components/dashboard/TopSearch';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import SystemHeader from '@/components/dashboard/SystemHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function EmergencyPage() {
  const { crashDetectionEnabled, userProfile } = useAppStore();
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const [gForce, setGForce] = useState(1.0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [waLink, setWaLink] = useState('');
  const [smsLink, setSmsLink] = useState('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = 'SOS Emergency | SafeVisionAI';
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const dn = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => {
          setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
          setGeoError(null);
        },
        err => setGeoError(err.message)
      );
    } else {
      setGeoError('Geolocation not supported by this browser.');
    }

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const g = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2) / 9.81;
      setGForce(Math.round(g * 10) / 10);
    };
    window.addEventListener('devicemotion', handler);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', dn);
      window.removeEventListener('devicemotion', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startHold = () => {
    if (activated) return;
    setHolding(true);
    setHoldProgress(0);

    const startTime = performance.now();
    const duration = 2000; // 2 seconds

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setHolding(false);
        setActivated(true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const cancelHold = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!activated) {
      setHolding(false);
      setHoldProgress(0);
    }
  };

  const [dispatchState, setDispatchState] = useState<'idle' | 'dispatching' | 'dispatched' | 'failed'>('idle');

  const cancelDispatch = () => {
    setActivated(false);
    setHoldProgress(0);
    setDispatchState('idle');
  };

  // Fire backend SOS call on activation
  useEffect(() => {
    if (!activated) return;
    if (!isOnline || !coords) return; // offline → user uses share links below

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    setDispatchState('dispatching');
    fetch(`${API_URL}/api/v1/emergency/sos?lat=${coords.lat}&lon=${coords.lng}`)
      .then(r => {
        setDispatchState(r.ok ? 'dispatched' : 'failed');
      })
      .catch(() => setDispatchState('failed'));
  }, [activated, coords, isOnline]);

  useEffect(() => {
    const gpsLoc = coords ? { lat: coords.lat, lon: coords.lng, accuracy: 10, timestamp: Date.now() } : null;
    generateSosWhatsAppLink(null, gpsLoc).then(setWaLink).catch(() => setWaLink(''));
    setSmsLink(generateSosSmsLink(null, gpsLoc));
  }, [coords]);

  return (
    <div className="bg-slate-50 dark:bg-[#0B1121] text-slate-900 dark:text-[#d7e3fc] font-['Inter'] selection:bg-red-500/30 selection:text-red-900 dark:selection:text-[#5c0002] min-h-dvh flex flex-col relative overflow-x-hidden transition-colors duration-500">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="Emergency SOS Terminal" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      {/* ── Main Tactical HUD Canvas ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-52 px-6 space-y-8 relative z-10 transition-all duration-500">
        
        {/* ── TOP: SOS PULSING BUTTON ── */}
        <section className="flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            {/* G-Force Badge */}
            <div className="absolute -top-4 -right-4 z-10 bg-white/90 dark:bg-[#2a3548]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 dark:border-[#5b403f]/15 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black tracking-widest text-slate-800 dark:text-[#d7e3fc] uppercase">
                {gForce.toFixed(1)}G IMPACT
              </span>
            </div>

            {/* Main SOS Button */}
            <button 
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onContextMenu={e => e.preventDefault()}
              className={`relative ${!activated ? 'animate-[pulse_2s_infinite]' : ''} w-56 h-56 rounded-full bg-gradient-to-br from-[#ff5545] to-[#93000a] flex flex-col items-center justify-center text-white active:scale-90 transition-transform duration-150 overflow-hidden outline-none`}
              style={{
                boxShadow: !activated ? '0 0 0 0 rgba(230, 57, 70, 0.7)' : '0 0 40px rgba(255, 85, 69, 0.8)',
              }}
            >
              {/* Hold Progress Background Layer */}
              {holding && !activated && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all duration-75"
                  style={{ height: `${holdProgress}%` }}
                />
              )}
              
              <span className="material-symbols-outlined text-6xl mb-2 relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span className="text-3xl font-black tracking-tighter relative z-10">
                {activated ? 'DISPATCHED' : 'SOS'}
              </span>
            </button>
          </div>
          
          <div className="text-center min-h-[80px]">
            {activated ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {dispatchState === 'dispatching' && (
                  <span className="text-yellow-500 font-black tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Contacting Emergency Services...
                  </span>
                )}
                {dispatchState === 'dispatched' && (
                  <>
                    <span className="text-emerald-600 dark:text-[#53e16f] font-black tracking-[0.2em] uppercase text-xs">Emergency Declared</span>
                    <p className="text-emerald-700/80 dark:text-[#e4bebc] text-xs mt-1 font-medium">Nearest emergency services located. Use share links below to send your exact location.</p>
                  </>
                )}
                {(dispatchState === 'failed' || dispatchState === 'idle') && (
                  <>
                    <span className="text-orange-500 font-black tracking-[0.2em] uppercase text-xs">SOS Activated — Use Share Links</span>
                    <p className="text-slate-500 dark:text-[#e4bebc] text-xs mt-1 font-medium">
                      {!isOnline ? 'Offline mode — share your location via WhatsApp or SMS below.' : 'Backend unreachable — share your location manually using the links below.'}
                    </p>
                  </>
                )}
                <button onClick={cancelDispatch} className="mt-4 px-5 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-full font-bold uppercase text-[10px] tracking-wider hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                  Cancel Dispatch
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="text-red-500 dark:text-[#ffb4aa] font-black tracking-[0.2em] uppercase text-xs">Hold to Activate</span>
                <p className="text-slate-500 dark:text-[#e4bebc] text-xs mt-1 font-medium">Automatic Emergency Dispatch system armed</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── MIDDLE: QUICK DIAL CARDS ── */}
        <section className="grid grid-cols-3 gap-3">
          <a href="tel:112" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all hover:border-red-500/30">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-[#ff5545]/15 flex items-center justify-center text-red-600 dark:text-[#ff5545]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">112</p>
              <p className="text-[10px] font-bold uppercase text-red-600 dark:text-[#ffb4aa]">Emergency</p>
            </div>
          </a>
          
          <a href="tel:100" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all hover:border-blue-500/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-[#4b8eff]/15 flex items-center justify-center text-blue-600 dark:text-[#4b8eff]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">100</p>
              <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-[#adc6ff]">Police</p>
            </div>
          </a>

          <a href="tel:102" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all hover:border-emerald-500/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-[#05b046]/15 flex items-center justify-center text-emerald-600 dark:text-[#05b046]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>ecg_heart</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">102</p>
              <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-[#53e16f]">Ambulance</p>
            </div>
          </a>
        </section>

        {/* ── SECTION: SHARE LOCATION ── */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Share Location</h2>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-[#53e16f] uppercase tracking-widest bg-emerald-100 dark:bg-[#53e16f]/10 px-2.5 py-1 rounded-full">
              Real-time Fix
            </span>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-slate-500 dark:text-[#e4bebc] text-[10px] font-black uppercase tracking-widest">GPS Coordinates Preview</p>
                <div className="text-lg font-mono font-bold tracking-tight text-slate-800 dark:text-[#d7e3fc]">
                   {geoError ? (
                     <span className="text-red-500 dark:text-red-400 text-sm">{geoError}</span>
                   ) : coords ? (
                     `Lat: ${coords.lat.toFixed(4)}, Long: ${coords.lng.toFixed(4)}`
                   ) : (
                     <span className="flex items-center gap-2 text-slate-400">
                       <Loader2 size={16} className="animate-spin" /> Resolving GPS...
                     </span>
                   )}
                </div>
              </div>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-[#2a3548] flex-shrink-0 relative">
                <Image 
                  className="object-cover grayscale opacity-50" 
                  alt="Map" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxWfyjGCG1gokyFVyuNR3r3F3sIyjrxuOfSXC3e_I_RTY919UFsdJPbMzQ7GKb38btRBgMPfq7ZCNBEOYu1kN7MrpUfudNwoY_G_lSV8SWbmWGsqAYRVuCpG4aFFbWJqDnimCDoj5CZF5VHdB07tke6yTdrZFtbQb6NiEGlKFHNyHjVjhOBXGtoBl9SwNT_izOAE-ijZ0pJsbmTMg7hkyfUB7yKre1vWVPByMzreduHY6ZjER15dALHvqGJtucwXewQU_gLTiiuoqg"
                  fill
                  unoptimized
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#05b046] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md shadow-[#05b046]/20">
                <span className="material-symbols-outlined text-[16px]">share</span>
                WhatsApp
              </a>
              <a href={smsLink} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-[#d7e3fc] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">sms</span>
                SMS Backup
              </a>
            </div>
          </div>
        </section>

        {/* ── CARD: CRASH PROFILE ── */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Crash Profile</h2>
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] dark:opacity-5 rotate-12">
              <span className="material-symbols-outlined text-[8rem]">contact_emergency</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
              <div>
                <p className="text-slate-500 dark:text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Blood Group</p>
                <p className="text-xl font-black text-red-600 dark:text-[#ffb4aa]">
                  {userProfile.bloodGroup || <span className="text-slate-400 text-sm font-bold normal-case">Not set — add in Profile</span>}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Primary Contact</p>
                <p className="text-lg font-bold text-slate-900 dark:text-[#d7e3fc] truncate">
                  {userProfile.emergencyContact || <span className="text-slate-400 text-sm font-bold normal-case">Not set</span>}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Vehicle ID</p>
                <p className="text-base font-mono font-bold text-blue-600 dark:text-[#adc6ff]">
                  {userProfile.vehicleNumber || <span className="text-slate-400 text-sm font-bold font-sans normal-case">Not set</span>}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Operator</p>
                <p className="text-sm font-bold text-slate-800 dark:text-[#d7e3fc]">
                  {userProfile.name || <span className="text-slate-400 italic">Set name in Profile</span>}
                </p>
              </div>
            </div>
            {/* Prompt to fill profile if empty */}
            {!userProfile.name && !userProfile.bloodGroup && (
              <a href="/profile" className="mt-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-[#adc6ff] hover:underline">
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Complete your profile for accurate SOS dispatch
              </a>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
