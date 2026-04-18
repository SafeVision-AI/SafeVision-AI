/**
 * BigDataCloud Reverse Geocoding — FREE, no API key, client-side safe.
 *
 * Converts GPS coordinates to a readable address directly in the browser.
 * No backend call needed, no API key exposed.
 *
 * @see https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api
 */

const BIGDATA_CLOUD_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';

export interface ReverseGeocodeResult {
  locality: string;       // e.g. "Adyar"
  city: string;           // e.g. "Chennai"
  state: string;          // e.g. "Tamil Nadu"
  country: string;        // e.g. "India"
  displayAddress: string; // e.g. "Adyar, Tamil Nadu"
}

/**
 * Convert GPS coordinates to a human-readable address.
 * Uses BigDataCloud's free client-side API — no key needed.
 */
export async function getAddressFromGPS(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `${BIGDATA_CLOUD_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const d = await res.json();

    const locality = d.locality || '';
    const city = d.city || d.locality || '';
    const state = d.principalSubdivision || '';
    const country = d.countryName || '';

    const parts = [locality, state].filter(Boolean);
    const displayAddress = parts.join(', ') || 'Unknown Location';

    return { locality, city, state, country, displayAddress };
  } catch {
    return null;
  }
}
