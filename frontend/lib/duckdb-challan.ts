import * as duckdb from '@duckdb/duckdb-wasm';

// Abstracted helper: initialize duckdb wasm for offline challan calculation
export async function initOfflineChallanDB() {
  // Mock initialization for now because web assembly instantiation requires static assets
  // In production for the app, these files are hosted in public/
  // We'll mimic the response locally.
  let isReady = false;
  try {
    // Check if browser
    if (typeof window !== 'undefined') {
      console.log('Would initialize DuckDB-Wasm for offline challan here');
      isReady = true;
    }
  } catch (err) {
    console.error(err);
  }
  return isReady;
}

export async function calculateOfflineChallan(violationCode: string, vehicleClass: string, isRepeat: boolean) {
  // Simulated offline database lookup against DuckDB
  console.log('Querying offline duckdb for', violationCode, vehicleClass);
  
  const db = {
    '177': { base: 100, repeat: 300, desc: 'General Provision', section: '177' },
    '177A': { base: 500, repeat: 1500, desc: 'Violation of road regulations', section: '177A' },
    '178_1': { base: 500, repeat: 500, desc: 'Traveling without ticket on bus', section: '178(1)' },
    '179_1': { base: 2000, repeat: 2000, desc: 'Disobedience of orders of authorities', section: '179(1)' },
    '180': { base: 5000, repeat: 5000, desc: 'Allowing unauthorized person to drive', section: '180' },
    '181': { base: 5000, repeat: 5000, desc: 'Driving without license', section: '181' },
    '182_3': { base: 10000, repeat: 10000, desc: 'Driving despite disqualification', section: '182(3)' },
    '182_4': { base: 10000, repeat: 10000, desc: 'Driving over size/weight limit', section: '182(4)' },
    '183': { base: vehicleClass === 'LMV' ? 1000 : 2000, repeat: null, desc: 'Over-speeding', section: '183(1)' },
    '184': { base: 1000, repeat: 10000, desc: 'Dangerous driving', section: '184' },
    '185': { base: 10000, repeat: 15000, desc: 'Drunken driving', section: '185' },
    '194D': { base: 1000, repeat: null, desc: 'Driving without helmet (plus 3 mo disqualification)', section: '194D' },
    '194B': { base: 1000, repeat: null, desc: 'Driving without seat belt', section: '194B' }
  };

  await new Promise(r => setTimeout(r, 600)); // Simulate offline fast response

  const result = db[violationCode as keyof typeof db];
  if (!result) return { base_fine: 0, repeat_fine: null, section: 'Unknown', description: 'Violation not found' };

  return {
    base_fine: result.base,
    repeat_fine: result.repeat,
    section: result.section,
    description: result.desc,
  };
}
