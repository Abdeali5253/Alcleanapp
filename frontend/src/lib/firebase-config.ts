// Firebase Configuration for Push Notifications
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function initializeFirebase(): FirebaseApp | null {
  if (app) return app;
  
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Configuration missing');
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

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  
  const firebaseApp = initializeFirebase();
  if (!firebaseApp) return null;
  
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(firebaseApp);
      console.log('[Firebase] Messaging initialized');
      return messaging;
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Messaging failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!('Notification' in window)) {
      console.warn('[Firebase] Notifications not supported');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('[Firebase] Permission denied');
      return null;
    }
    
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) return null;
    
    // Get FCM token with VAPID key
    const token = await getToken(messagingInstance, { 
      vapidKey: VAPID_KEY 
    });
    
    if (token) {
      console.log('[Firebase] FCM Token:', token.substring(0, 30) + '...');
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('[Firebase] Token error:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) return null;
  
  return onMessage(messagingInstance, (payload) => {
    console.log('[Firebase] Message received:', payload);
    callback(payload);
  });
}

export const getConfig = () => firebaseConfig;
export const getVapidKey = () => VAPID_KEY;
