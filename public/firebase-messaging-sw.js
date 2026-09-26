importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// These config values will be injected during the build step or need to be set manually here
// For this application, we can use a basic handler for background messages

firebase.initializeApp({
  apiKey: "AIzaSyAEZ2x5TuIztbTW1MJLVW0DilEraAihNMM",
  authDomain: "our-puthia-45c6e.firebaseapp.com",
  projectId: "our-puthia-45c6e",
  storageBucket: "our-puthia-45c6e.firebasestorage.app",
  messagingSenderId: "879558865198",
  appId: "1:879558865198:web:932e24d30d6a6a2a2e8abf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const data = payload.data || {};
  const isCall = data.type === 'call_invite' || data.action === 'call' || data.callId;

  if (isCall) {
    const callerName = data.callerName || payload.notification?.title || 'ব্যবহারকারী';
    const callType = data.callType === 'video' ? 'ভিডিও কল' : 'অডিও কল';
    const notificationTitle = `📞 ইনকামিং ${callType}: ${callerName}`;
    const notificationOptions = {
      body: 'উত্তর দিতে ট্যাপ করুন',
      icon: data.callerPhoto || '/icon-192.png',
      badge: '/icon-192.png',
      tag: `call-${data.callId || Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      data: {
        type: 'call_invite',
        callId: data.callId || `call_${Date.now()}`,
        callerId: data.callerId,
        callerName: data.callerName || 'ব্যবহারকারী',
        callerPhoto: data.callerPhoto || '',
        callType: data.callType || 'audio',
        receiverId: data.receiverId,
        url: `/?incoming_call=${data.callId || ''}&type=${data.callType || 'audio'}`
      }
    };

    const callPayload = {
      id: data.callId || `call_${Date.now()}`,
      callerId: data.callerId || 'unknown',
      callerName: data.callerName || 'ব্যবহারকারী',
      callerPhoto: data.callerPhoto || '',
      receiverId: data.receiverId || '',
      receiverName: data.receiverName || '',
      type: data.callType === 'video' ? 'video' : 'audio',
      status: 'ringing',
      createdAt: Date.now()
    };

    // Broadcast to open clients
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'FCM_CALL_INVITE',
          payload: callPayload
        });
      });
    });

    // Also try BroadcastChannel
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
      console.warn('BroadcastChannel error in SW:', e);
    }

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }

  const notificationTitle = payload.notification?.title || 'আমাদের পুঠিয়া';
  const notificationOptions = {
    body: payload.notification?.body || data.text || 'নতুন নোটিফিকেশন',
    icon: '/icon-192.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
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
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(notificationData.url || '/');
      }
    })
  );
});
