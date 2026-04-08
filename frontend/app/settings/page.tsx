'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Bell, Shield, Globe, Map, 
  Trash2, CheckCircle, ChevronRight,
  Droplet, Car, PhoneCall, Zap,
  Moon, Sun, Laptop, Languages, Terminal
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/dashboard/BottomNav';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import SystemSidebar from '@/components/dashboard/SystemSidebar';

export default function SettingsPage() {
  const { crashDetectionEnabled, setCrashDetectionEnabled } = useAppStore();
  const [speedAlert, setSpeedAlert] = useState(false);
  const [communityReports, setCommunityReports] = useState(true);
  const [satelliteView, setSatelliteView] = useState(false);
  const [themePreference, setThemePreference] = useState<'system'|'light'|'dark'>('system');

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500 font-inter">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="System Settings" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-32 px-6 space-y-12 relative z-10">
        
        {/* ── Profile Summary ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-space leading-none">Identity Matrix Active</span>
          </div>
          
          <div className="relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden group">
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="relative group/avatar">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-white/10 ring-4 ring-emerald-500/20 overflow-hidden relative">
                  <Image 
                    className="object-cover transition-all duration-500 group-hover/avatar:scale-110" 
                    alt="Profile picture" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWgLDPCPukFOhMeqo-sFJLb_pTjR9ItnZWcjZ793N-COvmvj3a9BbI95bMx0it5kI5qFXXeGtqUB1GgOsQ597ztGBQQWAzWQBIvHG1GKtWcUn3OCUTDpLszpKkrH4cd6cBa9ChbKOiCel7WBLe7DYu5OOMb7vjxFXcbFDwS25slG-l9ASkYLkwwCjwvURq816VDJXAW80TqOXs6qNiMxPJJun2PcJV9iGNGNqO8PMQ9kDTdyeb5ww_mh4b3Zr9vXL80-0U0aa1eNvJ"
                    fill
                    unoptimized
                  />
                </div>
                <button className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white dark:border-[#071325] active:scale-90 transition-all">
                  <Zap size={14} className="text-white" />
                </button>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-space">Marcus Thorne</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Tactical Responder</p>
              </div>
              
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <Droplet size={14} className="text-red-500" />
                  <span className="text-[9px] font-black uppercase text-slate-400">O Negative</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <Car size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase text-slate-400">SV-2024-AI</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <PhoneCall size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black uppercase text-slate-400">9876543210</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section: NOTIFICATIONS ── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Vigilance Defaults</h2>
          <div className="flex flex-col gap-4">
            
            {/* Crash Detection */}
            <div className="bg-white dark:bg-white/5 p-5 rounded-[2rem] flex items-center justify-between border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Shield size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Crash Detection</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Auto-SOS Engagement</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={crashDetectionEnabled} onChange={e => setCrashDetectionEnabled(e.target.checked)} />
                <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Speed Zone */}
            <div className="bg-white dark:bg-white/5 p-5 rounded-[2rem] flex items-center justify-between border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Speed Warnings</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Real-time G-Analytics</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={speedAlert} onChange={e => setSpeedAlert(e.target.checked)} />
                <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </section>

        {/* ── Section: DATA & CACHE ── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Storage Matrix</h2>
          <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">V8 Offline Cache</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">2.4 GB Occupied</p>
               </div>
               <button 
                 onClick={() => alert("Matrix Purged")}
                 className="px-6 py-3 bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20 active:scale-95 transition-all"
               >
                 Purge Data
               </button>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Core Version: 4.2.0-SVA</span>
              </div>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
