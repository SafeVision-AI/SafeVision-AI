'use client';

import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { NetworkMonitor } from '@/components/NetworkMonitor';
import { useAppStore } from '@/lib/store';
import { GlobalSOS } from '@/components/GlobalSOS';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  const isDesktopSidebarCollapsed = useAppStore((state) => state.isDesktopSidebarCollapsed);

  return (
    <div className="flex min-h-dvh w-full bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* ── Skip Link for Accessibility ── */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 p-2 bg-[var(--bg-card)] text-[var(--text-primary)] font-bold rounded"></a>
      {/* ── Desktop Sidebar (Hidden on Mobile) ── */}
      <NetworkMonitor />
      <GlobalSOS />
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* ── Main Content Area ── */}
      <main id="main" className={`flex-1 relative flex min-h-dvh w-full transition-all duration-300 ${isDesktopSidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}>
        <div className="relative min-h-dvh w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
