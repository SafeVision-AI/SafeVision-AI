'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { MapPin, BotMessageSquare, MapPinPlus, AlertTriangle, HeartPulse } from 'lucide-react';

interface NavItem {
  id: number;
  icon: string | React.ReactNode;
  label: string;
  href: string;
}

const items: NavItem[] = [
  { id: 0, icon: <MapPin size={24} strokeWidth={2.5} />, label: "Map", href: "/" },
  { id: 1, icon: <BotMessageSquare size={24} strokeWidth={2.5} />, label: "AI Chat", href: "/assistant" },
  { id: 2, icon: <MapPinPlus size={24} strokeWidth={2.5} />, label: "Locator", href: "/locator" },
  { id: 3, icon: <AlertTriangle size={24} strokeWidth={2.5} />, label: "Report", href: "/report" },
  { id: 4, icon: <HeartPulse size={24} strokeWidth={2.5} />, label: "First Aid", href: "/first-aid" },
];

const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();

  // Find which tab is active based on the URL. If not found, default to 0
  const activeIndex = items.findIndex(item => item.href === pathname);
  const active = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full flex justify-center lg:hidden [@media(max-height:500px)]:hidden">
      <div className="relative flex items-center justify-around w-[92vw] max-w-sm md:max-w-md bg-white/80 dark:bg-[#1a2133]/80 backdrop-blur-xl rounded-[2.5rem] px-2 py-2 shadow-xl border border-white/20 dark:border-white/10 overflow-hidden pointer-events-auto">

        {/* Active Indicator Glow */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-12 h-12 bg-gradient-to-r from-emerald-500 to-[#00C896] rounded-full blur-2xl -z-10"
          animate={{
            left: `calc(${active * (100 / items.length)}% + ${100 / items.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {items.map((item, index) => {
          const isActive = index === active;
          return (
            <Link 
              href={item.href} 
              key={item.id} 
              className="relative flex flex-col items-center group p-1 min-w-touch min-h-touch"
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (typeof window !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate(10);
                }
              }}
            >
              {/* Button & Pill */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-x-2 top-0.5 bottom-4 bg-[#1A5C38] dark:bg-[#1A5C38] rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={{ scale: isActive ? 1.2 : 1 }}
                className={`flex items-center justify-center w-9 h-9 relative z-10 transition-colors ${isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-[#00C896]'
                  }`}
              >
                {/* Dynamically Render Lucide Node or Material Symbol */}
                {typeof item.icon === 'string' ? (
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                ) : (
                  item.icon
                )}
              </motion.div>

              {/* Persistent Text Label */}
              <span className={`text-[9px] font-bold mt-1 tracking-wide ${isActive ? 'text-emerald-700 dark:text-[#00C896]' : 'text-slate-600 dark:text-slate-400'}`}>
                {item.label}
              </span>

            </Link>
          );
        })}
      </div>
    </div>
  );
});

export default BottomNav;
