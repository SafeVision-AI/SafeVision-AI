'use client';

import { useAppStore, ConnectivityState } from '@/lib/store';

const CONFIG: Record<ConnectivityState, { label: string; color: string }> = {
  'online':     { label: 'Live',    color: 'conn-online' },
  'cached':     { label: 'Cached',  color: 'conn-cached' },
  'offline':    { label: 'Offline', color: 'conn-offline' },
  'ai-offline': { label: 'AI Active', color: 'conn-ai' },
};

interface Props {
  className?: string;
}

export function ConnectivityBadge({ className = '' }: Props) {
  const connectivity = useAppStore((s) => s.connectivity);
  const { label, color } = CONFIG[connectivity];

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`Connectivity: ${label}`}
      className={`conn-badge ${color} ${className}`}
    >
      <span className="conn-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
