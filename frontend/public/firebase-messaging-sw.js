// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMZrTCi1giFF6hJOC-MuOBbsqqKp6G6rU",
  authDomain: "app-notification-5e56b.firebaseapp.com",
  projectId: "app-notification-5e56b",
  storageBucket: "app-notification-5e56b.firebasestorage.app",
  messagingSenderId: "310536726569",
  appId: "1:310536726569:android:eb53b3a97416f36ef71438"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'AlClean';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] Notification clicked:', event);
  
  event.notification.close();
  
  // Handle action buttons
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          let url = '/';
          
          // Navigate based on notification type
          const notificationType = event.notification.data?.type;
          if (notificationType === 'order_update') {
            url = '/orders';
          } else if (notificationType === 'promotion' || notificationType === 'sale') {
            url = '/products';
          }
          
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Log service worker installation
self.addEventListener('install', (event) => {
  console.log('[Firebase SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Firebase SW] Activated');
  event.waitUntil(clients.claim());
});

console.log('[Firebase SW] Service worker loaded');
