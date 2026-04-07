'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/dashboard/BottomNav';

export default function ProfilePage() {
  const { crashDetectionEnabled, setCrashDetectionEnabled } = useAppStore();
  const [offlineMode, setOfflineMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  return (
    <div className="bg-[#071325] text-[#d7e3fc] min-h-dvh pb-32 font-['Inter'] selection:bg-[#ff5545] selection:text-[#5c0002]">
      
      {/* ── TopAppBar ── */}
      <header className="fixed top-0 w-full z-50 bg-[#071325]/60 backdrop-blur-xl flex items-center px-6 h-16 shadow-[0_0_15px_rgba(255,180,170,0.08)]">
        <div className="flex items-center gap-4 w-full">
          <Link href="/" className="text-[#ffb4aa] hover:bg-white/5 transition-colors p-2 rounded-full active:scale-95 duration-100 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="tracking-tight font-bold text-[#d7e3fc] text-lg">Profile & Preferences</h1>
          <div className="ml-auto text-xl font-black text-[#d7e3fc]">SafeVisionAI</div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-12 relative z-10">
        
        {/* ── Profile Summary Section ── */}
        <section className="relative">
          {/* Asymmetric Glow Background */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#ffb4aa]/5 rounded-full blur-[80px]"></div>
          
          <div className="flex items-center gap-6 mb-8 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-[#5b403f]/30 p-1 overflow-hidden bg-[#101c2e] relative">
                <Image 
                  alt="User Profile" 
                  className="object-cover rounded-full" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvek5YwIYwT_V1ClELIh5PXKtqOV5obKd0wL5yKz9FHXdd3_WJG6coDdu-PPf0DNIB5zEOaWf30nx4BNoacevnVq5eWQJR9oLIzttE387el_91QJ1D3m2LuramyDLlck_Y4rh-3djYdFOobdAaLQ_ptEKI84K19tL0THN9WJR9IDappcWQ6hJGnFXM-usSzTsZfeYV2DxA0Ddwhig2-E0bV8ZWJuyTGds4dly794f0RfXE2wi15ovYzPknpl1gFFItf_aWuwzeXjUl"
                  fill
                  unoptimized
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-[#05b046] w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#071325]">
                <span className="material-symbols-outlined text-[14px] text-[#003a11]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#d7e3fc]">Marcus Thorne</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#53e16f] animate-pulse"></span>
                <span className="text-[#53e16f]/80 font-semibold tracking-wider uppercase text-[10px]">Verified Driver</span>
              </div>
            </div>
          </div>

          {/* Driving Score Bar */}
          <div className="bg-[#1f2a3d]/80 backdrop-blur-xl p-6 rounded-lg shadow-xl -mt-2 relative z-10 border border-white/5">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[#e4bebc] text-xs uppercase tracking-widest font-bold mb-1">Safety Rating</p>
                <h3 className="text-2xl font-bold text-[#d7e3fc]">94<span className="text-[#e4bebc] text-sm font-medium">/100</span></h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#adc6ff] uppercase tracking-tighter">Top 5% Globally</span>
              </div>
            </div>
            <div className="h-3 w-full bg-[#2a3548] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#ff5545] to-[#53e16f] w-[94%] rounded-full shadow-[0_0_10px_rgba(83,225,111,0.3)]"></div>
            </div>
            <p className="mt-4 text-xs text-[#d7e3fc]/60 leading-relaxed italic">&quot;Your vigilant response time to road hazards is exceptional this month.&quot;</p>
          </div>
        </section>

        {/* ── Profile Fields (Identity Matrix) ── */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e4bebc]/70 pl-2">Identity Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Blood Group */}
            <div className="bg-[#101c2e] p-4 rounded-xl border border-white/5 group hover:bg-[#1f2a3d] transition-all cursor-pointer">
              <label className="block text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1 pointer-events-none">Blood Group</label>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#d7e3fc]">O Negative (O-)</span>
                <span className="material-symbols-outlined text-[#ffb4aa]/40 group-hover:text-[#ffb4aa] transition-colors">water_drop</span>
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="bg-[#101c2e] p-4 rounded-xl border border-white/5 group hover:bg-[#1f2a3d] transition-all cursor-pointer">
              <label className="block text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1 pointer-events-none">Vehicle Number</label>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#d7e3fc] uppercase">SV-2024-AI</span>
                <span className="material-symbols-outlined text-[#ffb4aa]/40 group-hover:text-[#ffb4aa] transition-colors">directions_car</span>
              </div>
            </div>

            {/* Interface Language */}
            <div className="bg-[#101c2e] p-4 rounded-xl border border-white/5 md:col-span-2 group hover:bg-[#1f2a3d] transition-all cursor-pointer">
              <label className="block text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1 pointer-events-none">Interface Language</label>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#d7e3fc]">English (Global-Metric)</span>
                <span className="material-symbols-outlined text-[#ffb4aa]/40 group-hover:text-[#ffb4aa] transition-colors">language</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Vigilance Protocol ── */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e4bebc]/70 pl-2">Vigilance Protocol</h3>
          <div className="bg-[#142032] rounded-lg divide-y divide-white/5 overflow-hidden">
            
            {/* Offline Mode */}
            <label className="flex items-center justify-between p-6 hover:bg-[#1f2a3d] transition-colors cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-[#030e20] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#d7e3fc]/70">cloud_off</span>
                </div>
                <div>
                  <p className="font-bold text-[#d7e3fc]">Offline Mode</p>
                  <p className="text-[11px] text-[#e4bebc]/60">Process vision data locally without cloud sync</p>
                </div>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={offlineMode} onChange={e => setOfflineMode(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc]/20 peer-checked:after:bg-[#690003] after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb4aa] shadow-none peer-checked:shadow-[0_0_10px_rgba(255,180,170,0.4)]"></div>
              </div>
            </label>

            {/* Crash Detection */}
            <label className="flex items-center justify-between p-6 hover:bg-[#1f2a3d] transition-colors cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-[#93000a]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#ffb4aa]" style={{ fontVariationSettings: "'FILL' 1" }}>e911_emergency</span>
                </div>
                <div>
                  <p className="font-bold text-[#d7e3fc]">Crash Detection</p>
                  <p className="text-[11px] text-[#e4bebc]/60">Auto-alert emergency services on impact</p>
                </div>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={crashDetectionEnabled} onChange={e => setCrashDetectionEnabled(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc]/20 peer-checked:after:bg-[#690003] after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb4aa] shadow-none peer-checked:shadow-[0_0_10px_rgba(255,180,170,0.4)]"></div>
              </div>
            </label>

            {/* Push Notifications */}
            <label className="flex items-center justify-between p-6 hover:bg-[#1f2a3d] transition-colors cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-[#030e20] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#d7e3fc]/70">notifications_active</span>
                </div>
                <div>
                  <p className="font-bold text-[#d7e3fc]">Push Notifications</p>
                  <p className="text-[11px] text-[#e4bebc]/60">High-priority hazard and maintenance alerts</p>
                </div>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={pushNotifs} onChange={e => setPushNotifs(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc]/20 peer-checked:after:bg-[#690003] after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb4aa] shadow-none peer-checked:shadow-[0_0_10px_rgba(255,180,170,0.4)]"></div>
              </div>
            </label>

          </div>
        </section>

        {/* ── Action Section ── */}
        <section className="pt-8 pb-12 flex flex-col items-center gap-6">
          <button className="text-xs font-black uppercase tracking-widest text-[#ffb4aa]/60 hover:text-[#ffb4aa] hover:border-[#ffb4aa] transition-all active:scale-95 px-8 py-4 border border-[#5b403f]/10 rounded-full bg-transparent">
            Clear Local Data
          </button>
          <p className="text-[10px] text-[#e4bebc]/40 font-mono tracking-tighter uppercase">
            SafeVisionAI Secure Core v4.2.0-stable
          </p>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
