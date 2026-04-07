import { UserProfile } from './store';

/**
 * Validates a user profile for completeness before emergency reporting.
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.name && profile.bloodGroup && profile.vehicleNumber);
}

/**
 * Analyzes the profile status to drive the Dashboard safety-score indicator.
 */
export function getProfileStatus(profile: UserProfile | null): 'Safe' | 'Warning' | 'Critical' {
  if (!profile) return 'Critical';
  if (!profile.name || !profile.bloodGroup) return 'Warning';
  return 'Safe';
}

/**
 * Helper to get the first name of a user for the dashboard greeting.
 */
export function getFirstName(fullName?: string): string {
  if (!fullName) return "Sentinel";
  return fullName.split(' ')[0];
}
