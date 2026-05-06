import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PUBLIC_API_BASE_URL } from './public-env';
import { OFFLINE_SOS_SYNC_TIMEOUT_MS } from './safety-constants';

interface SOSData {
  id?: number;
  apiUrl?: string;
  lat: number;
  lon: number;
  userId?: string;
  bloodGroup?: string;
  emergencyContacts?: string[];
  timestamp: string;
}

interface RoadReportQueueData {
  id?: number;
  apiUrl?: string;
  lat: number;
  lon: number;
  issue_type: string;
  severity: number;
  description?: string;
  photo?: Blob;
  photoName?: string;
  timestamp: string;
}

interface SafeVixDB extends DBSchema {
  'sos-queue': {
    key: number;
    value: SOSData;
    indexes: { 'by-timestamp': string };
  };
  'road-report-queue': {
    key: number;
    value: RoadReportQueueData;
    indexes: { 'by-timestamp': string };
  };
}

let dbPromise: Promise<IDBPDatabase<SafeVixDB>> | null = null;
let offlineSyncListenersRegistered = false;

async function ensureServiceWorkerRegistration(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {
    return;
  }
}

/**
 * Initializes the IndexedDB for storing offline SOS requests.
 */
export function initDB() {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<SafeVixDB>('safevix-offline-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sos-queue')) {
          const store = db.createObjectStore('sos-queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('road-report-queue')) {
          const store = db.createObjectStore('road-report-queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Adds an SOS request to the offline queue.
 * Should be called when navigator.onLine is false or fetch throws a Network Error.
 */
export async function enqueueSOS(data: Omit<SOSData, 'timestamp'>): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const sosEntry: SOSData = {
    ...data,
    apiUrl: PUBLIC_API_BASE_URL,
    timestamp: new Date().toISOString(),
  };

  await db.add('sos-queue', sosEntry);
  
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sos-queue-flush');
    } catch {
      return;
    }
  }
}

export async function enqueueRoadReport(
  data: Omit<RoadReportQueueData, 'timestamp' | 'apiUrl'>
): Promise<void> {
  const db = await initDB();
  if (!db) return;

  await db.add('road-report-queue', {
    ...data,
    apiUrl: PUBLIC_API_BASE_URL,
    timestamp: new Date().toISOString(),
  });

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('road-report-queue-flush');
    } catch {
      return;
    }
  }
}

/**
 * Syncs all queued SOS requests to the backend.
 * Called automatically when connection is restored.
 */
export async function syncOfflineSOSQueue(): Promise<void> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return;
  }

  const db = await initDB();
  if (!db) return;

  const tx = db.transaction('sos-queue', 'readwrite');
  const store = tx.objectStore('sos-queue');
  
  const allKeys = await store.getAllKeys();
  const allItems = await store.getAll();

  if (allItems.length === 0) {
    return;
  }

  const API_URL = PUBLIC_API_BASE_URL;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const key = allKeys[i];

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), OFFLINE_SOS_SYNC_TIMEOUT_MS);
      const res = await fetch(`${API_URL}/api/v1/emergency/sos?lat=${item.lat}&lon=${item.lon}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (res.ok) {
        await store.delete(key);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  await tx.done;
}

export async function syncOfflineRoadReportQueue(): Promise<void> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return;
  }

  const db = await initDB();
  if (!db) return;

  const tx = db.transaction('road-report-queue', 'readwrite');
  const store = tx.objectStore('road-report-queue');
  const allKeys = await store.getAllKeys();
  const allItems = await store.getAll();

  if (allItems.length === 0) {
    return;
  }

  for (let i = 0; i < allItems.length; i += 1) {
    const item = allItems[i];
    const key = allKeys[i];
    const apiUrl = item.apiUrl ?? PUBLIC_API_BASE_URL;

    try {
      const formData = new FormData();
      formData.append('lat', String(item.lat));
      formData.append('lon', String(item.lon));
      formData.append('issue_type', item.issue_type);
      formData.append('severity', String(item.severity));
      if (item.description?.trim()) {
        formData.append('description', item.description.trim());
      }
      if (item.photo) {
        formData.append('photo', item.photo, item.photoName ?? 'road-report.webp');
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), OFFLINE_SOS_SYNC_TIMEOUT_MS);
      const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/v1/roads/report`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (res.ok) {
        await store.delete(key);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  await tx.done;
}

/**
 * Attaches event listeners to sync automatically when the network returns.
 * Should be called once in the root App or Layout component.
 */
export function registerOfflineSyncListeners() {
  if (typeof window !== 'undefined' && !offlineSyncListenersRegistered) {
    void ensureServiceWorkerRegistration();
    window.addEventListener('online', () => {
      void syncOfflineSOSQueue();
      void syncOfflineRoadReportQueue();
    });
    offlineSyncListenersRegistered = true;
  }
}
