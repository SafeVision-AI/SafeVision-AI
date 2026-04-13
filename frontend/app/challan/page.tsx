'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Shield, Car, Truck, Bike, Bus, AlertTriangle, 
  ChevronRight, Scale, History, MapPin, 
  ArrowRight, Activity, Zap, FileText, Info
} from 'lucide-react';
import BottomNav from '@/components/dashboard/BottomNav';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import { useTheme } from '@/components/ThemeProvider';
import { useAppStore } from '@/lib/store';

const STATES = [
  'Tamil Nadu (TN)',
  'Delhi (DL)',
  'Maharashtra (MH)',
  'Karnataka (KA)',
  'Uttar Pradesh (UP)',
  'West Bengal (WB)',
];

const VIOLATIONS = [
  { id: 'speeding', label: 'Speeding (>20km/h Limit)', mva: '§112/183', fine2w: 1000, fine4w: 2000, max: '4000' },
  { id: 'redlight', label: 'Red Light Violation', mva: '§119/177', fine2w: 1000, fine4w: 1000, max: '5000' },
  { id: 'dui', label: 'Section 185 — Drunk driving', mva: '§185', fine2w: 10000, fine4w: 10000, max: '25000 + Imprisonment', danger: 'Up to 6 months imprisonment' },
  { id: 'nolicense', label: 'Driving Without License', mva: '§3/181', fine2w: 5000, fine4w: 5000, max: '5000 + 3 Months' },
  { id: 'helmet_seatbelt', label: 'No Seatbelt/Helmet', mva: '§129/194D', fine2w: 1000, fine4w: 1000, max: '1000 + Disqualification' },
];

const VEHICLE_CLASSES = [
  { id: '2w', icon: <Bike size={28} />, title: '2-Wheeler', subtitle: 'Motorcycle / Scooter' },
  { id: '4w', icon: <Car size={28} />, title: 'Car/LMV', subtitle: 'Light Motor Vehicle' },
  { id: 'htv', icon: <Truck size={28} />, title: 'Truck', subtitle: 'Heavy Goods Vehicle' },
  { id: 'bus', icon: <Bus size={28} />, title: 'Bus/COMM', subtitle: 'Public Transport' },
];

