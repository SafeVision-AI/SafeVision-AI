'use client';

import { motion } from 'framer-motion';
import { Crosshair, Cpu, Scan, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

interface HazardViewfinderProps {
  imageSrc?: string;
  isDetecting?: boolean;
  confidence?: number;
  statusLabel?: string;
  signalLabel?: string;
  locationLabel?: string;
  viewportId?: string;
}

export default function HazardViewfinder({
  imageSrc,
  isDetecting = true,
  confidence = 98.4,
  statusLabel = 'Live hazard viewport',
  signalLabel = 'Awaiting GPS',
  locationLabel = 'Awaiting live coordinates',
  viewportId = 'RW-LIVE-VIEWPORT',
}: HazardViewfinderProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-[#030e20] shadow-2xl group">
      <div className="absolute inset-0 z-0">
        {imageSrc ? (
          <Image alt="Hazard evidence" src={imageSrc} fill className="object-cover opacity-60 grayscale mix-blend-luminosity transition-all duration-700 group-hover:grayscale-0" unoptimized />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-slate-900/50">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className="h-32 w-32 rounded-full border border-red-500/20" />
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute inset-0 flex items-center justify-center">
                <Scan className="text-red-500/20" size={60} strokeWidth={0.5} />
              </motion.div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="animate-pulse font-space text-[10px] font-black uppercase tracking-[0.4em] text-red-500/40">Camera uplink waiting</span>
              <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-slate-600">Add a real road photo for faster authority verification</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#071325] via-transparent to-[#071325]/40" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-space text-[10px] font-black uppercase tracking-[0.2em] text-white">{statusLabel}</span>
            </div>
            <span className="pl-1 font-mono text-[9px] font-bold uppercase tracking-tight text-slate-400">Vector: {locationLabel}</span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-md">
              <Cpu size={12} className="text-emerald-400" />
              <span className="font-space text-[10px] font-black uppercase tracking-widest text-emerald-400">AI Core {confidence}%</span>
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-tight text-slate-500">Signal: {signalLabel}</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative h-full w-full max-h-[280px] max-w-[280px]">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-red-500/60" />
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-red-500/60" />
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-red-500/60" />
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }} className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-red-500/60" />

            {isDetecting ? <motion.div initial={{ top: '10%', opacity: 0 }} animate={{ top: ['10%', '90%', '10%'], opacity: [0, 1, 0.1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="absolute left-0 z-30 h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.5)]" /> : null}

            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className="h-full w-full rounded-full border border-red-400" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.05, 0.2] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute h-2/3 w-2/3 rounded-full border border-red-400" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Crosshair className="text-red-500/40" size={40} strokeWidth={1} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 self-start">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1 shadow-lg shadow-red-600/20">
              <ShieldAlert size={12} className="text-white" />
              <span className="font-space text-[10px] font-black uppercase tracking-widest text-white">Confirmed hazard</span>
            </div>
            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
              {isDetecting ? 'Analyzing risk...' : 'Ready to dispatch'}
            </motion.div>
          </div>
          <span className="pl-1 font-space text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-70">{viewportId}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
