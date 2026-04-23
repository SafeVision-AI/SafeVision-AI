import React from 'react';
import Image from 'next/image';
import { Droplet, Car, PhoneCall, Zap } from 'lucide-react';

export default function ProfileCard() {
  return (
    <div className="relative p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden group">
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative group/avatar">
          <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-white/10 ring-4 ring-emerald-500/20 overflow-hidden relative">
            <Image 
              className="object-cover transition-all duration-500 group-hover/avatar:scale-110" 
              alt="Profile picture" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWgLDPCPukFOhMeqo-sFJLb_pTjR9ItnZWcjZ793N-COvmvj3a9BbI95bMx0it5kI5qFXXeGtqUB1GgOsQ597ztGBQQWAzWQBIvHG1GKtWcUn3OCUTDpLszpKkrH4cd6cBa9ChbKOiCel7WBLe7DYu5OOMb7vjxFXcbFDwS25slG-l9ASkYLkwwCjwvURq816VDJXAW80TqOXs6qNiMxPJJun2PcJV9iGNGNqO8PMQ9kDTdyeb5ww_mh4b3Zr9vXL80-0U0aa1eNvJ"
              fill
              sizes="(max-width: 768px) 96px, 96px"
              priority
            />
          </div>
          <button className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white dark:border-[#0A0E14] active:scale-90 transition-all">
            <Zap size={14} className="text-white" />
          </button>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-space">Marcus Thorne</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Demo Mode — Verified Tactical Responder</p>
        </div>
        
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <Droplet size={14} className="text-red-500" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">O Negative</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <Car size={14} className="text-emerald-500" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">SV-2024-AI</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
            <PhoneCall size={14} className="text-slate-400" />
            <span className="text-[9px] font-semibold uppercase text-slate-400">9876543210</span>
          </div>
        </div>
      </div>
    </div>
  );
}
