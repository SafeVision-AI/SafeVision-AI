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
    loading: () => <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#071325] animate-pulse" />
  });

export default function V2Dashboard() {
  return (
    <div className="relative isolate h-[100dvh] min-h-dvh w-full overflow-hidden bg-[#f8fafc] text-slate-800 dark:bg-[#071325] dark:text-[#d7e3fc]">
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
  );
}
