/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: any;

// Immediately activate new service worker and claim clients to prevent stale cache lock
self.skipWaiting();
clientsClaim();

// 1. Workbox Precache & Outdated Cache Cleanup
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// 2. SPA Navigation Fallback for Offline App Shell
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/]
});
registerRoute(navigationRoute);

// 3. Runtime Caching for Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// Helper regex for Admin, Management, and Moderator assets (case-insensitive)
const ADMIN_ASSET_REGEX = /\/(?:[a-zA-Z0-9_-]*(?:admin|management|moderator)[a-zA-Z0-9_-]*)\.(?:js|css)$/i;

// Helper to strictly validate allowed Unsplash image hostnames
function isAllowedUnsplashHost(hostname: string): boolean {
  return hostname === 'images.unsplash.com' || /^([a-zA-Z0-9_-]+\.)?unsplash\.com$/.test(hostname);
}

// 4. Admin, Management & Moderator Assets (Strict NetworkOnly - Zero local caching of administrative code)
// Registered FIRST so Workbox first-match intercepts all admin/management assets before general script caching.
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style' || /\.(?:js|css)$/i.test(url.pathname)) &&
    ADMIN_ASSET_REGEX.test(url.pathname),
  new NetworkOnly()
);

// 5. On-demand Heavy Vendor Chunks (PDF tools, Maps, Charts, Lottie)
// Registered ahead of general routes so heavy libraries use their dedicated strict cache budget.
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style' || /\.(?:js|css)$/i.test(url.pathname)) &&
    (url.pathname.includes('vendor-pdf-tools') ||
     url.pathname.includes('vendor-maps') ||
     url.pathname.includes('vendor-charts') ||
     url.pathname.includes('vendor-lottie') ||
     url.pathname.includes('jspdf') ||
     url.pathname.includes('html2canvas') ||
     url.pathname.includes('canvg') ||
     url.pathname.includes('pdf-lib')),
  new NetworkFirst({
    cacheName: 'heavy-vendor-cache',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 14 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// 6. Runtime Caching for Local Public Route Scripts & Styles (NetworkFirst to prevent stale 404 hashes)
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style' || /\.(?:js|css)$/i.test(url.pathname)) &&
    !url.pathname.includes('/api/') &&
    !ADMIN_ASSET_REGEX.test(url.pathname),
  new NetworkFirst({
    cacheName: 'app-dynamic-routes',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// 7. Runtime Caching for Images (Same-origin or strict Unsplash domain allowlist)
registerRoute(
  ({ url, request }) =>
    request.destination === 'image' &&
    (url.origin === self.location.origin || isAllowedUnsplashHost(url.hostname)),
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// 6. Firebase Cloud Messaging (FCM) Background Handler & Call Invites
try {
  self.importScripts(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js'
  );

  if (typeof self.firebase !== 'undefined') {
    self.firebase.initializeApp({
      apiKey: "AIzaSyAEZ2x5TuIztbTW1MJLVW0DilEraAihNMM",
      authDomain: "our-puthia-45c6e.firebaseapp.com",
      projectId: "our-puthia-45c6e",
      storageBucket: "our-puthia-45c6e.firebasestorage.app",
      messagingSenderId: "879558865198",
      appId: "1:879558865198:web:932e24d30d6a6a2a2e8abf"
    });

    const messaging = self.firebase.messaging();

    messaging.onBackgroundMessage((payload: any) => {
      console.log('[Unified SW] Received background FCM message:', payload);
      const data = payload?.data || {};
      const isCall =
        data.type === 'call_invite' ||
        data.type === 'audio_call' ||
        data.type === 'video_call' ||
        data.action === 'call' ||
        data.callId;

      if (isCall) {
        const callerName = data.callerName || payload.notification?.title?.replace(/^.*?:\s*/, '') || 'ব্যবহারকারী';
        const callType = (data.callType === 'video' || data.type === 'video_call') ? 'ভিডিও কল' : 'অডিও কল';
        const notificationTitle = `📞 ইনকামিং ${callType}: ${callerName}`;
        const notificationOptions = {
          body: 'উত্তর দিতে ট্যাপ করুন',
          icon: data.callerPhoto || data.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `call-${data.callId || Date.now()}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [300, 150, 300, 150, 300, 150, 500],
          data: {
            type: 'call_invite',
            callId: data.callId || `call_${Date.now()}`,
            callerId: data.callerId,
            callerName: callerName,
            callerPhoto: data.callerPhoto || '',
            callType: (data.callType === 'video' || data.type === 'video_call') ? 'video' : 'audio',
            receiverId: data.receiverId,
            url: `/?incoming_call=${data.callId || ''}&type=${data.callType || 'audio'}`
          }
        };

        const callPayload = {
          id: data.callId || `call_${Date.now()}`,
          callerId: data.callerId || 'unknown',
          callerName: callerName,
          callerPhoto: data.callerPhoto || '',
          receiverId: data.receiverId || '',
          receiverName: data.receiverName || '',
          type: (data.callType === 'video' || data.type === 'video_call') ? 'video' : 'audio',
          status: 'ringing',
          createdAt: Date.now()
        };

        // Broadcast to open clients
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
          clientList.forEach((client) => {
            client.postMessage({
              type: 'FCM_CALL_INVITE',
              payload: callPayload
            });
          });
        });

        // BroadcastChannel cross-tab notify
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('puthia_calls_channel');
            channel.postMessage({
              type: 'FCM_CALL_INVITE',
              payload: callPayload
            });
            channel.close();
          }
        } catch (e) {
          console.warn('[Unified SW] BroadcastChannel error:', e);
        }

        return self.registration.showNotification(notificationTitle, notificationOptions);
      }

      // Normal System Notifications
      const notifTitle = payload.notification?.title || data.title || 'আমাদের পুঠিয়া';
      const notifBody = payload.notification?.body || data.body || data.message || 'নতুন নোটিফিকেশন এসেছে';
      const notifIcon = data.icon || payload.notification?.icon || data.actorAvatar || '/pwa-192x192.png';
      const notifImage = data.image || payload.notification?.image;
      const notifUrl = data.url || data.deepLink || payload.data?.url || '/';

      const notificationOptions = {
        body: notifBody,
        icon: notifIcon,
        image: notifImage,
        badge: '/pwa-192x192.png',
        tag: data.tag || `notif_${Date.now()}`,
        vibrate: [200, 100, 200, 100, 200],
        data: {
          url: notifUrl,
          type: data.type || 'system_notification'
        }
      };

      return self.registration.showNotification(notifTitle, notificationOptions);
    });
  }
} catch (swInitErr) {
  console.warn('[Unified SW] Firebase compat import skipped or offline:', swInitErr);
}

// 7. Notification Click Handler & Deep Linking
export function getSafeNotificationDestination(rawUrl: unknown, baseOrigin: string): string {
  const fallbackUrl = new URL('/', baseOrigin).href;

  if (typeof rawUrl !== 'string') {
    return fallbackUrl;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return fallbackUrl;
  }

  try {
    const parsed = new URL(trimmed, baseOrigin);

    // 1. Enforce strict HTTP or HTTPS protocol only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallbackUrl;
    }

    // 2. Reject credentials embedded in URL (e.g. https://user:pass@domain/)
    if (parsed.username || parsed.password) {
      return fallbackUrl;
    }

    // 3. Strict Same-Origin Check: Origin must exactly match baseOrigin
    if (parsed.origin !== baseOrigin) {
      return fallbackUrl;
    }

    return parsed.href;
  } catch {
    return fallbackUrl;
  }
}

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const notificationData = event.notification.data || {};

  let rawUrl = notificationData.url || '/notifications';
  if (notificationData.type === 'chat_message' || notificationData.type === 'message') {
    rawUrl = notificationData.url || '/messages';
  } else if (notificationData.type === 'notice' || notificationData.type === 'announcement') {
    rawUrl = notificationData.url || '/notice';
  }

  const fullUrl = getSafeNotificationDestination(rawUrl, self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList: any[]) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (notificationData.type === 'call_invite') {
            client.postMessage({
              type: 'FCM_CALL_INVITE',
              payload: {
                id: notificationData.callId,
                callerId: notificationData.callerId,
                callerName: notificationData.callerName,
                callerPhoto: notificationData.callerPhoto,
                receiverId: notificationData.receiverId,
                type: notificationData.callType || 'audio',
                status: 'ringing',
                createdAt: Date.now()
              }
            });
          }

          try {
            if ('navigate' in client) {
              await client.navigate(fullUrl);
            }
          } catch (e) {
            console.warn('[Unified SW] Client navigate error:', e);
          }

          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});

// 8. Background Sync Handler (Graceful offline retry)
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-submissions' || event.tag === 'puthia-sync-submissions') {
    event.waitUntil(
      (async () => {
        console.log('[Unified SW] PWA Background Sync triggered for tag:', event.tag);

        // Broadcast to all active window clients
        try {
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({
              type: 'DRAIN_OFFLINE_QUEUE',
              source: 'service-worker-sync',
              tag: event.tag,
              timestamp: Date.now()
            });
          }
        } catch (clientErr) {
          console.warn('[Unified SW] Background sync client notify warning:', clientErr);
        }

        // Broadcast over BroadcastChannel for cross-tab coordination
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('puthia_sync_channel');
            channel.postMessage({
              type: 'DRAIN_OFFLINE_QUEUE',
              source: 'service-worker-sync',
              tag: event.tag,
              timestamp: Date.now()
            });
            channel.close();
          }
        } catch (bcErr) {
          console.warn('[Unified SW] BroadcastChannel sync notify warning:', bcErr);
        }
      })()
    );
  }
});

// 9. Skip Waiting on User Prompt
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
