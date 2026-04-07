'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
          className="absolute w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl -z-10"
          animate={{
            left: `calc(${active * (100 / items.length)}% + ${100 / items.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {items.map((item, index) => {
          const isActive = index === active;
          return (
            <Link href={item.href} key={item.id} className="relative flex flex-col items-center group">
              {/* Button */}
              <motion.div
                whileHover={{ scale: 1.2 }}
                animate={{ scale: isActive ? 1.4 : 1 }}
                className={`flex items-center justify-center w-11 h-11 relative z-10 transition-colors ${isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400'
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

              {/* Tooltip */}
              <span className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded-md bg-slate-800 text-white dark:bg-slate-200 dark:text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
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
