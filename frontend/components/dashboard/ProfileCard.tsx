'use client';

import React from 'react';
import { Droplet, Car, PhoneCall, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function ProfileCard() {
  const userProfile = useAppStore((state) => state.userProfile);
  const displayName = userProfile.name || 'Emergency Profile';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SV';

  return (
    <div className="relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden group">
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative group/avatar">
          <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-white/10 ring-4 ring-emerald-500/20 overflow-hidden relative bg-emerald-950 text-emerald-100 flex items-center justify-center">
            <span className="text-3xl font-black tracking-tight font-space">{initials}</span>
          </div>
          <button aria-label="Emergency profile status" className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white dark:border-[#0A0E14] active:scale-90 transition-all">
            <Zap size={14} className="text-white" />
          </button>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-space">{displayName}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {userProfile.name ? 'Verified emergency profile' : 'Complete profile for faster SOS dispatch'}
          </p>
        </div>
        
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <Droplet size={14} className="text-red-500" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">{userProfile.bloodGroup || 'Blood group'}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <Car size={14} className="text-emerald-500" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">{userProfile.vehicleNumber || 'Vehicle ID'}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <PhoneCall size={14} className="text-slate-400" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">{userProfile.emergencyContact || 'Emergency contact'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
