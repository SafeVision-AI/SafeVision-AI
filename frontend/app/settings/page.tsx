'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/dashboard/BottomNav';

export default function SettingsPage() {
  const { crashDetectionEnabled, setCrashDetectionEnabled } = useAppStore();
  const [speedAlert, setSpeedAlert] = useState(false);
  const [communityReports, setCommunityReports] = useState(true);
  const [satelliteView, setSatelliteView] = useState(false);
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system');

  return (
    <div className="bg-[#071325] text-[#d7e3fc] min-h-dvh pb-32 font-['Inter'] selection:bg-[#ff5545] selection:text-[#5c0002]">
      {/* ── TopAppBar ── */}
      <header className="fixed top-0 w-full z-50 bg-[#071325] flex items-center px-6 h-16 shadow-none">
        <Link href="/" className="text-[#ffb4aa] hover:opacity-80 transition-opacity active:scale-95 duration-150 mr-4 flex items-center justify-center p-2 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-bold tracking-tight text-[#d7e3fc] text-xl">Settings</h1>
      </header>

      <main className="pt-20 pb-32 px-6 max-w-md mx-auto space-y-10">
        
        {/* ── Section: ACCOUNT ── */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4aa]/60 mb-6 px-1">Account</h2>
          <div className="relative flex flex-col items-center bg-[#101c2e] rounded-lg p-8 border border-[#5b403f]/10">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border-2 border-[#ffb4aa] ring-4 ring-[#ffb4aa]/20 overflow-hidden relative">
                <Image 
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-500" 
                  alt="Profile picture" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWgLDPCPukFOhMeqo-sFJLb_pTjR9ItnZWcjZ793N-COvmvj3a9BbI95bMx0it5kI5qFXXeGtqUB1GgOsQ597ztGBQQWAzWQBIvHG1GKtWcUn3OCUTDpLszpKkrH4cd6cBa9ChbKOiCel7WBLe7DYu5OOMb7vjxFXcbFDwS25slG-l9ASkYLkwwCjwvURq816VDJXAW80TqOXs6qNiMxPJJun2PcJV9iGNGNqO8PMQ9kDTdyeb5ww_mh4b3Zr9vXL80-0U0aa1eNvJ"
                  fill
                  unoptimized
                />
              </div>
              <button className="absolute bottom-0 right-0 bg-[#ff5545] p-1.5 rounded-full shadow-lg border-2 border-[#071325] active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
              </button>
            </div>
            <h3 className="text-2xl font-bold text-[#d7e3fc] tracking-tight mb-4">Marcus Thorne</h3>
            
            <div className="w-full space-y-3">
              <div className="flex items-center gap-4 bg-[#2a3548]/30 p-4 rounded-2xl">
                <span className="material-symbols-outlined text-[#ffb4aa]">water_drop</span>
                <div>
                  <p className="text-[10px] text-[#e4bebc] font-medium uppercase tracking-wider">Blood Group</p>
                  <p className="text-[#d7e3fc] font-semibold">O Negative (O-)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#2a3548]/30 p-4 rounded-2xl">
                <span className="material-symbols-outlined text-[#ffb4aa]">directions_car</span>
                <div>
                  <p className="text-[10px] text-[#e4bebc] font-medium uppercase tracking-wider">Vehicle ID</p>
                  <p className="text-[#d7e3fc] font-semibold">SV-2024-AI</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#2a3548]/30 p-4 rounded-2xl">
                <span className="material-symbols-outlined text-[#ffb4aa]">contact_emergency</span>
                <div>
                  <p className="text-[10px] text-[#e4bebc] font-medium uppercase tracking-wider">Emergency Contact</p>
                  <p className="text-[#d7e3fc] font-semibold">Sarah (9876543210)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section: NOTIFICATIONS ── */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4aa]/60 mb-6 px-1">Notifications</h2>
          <div className="space-y-4">
            
            {/* Crash Detection */}
            <div className="bg-[#1f2a3d]/40 backdrop-blur-xl p-5 rounded-lg flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#93000a]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#ffb4aa]">car_crash</span>
                </div>
                <p className="font-medium text-[#d7e3fc]">Crash Detection Alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={crashDetectionEnabled} onChange={e => setCrashDetectionEnabled(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5545] border-transparent peer-focus:outline-none"></div>
              </label>
            </div>

            {/* Speed Zone */}
            <div className="bg-[#1f2a3d]/40 backdrop-blur-xl p-5 rounded-lg flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#4b8eff]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#adc6ff]">speed</span>
                </div>
                <p className="font-medium text-[#d7e3fc]">Speed Zone Warnings</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={speedAlert} onChange={e => setSpeedAlert(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5545] border-transparent peer-focus:outline-none"></div>
              </label>
            </div>

            {/* Community Reports */}
            <div className="bg-[#1f2a3d]/40 backdrop-blur-xl p-5 rounded-lg flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#05b046]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#53e16f]">groups</span>
                </div>
                <p className="font-medium text-[#d7e3fc]">Community Reports Nearby</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={communityReports} onChange={e => setCommunityReports(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5545] border-transparent peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </section>

        {/* ── Section: APP PREFERENCES ── */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4aa]/60 mb-6 px-1">App Preferences</h2>
          <div className="space-y-6">
            
            {/* Theme Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#e4bebc] px-1">Theme</p>
              <div className="flex bg-[#030e20] p-1 rounded-2xl gap-1">
                {(['system', 'light', 'dark'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      theme === t 
                        ? 'bg-[#1f2a3d] text-[#d7e3fc] shadow-lg' 
                        : 'text-[#e4bebc] hover:text-[#d7e3fc]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between bg-[#101c2e] p-4 rounded-2xl border border-[#5b403f]/10 cursor-pointer active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e4bebc]">language</span>
                <p className="text-sm font-medium text-[#d7e3fc]">Language</p>
              </div>
              <div className="flex items-center gap-2 text-[#ffb4aa] font-bold">
                <span>English</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
            </div>

            {/* Map Style */}
            <div className="flex items-center justify-between bg-[#101c2e] p-4 rounded-2xl border border-[#5b403f]/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e4bebc]">map</span>
                <p className="text-sm font-medium text-[#d7e3fc]">Satellite View</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={satelliteView} onChange={e => setSatelliteView(e.target.checked)} />
                <div className="w-12 h-6 bg-[#2a3548] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#071325] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d7e3fc] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5545] border-transparent peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </section>

        {/* ── Section: EMERGENCY DEFAULTS ── */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4aa]/60 mb-6 px-1">Emergency Defaults</h2>
          <div className="bg-[#ff5545]/5 border-2 border-[#ffb4aa]/20 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#ffb4aa] mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>sms</span>
              <p className="text-sm text-[#d7e3fc] leading-relaxed opacity-90">
                &quot;I&apos;m in an emergency at &quot;<span className="text-[#ffb4aa] font-bold">[Location]</span>&quot;. Please send help. My blood group is &quot;<span className="font-bold">O-</span>&quot;.&quot;
              </p>
            </div>
            <button className="w-full py-3 px-4 border border-[#ffb4aa] text-[#ffb4aa] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#ffb4aa]/10 transition-colors active:scale-95 duration-150">
              Edit Message
            </button>
          </div>
        </section>

        {/* ── Section: DATA & PRIVACY ── */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4aa]/60 mb-6 px-1">Data & Privacy</h2>
          <div className="bg-[#101c2e] rounded-lg p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#d7e3fc] font-medium">Offline Cache</p>
                <p className="text-xs text-[#e4bebc]">2.4 GB currently used</p>
              </div>
              <button 
                onClick={() => alert("Cache cleared")}
                className="px-4 py-2 border border-[#ffb4ab] text-[#ffb4ab] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#ffb4ab]/10 active:scale-95 transition-transform"
              >
                Clear Cache
              </button>
            </div>
            <div className="pt-4 border-t border-[#5b403f]/10 flex items-center justify-between">
              <p className="text-xs text-[#e4bebc] font-medium">Version: 4.1.0-K Sentinel</p>
              <span className="material-symbols-outlined text-[#53e16f] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
