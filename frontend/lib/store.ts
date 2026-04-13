import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GpsLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  state?: string;
  displayName?: string;
}

export interface NearbyService {
  id: string;
  name: string;
  category: 'hospital' | 'police' | 'ambulance' | 'fire' | 'towing' | 'pharmacy' | 'puncture' | 'showroom';
  lat: number;
  lon: number;
  distance: number; // metres
  phone?: string;
  address?: string;
  source: 'api' | 'offline';
}

export interface NearbyRoadIssue {
  uuid: string;
  issueType: string;
  severity: number;
  lat: number;
  lon: number;
  distance: number;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  description?: string;
  authorityName?: string;
  roadName?: string;
  roadType?: string;
  createdAt: string;
}

export interface ServiceSearchMeta {
  count: number;
  radiusUsed: number;
  requestedRadius: number;
  source: string;
}

export interface RoadIssueSearchMeta {
  count: number;
  radiusUsed: number;
}

export interface UserProfile {
  bloodGroup: string;
  vehicleNumber: string;
  emergencyContact: string;
  name: string;
}

export type AiMode = 'online' | 'offline' | 'loading';
export type ConnectivityState = 'online' | 'cached' | 'offline' | 'ai-offline';

interface AppState {
  // GPS
  gpsLocation: GpsLocation | null;
  gpsError: string | null;
  setGpsLocation: (loc: GpsLocation) => void;
  setGpsError: (err: string | null) => void;

  // Services
  nearbyServices: NearbyService[];
  serviceSearchMeta: ServiceSearchMeta;
  serviceRadius: number; // metres
  serviceCategory: 'all' | NearbyService['category'];
  setNearbyServices: (services: NearbyService[]) => void;
  setServiceSearchMeta: (meta: ServiceSearchMeta) => void;
  setServiceRadius: (r: number) => void;
  setServiceCategory: (c: AppState['serviceCategory']) => void;
  nearbyRoadIssues: NearbyRoadIssue[];
  roadIssueSearchMeta: RoadIssueSearchMeta;
  setNearbyRoadIssues: (issues: NearbyRoadIssue[]) => void;
  setRoadIssueSearchMeta: (meta: RoadIssueSearchMeta) => void;

  // AI Mode
  aiMode: AiMode;
  modelLoadProgress: number; // 0-100
  setAiMode: (m: AiMode) => void;
  setModelLoadProgress: (p: number) => void;

  // Connectivity
  connectivity: ConnectivityState;
  setConnectivity: (c: ConnectivityState) => void;

  // User Profile (persisted)
  userProfile: UserProfile;
  setUserProfile: (p: Partial<UserProfile>) => void;

  // Driving Score
  drivingScore: number | null;
  setDrivingScore: (s: number) => void;

  // Crash detection
  crashDetectionEnabled: boolean;
  setCrashDetectionEnabled: (v: boolean) => void;

  // UI State
  isSystemSidebarOpen: boolean;
  setSystemSidebarOpen: (v: boolean) => void;
  isDesktopSidebarCollapsed: boolean;
  setDesktopSidebarCollapsed: (v: boolean) => void;

  // Challan Calculator
  challanState: {
    violation: string;
    vehicle: string;
    jurisdiction: string;
    isRepeat: boolean;
  };
  setChallanState: (state: Partial<AppState['challanState']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // GPS
      gpsLocation: null,
      gpsError: null,
      setGpsLocation: (loc) => set({ gpsLocation: loc, gpsError: null }),
      setGpsError: (err) => set({ gpsError: err }),

      // Services
      nearbyServices: [],
      serviceSearchMeta: {
        count: 0,
        radiusUsed: 0,
        requestedRadius: 0,
        source: 'api',
      },
      serviceRadius: 5000,
      serviceCategory: 'all',
      setNearbyServices: (services) => set({ nearbyServices: services }),
      setServiceSearchMeta: (meta) => set({ serviceSearchMeta: meta }),
      setServiceRadius: (r) => set({ serviceRadius: r }),
      setServiceCategory: (c) => set({ serviceCategory: c }),
      nearbyRoadIssues: [],
      roadIssueSearchMeta: {
        count: 0,
        radiusUsed: 0,
      },
      setNearbyRoadIssues: (issues) => set({ nearbyRoadIssues: issues }),
      setRoadIssueSearchMeta: (meta) => set({ roadIssueSearchMeta: meta }),

      // AI Mode
      aiMode: 'online',
      modelLoadProgress: 0,
      setAiMode: (m) => set({ aiMode: m }),
      setModelLoadProgress: (p) => set({ modelLoadProgress: p }),

      // Connectivity
      connectivity: 'online',
      setConnectivity: (c) => set({ connectivity: c }),

      // User Profile
      userProfile: {
        bloodGroup: '',
        vehicleNumber: '',
        emergencyContact: '',
        name: '',
      },
      setUserProfile: (p) => set((s) => ({
        userProfile: { ...s.userProfile, ...p },
      })),

      // Driving Score
      drivingScore: null,
      setDrivingScore: (s) => set({ drivingScore: s }),

      // Crash Detection
      crashDetectionEnabled: false,
      setCrashDetectionEnabled: (v) => set({ crashDetectionEnabled: v }),

      // UI State
      isSystemSidebarOpen: false,
      setSystemSidebarOpen: (v) => set({ isSystemSidebarOpen: v }),
      isDesktopSidebarCollapsed: false,
      setDesktopSidebarCollapsed: (v) => set({ isDesktopSidebarCollapsed: v }),

      // Challan Calculator
      challanState: {
        violation: 'dui',
        vehicle: '4w',
        jurisdiction: 'Tamil Nadu (TN)',
        isRepeat: false,
      },
      setChallanState: (state) => set((s) => ({ challanState: { ...s.challanState, ...state } })),
    }),
    {
      name: 'svai-storage',
      // Only persist user profile and preferences
      partialize: (state) => ({
        userProfile: state.userProfile,
        aiMode: state.aiMode,
        serviceCategory: state.serviceCategory,
        isDesktopSidebarCollapsed: state.isDesktopSidebarCollapsed,
      }),
    }
  )
);
