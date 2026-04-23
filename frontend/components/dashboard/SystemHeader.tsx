'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Mic, Sun, Moon, Monitor, Menu, ShieldCheck, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ThemeProvider';

interface SystemHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  isOnlineInitial?: boolean;
}

const SystemHeader = memo(function SystemHeader({
  title = 'SafeVixAI',
  showBack = true,
  backHref = '/',
  isOnlineInitial = true
}: SystemHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(isOnlineInitial);
  const { theme, setTheme } = useTheme();
  const setSystemSidebarOpen = useAppStore((state) => state.setSystemSidebarOpen);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const operatorName = useAppStore((s) => s.operatorName);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: implement search navigation
    }
  };

  return (
    <header className="hidden lg:flex fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 shadow-sm px-6 h-16 items-center justify-between transition-colors duration-500">
      <div className="flex items-center gap-4 flex-1">
        {showBack && (
          <Link 
            href={backHref} 
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        
        <div className="flex flex-col">
          <h1 
            className="text-slate-800 dark:text-slate-200 font-black tracking-tight text-base leading-tight font-space uppercase"
            aria-current="page"
          >
            {title}
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sentinel Active</span>
          </div>
        </div>
      </div>

      {/* Desktop Search Bar (Google Maps Style) */}
      <form 
        onSubmit={handleSearch}
        role="search"
        aria-label="Search"
        className="flex-1 max-w-md mx-8 flex h-11 bg-slate-100 dark:bg-[#1a2133] rounded-full border border-slate-200 dark:border-white/5 items-center px-2 overflow-hidden transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(0,200,150,0.12)] focus-within:bg-white dark:focus-within:bg-[#1f283d] focus-within:border-[#1A5C38]/40"
      >
        <button
          type="button"
          onClick={() => setSystemSidebarOpen(true)}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors mr-1"
          title="Global Navigation"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ask Maps or Search System"
          aria-label="Search input"
          className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 px-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 font-medium h-full w-full"
        />
        <button 
          type="button"
          className="p-2 mr-1 rounded-full bg-[#1A5C38]/10 text-[#1A5C38] dark:text-[#00C896] hover:bg-[#1A5C38]/20 transition-all"
        >
          <Mic className="w-4 h-4" />
        </button>
      </form>

      <div className="flex items-center gap-4 min-w-[280px] justify-end">
        {/* Connection Status */}
        <div className="flex bg-white dark:bg-[#161c2d] rounded-xl p-0.5 border border-slate-200 dark:border-white/5 shadow-inner">
          <button
            title="Force Online Mode"
            disabled={isOnline}
            className={`px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 ${isOnline ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Online
          </button>
          <button
            title="Force Offline Mode"
            disabled={!isOnline}
            className={`px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all duration-200 ${!isOnline ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Offline
          </button>
        </div>

        {/* Theme Switcher */}
        {mounted && (
          <div className="flex items-center h-10 gap-1 bg-white dark:bg-[#1a2133] rounded-full p-1 border border-slate-200 dark:border-white/5 shadow-sm">
            {[
              { id: 'light', icon: <Sun size={14} />, title: 'Light' },
              { id: 'dark', icon: <Moon size={14} />, title: 'Dark' },
              { id: 'system', icon: <Monitor size={14} />, title: 'Auto' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                title={t.title}
                className={`p-1.5 rounded-full transition-all ${theme === t.id ? 'bg-emerald-100 text-emerald-700 dark:bg-[#1A5C38]/20 dark:text-[#00C896] shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                {t.icon}
              </button>
            ))}
          </div>
        )}

        {/* Operator Chip (only when authenticated) */}
        {isAuthenticated && operatorName && (
          <div className="hidden xl:flex items-center gap-2 bg-[#1A5C38]/10 dark:bg-[#1A5C38]/20 px-3 py-2 rounded-full border border-[#1A5C38]/20 dark:border-[#1A5C38]/30">
            <User size={12} className="text-[#1A5C38] dark:text-[#00C896]" />
            <span className="text-[10px] uppercase tracking-widest font-black text-[#1A5C38] dark:text-[#00C896] max-w-[120px] truncate">{operatorName}</span>
          </div>
        )}

        <div className="hidden xl:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] uppercase tracking-widest font-black text-emerald-700 dark:text-emerald-400">Secure</span>
        </div>
      </div>
    </header>
  );
});

export default SystemHeader;
