// Firebase Configuration for Push Notifications and Auth
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { canUseNotification } from "./notification-guard";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;
const isNative = Capacitor.isNativePlatform();

export function initializeFirebase(): FirebaseApp | null {
  if (app) return app;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("[Firebase] Configuration missing");
    return null;
  }

  // For mobile, set auth domain to Firebase auth hosting domain for proper OAuth redirect handling
  if (isNative) {
    firebaseConfig.authDomain = "app-notification-5e56b.firebaseapp.com";
  }

  try {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase] Initialized successfully");
    return app;
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    return null;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;

  const firebaseApp = initializeFirebase();
  if (!firebaseApp) return null;

  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      messaging = getMessaging(firebaseApp);
      console.log("[Firebase] Messaging initialized");
      return messaging;
    }
    return null;
  } catch (error) {
    console.error("[Firebase] Messaging failed:", error);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;

  const firebaseApp = initializeFirebase();
  if (!firebaseApp) return null;

  try {
    auth = getAuth(firebaseApp);
    console.log("[Firebase] Auth initialized");
    return auth;
  } catch (error) {
    console.error("[Firebase] Auth failed:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if running in a context that supports notifications

    if (!isNative || !canUseNotification()) {
      console.warn(
        "[Firebase] Notifications not supported in this environment",
      );
      return null;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.warn("[Firebase] Service workers not supported");
      return null;
    }

    if (!isNative || !canUseNotification()) return null;
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("[Firebase] Permission denied");
      return null;
    }

    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) {
      console.warn("[Firebase] Messaging not available");
      return null;
    }

    // Get FCM token with VAPID key
    try {
      const token = await getToken(messagingInstance, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        console.log("[Firebase] FCM Token:", token.substring(0, 30) + "...");
        return token;
      }
    } catch (tokenError: any) {
      // Handle specific errors gracefully
      if (tokenError.code === "messaging/failed-service-worker-registration") {
        console.warn(
          "[Firebase] Service worker registration failed. Push notifications will not work in this environment.",
        );
      } else {
        console.warn(
          "[Firebase] Token retrieval failed:",
          tokenError.message || tokenError,
        );
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error("[Firebase] Permission error:", error);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: any) => void,
): (() => void) | null {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) return null;

  return onMessage(messagingInstance, (payload) => {
    console.log("[Firebase] Message received:", payload);
    callback(payload);
  });
}

export const getConfig = () => firebaseConfig;
export const getVapidKey = () => VAPID_KEY;
