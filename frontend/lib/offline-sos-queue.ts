import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SOSData {
  lat: number;
  lon: number;
  userId?: string;
  bloodGroup?: string;
  emergencyContacts?: string[];
  timestamp: string;
}

interface SafeVixDB extends DBSchema {
  'sos-queue': {
    key: number;
    value: SOSData;
    indexes: { 'by-timestamp': string };
  };
}

let dbPromise: Promise<IDBPDatabase<SafeVixDB>> | null = null;

/**
 * Initializes the IndexedDB for storing offline SOS requests.
 */
export function initDB() {
  if (typeof window === 'undefined') return null; // Prevent SSR errors
  
  if (!dbPromise) {
    dbPromise = openDB<SafeVixDB>('safevix-offline-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sos-queue')) {
          const store = db.createObjectStore('sos-queue', {
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
    timestamp: new Date().toISOString(),
  };

  await db.add('sos-queue', sosEntry);
  console.log('📶 [Offline] SOS saved to local queue. Will sync when online.');
  
  // Register Background Sync with the same tag the SW listens for
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sos-queue-flush');
      console.log('📶 [Offline] Background sync registered: sos-queue-flush');
    } catch (err) {
      console.warn('Background sync registration failed:', err);
    }
  }
}

/**
 * Syncs all queued SOS requests to the backend.
 * Called automatically when connection is restored.
 */
export async function syncOfflineSOSQueue(): Promise<void> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return; // Don't try syncing if we know we're offline
  }

  const db = await initDB();
  if (!db) return;

  const tx = db.transaction('sos-queue', 'readwrite');
  const store = tx.objectStore('sos-queue');
  
  // Need to get all keys and items
  const allKeys = await store.getAllKeys();
  const allItems = await store.getAll();

  if (allItems.length === 0) {
    return;
  }

  console.log(`📶 [Sync] Found ${allItems.length} queued SOS requests. Syncing...`);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const key = allKeys[i];

    try {
      // Actually send to the backend
      const res = await fetch(`${API_URL}/api/v1/emergency/sos?lat=${item.lat}&lon=${item.lon}`, {
        method: 'GET', // Following your API spec, though POST is better for SOS
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Successfully synced, remove from queue
        await store.delete(key);
        console.log(`✅ [Sync] SOS ${key} transmitted successfully.`);
      } else {
        console.error(`❌ [Sync] Server returned error for SOS ${key}. Keeping in queue.`);
      }
    } catch (error) {
      console.error(`❌ [Sync] Network error while syncing SOS ${key}. Keeping in queue.`, error);
      // Stop syncing the rest if network is still down
      break;
    }
  }
}

/**
 * Attaches event listeners to sync automatically when the network returns.
 * Should be called once in the root App or Layout component.
 */
export function registerOfflineSyncListeners() {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored! Syncing offline queues...');
      syncOfflineSOSQueue();
    });
  }
}
