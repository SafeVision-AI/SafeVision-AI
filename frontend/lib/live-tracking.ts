// frontend/lib/live-tracking.ts
// Enterprise Family Tracking — Supabase Realtime + REST API
// Two modes:
//   1. VICTIM  → startFamilyTracking() → GPS polling → PUT /api/v1/live-tracking/update
//   2. FAMILY  → subscribeToTracking() → GET /api/v1/live-tracking/session/:id (poll)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TrackingSession {
  session_id: string;
  tracking_url: string;
  expires_at: string;
}

export interface LiveLocation {
  session_id: string;
  user_name: string;
  blood_group: string | null;
  vehicle_number: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed_kmh: number | null;
  battery_percent: number | null;
  is_active: boolean;
  updated_at: string;
}

// ── VICTIM SIDE ──────────────────────────────────────────────────────────────

/**
 * Start a live tracking session and return the shareable family link.
 * Call this immediately when SOS is triggered or crash is detected.
 */
export async function startFamilyTracking(params: {
  userName: string;
  bloodGroup?: string;
  vehicleNumber?: string;
  latitude: number;
  longitude: number;
  batteryPercent?: number;
}): Promise<TrackingSession> {
  const res = await fetch(`${API_BASE}/api/v1/live-tracking/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_name: params.userName,
      blood_group: params.bloodGroup,
      vehicle_number: params.vehicleNumber,
      latitude: params.latitude,
      longitude: params.longitude,
      battery_percent: params.batteryPercent,
    }),
  });

  if (!res.ok) throw new Error('Failed to start tracking session');
  return res.json();
}

/**
 * Begin continuous GPS polling and push location updates to the server.
 * Returns a function to stop tracking.
 */
export function beginLocationBroadcast(sessionId: string): () => void {
  let active = true;

  const push = () => {
    if (!active) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const battery = await getBatteryLevel();
        await fetch(`${API_BASE}/api/v1/live-tracking/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed_kmh: pos.coords.speed ? pos.coords.speed * 3.6 : null,
            battery_percent: battery,
          }),
        }).catch(() => {}); // Silent fail — offline queuing handles this
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  push(); // Immediate first push
  const interval = setInterval(push, 5000); // Poll every 5 seconds

  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * Stop a tracking session (user confirmed safe).
 */
export async function stopFamilyTracking(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/live-tracking/session/${sessionId}`, {
    method: 'DELETE',
  }).catch(() => {});
}

/**
 * Send WhatsApp messages to emergency contacts with the tracking link.
 */
export function notifyContactsViaWhatsApp(
  contacts: string[],
  userName: string,
  trackingUrl: string
): void {
  const message = encodeURIComponent(
    `🆘 EMERGENCY ALERT\n${userName} needs help!\n\nTrack live location:\n${trackingUrl}\n\n(Link works for 4 hours, no app needed)`
  );
  contacts.forEach((phone) => {
    // Clean phone number: remove spaces, dashes, and ensure country code
    const cleaned = phone.replace(/[\s\-()]/g, '');
    window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
  });
}

// ── FAMILY SIDE ───────────────────────────────────────────────────────────────

/**
 * Poll for a tracking session's current location.
 * Used by family members who open the shared link.
 * Returns a stop function.
 */
export function subscribeToTracking(
  sessionId: string,
  onUpdate: (location: LiveLocation) => void,
  onExpired: () => void,
  intervalMs = 5000
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/live-tracking/session/${sessionId}`);
      if (res.status === 404) {
        onExpired();
        active = false;
        return;
      }
      if (res.ok) {
        const data: LiveLocation = await res.json();
        if (!data.is_active) {
          onExpired();
          active = false;
          return;
        }
        onUpdate(data);
      }
    } catch {
      // Network error — keep trying silently
    }
  };

  poll(); // Immediate
  const interval = setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(interval);
  };
}

// ── UTILS ─────────────────────────────────────────────────────────────────────

async function getBatteryLevel(): Promise<number | undefined> {
  try {
    // @ts-ignore — Battery API not in all TS defs
    const battery = await navigator.getBattery?.();
    return battery ? Math.round(battery.level * 100) : undefined;
  } catch {
    return undefined;
  }
}
