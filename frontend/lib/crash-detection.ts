/**
 * SafeVixAI Crash Detection (Web/PWA)
 * 
 * Uses the DeviceMotionEvent API to detect sudden G-force spikes indicative of an accident.
 * Standard gravity is ~9.81 m/s^2. A moderate crash is > 10G (~98 m/s^2).
 */

// Thresholds for Crash Detection
const CRASH_THRESHOLD_G = 15; 
const GRAVITY_MS2 = 9.81;
const CRASH_THRESHOLD_MS2 = CRASH_THRESHOLD_G * GRAVITY_MS2;

// To avoid double-triggering
let isCrashDetected = false;

type CrashCallback = (force: number) => void;
let listeners: CrashCallback[] = [];

/**
 * Handle incoming device motion data.
 */
function handleDeviceMotion(event: DeviceMotionEvent) {
  if (isCrashDetected) return;

  const { accelerationIncludingGravity } = event;
  if (!accelerationIncludingGravity) return;

  const x = accelerationIncludingGravity.x || 0;
  const y = accelerationIncludingGravity.y || 0;
  const z = accelerationIncludingGravity.z || 0;

  // Calculate total acceleration magnitude
  const magnitude = Math.sqrt(x * x + y * y + z * z);

  if (magnitude >= CRASH_THRESHOLD_MS2) {
    console.warn(`💥 CRASH DETECTED! G-Force: ${(magnitude / GRAVITY_MS2).toFixed(1)}G`);
    isCrashDetected = true;
    listeners.forEach((callback) => callback(magnitude));

    // Reset detection after 1 minute to allow subsequent events
    setTimeout(() => {
      isCrashDetected = false;
    }, 60000);
  }
}

/**
 * Initializes real DeviceMotion listeners if supported.
 * Note: iOS 13+ requires user permission to access DeviceMotionEvent.
 */
export async function startCrashDetection(onCrashDetected: CrashCallback) {
  if (typeof window === 'undefined') return;
  
  listeners.push(onCrashDetected);

  // Request permission for iOS 13+ devices
  if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    try {
      const permissionState = await (DeviceMotionEvent as any).requestPermission();
      if (permissionState === 'granted') {
        window.addEventListener('devicemotion', handleDeviceMotion, true);
        console.log('✅ Crash Detection active (Sensors running).');
      } else {
        console.error('Crash Detection permission denied.');
      }
    } catch (err) {
      console.error('Error requesting device motion permission:', err);
    }
  } else {
    // Android or standard web browsers
    window.addEventListener('devicemotion', handleDeviceMotion, true);
    console.log('✅ Crash Detection active (Sensors running).');
  }
}

export function stopCrashDetection(onCrashDetected: CrashCallback) {
  if (typeof window === 'undefined') return;
  
  listeners = listeners.filter((cb) => cb !== onCrashDetected);
  if (listeners.length === 0) {
    window.removeEventListener('devicemotion', handleDeviceMotion, true);
  }
}

/**
 * MOCK function specifically for Hackathon judging.
 * Safely simulates a massive G-force spike.
 */
export function simulateCrashDemo() {
  console.log('🚨 MOCK CRASH DEMO INITIATED');
  if (isCrashDetected) return;
  
  isCrashDetected = true;
  listeners.forEach((callback) => callback(CRASH_THRESHOLD_MS2 + 10)); // Trigger with slightly above threshold

  // Reset demo lock after 60s
  setTimeout(() => {
    isCrashDetected = false;
  }, 60000);
}
