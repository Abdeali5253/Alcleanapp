import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging, Message } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";

dotenv.config();

const router = Router();

// Initialize Firebase Admin only when needed
let adminInitialized = false;

function initializeFirebaseAdmin() {
  if (adminInitialized) return;
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error("Firebase credentials not configured");
  }

  // Handle private key formatting - Firebase service account keys are usually already properly formatted
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // If the key contains escaped newlines (\n), unescape them
  if (privateKey && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // Validate that we have a proper private key
  if (!privateKey || privateKey.length < 500) {
    throw new Error(
      `Invalid Firebase private key: key is too short (${privateKey?.length || 0} chars). Please check your FIREBASE_PRIVATE_KEY environment variable.`,
    );
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "Invalid Firebase private key: missing BEGIN PRIVATE KEY header. Please ensure you're using the full private_key from your Firebase service account JSON.",
    );
  }

  console.log(
    "[FCM] Initializing with project:",
    process.env.FIREBASE_PROJECT_ID,
  );
  console.log("[FCM] Client email:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("[FCM] Private key length:", privateKey.length);

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  adminInitialized = true;
}

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

// Initialize persistent storage
loadDevices();
loadNotifications();

async function sendFCMNotification(
  tokens: string[],
  notification: { title: string; body: string; image?: string },
  data?: Record<string, string>,
): Promise<{ success: number; failure: number }> {
  console.log(`[FCM] Attempting to send to ${tokens.length} tokens`);
  console.log(`[FCM] Notification:`, notification);
  console.log(`[FCM] Data:`, data);

  try {
    console.log("[FCM] Initializing Firebase Admin...");
    initializeFirebaseAdmin();
    const messaging = getMessaging();
    console.log("[FCM] Firebase Admin initialized successfully");
  } catch (error: any) {
    console.error("[FCM] Failed to initialize Firebase:", error);
    return { success: 0, failure: tokens.length };
  }

  const messaging = getMessaging();
  let successCount = 0;
  let failureCount = 0;

  for (const token of tokens) {
    try {
      console.log(`[FCM] Sending to token: ${token.substring(0, 30)}...`);

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

      console.log(`[FCM] Message payload:`, JSON.stringify(message, null, 2));

      const messageId = await messaging.send(message);
      if (messageId) {
        successCount++;
        console.log(
          `[FCM] SUCCESS: Sent to ${token.substring(0, 20)}... (messageId: ${messageId})`,
        );

        const notificationId = `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const device = deviceTokens.get(token);
        const userId = device?.userId;
        sentNotifications.set(notificationId, {
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
        saveNotifications();
      } else {
        failureCount++;
      }
    } catch (error: any) {
      failureCount++;
      console.error(
        `[FCM] ERROR sending to ${token.substring(0, 20)}...`,
        error.message,
      );

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

/**
 * POST /api/notifications/register
 * Register a device FCM token for push notifications
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { token, platform, timestamp, userId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "FCM token is required",
      });
    }

    const deviceInfo: DeviceToken = {
      token,
      platform: platform || "web",
      registeredAt: timestamp || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userId,
    };

    deviceTokens.set(token, deviceInfo);
    saveDevices();

    console.log(
      `[Notifications] Registered device: ${platform} - ${token.substring(0, 20)}...`,
    );

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

/**
 * POST /api/notifications/send
 * Send push notification to all registered devices
 */
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { title, body, type, data, imageUrl, userId } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: "Title and body are required",
      });
    }

    let tokens: string[];
    if (userId) {
      tokens = Array.from(deviceTokens.entries())
        .filter(([_, device]) => device.userId === userId)
        .map(([token, _]) => token);
    } else {
      tokens = Array.from(deviceTokens.keys());
    }

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: "No devices registered",
        sentCount: 0,
      });
    }

    const result = await sendFCMNotification(
      tokens,
      { title, body, image: imageUrl },
      { type: type || "general", ...data },
    );

    res.json({
      success: true,
      message: `Notification sent to ${result.success} devices (${result.failure} failed)`,
      sentCount: result.success,
      failedCount: result.failure,
      notification: { title, body, type },
    });
  } catch (error: any) {
    console.error("[Notifications] Send error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send notification",
    });
  }
});

/**
 * POST /api/notifications/send-to-user
 * Send push notification to a specific user
 */
router.post("/send-to-user", async (req: Request, res: Response) => {
  try {
    const { userId, title, body, type, data, imageUrl } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "userId, title, and body are required",
      });
    }

    const tokens = Array.from(deviceTokens.entries())
      .filter(([_, device]) => device.userId === userId)
      .map(([token, _]) => token);

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: "User has no registered devices",
        sentCount: 0,
      });
    }

    const result = await sendFCMNotification(
      tokens,
      { title, body, image: imageUrl },
      { type: type || "general", userId, ...data },
    );

    res.json({
      success: true,
      message: `Notification sent to user's ${result.success} devices`,
      sentCount: result.success,
      failedCount: result.failure,
    });
  } catch (error: any) {
    console.error("[Notifications] Send to user error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send notification",
    });
  }
});

/**
 * POST /api/notifications/send-to-token
 * Send push notification to a specific FCM token (for testing)
 */
router.post("/send-to-token", async (req: Request, res: Response) => {
  try {
    const { token, title, body, type, data, imageUrl } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "token, title, and body are required",
      });
    }

    const result = await sendFCMNotification(
      [token],
      { title, body, image: imageUrl },
      { type: type || "general", ...data },
    );

    res.json({
      success: result.success > 0,
      message:
        result.success > 0
          ? "Notification sent!"
          : "Failed to send notification",
      result,
    });
  } catch (error: any) {
    console.error("[Notifications] Send to token error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send notification",
    });
  }
});

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || "";

router.get("/devices", async (req: Request, res: Response) => {
  const devices = Array.from(deviceTokens.values()).map((d) => ({
    platform: d.platform,
    registeredAt: d.registeredAt,
    lastActive: d.lastActive,
    userId: d.userId,
    tokenPreview: d.token.substring(0, 20) + "...",
  }));

  res.json({
    success: true,
    count: devices.length,
    devices,
  });
});

router.delete("/unregister", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });
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

router.post("/store-received", async (req: Request, res: Response) => {
  try {
    const { token, title, body, data, timestamp } = req.body;
    if (!token || !title || !body)
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });

    const device = deviceTokens.get(token);
    const userId = device?.userId;

    const notificationId = `received_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sentNotifications.set(notificationId, {
      id: notificationId,
      userId,
      token,
      title,
      body,
      data: data || {},
      timestamp: timestamp || new Date().toISOString(),
      delivered: true,
      read: false,
    });
    saveNotifications();

    res.json({ success: true, message: "Notification stored successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to store notification",
      });
  }
});

router.get("/history", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string")
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });

    const userNotifications = Array.from(sentNotifications.values())
      .filter((n) => n.token === token)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    res.json({
      success: true,
      notifications: userNotifications,
      count: userNotifications.length,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to fetch history",
      });
  }
});

router.get("/user-notifications", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string")
      return res
        .status(400)
        .json({ success: false, error: "userId is required" });

    const userNotifications = Array.from(sentNotifications.values())
      .filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    res.json({
      success: true,
      notifications: userNotifications,
      count: userNotifications.length,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to fetch user notifications",
      });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  res.json({
    success: true,
    status: {
      fcmConfigured: !!process.env.FIREBASE_PROJECT_ID,
      registeredDevices: deviceTokens.size,
      storedNotifications: sentNotifications.size,
    },
  });
});

export default router;
