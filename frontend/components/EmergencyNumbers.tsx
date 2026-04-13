'use client';

import { Fragment } from 'react';

import { PRIMARY_EMERGENCY_BAR } from '@/lib/emergency-numbers';

export function EmergencyNumbers() {
  return (
    <nav
      className="emergency-bar"
      aria-label="Emergency phone numbers"
      role="navigation"
    >
      {PRIMARY_EMERGENCY_BAR.map((n, i) => (
        <Fragment key={n.id}>
          {i > 0 && <div className="bar-divider" aria-hidden="true" key={`div-${i}`} />}
          <a
            key={n.service}
            href={`tel:${n.service}`}
            className="emergency-bar-btn"
            aria-label={`Call ${n.label}: ${n.service}`}
          >
            <span
              className="emergency-bar-num"
              style={{ color: n.color }}
            >
              {n.service}
            </span>
            <span
              className="emergency-bar-label"
              style={{ color: n.color, opacity: 0.75 }}
            >
              {n.label}
            </span>
          </a>
        </Fragment>
      ))}
    </nav>
  );
}
