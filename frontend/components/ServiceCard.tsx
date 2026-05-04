'use client';

import { useState } from 'react';
import { NearbyService } from '@/lib/store';
import {
  openBestNavApp,
  openNavApp,
  getPreferredNavApp,
  setPreferredNavApp,
  NAV_APPS,
  type NavApp,
} from '@/lib/navigation-launch';

// ── Accent colors per category ────────────────────────────────────────────────

const ACCENT_COLORS: Record<NearbyService['category'], string> = {
  hospital:  'var(--accent-red)',
  ambulance: 'var(--accent-red)',
  police:    'var(--accent-blue)',
  fire:      'var(--accent-orange)',
  towing:    'var(--accent-amber)',
  pharmacy:  'var(--accent-purple)',
  puncture:  'var(--accent-green)',
  showroom:  'var(--accent-blue)',
};

const CATEGORY_LABELS: Record<NearbyService['category'], string> = {
  hospital:  'Hospital',
  ambulance: 'Ambulance',
  police:    'Police Station',
  fire:      'Fire Station',
  towing:    'Towing Service',
  pharmacy:  'Pharmacy',
  puncture:  'Puncture Shop',
  showroom:  'Showroom',
};

interface Props {
  service: NearbyService;
  className?: string;
}

function formatDistance(metres: number): string {
  return metres < 1000
    ? `${metres.toFixed(0)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}

export function ServiceCard({ service, className = '' }: Props) {
  const color = ACCENT_COLORS[service.category];
  const label = CATEGORY_LABELS[service.category];
  const [showNavChoice, setShowNavChoice] = useState(false);

  const dest = { lat: service.lat, lon: service.lon, name: service.name };

  const handleNavSelect = (app: NavApp) => {
    setPreferredNavApp(app);
    openNavApp(app, dest);
    setShowNavChoice(false);
  };

  return (
    <div className={`service-card ${className}`} role="article" aria-label={service.name}>
      {/* Left accent bar */}
      <div className="service-card-accent" style={{ backgroundColor: color }} aria-hidden="true" />

      <div className="service-card-body">
        {/* Top row: name + distance */}
        <div className="service-card-top">
          <div>
            <div className="service-card-name">{service.name}</div>
            <div style={{ color, fontSize: '0.75rem', fontWeight: 600, marginTop: '2px' }}>
              {label}
              {service.source === 'offline' && (
                <span style={{
                  marginLeft: '0.5rem',
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                }}>
                  · offline cache
                </span>
              )}
            </div>
          </div>
          <div className="service-card-dist">{formatDistance(service.distance)}</div>
        </div>

        {/* Actions row */}
        <div className="service-card-actions">
          {service.phone && (
            <a
              href={`tel:${service.phone}`}
              className="btn btn-outline-green"
              aria-label={`Call ${service.name}: ${service.phone}`}
            >
              📞 Call
            </a>
          )}

          {/* Primary: open in preferred nav app */}
          <button
            onClick={() => openBestNavApp(dest)}
            className="btn btn-outline-blue"
            aria-label={`Get directions to ${service.name}`}
          >
            🗺️ Directions
          </button>

          {/* Secondary: nav app chooser dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNavChoice(!showNavChoice)}
              className="btn btn-outline-blue"
              aria-label="Choose navigation app"
              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
              title={`Using: ${NAV_APPS.find(a => a.key === getPreferredNavApp())?.label || 'Google Maps'}`}
            >
              ⌄
            </button>

            {/* Dropdown */}
            {showNavChoice && (
              <div
                className="absolute right-0 bottom-full mb-2 z-50 min-w-[160px] rounded-lg overflow-hidden shadow-2xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary, #0D1117)',
                  borderColor: 'var(--border-color, rgba(255,255,255,0.08))',
                }}
              >
                {NAV_APPS.map((app) => {
                  const isActive = getPreferredNavApp() === app.key;
                  return (
                    <button
                      key={app.key}
                      onClick={() => handleNavSelect(app.key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider transition-colors"
                      style={{
                        color: isActive ? 'var(--accent-green, #00C896)' : 'var(--text-primary, #d7e3fc)',
                        backgroundColor: isActive ? 'rgba(0,200,150,0.08)' : 'transparent',
                      }}
                    >
                      <span className="text-base">{app.emoji}</span>
                      {app.label}
                      {isActive && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
