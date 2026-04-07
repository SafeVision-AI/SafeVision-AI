'use client';

import { useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/dashboard/BottomNav';

const STATES = [
  'Delhi (DL)',
  'Maharashtra (MH)',
  'Karnataka (KA)',
  'Uttar Pradesh (UP)',
  'West Bengal (WB)',
];

const VIOLATIONS = [
  { id: 'speeding', label: 'Speeding (>20km/h Limit)', mva: '§112/183', fine2w: 1000, fine4w: 2000, max: '4000' },
  { id: 'redlight', label: 'Red Light Violation', mva: '§119/177', fine2w: 1000, fine4w: 1000, max: '5000' },
  { id: 'dui', label: 'Drunk Driving', mva: '§185', fine2w: 10000, fine4w: 10000, max: '25000 + Imprisonment' },
  { id: 'nolicense', label: 'Driving Without License', mva: '§3/181', fine2w: 5000, fine4w: 5000, max: '5000 + 3 Months' },
  { id: 'helmet_seatbelt', label: 'No Seatbelt/Helmet', mva: '§129/194D', fine2w: 1000, fine4w: 1000, max: '1000 + Disqualification' },
];

const VEHICLE_CLASSES = [
  { id: '4w', icon: 'directions_car', title: 'LMV', subtitle: 'Light Motor Vehicle' },
  { id: 'htv', icon: 'local_shipping', title: 'HGV', subtitle: 'Heavy Goods Vehicle' },
  { id: '2w', icon: 'two_wheeler', title: 'MC', subtitle: 'Motorcycle' },
  { id: 'lcv', icon: 'airport_shuttle', title: 'COMM', subtitle: 'Passenger Bus' },
];

export default function ChallanPage() {
  const [violation, setViolation] = useState(VIOLATIONS[0].id);
  const [vehicle, setVehicle] = useState('4w');
  const [jurisdiction, setJurisdiction] = useState(STATES[0]);

  const activeViolation = VIOLATIONS.find(v => v.id === violation) || VIOLATIONS[0];
  
  let baseFine = (vehicle === '2w') ? activeViolation.fine2w : activeViolation.fine4w;
  if (['lcv', 'htv'].includes(vehicle)) baseFine = Math.round(baseFine * 1.5);

  return (
    <div className="bg-[#071325] text-[#d7e3fc] min-h-dvh pb-32 font-['Inter'] selection:bg-[#b0c6ff] selection:text-[#001945]">

      {/* ── TopAppBar ── */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-[#071325] shadow-[0_4px_20px_rgba(176,198,255,0.05)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 text-[#b0c6ff] hover:bg-[#2e394d]/50 transition-colors active:scale-95 duration-200 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-[#b0c6ff] tracking-tight font-bold text-xl uppercase">Fines & Violations</h1>
        </div>
        <button className="p-2 text-[#b0c6ff] hover:bg-[#2e394d]/50 transition-colors active:scale-95 duration-200 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">search</span>
        </button>
        <div className="bg-gradient-to-b from-[#142032] to-transparent h-px w-full absolute bottom-0 left-0"></div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Welcome & Context */}
        <div className="space-y-2">
          <p className="text-[#c5c6cd] font-bold text-[10px] uppercase tracking-[0.2em]">System Terminal // Calculator</p>
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#b0c6ff]">Precision Estimation</h2>
        </div>

        {/* ── Calculator Stepper Card ── */}
        <section className="bg-[#142032] rounded-lg p-8 space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#b0c6ff]/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          
          {/* Step 1: Violation Type */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <label className="text-[0.6875rem] font-bold text-[#c5c6cd] uppercase tracking-widest">01. Violation Type</label>
              <span className="bg-[#b0c6ff]/10 text-[#b0c6ff] px-3 py-1 rounded-full text-[10px] font-bold">REQUIRED</span>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0c6ff] pointer-events-none">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <select 
                value={violation}
                onChange={(e) => setViolation(e.target.value)}
                className="w-full bg-[#030e20] border-none rounded-lg py-4 pl-12 pr-4 text-[#d7e3fc] font-medium appearance-none focus:ring-0 focus:bg-[#2a3549] transition-colors outline-none cursor-pointer"
              >
                {VIOLATIONS.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c5c6cd]">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div className="absolute left-0 top-0 h-full w-0.5 bg-[#b0c6ff] rounded-full"></div>
            </div>
          </div>

          {/* Step 2: Vehicle Class */}
          <div className="space-y-6 relative z-10">
            <label className="text-[0.6875rem] font-bold text-[#c5c6cd] uppercase tracking-widest">02. Vehicle Class</label>
            <div className="grid grid-cols-2 gap-4">
              {VEHICLE_CLASSES.map(cls => (
                <button 
                  key={cls.id}
                  onClick={() => setVehicle(cls.id)}
                  className={`flex flex-col items-start gap-4 p-5 rounded-lg transition-all group border-l-2 ${
                    vehicle === cls.id 
                      ? 'bg-[#2a3549] border-[#b0c6ff] shadow-[0_0_15px_rgba(176,198,255,0.05)]' 
                      : 'bg-[#030e20] border-transparent hover:border-[#b0c6ff]/50 hover:bg-[#2a3549]/50'
                  }`}
                >
                  <span className={`material-symbols-outlined transition-colors ${vehicle === cls.id ? 'text-[#b0c6ff]' : 'text-[#c5c6cd] group-hover:text-[#b0c6ff]/80'}`}>
                    {cls.icon}
                  </span>
                  <div className="text-left">
                    <p className={`font-bold ${vehicle === cls.id ? 'text-[#b0c6ff]' : 'text-[#d7e3fc]'}`}>{cls.title}</p>
                    <p className={`text-[10px] uppercase ${vehicle === cls.id ? 'text-[#d7e3fc]/80' : 'text-[#c5c6cd]'}`}>{cls.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: State & Location */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <label className="text-[0.6875rem] font-bold text-[#c5c6cd] uppercase tracking-widest">03. Jurisdiction</label>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#40e56c]/10 border-none">
                <span className="w-1.5 h-1.5 bg-[#40e56c] rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#40e56c] uppercase tracking-tight">Active</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0c6ff] pointer-events-none">
                <span className="material-symbols-outlined">map</span>
              </div>
              <select 
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-[#030e20] border-none rounded-lg py-4 pl-12 pr-4 text-[#d7e3fc] font-medium appearance-none focus:ring-0 focus:bg-[#2a3549] transition-colors outline-none cursor-pointer"
              >
                {STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c5c6cd]">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Result Card: Floating Glassmorphism ── */}
        {baseFine !== null && (
          <section className="bg-[#142032]/70 backdrop-blur-md rounded-lg p-8 shadow-[0_0_20px_rgba(176,198,255,0.05)] relative overflow-hidden border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#b0c6ff]/10 blur-[80px] rounded-full"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[0.6875rem] font-bold text-[#c5c6cd] uppercase tracking-[0.3em]">Estimated Liability</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-6xl font-black text-white tracking-tighter">
                    ₹{baseFine.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2">
                  <span className="bg-[#ed3800] text-white px-2 py-0.5 rounded text-[10px] font-black tracking-tighter">{activeViolation.mva} MVA</span>
                  <span className="text-[#c5c6cd] text-[10px] font-medium italic">Amended Act 2019</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button className="bg-[#b0c6ff] text-[#002d6f] px-8 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(176,198,255,0.3)] hover:scale-105 active:scale-95 transition-all">
                  <span>DETAILED REPORT</span>
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                </button>
                <button className="bg-[#2a3549]/40 text-[#c5c6cd] px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#2a3549] transition-colors">
                  Save to History
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#c5c6cd] mb-1">Max Penalty</p>
                <p className="text-sm font-bold text-[#ffb4ab]">₹{activeViolation.max}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#c5c6cd] mb-1">Processing Time</p>
                <p className="text-sm font-bold text-[#40e56c]">Instant Settlement</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
