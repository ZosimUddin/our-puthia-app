/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: any;

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

// 4. Runtime Caching for Scripts & Styles (StaleWhileRevalidate)
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ]
  })
);

// 5. Runtime Caching for Images
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 })
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
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const notificationData = event.notification.data || {};

  let rawUrl = notificationData.url || '/notifications';
  if (notificationData.type === 'chat_message' || notificationData.type === 'message') {
    rawUrl = notificationData.url || '/messages';
  } else if (notificationData.type === 'notice' || notificationData.type === 'announcement') {
    rawUrl = notificationData.url || '/notice';
  }

  const fullUrl = new URL(rawUrl, self.location.origin).href;

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
  if (event.tag === 'sync-submissions') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[Unified SW] PWA Background Sync: sync-submissions triggered.');
      })
    );
  }
});

// 9. Skip Waiting on User Prompt
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
