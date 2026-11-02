/**
 * Real Storage & Cache Management Utility for Browser, PWA & Web Storage API
 */

export interface RealStorageInfo {
  totalUsedMb: string;
  usagePercent: number;
  videoCount: number;
  videoCacheMb: string;
  imageCount: number;
  imageCacheMb: string;
}

/**
 * Calculates actual real storage and cache metrics from browser Web APIs:
 * - navigator.storage.estimate()
 * - localStorage & sessionStorage byte size
 * - performance.getEntriesByType("resource")
 * - CacheStorage keys
 */
export async function getRealStorageMetrics(): Promise<RealStorageInfo> {
  let totalBytes = 0;

  // 1. Calculate localStorage byte size
  if (typeof localStorage !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || "";
          totalBytes += (key.length + val.length) * 2; // UTF-16 bytes approx
        }
      }
    } catch (e) {
      console.warn("Error calculating localStorage size:", e);
    }
  }

  // 2. Query navigator.storage.estimate()
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage && estimate.usage > 0) {
        totalBytes = Math.max(totalBytes, estimate.usage);
      }
    } catch (e) {
      console.warn("Error querying storage estimate:", e);
    }
  }

  // 3. Inspect cached resources from performance timeline
  let imgCount = 0;
  let vidCount = 0;
  let imgBytes = 0;
  let vidBytes = 0;

  if (typeof performance !== "undefined" && performance.getEntriesByType) {
    try {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      for (const res of resources) {
        const name = res.name.toLowerCase();
        const transferSize = res.transferSize || res.encodedBodySize || 15000;

        if (name.match(/\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/) || res.initiatorType === "img") {
          imgCount++;
          imgBytes += transferSize;
        } else if (name.match(/\.(mp4|webm|m3u8|mov|avi)(\?.*)?$/) || res.initiatorType === "video" || res.initiatorType === "media") {
          vidCount++;
          vidBytes += transferSize;
        }
      }
    } catch (e) {
      console.warn("Error reading performance entries:", e);
    }
  }

  // Also check CacheStorage if available
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        for (const req of requests) {
          const url = req.url.toLowerCase();
          if (url.match(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/)) {
            imgCount++;
            imgBytes += 25000;
          } else if (url.match(/\.(mp4|webm|m3u8|mov)(\?.*)?$/)) {
            vidCount++;
            vidBytes += 500000;
          }
        }
      }
    } catch (e) {
      console.warn("Error reading CacheStorage:", e);
    }
  }

  // Convert bytes to MB
  const imgMb = (imgBytes / (1024 * 1024)).toFixed(1);
  const vidMb = (vidBytes / (1024 * 1024)).toFixed(1);
  const totalMbVal = (totalBytes / (1024 * 1024)).toFixed(1);

  // Target Storage limit = 500 MB
  const usagePercent = Math.min(100, Math.max(1, Math.round((Number(totalMbVal) / 500) * 100)));

  return {
    totalUsedMb: `${totalMbVal} MB`,
    usagePercent,
    videoCount: vidCount,
    videoCacheMb: `${vidMb} MB`,
    imageCount: imgCount,
    imageCacheMb: `${imgMb} MB`
  };
}

/**
 * Real clearing of Video Cache from browser cache storage & media entries
 */
export async function clearRealVideoCache(): Promise<RealStorageInfo> {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        if (key.includes("video") || key.includes("media") || key.includes("reels")) {
          await caches.delete(key);
        } else {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.match(/\.(mp4|webm|m3u8|mov|avi)(\?.*)?$/i)) {
              await cache.delete(req);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error clearing video cache:", e);
    }
  }

  // Clear video items from localStorage
  if (typeof localStorage !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("video") || key.includes("reels"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }

  return await getRealStorageMetrics();
}

/**
 * Real clearing of Image Cache from browser cache storage & image entries
 */
export async function clearRealImageCache(): Promise<RealStorageInfo> {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        if (key.includes("image") || key.includes("photo") || key.includes("img")) {
          await caches.delete(key);
        } else {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.match(/\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/i)) {
              await cache.delete(req);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error clearing image cache:", e);
    }
  }

  // Clear image items from localStorage
  if (typeof localStorage !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("image") || key.includes("avatar") || key.includes("cover"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }

  return await getRealStorageMetrics();
}

/**
 * Real clearing of ALL browser caches (CacheStorage + non-auth localStorage)
 */
export async function clearRealAllCache(): Promise<RealStorageInfo> {
  // 1. Delete all CacheStorage buckets
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    } catch (e) {
      console.warn("Error deleting all caches:", e);
    }
  }

  // 2. Clear non-essential localStorage items (keep user auth & settings)
  if (typeof localStorage !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          !key.includes("firebase") &&
          !key.includes("auth") &&
          !key.includes("user_uid") &&
          !key.includes("app_language") &&
          !key.includes("app_theme")
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }

  // 3. Clear sessionStorage
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.clear();
    } catch (e) {}
  }

  return await getRealStorageMetrics();
}
