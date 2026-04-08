'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { Menu, Mic, MapPin, Moon, Sun, Monitor, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAccuracyLabel, formatLocationLabel, isApproximateLocation } from '@/lib/location-utils';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ThemeProvider';

interface TopSearchProps {
  isMapPage?: boolean;
  forceShow?: boolean;
  showBack?: boolean;
  backHref?: string;
}

const MAP_FILTER_CHIPS: Array<{
  label: string;
  value: 'all' | 'hospital' | 'police' | 'ambulance' | 'fire' | 'pharmacy';
  icon: string;
  color: string;
  bg: string;
}> = [
  { label: 'All', value: 'all', icon: 'layers', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10' },
  { label: 'Hospitals', value: 'hospital', icon: 'local_hospital', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  { label: 'Police', value: 'police', icon: 'local_police', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Ambulance', value: 'ambulance', icon: 'emergency', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Fire', value: 'fire', icon: 'local_fire_department', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  { label: 'Pharmacy', value: 'pharmacy', icon: 'medication', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
];

const TopSearch = memo(function TopSearch({ 
  isMapPage = false, 
  forceShow = false,
  showBack = false,
  backHref = '/'
}: TopSearchProps) {
  const { gpsError, gpsLocation, serviceCategory, setServiceCategory, setSystemSidebarOpen } = useAppStore((state) => ({
    gpsError: state.gpsError,
    gpsLocation: state.gpsLocation,
    serviceCategory: state.serviceCategory,
    setServiceCategory: state.setServiceCategory,
    setSystemSidebarOpen: state.setSystemSidebarOpen,
  }));
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const locationLabel = formatLocationLabel(gpsLocation, gpsError);
  const locationAccuracy = formatAccuracyLabel(gpsLocation);
  const locationIsApproximate = isApproximateLocation(gpsLocation);

  const requestLocation = () => {
    window.dispatchEvent(new CustomEvent('svai:refresh-location'));
  };

  return (
    <div className={`absolute top-0 left-0 w-full z-40 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] md:pb-6 md:pt-[calc(1.5rem+env(safe-area-inset-top))] pointer-events-none flex flex-col items-center ${(!isMapPage && !forceShow) ? 'lg:hidden' : ''}`}>
      
      {/* Top Row: Search Bar (Center) & Desktop Controls */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex items-center justify-center md:justify-between lg:justify-center relative md:gap-4 lg:gap-6 md:px-4 lg:px-0"
      >
        
        {/* Left Side: Location Badge on Tablet/Desktop (Hidden on short landscape) */}
        <div className="hidden min-[1100px]:flex pointer-events-auto h-[52px] shrink-0">
          <button
            type="button"
            onClick={requestLocation}
            title={gpsError ?? 'Refresh current location'}
            className="flex items-center h-full gap-2 bg-white/95 dark:bg-[#1a2133]/95 backdrop-blur-2xl ring-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-full px-5 hover:bg-white dark:hover:bg-[#1f283d] transition-all cursor-pointer group"
          >
            <div className="bg-emerald-500/10 p-1.5 rounded-full">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              {locationLabel}
            </span>
            {locationAccuracy ? (
              <span className={`hidden min-[1320px]:inline text-[10px] font-black uppercase tracking-[0.18em] ${locationIsApproximate ? 'text-amber-500 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {locationAccuracy}
              </span>
            ) : null}
          </button>
        </div>

        {/* Floating Pill Search Bar (Google Maps Style) */}
        <div className={`w-full sm:max-w-md md:max-w-none md:flex-1 lg:flex-none lg:w-full lg:max-w-xl pointer-events-auto flex items-center h-[52px] bg-white/95 dark:bg-[#1a2133]/95 backdrop-blur-2xl rounded-full px-4 transition-all duration-300 border ${isFocused ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' : 'border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]'}`}>
          
          {showBack && (
            <Link href={backHref} className="p-2 mr-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-700 dark:text-slate-300 lg:hidden group flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
          )}

          <button 
            onClick={() => setSystemSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-700 dark:text-slate-300 lg:hidden mr-1"
          >
            <Menu className="w-6 h-6" />
          </button>

          <input
            type="text"
            placeholder="Ask Maps or Search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 px-2 text-slate-800 dark:text-[#d7e3fc] placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium text-base h-full w-full"
          />

          <button className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all ml-2">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Theme Toggle on Tablet/Desktop */}
        <div className="hidden md:flex pointer-events-auto h-[52px]">
          {mounted && (
            <div className="flex items-center h-full gap-1 bg-white/90 dark:bg-[#1a2133]/90 backdrop-blur-xl ring-1 ring-white/40 dark:ring-white/10 shadow-2xl rounded-full px-1.5">
              <button 
                onClick={() => setTheme('light')}
                className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Light Mode"
              >
                <Sun className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Dark Mode"
              >
                <Moon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`p-2 rounded-full transition-all ${theme === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="System Theme"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Floating Chips Row */}
      {isMapPage && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pointer-events-auto"
        >
          <div className="flex items-center gap-2 px-1 w-max mx-auto">
            <button
              type="button"
              onClick={requestLocation}
              title={gpsError ?? 'Refresh current location'}
              className="min-[1100px]:hidden flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-[#1a2133]/90 backdrop-blur-xl rounded-full shadow-lg ring-1 ring-white/40 dark:ring-white/10 whitespace-nowrap active:scale-95 transition-transform hover:shadow-2xl"
            >
              <div className="bg-emerald-500/10 p-1 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-[#d7e3fc]">
                {gpsError ? 'Enable Location' : gpsLocation ? 'Refresh Location' : 'Use My Location'}
              </span>
              {locationIsApproximate && locationAccuracy ? (
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-500 dark:text-amber-300">
                  {locationAccuracy}
                </span>
              ) : null}
            </button>
            {MAP_FILTER_CHIPS.map((chip) => {
              const isActive = serviceCategory === chip.value;
              return (
              <button
                key={chip.label}
                onClick={() => setServiceCategory(chip.value)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-[#1a2133]/90 backdrop-blur-xl rounded-full shadow-lg ring-1 ring-white/40 dark:ring-white/10 whitespace-nowrap active:scale-95 transition-transform hover:shadow-2xl"
                data-active={isActive}
                aria-pressed={isActive}
              >
                <div className={`${isActive ? 'bg-blue-500/15' : chip.bg} p-1 rounded-full flex items-center justify-center`}>
                  <span
                    className={`material-symbols-outlined text-[16px] ${isActive ? 'text-blue-600 dark:text-blue-400' : chip.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {chip.icon}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-[#d7e3fc]'}`}>
                  {chip.label}
                </span>
              </button>
            )})}
          </div>
        </motion.div>
      )}

    </div>
  );
});

export default TopSearch;
