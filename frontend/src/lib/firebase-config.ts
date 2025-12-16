/**
 * Firebase Configuration and Initialization
 * All sensitive keys are stored in environment variables
 */

// Get Firebase configuration from environment variables
const getFirebaseConfig = () => {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || "",
  };
};

export const firebaseConfig = getFirebaseConfig();

// VAPID key for web push notifications
// Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const getVapidKey = () => {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  return env.VITE_FIREBASE_VAPID_KEY || '';
};

export const VAPID_KEY = getVapidKey();

/**
 * Firebase Cloud Messaging (FCM) Setup Instructions
 * 
 * To enable real push notifications:
 * 
 * 1. Install Firebase dependencies:
 *    npm install firebase
 * 
 * 2. Get your Firebase Cloud Messaging Server Key:
 *    - Go to Firebase Console (https://console.firebase.google.com)
 *    - Select your project
 *    - Go to Project Settings > Cloud Messaging
 *    - Copy the "Server key" under Cloud Messaging API (Legacy)
 *    - Add it to server/.env as FCM_SERVER_KEY
 * 
 * 3. Get your VAPID key for web push:
 *    - In the same Cloud Messaging settings
 *    - Under "Web Push certificates"
 *    - Generate a new key pair or use existing
 *    - Copy the "Key pair" value
 *    - Add it to .env as VITE_FIREBASE_VAPID_KEY
 * 
 * 4. Get Firebase web configuration:
 *    - Go to Project Settings > General
 *    - Scroll to "Your apps" section
 *    - Click on your web app or add a new one
 *    - Copy all the config values to your .env file
 * 
 * 5. For Android app:
 *    - Download google-services.json from Firebase Console
 *    - Place it in android/app/ directory
 *    - Firebase SDK will be automatically configured
 */

// Initialize Firebase (uncomment when ready to use real Firebase)
/*
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('FCM Token:', token);
      
      // Send token to your server
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
      const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
      
      await fetch(`${apiUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'web' })
      });
      
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

// Handle foreground messages
export function onMessageListener() {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });
}

export { messaging };
*/
