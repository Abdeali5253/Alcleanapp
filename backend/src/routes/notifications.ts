import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { Message } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { getFirebaseAdminMessaging } from "../services/firebase-admin.js";

dotenv.config();

const router = Router();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";
const FCM_V1_API_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

// Persistent storage for FCM tokens and notifications
interface DeviceToken {
  token: string;
  platform: "web" | "android" | "ios";
  registeredAt: string;
  lastActive: string;
  userId?: string;
}

interface SentNotification {
  id: string;
  userId?: string; // Associate with user instead of token
  token: string;
  title: string;
  body: string;
  data: any;
  timestamp: string;
  delivered: boolean;
  read: boolean;
}

function parseBearerToken(header?: string): string | undefined {
  const match = header?.match(/^Bearer ([^\s]{20,4096})$/);
  return match?.[1];
}

export function notificationHistoryForUser(
  entries: SentNotification[],
  userId: string,
): Omit<SentNotification, "token">[] {
  return dedupeNotifications(
    entries.filter((entry) => entry.userId === userId),
  ).map(({ token: _token, ...entry }) => entry);
}

const NOTIFICATION_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

// File paths for persistent storage
const DATA_DIR = path.join(process.cwd(), "data");
const DEVICES_FILE = path.join(DATA_DIR, "devices.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

// In-memory maps for fast access
const deviceTokens: Map<string, DeviceToken> = new Map();
const sentNotifications: Map<string, SentNotification> = new Map();

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load data from files
function loadDevices() {
  try {
    ensureDataDir();
    if (fs.existsSync(DEVICES_FILE)) {
      const data = fs.readFileSync(DEVICES_FILE, "utf8");
      const devices: DeviceToken[] = JSON.parse(data);
      devices.forEach((device) => deviceTokens.set(device.token, device));
      console.log(
        `[Notifications] Loaded ${devices.length} devices from storage`,
      );
    }
  } catch (error) {
    console.error("[Notifications] Failed to load devices:", error);
  }
}

function loadNotifications() {
  try {
    ensureDataDir();
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, "utf8");
      const notifications: SentNotification[] = JSON.parse(data);
      notifications.forEach((notification) =>
        sentNotifications.set(notification.id, notification),
      );
      console.log(
        `[Notifications] Loaded ${notifications.length} notifications from storage`,
      );
    }
  } catch (error) {
    console.error("[Notifications] Failed to load notifications:", error);
  }
}

// Save data to files
function saveDevices() {
  try {
    ensureDataDir();
    const devices = Array.from(deviceTokens.values());
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
  } catch (error) {
    console.error("[Notifications] Failed to save devices:", error);
  }
}

function getNotificationSignature(notification: {
  token: string;
  title: string;
  body: string;
  data?: any;
}) {
  return JSON.stringify({
    token: notification.token,
    title: notification.title,
    body: notification.body,
    type: notification.data?.type || "general",
    orderId: notification.data?.orderId || "",
    productId: notification.data?.productId || "",
    deepLink: notification.data?.deepLink || "",
    discountCode: notification.data?.discountCode || "",
    imageUrl: notification.data?.imageUrl || "",
  });
}

function findDuplicateNotification(candidate: {
  token: string;
  title: string;
  body: string;
  data?: any;
  timestamp?: string;
}): SentNotification | undefined {
  const candidateSignature = getNotificationSignature(candidate);
  const candidateTime = candidate.timestamp
    ? new Date(candidate.timestamp).getTime()
    : Date.now();

  return Array.from(sentNotifications.values()).find((notification) => {
    if (getNotificationSignature(notification) !== candidateSignature) {
      return false;
    }

    const existingTime = new Date(notification.timestamp).getTime();
    return (
      Math.abs(existingTime - candidateTime) <= NOTIFICATION_DEDUPE_WINDOW_MS
    );
  });
}

function upsertStoredNotification(notification: SentNotification): SentNotification {
  const existing = findDuplicateNotification(notification);

  if (existing) {
    existing.delivered = existing.delivered || notification.delivered;
    existing.read = existing.read && notification.read;
    existing.userId = existing.userId || notification.userId;
    existing.timestamp =
      new Date(existing.timestamp).getTime() <=
      new Date(notification.timestamp).getTime()
        ? existing.timestamp
        : notification.timestamp;
    existing.data = {
      ...notification.data,
      ...existing.data,
    };
    sentNotifications.set(existing.id, existing);
    saveNotifications();
    return existing;
  }

  sentNotifications.set(notification.id, notification);
  saveNotifications();
  return notification;
}

