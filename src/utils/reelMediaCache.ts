/**
 * Persistent IndexedDB Media Cache for Short Videos / Reels
 * Ensures video files remain permanently accessible on the author's device
 * even across page reloads, browser restarts, and offline sessions.
 */

const DB_NAME = 'puthia_media_vault_v1';
const STORE_NAME = 'reel_videos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save video blob into persistent IndexedDB storage
 */
export async function saveReelVideoToDB(reelId: string, videoBlob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(videoBlob, reelId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save reel video to IndexedDB:', err);
  }
}

/**
 * Retrieve video blob from IndexedDB and create an active object URL
 */
export async function getReelVideoURLFromDB(reelId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(reelId);
      req.onsuccess = () => {
        const blob = req.result as Blob;
        if (blob instanceof Blob) {
          const freshUrl = URL.createObjectURL(blob);
          resolve(freshUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
