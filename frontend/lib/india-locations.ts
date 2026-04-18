/**
 * India State/City Data — FREE from CountryStateCity API.
 *
 * Provides dropdown data for DriveLegal state/city selection.
 * No API key required.
 *
 * @see https://countriesnow.space/
 */

const API_BASE = 'https://countriesnow.space/api/v0.1/countries';

// Cached results to avoid repeated API calls
let statesCache: string[] | null = null;
const citiesCache = new Map<string, string[]>();

/**
 * Get all Indian states. Results are cached after first call.
 */
export async function getIndianStates(): Promise<string[]> {
  if (statesCache) return statesCache;

  try {
    const res = await fetch(`${API_BASE}/states`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India' }),
    });
    if (!res.ok) return FALLBACK_STATES;

    const data = await res.json();
    const states = data?.data?.states || [];
    const stateNames = states
      .map((s: { name: string }) => s.name)
      .sort() as string[];

    statesCache = stateNames.length > 0 ? stateNames : FALLBACK_STATES;
    return statesCache;
  } catch {
    return FALLBACK_STATES;
  }
}

/**
 * Get all cities for an Indian state. Results are cached.
 */
export async function getCitiesForState(state: string): Promise<string[]> {
  if (citiesCache.has(state)) return citiesCache.get(state)!;

  try {
    const res = await fetch(`${API_BASE}/state/cities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India', state }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const cities = (data?.data || []).sort() as string[];

    citiesCache.set(state, cities);
    return cities;
  } catch {
    return [];
  }
}

// Hardcoded fallback for when the API is unreachable
const FALLBACK_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
];
