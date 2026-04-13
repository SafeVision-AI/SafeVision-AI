'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Terminal,
  Zap,
  Moon, Sun, Laptop,
  CheckCircle,
  PaintBucket
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ThemeProvider';
import BottomNav from '@/components/dashboard/BottomNav';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import ProfileCard from '@/components/dashboard/ProfileCard';
import Toggle from '@/components/dashboard/Toggle';
import Toast from '@/components/dashboard/Toast';

export default function SettingsPage() {
  const { crashDetectionEnabled, setCrashDetectionEnabled } = useAppStore();
  const [speedAlert, setSpeedAlert] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // To avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [toastConfig, setToastConfig] = useState<{show: boolean, message: string, type: 'success'|'info'|'error'}>({
    show: false,
    message: '',
    type: 'info'
  });

  useEffect(() => { document.title = 'Settings | SafeVisionAI'; }, []);

  const showToast = (message: string, type: 'success'|'info'|'error' = 'info') => {
    setToastConfig({ show: true, message, type });
  };

  const handlePurge = () => {
    // Purge logic here
    showToast('Cache Purged Successfully', 'success');
  };

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500 font-inter">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="System Settings" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-44 px-6 space-y-12 relative z-10">
        
        {/* ── Profile Summary ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-space leading-none">Identity Matrix Active</span>
          </div>
          <ProfileCard />
        </section>

        {/* ── Section: THEME PREFERENCES ── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Visual Interface</h2>
          <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-300 dark:border-white/5 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', icon: <Sun size={18} />, label: 'Light' },
                { id: 'dark', icon: <Moon size={18} />, label: 'Dark' },
                { id: 'system', icon: <Laptop size={18} />, label: 'System' }
              ].map((t) => {
                const isActive = mounted && theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:border-emerald-500/50'
                    }`}
                  >
                    {t.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section: NOTIFICATIONS ── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Vigilance Defaults</h2>
          <div className="flex flex-col gap-4">
            
            {/* Crash Detection */}
            <div className="bg-white dark:bg-white/5 p-5 rounded-[2rem] flex items-center justify-between border border-slate-300 dark:border-white/5 shadow-sm hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Shield size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Crash Detection</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Auto-SOS Engagement</p>
                </div>
              </div>
              <Toggle 
                checked={crashDetectionEnabled} 
                onChange={setCrashDetectionEnabled} 
                ariaLabel="Toggle Crash Detection" 
              />
            </div>

            {/* Speed Zone */}
            <div className="bg-white dark:bg-white/5 p-5 rounded-[2rem] flex items-center justify-between border border-slate-300 dark:border-white/5 shadow-sm hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Speed Warnings</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Real-time G-Analytics</p>
                </div>
              </div>
              <Toggle 
                checked={speedAlert} 
                onChange={setSpeedAlert} 
                ariaLabel="Toggle Speed Warnings" 
              />
            </div>
          </div>
        </section>

        {/* ── Section: DATA & CACHE ── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Storage Matrix</h2>
          <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-300 dark:border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">V8 Offline Cache</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">2.4 GB Occupied</p>
               </div>
               <button 
                 onClick={handlePurge}
                 className="px-6 py-3 bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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

      <Toast 
        isVisible={toastConfig.show} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onClose={() => setToastConfig(prev => ({...prev, show: false}))} 
      />

      <BottomNav />
    </div>
  );
}
