'use client';

interface EmergencyNumber {
  number: string;
  label: string;
  color: string;
}

const NUMBERS: EmergencyNumber[] = [
  { number: '112', label: 'Emergency', color: 'var(--accent-red)' },
  { number: '102', label: 'Ambulance', color: 'var(--accent-green)' },
  { number: '100', label: 'Police',    color: 'var(--accent-blue)' },
  { number: '1033', label: 'Highway',  color: 'var(--accent-orange)' },
];

export function EmergencyNumbers() {
  return (
    <nav
      className="emergency-bar"
      aria-label="Emergency phone numbers"
      role="navigation"
    >
      {NUMBERS.map((n, i) => (
        <>
          {i > 0 && <div className="bar-divider" aria-hidden="true" key={`div-${i}`} />}
          <a
            key={n.number}
            href={`tel:${n.number}`}
            className="emergency-bar-btn"
            aria-label={`Call ${n.label}: ${n.number}`}
          >
            <span
              className="emergency-bar-num"
              style={{ color: n.color }}
            >
              {n.number}
            </span>
            <span
              className="emergency-bar-label"
              style={{ color: n.color, opacity: 0.75 }}
            >
              {n.label}
            </span>
          </a>
        </>
      ))}
    </nav>
  );
}
