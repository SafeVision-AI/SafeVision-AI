import { CRASH_DEBOUNCE_MS, CRASH_THRESHOLD_G, STANDARD_GRAVITY_MS2 } from './safety-constants';

/**
 * SafeVixAI Crash Detection (Web/PWA)
 * 
 * Uses the DeviceMotionEvent API to detect sudden G-force spikes indicative of an accident.
 * Standard gravity is ~9.81 m/s^2. A moderate crash is > 10G (~98 m/s^2).
 */

const CRASH_THRESHOLD_MS2 = CRASH_THRESHOLD_G * STANDARD_GRAVITY_MS2;

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
    isCrashDetected = true;
    listeners.forEach((callback) => callback(magnitude));

    setTimeout(() => {
      isCrashDetected = false;
    }, CRASH_DEBOUNCE_MS);
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
      }
    } catch {
      return;
    }
  } else {
    window.addEventListener('devicemotion', handleDeviceMotion, true);
  }
}

export function stopCrashDetection(onCrashDetected: CrashCallback) {
  if (typeof window === 'undefined') return;
  
  listeners = listeners.filter((cb) => cb !== onCrashDetected);
  if (listeners.length === 0) {
    window.removeEventListener('devicemotion', handleDeviceMotion, true);
  }
}

export function simulateCrashDemo() {
  if (isCrashDetected) return;
  
  isCrashDetected = true;
  listeners.forEach((callback) => callback(CRASH_THRESHOLD_MS2 + 10));

  setTimeout(() => {
    isCrashDetected = false;
  }, CRASH_DEBOUNCE_MS);
}
