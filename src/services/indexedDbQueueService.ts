/**
 * Secure IndexedDB Offline Submission Queue Service
 * আমাদের পুঠিয়া — PWA Offline Resilience & Background Sync Architecture
 *
 * Provides a resilient, type-safe, zero-dependency offline mutation queue
 * for citizen feedback, complaints, and service corrections.
 * Enforces strict user isolation, lease-based stale sync recovery,
 * cold-boot auth readiness drain, atomic IndexedDB claims, heartbeat lease renewal,
 * fencing tokens, and collision-resistant idempotency.
 */

import { auth } from '../firebase';
import { addFeedback, addComplaint, addCorrection } from '../api';

export type OfflineSubmissionType = 'feedback' | 'complaint' | 'correction';
export type OfflineSubmissionStatus = 'pending' | 'syncing' | 'completed' | 'failed';
export type OfflineErrorCategory =
  | 'NETWORK_ERROR'
  | 'AUTH_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

export interface OfflineSubmissionItem {
  id: string; // Stable UUID document ID: sub_{type}_{uuid}
  type: OfflineSubmissionType;
  collectionName: 'feedbacks' | 'complaints' | 'corrections';
  payload: Record<string, any>;
  payloadHash?: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  status: OfflineSubmissionStatus;
  lastAttemptAt?: number;
  lastErrorCategory?: OfflineErrorCategory;
  lastErrorMessage?: string;
  requiresAuth: boolean;
  userId?: string;
  userEmail?: string;
  isAnonymous?: boolean;
  claimToken?: string;
  claimGeneration?: number;
}

const DB_NAME = 'our_puthia_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_submissions';
const MAX_PAYLOAD_STRING_LENGTH = 10000;
const DISALLOWED_KEY_PATTERNS = /(password|token|secret|credential|auth_?header|bearer|private_?key|api_?key)/i;
const PROCESSING_LEASE_MS = 60000; // 60 seconds lease for syncing items
const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds heartbeat lease renewal

/**
 * Open or initialize the IndexedDB store
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Generates a simple, fast string hash for payload integrity verification
 */
