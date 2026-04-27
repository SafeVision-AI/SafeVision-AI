import { GpsLocation, UserProfile } from './store';
import { getAddressFromGPS } from './reverse-geocode';

/**
 * Convert GPS coords to What3Words address (free API).
 * Falls back to Google Maps link if W3W fails.
 */
async function getWhat3Words(lat: number, lon: number): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_W3W_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat}%2C${lon}&language=en&format=json&key=${apiKey}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.words ? `///${data.words}` : null;
  } catch {
    return null;
  }
}

/**
 * Generates a pre-filled WhatsApp SOS message link.
 * Includes GPS coordinates, readable address, What3Words, and user profile.
 */
export async function generateSosWhatsAppLink(
  profile: UserProfile | null,
  location: GpsLocation | null
): Promise<string> {
  const base = 'https://wa.me/?text=';

  let addressLine = 'Unknown (GPS Signal Lost)';
  let w3wLine = '';

  if (location) {
    const addr = await getAddressFromGPS(location.lat, location.lon);
    addressLine = addr?.displayAddress || `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`;

    // Try to get What3Words for precise location
    const w3w = await getWhat3Words(location.lat, location.lon);
    if (w3w) {
      w3wLine = `\n🗺️ What3Words: ${w3w} (map.what3words.com/${w3w.replace('///', '')})`;
    }
  }

  const message = `🚨 EMERGENCY SOS - SafeVixAI 🚨
I need immediate assistance!

📍 Location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : 'Unknown (GPS Signal Lost)'}
📌 Address: ${addressLine}${w3wLine}
👤 Name: ${profile?.name || 'Anonymous User'}
🩸 Blood Group: ${profile?.bloodGroup || 'Not Specified'}
🚗 Vehicle: ${profile?.vehicleNumber || 'Not Specified'}

Please send help to these coordinates immediately.
☎️ Emergency: 112 | Ambulance: 108`;

  return base + encodeURIComponent(message);
}

/**
 * Generates a synchronous WhatsApp SOS link (no async address lookup).
 * Use this when you need an instant link without waiting for geocoding.
 */
export function generateSosWhatsAppLinkSync(
  profile: UserProfile | null,
  location: GpsLocation | null
): string {
  const base = 'https://wa.me/?text=';
  const message = `🚨 EMERGENCY SOS - SafeVixAI 🚨
I need immediate assistance!

📍 Location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : 'Unknown (GPS Signal Lost)'}
👤 Name: ${profile?.name || 'Anonymous User'}
🩸 Blood Group: ${profile?.bloodGroup || 'Not Specified'}
🚗 Vehicle: ${profile?.vehicleNumber || 'Not Specified'}

Please send help to these coordinates immediately.
☎️ Emergency: 112 | Ambulance: 108`;

  return base + encodeURIComponent(message);
}

/**
 * Generates a standard SMS (tel:) link for emergency broadcasting.
 */
export function generateSosSmsLink(profile: UserProfile | null, location: GpsLocation | null): string {
  const phone = '112';
  const message = `SOS! I need help. Location: ${location ? `https://maps.google.com/?q=${location.lat},${location.lon}` : 'Unknown'}. Name: ${profile?.name || 'User'}. Blood: ${profile?.bloodGroup || '?'}.`;
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}
