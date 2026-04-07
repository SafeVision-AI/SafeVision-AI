'use client';

import { useEffect, ReactNode } from 'react';
import { useAppStore } from '@/lib/store';

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const { setConnectivity } = useAppStore();

  useEffect(() => {
    const update = () => {
      setConnectivity(navigator.onLine ? 'online' : 'offline');
    };

    // Set initial state
    setConnectivity(navigator.onLine ? 'online' : 'offline');

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [setConnectivity]);

  return <>{children}</>;
}
