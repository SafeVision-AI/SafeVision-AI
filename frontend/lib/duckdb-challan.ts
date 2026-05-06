import { OFFLINE_CHALLAN_LOOKUP_DELAY_MS } from './safety-constants';


export async function initOfflineChallanDB() {
  return typeof window !== 'undefined';
}

export async function calculateOfflineChallan(violationCode: string, vehicleClass: string, _isRepeat: boolean) {
  const db = {
    '177':  { base: 500,   repeat: 1500,  desc: 'General Provision',                      section: '177'    },
    '177A': { base: 500,   repeat: 1000,  desc: 'Violation of road regulations',           section: '177A'   },
    '178':  { base: 500,   repeat: 500,   desc: 'Traveling without ticket on bus',          section: '178(1)' },
    '179':  { base: 2000,  repeat: 2000,  desc: 'Disobedience of orders of authorities',   section: '179(1)' },
    '180':  { base: 5000,  repeat: 5000,  desc: 'Allowing unauthorized person to drive',   section: '180'    },
    '181':  { base: 5000,  repeat: 5000,  desc: 'Driving without license',                 section: '181'    },
    '182_3':{ base: 10000, repeat: 10000, desc: 'Driving despite disqualification',        section: '182(3)' },
    '182_4':{ base: 10000, repeat: 10000, desc: 'Driving over size/weight limit',          section: '182(4)' },
    '183':  { base: vehicleClass === 'LMV' ? 1000 : 2000, repeat: vehicleClass === 'LMV' ? 2000 : 4000, desc: 'Over-speeding', section: '183(1)' },
    '184':  { base: 5000,  repeat: 10000, desc: 'Dangerous driving',                       section: '184'    },
    '185':  { base: 10000, repeat: 15000, desc: 'Drunken driving',                         section: '185'    },
    '194D': { base: 1000,  repeat: 1000,  desc: 'Driving without helmet',                  section: '194D',  additional_penalty: '3-month licence disqualification' },
    '194B': { base: 1000,  repeat: 1000,  desc: 'Driving without seat belt',               section: '194B'   },
  };

  await new Promise(r => setTimeout(r, OFFLINE_CHALLAN_LOOKUP_DELAY_MS));

  const result = db[violationCode as keyof typeof db];
  if (!result) return { base_fine: 0, repeat_fine: null, section: 'Unknown', description: 'Violation not found' };

  return {
    base_fine: result.base,
    repeat_fine: result.repeat,
    section: result.section,
    description: result.desc,
  };
}