function dedupeNotifications(notifications: SentNotification[]): SentNotification[] {
  const sorted = [...notifications].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const deduped: SentNotification[] = [];

  for (const notification of sorted) {
    const existing = deduped.find((item) => {
      if (getNotificationSignature(item) !== getNotificationSignature(notification)) {
        return false;
      }

      return (
        Math.abs(
          new Date(item.timestamp).getTime() -
            new Date(notification.timestamp).getTime(),
        ) <= NOTIFICATION_DEDUPE_WINDOW_MS
      );
    });

    if (existing) {
      existing.delivered = existing.delivered || notification.delivered;
      existing.read = existing.read && notification.read;
      existing.userId = existing.userId || notification.userId;
      existing.data = {
        ...notification.data,
        ...existing.data,
      };
      if (
        new Date(notification.timestamp).getTime() <
        new Date(existing.timestamp).getTime()
      ) {
        existing.timestamp = notification.timestamp;
      }
    } else {
      deduped.push({ ...notification });
    }
  }

  return deduped.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function saveNotifications() {
  try {
    ensureDataDir();
    const notifications = Array.from(sentNotifications.values());
    fs.writeFileSync(
      NOTIFICATIONS_FILE,
      JSON.stringify(notifications, null, 2),
    );
  } catch (error) {
    console.error("[Notifications] Failed to save notifications:", error);
  }
}

export function deleteNotificationDataForUser(userId: string): {
  devicesDeleted: number;
  notificationsDeleted: number;
} {
  let devicesDeleted = 0;
  let notificationsDeleted = 0;
  for (const [token, device] of deviceTokens.entries()) {
    if (device.userId === userId) {
      deviceTokens.delete(token);
      devicesDeleted += 1;
    }
  }
  for (const [id, notification] of sentNotifications.entries()) {
    if (notification.userId === userId) {
      sentNotifications.delete(id);
      notificationsDeleted += 1;
    }
  }
  if (devicesDeleted > 0) saveDevices();
  if (notificationsDeleted > 0) saveNotifications();
  return { devicesDeleted, notificationsDeleted };
}
// Initialize persistent storage
loadDevices();
loadNotifications();

async function sendFCMNotification(
  tokens: string[],
  notification: { title: string; body: string; image?: string },
  data?: Record<string, string>,
): Promise<{ success: number; failure: number }> {
  console.log(`[FCM] Attempting to send notification to ${tokens.length} device(s)`);

  let messaging;
  try {
    messaging = getFirebaseAdminMessaging();
  } catch (error: any) {
    console.error("[FCM] Failed to initialize Firebase:", error);
    return { success: 0, failure: tokens.length };
  }

  let successCount = 0;
  let failureCount = 0;

  for (const token of tokens) {
    try {
      const message: Message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: {
          ...data,
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image || "",
          timestamp: new Date().toISOString(),
        },
        token: token,
        android: {
          priority: "high",
          notification: {
            priority: "max",
            channelId: "alclean_high_priority_v1",
          },
        },
      };

      const messageId = await messaging.send(message);
      if (messageId) {
        successCount++;
        console.log(`[FCM] Notification delivered (messageId: ${messageId})`);

        const notificationId = `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const device = deviceTokens.get(token);
        const userId = device?.userId;
        upsertStoredNotification({
          id: notificationId,
          userId,
          token,
          title: notification.title,
          body: notification.body,
          data: data || {},
          timestamp: new Date().toISOString(),
          delivered: true,
          read: false,
        });
      } else {
        failureCount++;
      }
    } catch (error: any) {
      failureCount++;
      console.error("[FCM] Error sending notification:", error.message);

      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        deviceTokens.delete(token);
      }
    }
  }

  console.log(
    `[FCM] Send operation complete: ${successCount} success, ${failureCount} failure`,
  );
  return { success: successCount, failure: failureCount };
}

export interface UserNotificationRequest {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function sendNotificationToUser(
  request: UserNotificationRequest,
): Promise<{ success: number; failure: number }> {
  const tokens = Array.from(deviceTokens.entries())
    .filter(([_, device]) => device.userId === request.userId)
    .map(([token]) => token);
  if (tokens.length === 0) return { success: 0, failure: 0 };
  return sendFCMNotification(
    tokens,
    { title: request.title, body: request.body, image: request.imageUrl },
    {
      type: request.type || "general",
      userId: request.userId,
      ...request.data,
    },
  );
}

export interface RegisteredDeviceSummary {
  tokenPreview: string;
  platform: DeviceToken["platform"];
  userId?: string;
  registeredAt: string;
  lastActive: string;
}

/**
 * Server-only administration helper. It intentionally returns only a token
 * preview so logs and terminal output cannot expose usable FCM credentials.
 */
export function listRegisteredDevices(): RegisteredDeviceSummary[] {
  return Array.from(deviceTokens.values()).map((device) => ({
    tokenPreview: `${device.token.slice(0, 6)}...${device.token.slice(-6)}`,
    platform: device.platform,
    userId: device.userId,
    registeredAt: device.registeredAt,
    lastActive: device.lastActive,
  }));
}

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

/** Server-only broadcast helper for scheduled jobs and the local admin CLI. */
export async function sendNotificationToAll(
  request: BroadcastNotificationRequest,
): Promise<{ recipients: number; success: number; failure: number }> {
  const tokens = Array.from(deviceTokens.keys());
  if (tokens.length === 0) {
    return { recipients: 0, success: 0, failure: 0 };
  }
  const result = await sendFCMNotification(
    tokens,
    { title: request.title, body: request.body, image: request.imageUrl },
    request.data,
  );
  return { recipients: tokens.length, ...result };
}

async function getCustomerIdFromAccessToken(
  accessToken: string,
): Promise<string | undefined> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN || "";
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
  if (!domain || !storefrontToken) return undefined;
  const response = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: `
          query notificationCustomer($customerAccessToken: String!) {
            customer(customerAccessToken: $customerAccessToken) { id }
          }
        `,
        variables: { customerAccessToken: accessToken },
      }),
    },
  );
  if (!response.ok) return undefined;
  const payload: any = await response.json();
  return payload.data?.customer?.id;
}

/**
 * POST /api/notifications/register
 * Register a device FCM token for push notifications
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { token, platform, userId } = req.body;

    if (typeof token !== "string" || token.length < 20 || token.length > 4096) {
      return res.status(400).json({
        success: false,
        error: "Valid FCM token is required",
      });
    }
    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({ success: false, error: "Invalid platform" });
    }

    let verifiedUserId: string | undefined;
    const accessToken = parseBearerToken(req.headers.authorization);
    if (accessToken) {
      verifiedUserId = await getCustomerIdFromAccessToken(accessToken);
      if (!verifiedUserId) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired customer access token",
        });
      }
      if (userId && userId !== verifiedUserId) {
        return res.status(403).json({
          success: false,
          error: "Customer identity does not match access token",
        });
      }
    }
    const existingDevice = deviceTokens.get(token);
    const deviceInfo: DeviceToken = {
      token,
      platform,
      registeredAt:
        existingDevice?.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userId: verifiedUserId,
    };

    deviceTokens.set(token, deviceInfo);
    saveDevices();

    console.log(`[Notifications] Registered ${platform || "web"} device`);

    res.json({
      success: true,
      message: "Device registered successfully",
      deviceCount: deviceTokens.size,
    });
  } catch (error: any) {
    console.error("[Notifications] Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register device",
    });
  }
});

router.delete("/unregister", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });
    const device = deviceTokens.get(token);
    if (device?.userId) {
      const accessToken = parseBearerToken(req.headers.authorization);
      const verifiedUserId = accessToken
        ? await getCustomerIdFromAccessToken(accessToken)
        : undefined;
      if (!verifiedUserId || verifiedUserId !== device.userId) {
        return res.status(403).json({ success: false, error: "Not allowed" });
      }
    }
    const deleted = deviceTokens.delete(token);
    res.json({
      success: true,
      message: deleted ? "Device unregistered" : "Device not found",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to unregister device",
      });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const accessToken = parseBearerToken(req.headers.authorization);
    const userId = accessToken
      ? await getCustomerIdFromAccessToken(accessToken)
      : undefined;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Valid access token required" });
    }

    const notifications = notificationHistoryForUser(
      Array.from(sentNotifications.values()),
      userId,
    );
    return res.json({ success: true, notifications, count: notifications.length });
  } catch (error: any) {
    console.error("[Notifications] History error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

export default router;
