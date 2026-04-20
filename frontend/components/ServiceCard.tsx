'use client';


import { NearbyService } from '@/lib/store';

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

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lon}`;

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
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-blue"
            aria-label={`Get directions to ${service.name}`}
          >
            🗺 Directions
          </a>
        </div>
      </div>
    </div>
  );
}
