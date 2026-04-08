'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, ArrowLeft, ChevronDown, ChevronUp,
  Heart, Flame, Car, AlertTriangle, Phone, Zap,
  Wifi, WifiOff, BookOpen, Wind, Activity, Lock, Cpu, Navigation, Signal, ArrowRight, ShieldAlert
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';

const CATEGORIES = ['All', 'Medical', 'Fire', 'Accident', 'Criminal'] as const;
type Category = typeof CATEGORIES[number];

interface Protocol {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<Category, 'All'>;
  accentColor: string;
  glowColor: string;
  icon: React.ReactNode;
  steps: string[];
  callNumber?: string;
  meta?: {
    time: string;
    level: string;
  };
}

const PROTOCOLS: Protocol[] = [
  {
    id: 'cpr',
    title: 'Cardiopulmonary Resuscitation (CPR)',
    subtitle: 'Cardiac arrest intervention for adults & children',
    category: 'Medical',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.15)',
    icon: <Heart size={20} />,
    steps: [
      'Check scene safety and tap shoulders — shout "Are you OK?"',
      'Call 112 immediately or ask someone to call',
      'Tilt head back, lift chin, check for breathing (10 sec)',
      'Give 30 chest compressions: hard, fast, center of chest',
      'Give 2 rescue breaths — seal mouth, watch chest rise',
    ],
    callNumber: '108',
    meta: { time: '8-12m', level: 'Critical' }
  },
  {
    id: 'bleeding',
    title: 'Severe Hemorrhage & Bleeding',
    subtitle: 'Tourniquet application and trauma management',
    category: 'Medical',
    accentColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.15)',
    icon: <Zap size={20} />,
    steps: [
      'Apply firm direct pressure with clean cloth',
      'Elevate wound above heart level if possible',
      'Apply tourniquet 5–7cm above wound for limb bleeding',
      'Note time of application — write on skin',
      'Call 108 and monitor for shock symptoms',
    ],
    callNumber: '108',
    meta: { time: '4-6m', level: 'Fatal' }
  },
  {
    id: 'fire',
    title: 'Fire Emergency Response',
    subtitle: 'Evacuation and containment protocol (RACE)',
    category: 'Fire',
    accentColor: '#ff8c45',
    glowColor: 'rgba(255,140,69,0.15)',
    icon: <Flame size={20} />,
    steps: [
      'RESCUE: Remove anyone in immediate danger',
      'ALERT: Activate fire alarm and shout "Fire!"',
      'CONTAIN: Close all doors to limit fire spread',
      'EVACUATE: Use stairs only. Stay low in smoke',
    ],
    callNumber: '101',
    meta: { time: '2-4m', level: 'High' }
  },
  {
    id: 'accident',
    title: 'Road Accident Response',
    subtitle: 'Scene management and victim stabilization',
    category: 'Accident',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.15)',
    icon: <Car size={20} />,
    steps: [
      'Park safely 50m ahead, hazard lights ON',
      'Call 112 — give exact location & victim count',
      'Do NOT move victims unless immediate risk exists',
      'If unconscious: put in recovery position',
    ],
    callNumber: '112',
    meta: { time: '10-15m', level: 'Tactical' }
  }
];

