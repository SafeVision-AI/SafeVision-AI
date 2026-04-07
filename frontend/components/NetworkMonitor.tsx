'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function NetworkMonitor() {
  const { setConnectivity } = useAppStore();

  useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      setConnectivity(navigator.onLine ? 'online' : 'offline');
    }

    const handleOnline = () => {
      // In a real app we might ping a server to verify. For now, trust the browser.
      setConnectivity('online');
    };

    const handleOffline = () => {
      setConnectivity('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setConnectivity]);

  return null;
}
