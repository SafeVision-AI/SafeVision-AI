'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Terminal, Zap, Moon, Sun, Laptop,
  CheckCircle, PaintBucket, Bell, Lock,
  Download, Trash2, Info, LogOut,
  Map, Vibrate, Navigation, Database,
  ShieldCheck, Wifi, WifiOff, User,
  ChevronRight, ToggleLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  getPreferredNavApp,
  setPreferredNavApp,
  NAV_APPS,
  type NavApp,
} from '@/lib/navigation-launch';
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
  const router = useRouter();
  const {
    crashDetectionEnabled,
    setCrashDetectionEnabled,
    isAuthenticated,
    operatorName,
    clearAuth,
    userProfile,
  } = useAppStore();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); document.title = 'System Settings | SafeVixAI'; }, []);

  // Feature toggles
  const [speedAlert, setSpeedAlert] = useState(false);
  const [hazardNotifs, setHazardNotifs] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [sosVibration, setSosVibration] = useState(true);
  const [autoOffline, setAutoOffline] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [navApp, setNavApp] = useState<NavApp>('google');

  // Load persisted nav preference on mount
  useEffect(() => {
    setNavApp(getPreferredNavApp());
  }, []);

  const [toastConfig, setToastConfig] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' }>({
    show: false, message: '', type: 'info',
  });
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') =>
    setToastConfig({ show: true, message, type });

  const handlePurge = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('svai-offline-bundle');
    }
    showToast('Cache Purged Successfully', 'success');
  };

  const handleExport = () => {
    const data = {
      profile: userProfile,
      exportedAt: new Date().toISOString(),
      version: '2.4.0-SVA',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safevixai_profile_export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Profile data exported', 'success');
  };

  const handleSignOut = () => {
    clearAuth();
    showToast('Signed out successfully', 'info');
    setTimeout(() => router.push('/login'), 800);
  };

  // ── Section helper ──
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 font-space px-2">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );

  // ── Card helper ──
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/8 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );

  // ── Toggle Row ──
  const ToggleRow = ({
    icon, iconBg, iconColor, label, sub, checked, onChange, danger = false
  }: {
    icon: React.ReactNode; iconBg: string; iconColor: string;
    label: string; sub: string; checked: boolean;
    onChange: (v: boolean) => void; danger?: boolean;
  }) => (
    <div className={`flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors ${danger ? 'border-t border-red-500/10' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className={`font-black text-sm uppercase tracking-tight ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{label}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{sub}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabel={`Toggle ${label}`} />
    </div>
  );

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#0A0E14] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500 font-inter">

      <SystemHeader title="System Settings" showBack={false} />

      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-44 px-6 space-y-10 relative z-10">

        {/* ── OPERATOR IDENTITY ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em] font-space leading-none">
              {isAuthenticated ? 'Authenticated Operator' : 'Identity Matrix Active'}
            </span>
          </div>

          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-5 rounded-lg bg-[#1A5C38]/5 dark:bg-[#1A5C38]/10 border border-[#1A5C38]/20"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1A5C38] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1A5C38]/20">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Operator</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{operatorName}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A5C38]/10 border border-[#1A5C38]/20">
                <ShieldCheck size={12} className="text-[#00C896]" />
                <span className="text-[9px] font-semibold text-[#00C896] uppercase tracking-widest">JWT</span>
              </div>
            </motion.div>
          )}

          <ProfileCard />
        </section>

        {/* ── VISUAL INTERFACE ── */}
        <Section title="Visual Interface">
          <Card>
            <div className="p-5 pb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Appearance Mode</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', icon: <Sun size={20} />, label: 'Light' },
                  { id: 'dark', icon: <Moon size={20} />, label: 'Dark' },
                  { id: 'system', icon: <Laptop size={20} />, label: 'System' },
                ].map((t) => {
                  const isActive = mounted && theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${isActive
                        ? 'border-[#1A5C38] bg-[#1A5C38]/8 text-[#1A5C38] dark:border-[#00C896]/40 dark:bg-[#1A5C38]/15 dark:text-[#00C896] shadow-sm'
                        : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 text-slate-400 hover:border-[#1A5C38]/30 hover:text-slate-600'}`}
                    >
                      {t.icon}
                      <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── VIGILANCE PROTOCOLS ── */}
        <Section title="Vigilance Protocols">
          <Card>
            <ToggleRow icon={<Shield size={20} />} iconBg="bg-red-500/10" iconColor="text-red-500"
              label="Crash Detection" sub="Auto-SOS Engagement on Impact"
              checked={crashDetectionEnabled} onChange={setCrashDetectionEnabled} />
            <div className="border-t border-slate-100 dark:border-white/5" />
            <ToggleRow icon={<Zap size={20} />} iconBg="bg-amber-500/10" iconColor="text-amber-500"
              label="Speed Warnings" sub="Real-time G-Force Analytics"
              checked={speedAlert} onChange={setSpeedAlert} />
            <div className="border-t border-slate-100 dark:border-white/5" />
            <ToggleRow icon={<Bell size={20} />} iconBg="bg-[#1A5C38]/10" iconColor="text-[#1A5C38] dark:text-[#00C896]"
              label="Hazard Alerts" sub="Push Notifications for Nearby Hazards"
              checked={hazardNotifs} onChange={setHazardNotifs} />
            <div className="border-t border-slate-100 dark:border-white/5" />
            <ToggleRow icon={<Vibrate size={20} />} iconBg="bg-purple-500/10" iconColor="text-purple-500"
              label="SOS Vibration" sub="Haptic Feedback on Emergency Trigger"
              checked={sosVibration} onChange={setSosVibration} />
          </Card>
        </Section>

        {/* ── NAVIGATION APP ── */}
        <Section title="Navigation">
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Map size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Preferred Navigation App</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Used for &ldquo;Get Directions&rdquo; in Locator</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {NAV_APPS.map((app) => {
                  const isActive = mounted && navApp === app.key;
                  return (
                    <button
                      key={app.key}
                      onClick={() => { setNavApp(app.key); setPreferredNavApp(app.key); showToast(`Navigation set to ${app.label}`, 'success'); }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-500/8 text-blue-500 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-400 shadow-sm'
                          : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 text-slate-400 hover:border-blue-500/30 hover:text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{app.emoji}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">{app.label.replace('Google ', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── LOCATION & PRIVACY ── */}
        <Section title="Location & Privacy">
          <Card>
            <ToggleRow icon={<Navigation size={20} />} iconBg="bg-[#1A5C38]/10" iconColor="text-[#1A5C38] dark:text-[#00C896]"
              label="Live Location" sub="GPS Tracking for Emergency Services"
              checked={locationTracking} onChange={setLocationTracking} />
            <div className="border-t border-slate-100 dark:border-white/5" />
            <ToggleRow icon={<Database size={20} />} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
              label="Auto-Offline Bundle" sub="Cache Critical Data When Connectivity Drops"
              checked={autoOffline} onChange={setAutoOffline} />
            <div className="border-t border-slate-100 dark:border-white/5" />
            <ToggleRow icon={<Map size={20} />} iconBg="bg-slate-500/10" iconColor="text-slate-400"
              label="Usage Analytics" sub="Anonymous Performance Telemetry"
              checked={analyticsOptIn} onChange={setAnalyticsOptIn} />
          </Card>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 leading-relaxed">
            SafeVixAI does not sell your data. All location data stays on-device or is transmitted only during active SOS dispatch.
          </p>
        </Section>

        {/* ── STORAGE MATRIX ── */}
        <Section title="Storage Matrix">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-500/10 flex items-center justify-center">
                  <Database size={20} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Offline Cache</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">First Aid · Hazard DB · Route Index</p>
                </div>
              </div>
              <button
                onClick={handlePurge}
                className="px-5 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-widest rounded-xl border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
              >
                Purge
              </button>
            </div>

            {/* Export data */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#1A5C38]/10 flex items-center justify-center">
                  <Download size={18} className="text-[#1A5C38] dark:text-[#00C896]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Export Profile</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">JSON · GDPR Compliant</p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-5 py-2.5 bg-[#1A5C38]/10 text-[#1A5C38] dark:text-[#00C896] text-[10px] font-semibold uppercase tracking-widest rounded-xl border border-[#1A5C38]/20 hover:bg-[#1A5C38]/20 active:scale-95 transition-all"
              >
                Export
              </button>
            </div>

            {/* App info */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#00C896]" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">SafeVixAI v2.4.0-SVA</span>
              </div>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
          </Card>
        </Section>

        {/* ── SYSTEM LINKS ── */}
        <Section title="System">
          <Card>
            <Link
              href="/profile"
              className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#1A5C38]/10 flex items-center justify-center">
                  <User size={18} className="text-[#1A5C38] dark:text-[#00C896]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Edit Profile</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Identity & Emergency Data</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </Link>

            <div className="border-t border-slate-100 dark:border-white/5" />

            <Link
              href="/emergency"
              className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Shield size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Emergency Protocols</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">First Response Procedures</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </Link>

            <div className="border-t border-slate-100 dark:border-white/5" />

            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Info size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Build Info</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">IIT Madras Hackathon 2024</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">v2.4.0</span>
            </div>
          </Card>
        </Section>

        {/* ── SIGN OUT ── */}
        {isAuthenticated && (
          <section>
            <button
              onClick={handleSignOut}
              className="w-full h-14 rounded-lg border-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-600 dark:text-red-400 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut size={15} />
              Sign Out Operator — {operatorName}
            </button>
          </section>
        )}

        <div className="h-4" />
      </main>

      <Toast
        isVisible={toastConfig.show}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))}
      />

      <BottomNav />
    </div>
  );
}
