import { GpsLocation, UserProfile } from './store';
import { getAddressFromGPS } from './reverse-geocode';

/**
 * Generates a pre-filled WhatsApp SOS message link.
 * Includes GPS coordinates, readable address (BigDataCloud),
 * user profile details, and a clear emergency call to action.
 */
export async function generateSosWhatsAppLink(
  profile: UserProfile | null,
  location: GpsLocation | null
): Promise<string> {
  const base = "https://wa.me/?text=";

  // Get readable address from BigDataCloud (free, no key)
  let addressLine = "Unknown (GPS Signal Lost)";
  if (location) {
    const addr = await getAddressFromGPS(location.lat, location.lon);
    addressLine = addr?.displayAddress || `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`;
  }

  const message = `🚨 EMERGENCY SOS - SafeVisionAI 🚨
I need immediate assistance!

📍 Location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : "Unknown (GPS Signal Lost)"}
📌 Address: ${addressLine}
👤 Profile: ${profile?.name || "Anonymous User"}
🩸 Blood Group: ${profile?.bloodGroup || "Not Specified"}
🚗 Vehicle: ${profile?.vehicleNumber || "Not Specified"}

Please send help to these coordinates immediately.
☎️ Emergency: 112`;

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
  const base = "https://wa.me/?text=";
  const message = `🚨 EMERGENCY SOS - SafeVisionAI 🚨
I need immediate assistance!

📍 Location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : "Unknown (GPS Signal Lost)"}
👤 Profile: ${profile?.name || "Anonymous User"}
🩸 Blood Group: ${profile?.bloodGroup || "Not Specified"}
🚗 Vehicle: ${profile?.vehicleNumber || "Not Specified"}

Please send help to these coordinates immediately.
☎️ Emergency: 112`;

  return base + encodeURIComponent(message);
}

/**
 * Generates a standard SMS (tel:) link for emergency broadcasting.
 */
export function generateSosSmsLink(profile: UserProfile | null, location: GpsLocation | null): string {
  const phone = "112"; // Primary emergency services in India
  const message = `SOS! I need help. My location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : "Unknown"}. Profile: ${profile?.name || "User"}.`;
  
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}
