/**
 * Photon Geocoding — FREE search autocomplete from Komoot.
 *
 * Used for the frontend search box to find places in India.
 * Biased to India's bounding box for better results.
 * No API key required.
 *
 * @see https://photon.komoot.io/
 */

const PHOTON_URL = 'https://photon.komoot.io/api/';

// India bounding box — biases results to Indian locations
const INDIA_BBOX = '68.7,8.4,97.4,37.6';

export interface GeocodingResult {
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  label: string; // Formatted display string
}

/**
 * Search for places using Photon (Komoot) geocoding API.
 * Results are biased toward India.
 */
export async function searchPlaces(
  query: string,
  limit: number = 5
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      lang: 'en',
      limit: String(limit),
      bbox: INDIA_BBOX,
    });

    const res = await fetch(`${PHOTON_URL}?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    const features = data.features || [];

    return features.map((f: any) => {
      const props = f.properties || {};
      const [lon, lat] = f.geometry?.coordinates || [0, 0];

      const name = props.name || '';
      const city = props.city || props.county || '';
      const state = props.state || '';
      const country = props.country || '';

      // Build a readable label
      const labelParts = [name, city, state].filter(Boolean);
      const label = labelParts.join(', ');

      return { name, city, state, country, lat, lon, label };
    });
  } catch {
    return [];
  }
}

/**
 * Debounced search — waits for user to stop typing before searching.
 */
export function createDebouncedSearch(delayMs: number = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (query: string, callback: (results: GeocodingResult[]) => void) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const results = await searchPlaces(query);
      callback(results);
    }, delayMs);
  };
}