export function computePayloadHash(payload: Record<string, any>): string {
  const str = JSON.stringify(payload || {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Generates a collision-resistant UUID v4 string
 */
export function generateSubmissionId(type: OfflineSubmissionType): string {
  let uuid: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uuid = crypto.randomUUID();
  } else {
    // Fallback pseudo-UUID
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return `sub_${type}_${uuid}`;
}

/**
 * Validates and strictly sanitizes text-only payload
 * Rejects binary blobs, base64 data URLs, sensitive keys, and oversized strings
 */
export function sanitizeOfflinePayload(raw: Record<string, any>): Record<string, any> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid payload: must be a plain key-value object');
  }

  const clean: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    // 1. Enforce safe key naming
    if (DISALLOWED_KEY_PATTERNS.test(key)) {
      console.warn(`[OfflineQueue] Rejected sensitive payload key: "${key}"`);
      continue;
    }

    // 2. Reject binary blobs, files, functions
    if (typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      throw new Error(`Binary blob or file upload not permitted in offline text queue (key: ${key})`);
    }

    // 3. String validation and truncation guard
    if (typeof value === 'string') {
      // Disallow data URL images or massive base64 blobs
      if (value.startsWith('data:') && value.includes(';base64,')) {
        throw new Error(`Base64 data URLs are not permitted in offline text queue (key: ${key})`);
      }

      if (value.length > MAX_PAYLOAD_STRING_LENGTH) {
        clean[key] = value.slice(0, MAX_PAYLOAD_STRING_LENGTH).trim();
      } else {
        clean[key] = value.trim();
      }
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      clean[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested plain objects
      if (value instanceof Date) {
        clean[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        clean[key] = value
          .filter((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
          .slice(0, 50); // Hard boundary limit on array elements
      } else {
        clean[key] = sanitizeOfflinePayload(value);
      }
    }
  }

  return clean;
}

class IndexedDbQueueService {
  private isProcessing = false;
  private isAuthInitialized = false;
  private syncChannel: BroadcastChannel | null = null;
  private tabSessionId: string = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  constructor() {
    this.initListeners();
    this.initAuthAndColdBootDrain();
  }

  private initListeners() {
    if (typeof window === 'undefined') return;

    // 1. Online event listener
    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Network restored. Attempting background queue drain...');
      this.processQueue();
    });

    // 2. Service Worker postMessage listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'DRAIN_OFFLINE_QUEUE') {
          console.log('[OfflineQueue] SW DRAIN_OFFLINE_QUEUE message received.');
          this.processQueue();
        }
      });
    }

    // 3. Cross-tab BroadcastChannel listener
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.syncChannel = new BroadcastChannel('puthia_sync_channel');
        this.syncChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'DRAIN_OFFLINE_QUEUE') {
            console.log('[OfflineQueue] BroadcastChannel DRAIN_OFFLINE_QUEUE received.');
            this.processQueue();
          }
        };
      }
    } catch (e) {
      console.warn('[OfflineQueue] BroadcastChannel init error:', e);
    }
  }

  /**
   * Cold Boot Auto-Drain (F-C1-08)
   * Resolves Firebase Auth initial state canonically before initiating drain.
   * Prevents double-drain triggers and early unauthenticated runs.
   */
  private initAuthAndColdBootDrain() {
    if (typeof window === 'undefined') return;

    const handleAuthReady = (user: any) => {
      const isFirstRun = !this.isAuthInitialized;
      this.isAuthInitialized = true;

      console.log('[OfflineQueue] Auth state ready:', user?.uid ? `User(${user.uid})` : 'Anonymous');
      this.notifyQueueChanged();

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (isFirstRun) {
          console.log('[OfflineQueue] Cold boot auto-drain starting after Auth readiness...');
          this.processQueue();
        } else {
          this.processQueue();
        }
      }
    };

    // Use authStateReady if supported by Firebase Auth SDK
    if (typeof (auth as any).authStateReady === 'function') {
      (auth as any).authStateReady().then(() => {
        if (!this.isAuthInitialized) {
          handleAuthReady(auth.currentUser);
        }
      }).catch((e: any) => {
        console.warn('[OfflineQueue] authStateReady warning:', e);
      });
    }

    // Listen for auth state changes (login, logout, account switch)
    auth.onAuthStateChanged((user) => {
      handleAuthReady(user);
    });
  }

  private notifyQueueChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puthia_offline_queue_updated'));
    }
  }

  /**
   * Request browser Background Sync registration if supported
   */
  public async requestBackgroundSync(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg && typeof (reg as any).sync.register === 'function') {
        await (reg as any).sync.register('sync-submissions');
        console.log('[OfflineQueue] Sync registration "sync-submissions" granted.');
        return true;
      }
    } catch (e) {
      console.warn('[OfflineQueue] Background Sync register skipped or unsupported:', e);
    }
    return false;
  }

  /**
   * Enqueue a submission into IndexedDB with explicit ownership & payload integrity metadata (F-C1-07)
   */
  public async enqueue(
    type: OfflineSubmissionType,
    collectionName: 'feedbacks' | 'complaints' | 'corrections',
    rawPayload: Record<string, any>,
    options?: {
      requiresAuth?: boolean;
      customId?: string;
      isAnonymous?: boolean;
    }
  ): Promise<OfflineSubmissionItem> {
    const db = await openIndexedDB();
    const sanitizedPayload = sanitizeOfflinePayload(rawPayload);
    const payloadHash = computePayloadHash(sanitizedPayload);
    const id = options?.customId || generateSubmissionId(type);

    const currentUser = auth.currentUser;
    const isAnonymous = options?.isAnonymous ?? (!currentUser && type === 'feedback');

    const item: OfflineSubmissionItem = {
      id,
      type,
      collectionName,
      payload: sanitizedPayload,
      payloadHash,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      requiresAuth: options?.requiresAuth ?? (type === 'complaint' || type === 'correction'),
      userId: isAnonymous ? undefined : currentUser?.uid,
      userEmail: isAnonymous ? undefined : (currentUser?.email || undefined),
      isAnonymous,
      claimGeneration: 0
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to insert offline submission item'));
    });

    this.notifyQueueChanged();
    await this.requestBackgroundSync();

    // If online and auth is ready, kick off an immediate background drain attempt
    if (typeof navigator !== 'undefined' && navigator.onLine && this.isAuthInitialized) {
      this.processQueue();
    }

    return item;
  }

  /**
   * Get single item by ID
   */
  public async getById(id: string): Promise<OfflineSubmissionItem | null> {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as OfflineSubmissionItem) || null);
      req.onerror = () => reject(req.error || new Error('Failed to get item by ID'));
    });
  }

  /**
   * Get all items currently in the queue
   */
  public async getAll(): Promise<OfflineSubmissionItem[]> {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as OfflineSubmissionItem[];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error || new Error('Failed to fetch offline submissions'));
    });
  }

  /**
   * Get user-isolated submissions (F-C1-07)
   * Only returns items matching the current user's UID or anonymous partition.
   * Malformed authenticated items with missing/empty UID are NOT shown to anonymous users.
   */
  public async getUserSubmissions(currentUid?: string | null): Promise<OfflineSubmissionItem[]> {
    const all = await this.getAll();
    if (currentUid && currentUid.trim() !== '') {
      // Authenticated user: only see items created by this exact UID
      return all.filter((i) => i.userId === currentUid);
    }
    // Unauthenticated user: only see items explicitly created as anonymous (isAnonymous === true AND !requiresAuth)
    return all.filter((i) => i.isAnonymous === true && !i.requiresAuth);
  }

  /**
   * Update an item in IndexedDB
   */
  public async update(id: string, updates: Partial<OfflineSubmissionItem>): Promise<void> {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as OfflineSubmissionItem | undefined;
        if (!existing) {
          resolve();
          return;
        }
        const updated = { ...existing, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Remove an item from IndexedDB (e.g., after confirmed server sync or user discard)
   */
  public async remove(id: string): Promise<boolean> {
    const db = await openIndexedDB();
    const result = await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Failed to delete item from offline store'));
    });
    this.notifyQueueChanged();
    return result;
  }

  /**
   * F-C1-09: Truly Atomic IndexedDB Claim in a single 'readwrite' transaction.
   * Reads the item, verifies pending/recoverable status & lease expiry,
   * increments claimGeneration fencing token, updates claimToken & status='syncing',
   * and puts the updated item back in the SAME transaction before resolving.
   */
  public async attemptAtomicClaim(
    id: string,
    tabSessionId: string,
    options?: { forceRetry?: boolean }
  ): Promise<{ success: boolean; item?: OfflineSubmissionItem; claimGeneration?: number }> {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      let isSettled = false;
      const safeResolve = (val: { success: boolean; item?: OfflineSubmissionItem; claimGeneration?: number }) => {
        if (!isSettled) {
          isSettled = true;
          resolve(val);
        }
      };

      let claimedItem: OfflineSubmissionItem | undefined;
      let newClaimGen: number | undefined;

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => {
        if (claimedItem && newClaimGen !== undefined) {
          safeResolve({ success: true, item: claimedItem, claimGeneration: newClaimGen });
        } else {
          safeResolve({ success: false });
        }
      };

      tx.onabort = () => {
        safeResolve({ success: false });
      };

      tx.onerror = () => {
        safeResolve({ success: false });
      };

      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineSubmissionItem | undefined;
        if (!item) {
          return;
        }

        const now = Date.now();
        const attemptTime = item.lastAttemptAt || 0;
        const isLeaseExpired = now - attemptTime > PROCESSING_LEASE_MS;

        // Item can be claimed ONLY if:
        // 1. status === 'pending' OR (options.forceRetry AND status === 'failed') OR
        // 2. status === 'syncing' AND lease is expired (stale recovery)
        const canClaim =
          item.status === 'pending' ||
          (options?.forceRetry === true && item.status === 'failed') ||
          (item.status === 'syncing' && isLeaseExpired);

        if (!canClaim) {
          return;
        }

        newClaimGen = (item.claimGeneration || 0) + 1;
        const updatedItem: OfflineSubmissionItem = {
          ...item,
          status: 'syncing',
          lastAttemptAt: now,
          claimToken: tabSessionId,
          claimGeneration: newClaimGen
        };

        const putReq = store.put(updatedItem);
        putReq.onsuccess = () => {
          // Request-level success within transaction scope: save item reference for tx.oncomplete
          claimedItem = updatedItem;
        };
        putReq.onerror = () => {
          claimedItem = undefined;
          newClaimGen = undefined;
        };
      };

      getReq.onerror = () => {
        // Handled by tx.onerror / tx.onabort
      };
    });
  }

  /**
   * F-C1-10: Renew processing lease while an in-flight Firestore request is active.
   * Only succeeds if claimToken AND claimGeneration match.
   */
  public async renewLease(id: string, tabSessionId: string, claimGen: number): Promise<boolean> {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      let isSettled = false;
      const safeResolve = (val: boolean) => {
        if (!isSettled) {
          isSettled = true;
          resolve(val);
        }
      };

      let isRenewed = false;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => safeResolve(isRenewed);
      tx.onabort = () => safeResolve(false);
      tx.onerror = () => safeResolve(false);

      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineSubmissionItem | undefined;
        if (!item || item.claimToken !== tabSessionId || item.claimGeneration !== claimGen) {
          // Lease stolen or token mismatch: do NOT renew
          return;
        }

        const updated: OfflineSubmissionItem = {
          ...item,
          lastAttemptAt: Date.now()
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => {
          isRenewed = true;
        };
        putReq.onerror = () => {
          isRenewed = false;
        };
      };

      getReq.onerror = () => {
        // Handled by tx.onerror / tx.onabort
      };
    });
  }

  /**
   * Verify fencing token before performing final server ACK removal or state update
   */
  public async verifyFencingToken(id: string, tabSessionId: string, claimGen: number): Promise<boolean> {
    const item = await this.getById(id);
    if (!item) return false;
    return item.claimToken === tabSessionId && item.claimGeneration === claimGen;
  }

  /**
   * User action: Retry a failed item (enforces UID ownership)
   */
  public async retryItem(id: string): Promise<boolean> {
    const item = await this.getById(id);
    if (!item) return false;

    const currentUser = auth.currentUser;
    const hasValidUserId = typeof item.userId === 'string' && item.userId.trim().length > 0;

    if (item.requiresAuth && (!currentUser || !hasValidUserId || item.userId !== currentUser.uid)) {
      console.warn('[OfflineQueue] Retry blocked: Item owner UID does not match current session.');
      return false;
    }

    await this.update(id, {
      status: 'pending',
      retryCount: 0,
      claimToken: undefined,
      lastErrorMessage: undefined,
      lastErrorCategory: undefined
    });
    this.notifyQueueChanged();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }
    return true;
  }

  /**
   * Stale "syncing" Recovery (F-C1-10)
   * Recovers items stuck in 'syncing' state due to app crash or sudden window close
   */
  public async recoverStaleSyncingItems(): Promise<number> {
    const all = await this.getAll();
    const now = Date.now();
    let recovered = 0;

    for (const item of all) {
      if (item.status === 'syncing') {
        const attemptTime = item.lastAttemptAt || 0;
        if (now - attemptTime > PROCESSING_LEASE_MS) {
          console.warn(`[OfflineQueue] Recovering stale syncing item: ${item.id} (lease expired)`);
          await this.update(item.id, {
            status: 'pending',
            claimToken: undefined
            // Do NOT increment retryCount on crash recovery
          });
          recovered++;
        }
      }
    }

    if (recovered > 0) {
      this.notifyQueueChanged();
    }
    return recovered;
  }

  /**
   * Process and drain the offline queue with strict idempotency, fencing tokens, and user isolation
   */
  public async processQueue(options?: { forceRetry?: boolean }): Promise<{
    processed: number;
    synced: number;
    failed: number;
    pendingAuth: number;
    recoveredStale: number;
  }> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing in this tab. Skipping concurrent run.');
      return { processed: 0, synced: 0, failed: 0, pendingAuth: 0, recoveredStale: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineQueue] Device is currently offline. Skipping sync attempt.');
      return { processed: 0, synced: 0, failed: 0, pendingAuth: 0, recoveredStale: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let synced = 0;
    let failed = 0;
    let pendingAuth = 0;
    let recoveredStale = 0;

    try {
      // 1. Recover stale syncing items from previous crash/closing
      recoveredStale = await this.recoverStaleSyncingItems();

      const allItems = await this.getAll();
      const currentUser = auth.currentUser;

      const targetItems = allItems.filter((item) => {
        if (item.status === 'pending') return true;
        if (options?.forceRetry && item.status === 'failed') return true;
        return false;
      });

      for (const item of targetItems) {
        processed++;

        // 2. F-C1-07: Strict Authenticated Queue Ownership Validation
        if (item.requiresAuth) {
          const hasValidUserId = typeof item.userId === 'string' && item.userId.trim().length > 0;

          // If no user is logged in, or if userId is missing/empty/null/undefined, or if userId !== currentUser.uid:
          if (!currentUser || !hasValidUserId || item.userId !== currentUser.uid) {
            console.warn(
              `[OfflineQueue] Isolation barrier triggered for item ${item.id}: requiresAuth is true but ownership validation failed (item.userId: ${item.userId}, currentUid: ${currentUser?.uid}). Holding item.`
            );
            await this.update(item.id, {
              status: 'pending',
              lastAttemptAt: Date.now(),
              lastErrorCategory: 'AUTH_REQUIRED',
              lastErrorMessage: !currentUser
                ? 'অভিযোগ বা সংশোধনী জমা দেওয়ার জন্য লগইন করা আবশ্যক।'
                : 'এই ড্রাফটটির মালিকানা ও সাবমিশন অ্যাকাউন্ট ভিন্ন। সঠিক অ্যাকাউন্টে লগইন করুন।'
            });
            pendingAuth++;
            continue;
          }
        }

        // 3. F-C1-09: Atomic Claim in a single IndexedDB transaction
        const claimResult = await this.attemptAtomicClaim(item.id, this.tabSessionId, options);
        if (!claimResult.success || !claimResult.claimGeneration) {
          console.log(`[OfflineQueue] Atomic claim failed for item ${item.id}. Skipping.`);
          continue;
        }

        const claimGen = claimResult.claimGeneration;
        this.notifyQueueChanged();

        // 4. F-C1-10: In-flight Lease Renewal Heartbeat Timer during long-running Firestore calls
        const heartbeatTimer = setInterval(() => {
          this.renewLease(item.id, this.tabSessionId, claimGen).catch((e) => {
            console.warn(`[OfflineQueue] Heartbeat renewal failed for ${item.id}:`, e);
          });
        }, HEARTBEAT_INTERVAL_MS);

        try {
          // Verify payload integrity if payloadHash is present
          if (item.payloadHash) {
            const currentHash = computePayloadHash(item.payload);
            if (currentHash !== item.payloadHash) {
              throw new Error('Payload integrity violation: hash mismatch before server dispatch.');
            }
          }

          // Dispatch to Firestore using stable document ID
          if (item.type === 'feedback') {
            await addFeedback(
              {
                ...(item.payload as any),
                _syncedFromOffline: true,
                _offlineQueuedAt: item.createdAt
              },
              item.id
            );
          } else if (item.type === 'complaint') {
            await addComplaint(
              {
                ...(item.payload as any),
                _syncedFromOffline: true,
                _offlineQueuedAt: item.createdAt
              },
              item.id
            );
          } else if (item.type === 'correction') {
            await addCorrection(
              {
                ...(item.payload as any),
                _syncedFromOffline: true,
                _offlineQueuedAt: item.createdAt
              },
              item.id
            );
          }

          // F-C1-10: Verify fencing token before completing removal
          const isFencingTokenValid = await this.verifyFencingToken(item.id, this.tabSessionId, claimGen);
          if (!isFencingTokenValid) {
            console.warn(`[OfflineQueue] Fencing token invalid for ${item.id}. Lease was stolen during long request. Skipping deletion.`);
            continue;
          }

          // 5. Server acknowledgment confirmed: purge local copy
          synced++;
          await this.remove(item.id);
          console.log(`[OfflineQueue] Successfully synced and acknowledged item: ${item.id}`);
        } catch (err: any) {
          console.error(`[OfflineQueue] Sync failure for ${item.id}:`, err);
          failed++;

          const errMsg = err?.message || String(err);
          const isPermissionDenied =
            errMsg.includes('permission-denied') ||
            errMsg.includes('insufficient permissions') ||
            errMsg.includes('Missing or insufficient permissions');

          const nextRetry = item.retryCount + 1;

          // Verify fencing token before updating error status
          const isFencingTokenValid = await this.verifyFencingToken(item.id, this.tabSessionId, claimGen);
          if (!isFencingTokenValid) {
            console.warn(`[OfflineQueue] Fencing token invalid during error handling for ${item.id}. Skipping status update.`);
            continue;
          }

          if (isPermissionDenied) {
            // Permanent authorization failure: do NOT delete, keep for user inspection (F-C1-11)
            await this.update(item.id, {
              status: 'failed',
              retryCount: nextRetry,
              claimToken: undefined,
              lastErrorCategory: 'PERMISSION_DENIED',
              lastErrorMessage: 'অনুমতি মেলেনি (Permission Denied)।'
            });
          } else {
            // Network or transient error
            if (nextRetry >= item.maxRetries) {
              await this.update(item.id, {
                status: 'failed',
                retryCount: nextRetry,
                claimToken: undefined,
                lastErrorCategory: 'NETWORK_ERROR',
                lastErrorMessage: 'সর্বোচ্চ চেষ্টা (৩ বার) শেষেও নেটওয়ার্কের কারণে জমা হয়নি।'
              });
            } else {
              // Exponential backoff retry state: keep pending
              await this.update(item.id, {
                status: 'pending',
                retryCount: nextRetry,
                claimToken: undefined,
                lastErrorCategory: 'NETWORK_ERROR',
                lastErrorMessage: errMsg
              });
            }
          }
        } finally {
          clearInterval(heartbeatTimer);
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyQueueChanged();
    }

    return { processed, synced, failed, pendingAuth, recoveredStale };
  }
}

export const indexedDbQueueService = new IndexedDbQueueService();
