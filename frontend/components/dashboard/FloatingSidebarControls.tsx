'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';

// ── Driving Score 2.0 (High-Fidelity Gauge) ──
const DrivingScore = ({ score }: { score: number }) => {
  const getStatus = (s: number) => {
    if (s >= 80) return { label: 'OPTIMAL', color: '#53e16f', glow: 'rgba(83, 225, 111, 0.5)' };
    if (s >= 60) return { label: 'CAUTION', color: '#f5d44f', glow: 'rgba(245, 212, 79, 0.5)' };
    return { label: 'CRITICAL', color: '#ff5545', glow: 'rgba(255, 85, 69, 0.5)' };
  };

  const { label, color, glow } = getStatus(score);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center group pointer-events-auto"
    >
      {/* Label (Sliding out) */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="self-center bg-white/90 dark:bg-[#0B1121]/90 backdrop-blur-xl rounded-full px-4 py-1.5 border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5545] animate-pulse shadow-[0_0_8px_rgba(255,85,69,0.8)]"></span>
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-700 dark:text-blue-400 uppercase font-space">
            Priority Vectors Detected
          </span>
        </div>
        <p className="text-xs font-black tracking-widest font-space" style={{ color }}>{label}</p>
      </div>

      <div className="relative w-14 h-14 rounded-full bg-white/95 dark:bg-[#0a0f1a]/90 backdrop-blur-xl shadow-2xl ring-1 ring-white/40 dark:ring-white/10 flex items-center justify-center cursor-help transition-all duration-500 overflow-hidden">
        {/* Subtle Neon Glow Backdrop */}
        <div
          className="absolute inset-0 blur-xl opacity-20"
          style={{ backgroundColor: color }}
        />

        <svg className="absolute inset-0 w-full h-full -rotate-90">
          {/* Background Track */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          {/* Progress Gauge */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
          />
        </svg>

        <div className="z-10 flex flex-col items-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-black leading-none tracking-tighter"
            style={{ color }}
          >
            {score}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Tactical HUD Button ──
interface HUDButtonProps {
  icon: string | React.ReactNode;
  label: string;
  color?: string;
  href?: string;
  onClick?: () => void;
  isCustom?: boolean; // For SOS button logic
}

const HUDButton = ({ icon, label, color = "#c5c6cd", href, onClick, isCustom }: HUDButtonProps) => {
  const ButtonContent = (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative w-12 h-12 flex items-center justify-center rounded-full bg-white/95 dark:bg-[#1a2133]/90 backdrop-blur-xl ring-1 ring-white/40 dark:ring-white/10 shadow-2xl transition-all group/btn ${isCustom ? '' : 'pointer-events-auto'}`}
    >
      {/* Side Label */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover/btn:translate-x-0">
        <span className="bg-white/95 dark:bg-[#0B1121]/90 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-black tracking-[0.15em] text-slate-800 dark:text-blue-200 uppercase whitespace-nowrap shadow-2xl font-space">
          {label}
        </span>
      </div>

      <div className="transition-transform duration-300 group-hover/btn:rotate-12" style={{ color }}>
        {typeof icon === 'string' ? (
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>
            {icon}
          </span>
        ) : (
          icon
        )}
      </div>
    </motion.button>
  );

  if (href) {
    return <Link href={href} className="pointer-events-auto">{ButtonContent}</Link>;
  }

  return <div className="pointer-events-auto">{ButtonContent}</div>;
};

// ── Main Dashboard HUD ──
export default function FloatingSidebarControls() {
  const [isScanning, setIsScanning] = useState(false);
  const drivingScore = useAppStore((state) => state.drivingScore);

  const handleRelocate = () => {
    setIsScanning(true);
    window.dispatchEvent(new CustomEvent('svai:refresh-location'));
    // Simulate tactical scan
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", damping: 20, stiffness: 100 }}
      className="absolute right-4 bottom-24 lg:bottom-8 z-40 flex flex-col items-center gap-5 pointer-events-none"
    >
      {/* ── Driver Analytics ── */}
      <DrivingScore score={drivingScore ?? 78} />

      {/* ── Control Stack ── */}
      <div className="flex flex-col gap-3">
        <HUDButton
          icon="my_location"
          label="Relocate Sentinel"
          onClick={handleRelocate}
        />

        <HUDButton
          icon={<ShieldAlert size={20} strokeWidth={2.5} />}
          label="Emergency Protocols"
          href="/emergency"
          color="#ff5545"
        />
      </div>

      {/* ── Priority Action: SOS ── */}
      <Link href="/sos" className="pointer-events-auto mt-2">
        <motion.button
          onClick={() => {
             try { if (navigator?.vibrate) navigator.vibrate(50); } catch (e) {}
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          className="relative w-16 h-16 bg-[#ff5545] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,85,69,0.4)] group z-50 overflow-hidden"
        >
          {/* Multi-layered Tactical Ripples */}
          <motion.div
            animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-white/30"
          />
          <motion.div
            animate={{ scale: [1, 1.8, 2], opacity: [0.3, 0.1, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full border-2 border-white/20"
          />

          <span className="text-white text-lg font-black tracking-[0.1em] relative z-10 drop-shadow-md">
            SOS
          </span>

          {/* Dynamic "Scanning" Overlay effect for buttons (Optional/UX) */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ top: "-100%" }}
                animate={{ top: "100%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: 2, ease: "linear" }}
                className="absolute inset-x-0 h-10 w-full bg-white/20 blur-xl pointer-events-none z-20"
              />
            )}
          </AnimatePresence>
        </motion.button>
      </Link>
    </motion.div>
  );
}
