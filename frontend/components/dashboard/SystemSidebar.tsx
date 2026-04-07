'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

const SystemSidebar = memo(function SystemSidebar() {
  const isOpen = useAppStore((state) => state.isSystemSidebarOpen);
  const setOpen = useAppStore((state) => state.setSystemSidebarOpen);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[85vw] sm:w-[340px] max-w-[340px] bg-[#f8fafc] dark:bg-[#0a0f1a] shadow-2xl z-[101] flex flex-col border-r border-white/10 overflow-hidden lg:hidden"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
                  aria-hidden="true"
                >
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight font-space">SafeVision AI</h2>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Protocol Active</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close Sidebar"
                className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white active:scale-90"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Main Navigation Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">Operations Console</p>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-3 gap-3"
                >
                  {navItems.map((item) => (
                    <motion.div key={item.label} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group shadow-sm hover:shadow-md h-24"
                      >
                        <div className={`${item.color} group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-bold text-center text-slate-700 dark:text-slate-300 leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Quick Dial Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">Emergency Quick Dial</p>
                  <div className="h-px flex-1 bg-red-500/20 ml-4"></div>
                </div>

                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3"
                >
                  {quickDials.map((dial) => (
                    <motion.div key={dial.label} variants={itemVariants}>
                      <a
                        href={`tel:${dial.number}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                          {dial.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">{dial.label}</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{dial.number}</p>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Primary Action Footer: SOS */}
            <div className="p-6 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/5">
              <Link href="/sos" onClick={() => setOpen(false)}>
                <button className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-600/30 transition-all active:scale-95 group overflow-hidden relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white/10"
                  />
                  <span className="material-symbols-outlined text-3xl font-black relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                    sos
                  </span>
                  <span className="relative z-10 tracking-widest uppercase">System SOS</span>
                </button>
              </Link>
              <p className="text-center text-[10px] font-bold text-slate-500 mt-4 tracking-tighter">
                SafeVision AI v2.4.0-Sentinel • Professional Responder Tier
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default SystemSidebar;
