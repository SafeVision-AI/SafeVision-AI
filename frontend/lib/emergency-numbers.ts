export interface EmergencyNumberEntry {
  id: string;
  service: string;
  label: string;
  coverage: string;
  notes?: string;
  color: string;
}

export const EMERGENCY_NUMBER_LIST: EmergencyNumberEntry[] = [
  {
    id: 'national_emergency',
    service: '112',
    label: 'Emergency',
    coverage: 'Pan-India',
    notes: 'Unified emergency response',
    color: 'var(--accent-red)',
  },
  {
    id: 'ambulance',
    service: '102',
    label: 'Ambulance',
    coverage: 'Pan-India',
    notes: 'Public ambulance dispatch in many states',
    color: 'var(--accent-green)',
  },
  {
    id: 'police',
    service: '100',
    label: 'Police',
    coverage: 'Pan-India',
    notes: 'Police control room',
    color: 'var(--accent-blue)',
  },
  {
    id: 'fire',
    service: '101',
    label: 'Fire',
    coverage: 'Pan-India',
    notes: 'Fire and rescue services',
    color: 'var(--accent-orange)',
  },
  {
    id: 'medical_emergency',
    service: '108',
    label: 'Medical Emergency',
    coverage: 'Most states',
    notes: 'Integrated emergency medical response',
    color: 'var(--accent-green)',
  },
  {
    id: 'national_highway',
    service: '1033',
    label: 'Highway',
    coverage: 'National Highways',
    notes: 'NHAI emergency helpline',
    color: 'var(--accent-orange)',
  },
  {
    id: 'state_highway',
    service: '1073',
    label: 'State Highway',
    coverage: 'Many states',
    notes: 'State highway emergency and roadside support',
    color: 'var(--accent-orange)',
  },
  {
    id: 'health_helpline',
    service: '104',
    label: 'Health Helpline',
    coverage: 'Many states',
    notes: 'Public health advice and referrals',
    color: 'var(--accent-green)',
  },
  {
    id: 'women_helpline',
    service: '1091',
    label: 'Women Helpline',
    coverage: 'Pan-India',
    notes: 'Women safety helpline',
    color: 'var(--accent-red)',
  },
  {
    id: 'child_helpline',
    service: '1098',
    label: 'Child Helpline',
    coverage: 'Pan-India',
    notes: 'Child emergency support',
    color: 'var(--accent-blue)',
  },
  {
    id: 'disaster_management',
    service: '1099',
    label: 'Disaster',
    coverage: 'Selected deployments',
    notes: 'Disaster management support where available',
    color: 'var(--accent-orange)',
  },
  {
    id: 'aiims_trauma',
    service: '011-26588500',
    label: 'AIIMS Trauma',
    coverage: 'Delhi referral',
    notes: 'AIIMS Trauma Centre board line',
    color: 'var(--accent-blue)',
  },
  {
    id: 'cpgrams',
    service: '1800-11-0012',
    label: 'CPGRAMS',
    coverage: 'Pan-India',
    notes: 'Public grievance support desk',
    color: 'var(--accent-blue)',
  },
];

export const PRIMARY_EMERGENCY_BAR = EMERGENCY_NUMBER_LIST.filter((entry) =>
  ['112', '102', '100', '1033'].includes(entry.service),
);

export const EMERGENCY_NUMBER_MAP = Object.fromEntries(
  EMERGENCY_NUMBER_LIST.map((entry) => [entry.id, entry]),
);
