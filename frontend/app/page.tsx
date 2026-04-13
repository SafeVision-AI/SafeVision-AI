'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import TopSearch from '../components/dashboard/TopSearch';
import FloatingSidebarControls from '../components/dashboard/FloatingSidebarControls';
import RecentAlertsOverlay from '../components/dashboard/RecentAlertsOverlay';
import BottomNav from '../components/dashboard/BottomNav';
import SystemSidebar from '../components/dashboard/SystemSidebar';
import DashboardMapBootstrap from '../components/dashboard/DashboardMapBootstrap';

// Dynamically load the map without SSR so MapLibre boots only in the browser.
const MapBackground = dynamic(
  () => import('../components/dashboard/MapBackgroundInner'),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 animate-pulse flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" /></div>
  });

import { ChevronRight, ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function V2Dashboard() {
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);

  return (
    <div className="relative isolate h-[100dvh] min-h-dvh w-full overflow-hidden bg-[var(--bg-root-dark)] text-slate-800 dark:text-[#d7e3fc] flex">
      <div className="relative flex-1 h-full w-full overflow-hidden">
        <DashboardMapBootstrap />

        {/* 1. Underlying Map Background */}
      <MapBackground />

      {/* 2. Top Search & Hamburger (Floating) */}
      <TopSearch isMapPage={true} />

      {/* 3. System Sidebar (Left Drawer) */}
      <SystemSidebar />

      {/* 4. Right Sidebar Controls (Relocate, SOS, 3D Score) */}
      <FloatingSidebarControls />

      {/* 4. Recent Alerts (Floating above Bottom Nav) */}
      <RecentAlertsOverlay />

        {/* 5. Bottom Navigation */}
        <BottomNav />
      </div>

      {/* 6. Desktop Right Side Info Panel (Collapsible) */}
      <div 
        className={`hidden lg:flex flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1121] transition-all duration-300 relative ${isPanelOpen ? 'w-[320px] xl:w-[380px]' : 'w-0 border-none'}`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-white dark:bg-[#1a2133] border border-slate-200 dark:border-white/10 rounded-l-xl flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-50 text-slate-500 dark:text-slate-400"
          aria-label={isPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {isPanelOpen && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <h2 className="text-xl font-bold tracking-tight mb-6">Area Intelligence</h2>
            
            <div className="space-y-4">
              {/* Region Status Card */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-full mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Secure Region</h3>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">No critical anomalies detected in your current 5km radius.</p>
                </div>
              </div>

              {/* Sample Hazard Card (Placeholder for real data) */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 opacity-70">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Monitored Hazard</h3>
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">+2.4km</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>Reported pothole condition stable</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
