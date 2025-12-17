// Firebase Configuration for AlClean Mobile App
// This file initializes Firebase for push notifications

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Get configuration from environment variables
const getFirebaseConfig = () => {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'app-notification-5e56b',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '310536726569',
    appId: env.VITE_FIREBASE_APP_ID || '',
  };
};

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Initialize Firebase only if config is valid
export function initializeFirebase(): FirebaseApp | null {
  if (app) return app;
  
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Configuration missing, notifications disabled');
    return null;
  }
  
  try {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized successfully');
    return app;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    return null;
  }
}

// Get Firebase Messaging instance
export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  
  const firebaseApp = initializeFirebase();
  if (!firebaseApp) return null;
  
  try {
    // Check if messaging is supported (requires HTTPS or localhost)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(firebaseApp);
      console.log('[Firebase] Messaging initialized');
      return messaging;
    }
    console.warn('[Firebase] Messaging not supported in this environment');
    return null;
  } catch (error) {
    console.error('[Firebase] Messaging initialization failed:', error);
    return null;
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[Firebase] Notifications not supported');
      return null;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('[Firebase] Notification permission denied');
      return null;
    }
    
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) return null;
    
    // Get FCM token
    const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
    const vapidKey = env.VITE_FIREBASE_VAPID_KEY || '';
    
    const token = await getToken(messagingInstance, { vapidKey });
    
    if (token) {
      console.log('[Firebase] FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    }
    
    console.warn('[Firebase] No FCM token available');
    return null;
  } catch (error) {
    console.error('[Firebase] Error getting FCM token:', error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) return null;
  
  return onMessage(messagingInstance, (payload) => {
    console.log('[Firebase] Foreground message received:', payload);
    callback(payload);
  });
}

// Export config for debugging
export const getConfig = () => firebaseConfig;
