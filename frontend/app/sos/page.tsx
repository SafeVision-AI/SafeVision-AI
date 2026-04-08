'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { generateSosWhatsAppLink, generateSosSmsLink } from '@/lib/sos-share';
import TopSearch from '@/components/dashboard/TopSearch';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import SystemHeader from '@/components/dashboard/SystemHeader';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyPage() {
  const { crashDetectionEnabled } = useAppStore();
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const [gForce, setGForce] = useState(1.0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const dn = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      );
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
    };
  }, []);

  const startHold = () => {
    if (activated) return;
    setHolding(true);
    setHoldProgress(0);
    holdTimer.current = setInterval(() => {
      setHoldProgress(p => {
        if (p >= 100) {
          clearInterval(holdTimer.current!);
          setHolding(false);
          setActivated(true);
          return 100;
        }
        return p + 4;
      });
    }, 100);
  };

  const cancelHold = () => {
    setHolding(false);
    setHoldProgress(0);
    if (holdTimer.current) clearInterval(holdTimer.current);
  };

  const gpsLoc = coords ? { lat: coords.lat, lon: coords.lng, accuracy: 10, timestamp: Date.now() } : null;
  const waLink = generateSosWhatsAppLink(null, gpsLoc);
  const smsLink = generateSosSmsLink(null, gpsLoc);

  return (
    <div className="bg-[#071325] text-[#d7e3fc] font-['Inter'] selection:bg-[#ff5545] selection:text-[#5c0002] min-h-dvh flex flex-col relative overflow-x-hidden transition-colors duration-500">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="Emergency SOS Terminal" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      {/* ── Main Tactical HUD Canvas ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-48 px-6 space-y-8 relative z-10 transition-all duration-500">
        
        {/* ── TOP: SOS PULSING BUTTON ── */}
        <section className="flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            {/* G-Force Badge */}
            <div className="absolute -top-4 -right-4 z-10 bg-[#2a3548]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#5b403f]/15 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#53e16f] animate-pulse"></span>
              <span className="text-[10px] font-black tracking-widest text-[#d7e3fc] uppercase">
                {gForce.toFixed(1)}G IMPACT
              </span>
            </div>

            {/* Main SOS Button */}
            <button 
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onContextMenu={e => e.preventDefault()}
              className={`relative ${!activated ? 'animate-[pulse_2s_infinite]' : ''} w-56 h-56 rounded-full bg-gradient-to-br from-[#ff5545] to-[#93000a] flex flex-col items-center justify-center text-white active:scale-90 transition-transform duration-150 overflow-hidden shadow-[0_0_0_0_rgba(230,57,70,0.7)]`}
              style={{
                boxShadow: !activated ? '0 0 0 0 rgba(230, 57, 70, 0.7)' : '0 0 40px rgba(255, 85, 69, 0.8)',
              }}
            >
              {/* Hold Progress Background Layer */}
              {holding && !activated && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all duration-100"
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
          
          <div className="text-center">
            {activated ? (
              <>
                <span className="text-[#53e16f] font-black tracking-[0.2em] uppercase text-xs">Emergency Declared</span>
                <p className="text-[#e4bebc] text-xs mt-1 font-medium">Services have been notified of your location.</p>
              </>
            ) : (
              <>
                <span className="text-[#ffb4aa] font-black tracking-[0.2em] uppercase text-xs">Hold to Activate</span>
                <p className="text-[#e4bebc] text-xs mt-1 font-medium">Automatic Emergency Dispatch system armed</p>
              </>
            )}
          </div>
        </section>

        {/* ── MIDDLE: QUICK DIAL CARDS ── */}
        <section className="grid grid-cols-3 gap-3">
          <a href="tel:112" className="bg-[#101c2e] p-4 rounded-xl flex flex-col items-center justify-center space-y-3 active:bg-[#1f2a3d] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#ff5545]/20 flex items-center justify-center text-[#ff5545]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest opacity-60 uppercase text-[#d7e3fc]">112</p>
              <p className="text-[10px] font-bold uppercase text-[#ffb4aa]">Emergency</p>
            </div>
          </a>
          
          <a href="tel:100" className="bg-[#101c2e] p-4 rounded-xl flex flex-col items-center justify-center space-y-3 active:bg-[#1f2a3d] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#4b8eff]/20 flex items-center justify-center text-[#4b8eff]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest opacity-60 uppercase text-[#d7e3fc]">100</p>
              <p className="text-[10px] font-bold uppercase text-[#adc6ff]">Police</p>
            </div>
          </a>

          <a href="tel:102" className="bg-[#101c2e] p-4 rounded-xl flex flex-col items-center justify-center space-y-3 active:bg-[#1f2a3d] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#05b046]/20 flex items-center justify-center text-[#05b046]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>ecg_heart</span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest opacity-60 uppercase text-[#d7e3fc]">102</p>
              <p className="text-[10px] font-bold uppercase text-[#53e16f]">Ambulance</p>
            </div>
          </a>
        </section>

        {/* ── SECTION: SHARE LOCATION ── */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-black tracking-tight text-[#d7e3fc] uppercase">Share Location</h2>
            <span className="text-[10px] font-bold text-[#53e16f] uppercase tracking-widest bg-[#53e16f]/10 px-2 py-0.5 rounded">
              Real-time Fix
            </span>
          </div>

          <div className="bg-[#101c2e] rounded-lg p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-[#e4bebc] text-[10px] font-black uppercase tracking-widest">GPS Coordinates Preview</p>
                <p className="text-lg font-mono font-bold tracking-tight text-[#d7e3fc]">
                   {coords ? `Lat: ${coords.lat.toFixed(4)}, Long: ${coords.lng.toFixed(4)}` : 'Resolving GPS...'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2a3548] flex-shrink-0 relative">
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
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#05b046] text-[#003a11] py-4 rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">share</span>
                WhatsApp
              </a>
              <a href={smsLink} className="flex items-center justify-center gap-2 bg-[#2a3548] text-[#d7e3fc] py-4 rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-all border border-[#5b403f]/15">
                <span className="material-symbols-outlined text-sm">sms</span>
                SMS Backup
              </a>
            </div>
          </div>
        </section>

        {/* ── CARD: CRASH PROFILE ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-black tracking-tight text-[#d7e3fc] uppercase">Crash Profile</h2>
          <div className="bg-[#2a3548]/40 backdrop-blur-md rounded-xl p-6 border border-[#5b403f]/15 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12">
              <span className="material-symbols-outlined text-[8rem]">contact_emergency</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
              <div>
                <p className="text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Blood Group</p>
                <p className="text-xl font-black text-[#ffb4aa]">O- (Negative)</p>
              </div>
              <div>
                <p className="text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Primary Contact</p>
                <p className="text-lg font-bold text-[#d7e3fc] truncate">Sarah Thorne</p>
              </div>
              <div>
                <p className="text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Vehicle ID</p>
                <p className="text-base font-mono font-bold text-[#adc6ff]">SV-2024-AI</p>
              </div>
              <div>
                <p className="text-[#e4bebc] text-[10px] font-black uppercase tracking-widest mb-1">Medical Notes</p>
                <p className="text-sm font-medium text-[#d7e3fc] italic">&quot;No known allergies&quot;</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
