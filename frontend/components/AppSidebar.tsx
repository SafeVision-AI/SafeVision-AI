'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  BotMessageSquare,
  MapPinPlus,
  HeartPulse,
  AlertTriangle,
  Scale,
  ShieldAlert,
  User,
  Settings,
  Phone,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const navItems = [
  { icon: <MapPin size={24} />, label: 'Map', href: '/', color: 'text-blue-500' },
  { icon: <BotMessageSquare size={24} />, label: 'AI Assistant', href: '/assistant', color: 'text-indigo-500' },
  { icon: <MapPinPlus size={24} />, label: 'Locator', href: '/locator', color: 'text-emerald-500' },
  { icon: <HeartPulse size={24} />, label: 'First Aid', href: '/first-aid', color: 'text-red-500' },
  { icon: <AlertTriangle size={24} />, label: 'Report Road Issue', href: '/report', color: 'text-orange-500' },
  { icon: <Scale size={24} />, label: 'Challan Calculator', href: '/challan', color: 'text-slate-500' },
  { icon: <ShieldAlert size={24} />, label: 'Emergency', href: '/emergency', color: 'text-red-600' },
  { icon: <User size={24} />, label: 'Profile', href: '/profile', color: 'text-sky-500' },
  { icon: <Settings size={24} />, label: 'Settings', href: '/settings', color: 'text-slate-400' },
];

const quickDials = [
  { label: 'Emergency', number: '112', icon: <Phone size={16} /> },
  { label: 'Ambulance', number: '102', icon: <HeartPulse size={16} /> },
  { label: 'Police', number: '100', icon: <ShieldAlert size={16} /> },
  { label: 'Highway', number: '1033', icon: <MapPinPlus size={16} /> },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isDesktopSidebarCollapsed = useAppStore((state) => state.isDesktopSidebarCollapsed);
  const setDesktopSidebarCollapsed = useAppStore((state) => state.setDesktopSidebarCollapsed);

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className={`fixed left-0 top-0 h-full z-50 bg-white/70 dark:bg-[#0a0f1a]/70 backdrop-blur-3xl flex flex-col border-r border-slate-200/50 dark:border-white/[0.08] shadow-[16px_0_48px_rgba(0,0,0,0.05)] dark:shadow-[16px_0_48px_rgba(0,0,0,0.2)] transition-[width] duration-300 ${isDesktopSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'}`}
    >

      {/* Header */}
      <div className={`flex items-center border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-xl transition-[padding,justify-content] ${isDesktopSidebarCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'}`}>
        {!isDesktopSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none">SafeVision AI</h2>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">System Integrated</p>
            </motion.div>
          </div>
        )}
        <button
          onClick={() => setDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          title="Toggle Sidebar"
        >
          {isDesktopSidebarCollapsed ? <PanelLeftOpen size={28} /> : <PanelLeftClose size={28} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div>
          {!isDesktopSidebarCollapsed && (
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-3 px-2 whitespace-nowrap">Operations Console</p>
          )}
          <div className="flex flex-col gap-1 relative">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isDesktopSidebarCollapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group z-10 ${isActive
                    ? ''
                    : 'hover:bg-slate-100/50 dark:hover:bg-white-[0.02] font-medium'
                    } ${isDesktopSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-white dark:bg-[#1f2937]/80 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-white-[0.05] -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={`${item.color} ${isActive ? 'scale-110' : 'group-hover:scale-110'} p-1.5 rounded-lg bg-current/10 transition-transform shrink-0`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                  </div>
                  {!isDesktopSidebarCollapsed && (
                    <span className={`text-[13px] whitespace-nowrap transition-colors ${isActive
                      ? 'font-bold text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-[#8b949e] group-hover:text-slate-900 dark:group-hover:text-slate-200'
                      }`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Dial Section */}
        {!isDesktopSidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between px-2 mb-3">
              <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase whitespace-nowrap">Emergency Dial</p>
              <div className="h-px flex-1 bg-red-500/20 ml-3"></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickDials.map((dial) => (
                <a
                  key={dial.label}
                  href={`tel:${dial.number}`}
                  className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-[#111827]/80 hover:bg-slate-100 dark:hover:bg-[#1a2133] border border-slate-200/50 dark:border-white/[0.05] transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent pointer-events-none" />
                  <div className="text-red-500 mb-1 group-hover:scale-110 transition-[transform,color] group-hover:text-red-600 dark:group-hover:text-red-400">
                    {dial.icon}
                  </div>
                  <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap mb-0.5">{dial.label}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-[#e2e8f0] leading-none whitespace-nowrap group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{dial.number}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Primary Action Footer: SOS */}
      <div className={`p-4 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-black/30 border-t border-slate-200 dark:border-white/[0.05] shrink-0 flex flex-col items-center`}>
        <Link href="/sos" className="w-full">
          <button title={isDesktopSidebarCollapsed ? "System SOS" : undefined} className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black shadow-[0_4px_20px_rgba(220,38,38,0.4)] border border-red-400/50 hover:shadow-[0_4px_25px_rgba(220,38,38,0.6)] transition-all active:scale-[0.98] group overflow-hidden relative ${isDesktopSidebarCollapsed ? 'px-0' : ''}`}>
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:animate-shimmer"
            />
            <span className="material-symbols-outlined text-2xl font-black relative z-10 shrink-0 drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>
              sos
            </span>
            {!isDesktopSidebarCollapsed && (
              <span className="relative z-10 tracking-[0.2em] font-black uppercase text-[13px] whitespace-nowrap drop-shadow-sm">System SOS</span>
            )}
          </button>
        </Link>
        {!isDesktopSidebarCollapsed && (
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM ONLINE
          </div>
        )}
      </div>
    </motion.aside>
  );
}
