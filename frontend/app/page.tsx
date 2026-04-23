'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import TopSearch from '../components/dashboard/TopSearch';
import FloatingSidebarControls from '../components/dashboard/FloatingSidebarControls';
import RecentAlertsOverlay from '../components/dashboard/RecentAlertsOverlay';
import BottomNav from '../components/dashboard/BottomNav';
import SystemSidebar from '../components/dashboard/SystemSidebar';
import DashboardMapBootstrap from '../components/dashboard/DashboardMapBootstrap';
import { useAppStore } from '../lib/store';
import {
  ChevronRight, ChevronLeft, AlertTriangle, ShieldCheck,
  MapPin, Navigation, Zap, Activity, Shield, Circle
} from 'lucide-react';

// Dynamically load the map without SSR so MapLibre boots only in the browser.
const MapBackground = dynamic(
  () => import('../components/dashboard/MapBackgroundInner'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 animate-pulse flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#1A5C38]/20 border-t-[#1A5C38] animate-spin" />
      </div>
    )
  });

export default function V2Dashboard() {
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  const {
    gpsLocation,
    nearbyServices,
    nearbyRoadIssues,
    serviceSearchMeta,
    connectivity,
  } = useAppStore();

  const issueCount = nearbyRoadIssues.length;
  const serviceCount = nearbyServices.length;
  const openIssues = nearbyRoadIssues.filter(i => i.status === 'open').length;

  const areaStatus = openIssues === 0 ? 'secure' : openIssues <= 2 ? 'caution' : 'alert';

  const statusConfig = {
    secure: {
      label: 'Secure Region',
      sub: `No critical anomalies in ${serviceSearchMeta.radiusUsed ? (serviceSearchMeta.radiusUsed / 1000).toFixed(1) : '5.0'}km radius`,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      sub_text: 'text-emerald-600/80 dark:text-emerald-400/80',
    },
    caution: {
      label: 'Caution Zone',
      sub: `${openIssues} active hazard${openIssues > 1 ? 's' : ''} nearby — proceed with care`,
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
      iconBg: 'bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      sub_text: 'text-amber-600/80 dark:text-amber-400/80',
    },
    alert: {
      label: 'High Risk Area',
      sub: `${openIssues} unresolved hazards detected — SOS ready`,
      icon: <Shield className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-500/10 border-red-500/20',
      iconBg: 'bg-red-500/20',
      text: 'text-red-700 dark:text-red-300',
      sub_text: 'text-red-600/80 dark:text-red-400/80',
    },
  };

  const sc = statusConfig[areaStatus];

  return (
    <div className="relative isolate h-[100dvh] min-h-dvh w-full overflow-hidden bg-[var(--bg-root-dark)] text-slate-800 dark:text-[#d7e3fc] flex">
      <div className="relative flex-1 h-full w-full overflow-hidden">
        <DashboardMapBootstrap />
        <MapBackground />
        <TopSearch isMapPage={true} />
        <SystemSidebar />
        <FloatingSidebarControls />
        <RecentAlertsOverlay />
        <BottomNav />
      </div>

      {/* ── Desktop Right Panel (Collapsible) ── */}
      <div
        className={`hidden lg:flex flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0D1117] transition-all duration-300 relative ${isPanelOpen ? 'w-[320px] xl:w-[380px]' : 'w-0 border-none overflow-hidden'}`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/10 rounded-l-xl flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-[#161c2d] transition-colors z-50 text-slate-500 dark:text-slate-400"
          aria-label={isPanelOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {isPanelOpen && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">

            {/* Panel Header */}
            <div className="sticky top-0 bg-white dark:bg-[#0D1117] border-b border-slate-100 dark:border-white/5 px-6 py-5 z-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight font-space">
                  Area Intelligence
                </h2>
                {/* Connectivity indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest ${
                  connectivity === 'online'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connectivity === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {connectivity === 'online' ? 'Live' : 'Cached'}
                </div>
              </div>
              {gpsLocation && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <MapPin size={9} className="inline mr-1" />
                  {gpsLocation.city ?? 'Location detected'}{gpsLocation.state ? `, ${gpsLocation.state}` : ''}
                </p>
              )}
            </div>

            <div className="p-5 space-y-4">

              {/* Status Card */}
              <div className={`${sc.bg} border rounded-lg p-4 flex items-start gap-3`}>
                <div className={`${sc.iconBg} p-2 rounded-full mt-0.5 flex-shrink-0`}>
                  {sc.icon}
                </div>
                <div>
                  <h3 className={`font-black text-sm ${sc.text}`}>{sc.label}</h3>
                  <p className={`text-xs ${sc.sub_text} mt-1 leading-relaxed`}>{sc.sub}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={12} className="text-[#1A5C38] dark:text-[#00C896]" />
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Services</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{serviceCount}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nearby Found</p>
                </div>
                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Hazards</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{issueCount}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {openIssues} Open
                  </p>
                </div>
              </div>

              {/* Live Road Issues */}
              {nearbyRoadIssues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-1">Active Hazards</p>
                  {nearbyRoadIssues.slice(0, 4).map((issue) => (
                    <div
                      key={issue.uuid}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle size={14} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                          {issue.issueType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          {issue.roadName || 'Unknown Road'} · {(issue.distance / 1000).toFixed(1)}km
                        </p>
                      </div>
                      <span className={`text-[8px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg flex-shrink-0 ${
                        issue.severity >= 3
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        S{issue.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* No data yet */}
              {serviceCount === 0 && issueCount === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Activity size={20} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Scanning Area...</p>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 max-w-[180px] leading-relaxed">
                    Allow location to activate live hazard intelligence
                  </p>
                </div>
              )}

              {/* Driving Score */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#1A5C38]/8 to-[#00C896]/5 border border-[#1A5C38]/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1A5C38]/10 flex items-center justify-center">
                  <Zap size={20} className="text-[#1A5C38] dark:text-[#00C896]" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">AI Sentinel</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Monitoring Active</p>
                </div>
                <div className="flex items-center gap-1">
                  <Circle size={8} className="fill-[#00C896] text-[#00C896] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