export default function ChallanPage() {
  const { theme } = useTheme();
  
  // Use shared store instead of local state so values don't reset upon tab change
  const { challanState, setChallanState } = useAppStore();
  const { violation, vehicle, jurisdiction, isRepeat } = challanState;
  
  const [showDetailToast, setShowDetailToast] = useState(false);

  useEffect(() => { document.title = 'Challan Calculator | SafeVisionAI'; }, []);

  const activeViolation = VIOLATIONS.find(v => v.id === violation) || VIOLATIONS[0];
  
  let baseFine = (vehicle === '2w') ? activeViolation.fine2w : activeViolation.fine4w;
  if (['htv', 'bus'].includes(vehicle)) baseFine = Math.round(baseFine * 2.5);
  
  // Repeat offence logic: doubling the fine per standard MVA 2019 amendments
  const finalFine = isRepeat ? baseFine * 2 : baseFine;

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500 font-inter">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="Challan Terminal" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 w-full max-w-7xl mx-auto pt-28 lg:pt-24 pb-44 px-5 sm:px-12 flex flex-col lg:grid lg:grid-cols-[1.2fr,2fr] lg:gap-14 lg:items-start transition-all duration-500">
        
        {/* ── Left Column: System Summary & Real-time Quote ── */}
        <aside className="lg:sticky lg:top-28 flex flex-col gap-8 order-2 lg:order-1 mt-10 lg:mt-0">
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-space leading-none">Terminal Active</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-space leading-tight">
              Estimation<br />Terminal
            </h1>
          </section>

          {/* ── Big Result Card (The "Star" of the UI) ── */}
          <motion.section 
            layout
            className="relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col gap-6">
               <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-space">Total Liability</p>
                 <motion.h2 
                   key={finalFine}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-5xl sm:text-7xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter"
                 >
                   ₹{finalFine.toLocaleString('en-IN')}
                 </motion.h2>
               </div>

               <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <Scale size={16} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">{activeViolation.mva}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isRepeat ? 'Repeat Offence (2x)' : 'First Occurrence'}</span>
                    </div>
                 </div>

                 <AnimatePresence mode="wait">
                   {activeViolation.danger && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
                     >
                       <AlertTriangle size={12} className="text-red-500" />
                       <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{activeViolation.danger}</span>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               <div className="relative">
                 <button 
                   onClick={() => {
                     setShowDetailToast(true);
                     setTimeout(() => setShowDetailToast(false), 3000);
                   }}
                   className="w-full h-16 bg-slate-900 dark:bg-emerald-500 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all group/btn"
                 >
                    <span className="text-white dark:text-slate-900 font-black text-sm tracking-[0.2em] uppercase font-space">DETAILED REPORT</span>
                    <ArrowRight size={18} className="text-white dark:text-slate-900 group-hover/btn:translate-x-1 transition-transform" />
                 </button>
                 <AnimatePresence>
                   {showDetailToast && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white text-[10px] uppercase tracking-widest font-bold rounded-full shadow-xl whitespace-nowrap"
                     >
                       Detailed report currently offline
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          </motion.section>

          {/* Quick Meta */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Penalty</p>
                <p className="text-xs font-black text-slate-900 dark:text-white">₹{activeViolation.max}</p>
             </div>
             <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Act Sync</p>
                <p className="text-xs font-black text-emerald-500">MVA_ACT_2019</p>
             </div>
          </div>
        </aside>

        {/* ── Right Column: Input Portfolio ("Big & Simple") ── */}
        <div className="flex flex-col gap-10 order-1 lg:order-2">
           {/* Section 1: Violation */}
           <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-space flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" />
                  01. Violation Protocol
                </h3>
                <div className="px-3 py-1 rounded-full bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest">
                  {jurisdiction.split(' ')[0]}
                </div>
              </div>

              <div className="relative group">
                <select 
                  value={violation}
                  onChange={(e) => setChallanState({ violation: e.target.value })}
                  className="w-full bg-transparent border-2 border-slate-200 dark:border-white/10 rounded-3xl p-6 text-lg font-black text-slate-900 dark:text-white appearance-none focus:border-emerald-500 transition-all outline-none cursor-pointer"
                >
                  {VIOLATIONS.map(v => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-[#071325]">{v.label}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowRight size={24} className="rotate-90" />
                </div>
              </div>
           </section>

           {/* Section 2: Vehicle Selection (The "Big" UI) */}
           <section className="flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-space flex items-center gap-2">
                <Car size={14} className="text-emerald-500" />
                02. Vehicle Identification
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {VEHICLE_CLASSES.map(cls => (
                   <button 
                     key={cls.id}
                     onClick={() => setChallanState({ vehicle: cls.id })}
                     className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-95 ${
                       vehicle === cls.id 
                        ? 'bg-emerald-500 border-emerald-600/30 text-slate-900 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/20' 
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:border-slate-400 dark:hover:border-white/10 hover:shadow-md'
                     }`}
                   >
                     <div className={`p-4 rounded-2xl ${vehicle === cls.id ? 'bg-white/30' : 'bg-slate-100 dark:bg-white/5'}`}>
                       {cls.icon}
                     </div>
                     <div className="flex flex-col items-center">
                       <span className={`text-xs font-black uppercase tracking-widest ${vehicle === cls.id ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                         {cls.title}
                       </span>
                       <span className={`text-[8px] font-bold uppercase mt-1 opacity-60 ${vehicle === cls.id ? 'text-slate-900' : 'text-slate-400'}`}>
                         {cls.id === 'htv' ? 'Heavy' : cls.id === '2w' ? 'Light' : 'Standard'}
                       </span>
                     </div>
                   </button>
                 ))}
              </div>
           </section>

           {/* Section 3: Parameters & Jurisdiction */}
           <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-space">03. Jurisdiction</h3>
                <div className="relative">
                  <select 
                    value={jurisdiction}
                    onChange={(e) => setChallanState({ jurisdiction: e.target.value })}
                    className="w-full bg-transparent border-2 border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 dark:text-white appearance-none focus:border-emerald-500 transition-all outline-none cursor-pointer"
                  >
                    {STATES.map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-[#071325]">{s}</option>
                    ))}
                  </select>
                  <MapPin size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-space">04. History</h3>
                <button 
                  onClick={() => setChallanState({ isRepeat: !isRepeat })}
                  className={`w-full h-[58px] rounded-2xl border-2 flex items-center justify-between px-6 transition-all ${
                    isRepeat 
                    ? 'bg-red-500/10 border-red-500/20 text-red-600' 
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Repeat Offender?</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isRepeat ? 'bg-red-500' : 'bg-slate-200 dark:bg-white/10'}`}>
                    <motion.div 
                      layout
                      initial={false}
                      animate={{ x: isRepeat ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm" 
                    />
                  </div>
                </button>
              </div>
           </section>

           {/* AI Insight Footer */}
           <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-emerald-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">AI Tactical Insight</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Based on recent MVA amendments, high-risk offences like DUI ({activeViolation.mva}) have immediate license disqualification protocols active in {jurisdiction.split(' ')[0]}.
                </p>
              </div>
           </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
