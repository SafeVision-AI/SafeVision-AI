import { GpsLocation, UserProfile } from './store';

/**
 * Generates a pre-filled WhatsApp SOS message link.
 * Includes GPS coordinates, user profile details, and a clear emergency call to action.
 */
export function generateSosWhatsAppLink(profile: UserProfile | null, location: GpsLocation | null): string {
  const base = "https://wa.me/?text=";
  const message = `🚨 EMERGENCY SOS - SafeVisionAI 🚨
I need immediate assistance!

📍 Location: ${location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : "Unknown (GPS Signal Lost)"}
👤 Profile: ${profile?.name || "Anonymous User"}
🩸 Blood Group: ${profile?.bloodGroup || "Not Specified"}
🚗 Vehicle: ${profile?.vehicleNumber || "Not Specified"}

Please send help to these coordinates immediately.`;

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
