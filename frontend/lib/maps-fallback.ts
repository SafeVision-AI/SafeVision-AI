// frontend/lib/maps-fallback.ts
// Uses Google Maps Gemini Grounding ONLY when Supabase returns 0 results
// Never use for main map rendering — use MapLibre for that

const DEMO_KEY = process.env.NEXT_PUBLIC_GMAPS_DEMO_KEY;

export async function findEmergencyFallback(query: string, lat: number, lon: number) {
  if (!DEMO_KEY) {
    console.warn('Google Maps Demo Key not configured. Fallback unavailable.');
    return [];
  }
  
  // Only called when PostGIS returns empty — last resort
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&keyword=${query}&key=${DEMO_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.results) {
      return [];
    }

    return data.results.slice(0, 3).map((p: any) => ({
      name: p.name,
      lat: p.geometry.location.lat,
      lon: p.geometry.location.lng,
      address: p.vicinity,
      source: 'google_fallback'
    }));
  } catch (error) {
    console.error('Failed to fetch from Google Maps fallback:', error);
    return [];
  }
}