export default function EmergencyProtocolsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [expandedId, setExpandedId] = useState<string | null>('cpr');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = PROTOCOLS.filter(
    p => activeCategory === 'All' || p.category === activeCategory
  );

  const categoryColor: Record<string, string> = {
    Medical: '#10b981',
    Fire: '#ff8c45',
    Accident: '#3b82f6',
    Criminal: '#d4a8ff',
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="Emergency Protocol Terminal" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      {/* ── Main Protocol Hub ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-28 lg:pt-24 pb-32 px-5 sm:px-12 flex flex-col lg:grid lg:grid-cols-[1.2fr,2fr] lg:gap-14 lg:items-start transition-all duration-500">
        
        {/* ── Left Column: Tactical Control & SOS (Sticky) ── */}
        <aside className="lg:sticky lg:top-28 flex flex-col gap-8">
          {/* Hero Protocol Context */}
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.3em] font-space leading-none">Tactical Center</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-space leading-none">Satellite Lock</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-space leading-tight">
                Protocol Terminal
              </h1>
              <p className="max-w-md text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider opacity-80 leading-relaxed font-space">
                Real-time emergency override & standard hardware-grade guidance. High-gravity environment active.
              </p>
            </div>
          </section>

          {/* Module 1: Hazard Override Terminal (SOS) - Refined for density */}
          <section className="relative group">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="relative rounded-[2.5rem] overflow-hidden p-8 bg-gradient-to-br from-red-600 to-red-900 shadow-2xl shadow-red-600/30 border border-white/10"
            >
              {/* Background Animations */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                    <Shield size={32} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-100/70 mb-1 font-space">Hazard Override Alpha</span>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-space leading-none mb-2">Emergency SOS</h2>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                       <span className="text-[9px] font-black text-white uppercase tracking-widest opacity-90">Live Geoloc Sync Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <a href="tel:112" className="group/btn relative w-full h-16 px-8 bg-white rounded-2xl flex items-center justify-center gap-3 shadow-xl overflow-hidden active:scale-95 transition-all">
                     <span className="text-red-700 font-black text-sm tracking-[0.2em] uppercase font-space relative z-10">CALL 112 NOW</span>
                     <ArrowRight size={18} className="text-red-700 relative z-10 transition-transform group-hover/btn:translate-x-1" />
                   </a>
                   <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase text-red-200/60 tracking-[0.2em]">
                      <span>Ready for dispatch</span>
                      <span>Encrypted Loop</span>
                   </div>
                </div>
              </div>

              {/* Hardware Scan Effect */}
              <motion.div 
                animate={{ y: [0, 400, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 top-0 h-10 w-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
              />
            </motion.div>
          </section>
        </aside>

        {/* ── Right Column: Protocol Portfolio ── */}
        <div className="flex flex-col gap-8 pt-8 lg:pt-0">

        {/* Module 2: Tactical Filter Bay */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-space flex items-center gap-2">
              <Activity size={14} className="text-red-500" />
              Strategic Filters
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono italic">SVA_V4.2_INTEL</span>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-6 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              const color = cat === 'All' ? '#0f172a' : categoryColor[cat];
              return (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`group relative flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border-2 ${
                    isActive 
                      ? 'text-white border-transparent bg-transparent shadow-lg dark:text-slate-900' 
                      : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="filterGlow" 
                      className="absolute inset-0 rounded-[18px] z-[-1]" 
                      style={{ 
                        background: cat === 'All' ? (theme === 'dark' ? '#ffffff' : '#0f172a') : color, 
                        boxShadow: `0 8px 20px ${cat === 'All' ? (theme === 'dark' ? '#ffffff44' : '#0f172a44') : color + '44'}` 
                      }} 
                    />
                  )}
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Module 3: Protocol Intelligence folders */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-space">{filtered.length} INTEL FOLDERS ACCESSED</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <BookOpen size={10} className="text-emerald-500" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">OFFLINE READY</span>
            </div>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((protocol, i) => {
                const isExpanded = expandedId === protocol.id;
                return (
                  <motion.div 
                    layout
                    key={protocol.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative rounded-2xl sm:rounded-3xl transition-all duration-500 border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm ${isExpanded ? 'bg-white dark:bg-[#0B1121] ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl' : 'bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5'}`}
                  >
                    {/* Header: Intel Brief */}
                    <button onClick={() => setExpandedId(isExpanded ? null : protocol.id)} className="w-full flex items-center p-5 sm:p-7 text-left gap-5 relative z-10 transition-colors">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all" style={{ backgroundColor: protocol.glowColor, borderColor: `${protocol.accentColor}33`, color: protocol.accentColor }}>
                        {protocol.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${protocol.accentColor}22`, color: protocol.accentColor }}>{protocol.category}</span>
                          {protocol.meta && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{protocol.meta.level} PRIORITY</span>}
                        </div>
                        <h3 className="text-lg font-black dark:text-white uppercase font-space tracking-tight leading-none mb-1.5 truncate">{protocol.title}</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate opacity-80">{protocol.subtitle}</p>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="hidden sm:flex gap-1">
                           {[...Array(3)].map((_, j) => (
                             <div key={j} className="w-1 h-3 rounded-full bg-slate-200 dark:bg-white/10" style={{ backgroundColor: j === 0 ? protocol.accentColor : '' }} />
                           ))}
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Content: Active Guidance HUD */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                        >
                           <div className="px-5 sm:px-8 pb-8 pt-2">
                             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/5 to-transparent" />
                             
                             <div className="mt-6 flex flex-col gap-6">
                               <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-space flex items-center gap-2">
                                     <Cpu size={14} className="text-red-500/60" />
                                     Step-by-Step Tactical Guide
                                  </label>
                                  {protocol.meta && <span className="text-[10px] font-mono text-emerald-500 tracking-tighter">EST: {protocol.meta.time}</span>}
                               </div>

                               <div className="space-y-4">
                                 {protocol.steps.map((step, i) => (
                                   <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex gap-4 items-start group/step">
                                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-all" style={{ backgroundColor: protocol.glowColor, color: protocol.accentColor }}>{i + 1}</div>
                                      <div className="flex-1 pt-1.5 border-b border-slate-100 dark:border-white/5 pb-4 group-last/step:border-none">
                                         <p className="text-sm font-bold dark:text-slate-200 leading-relaxed font-mono tracking-tight">{step}</p>
                                      </div>
                                   </motion.div>
                                 ))}
                               </div>

                               {protocol.callNumber && (
                                 <motion.a 
                                   initial={{ y: 20, opacity: 0 }}
                                   animate={{ y: 0, opacity: 1 }}
                                   href={`tel:${protocol.callNumber}`}
                                   className="relative w-full h-14 rounded-2xl flex items-center justify-center gap-3 overflow-hidden shadow-xl"
                                   style={{ background: protocol.glowColor }}
                                 >
                                    <Phone size={20} style={{ color: protocol.accentColor }} />
                                    <span className="font-black text-[11px] tracking-[0.2em] uppercase font-space" style={{ color: protocol.accentColor }}>Dispatch {protocol.callNumber}</span>
                                 </motion.a>
                               )}
                             </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

          <div className="mt-8 flex flex-col items-center gap-4 py-8">
             <div className="w-12 h-px bg-slate-200 dark:bg-white/10" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-space opacity-50">Sentinel V4.2 Protocol Feed</p>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Floating Tactical SOS */}
      <a href="tel:112" className="fixed bottom-[110px] right-6 sm:right-12 z-50">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] text-white relative overflow-hidden"
        >
          <motion.div animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 rounded-full bg-white" />
          <Phone size={24} className="relative z-10" />
        </motion.button>
      </a>

    </div>
  );
}
