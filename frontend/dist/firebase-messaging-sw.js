// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBHsieStommdpkhabXZPlmdAuBS13MI8sA",
  authDomain: "app-notification-5e56b.firebaseapp.com",
  projectId: "app-notification-5e56b",
  storageBucket: "app-notification-5e56b.firebasestorage.app",
  messagingSenderId: "310536726569",
  appId: "1:310536726569:web:243b4e36ef095da0f71438"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || 'AlClean';
  const options = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          const type = event.notification.data?.type;
          let url = '/';
          if (type === 'order_update') url = '/orders';
          if (type === 'promotion') url = '/products';
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

console.log('[SW] Firebase messaging service worker loaded');
