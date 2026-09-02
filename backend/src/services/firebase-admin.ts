import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

function getPrivateKey(): string {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privateKey || privateKey.length < 500) {
    throw new Error("Firebase private key is missing or invalid");
  }
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("Firebase private key is missing its PEM header");
  }
  return privateKey;
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();
  const projectId = process.env.FIREBASE_PROJECT_ID || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  if (!projectId || !clientEmail) {
    throw new Error("Firebase credentials not configured");
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: getPrivateKey() }),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminMessaging() {
  return getMessaging(getFirebaseAdminApp());
}
