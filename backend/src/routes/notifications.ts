import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

dotenv.config();

const router = Router();

// Initialize Firebase Admin only when needed
let adminInitialized = false;

function initializeFirebaseAdmin() {
  if (adminInitialized) return;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase credentials not configured');
  }

  // Handle private key formatting - Firebase service account keys are usually already properly formatted
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // If the key contains escaped newlines (\n), unescape them
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Validate that we have a proper private key
  if (!privateKey || privateKey.length < 500) {
    throw new Error(`Invalid Firebase private key: key is too short (${privateKey?.length || 0} chars). Please check your FIREBASE_PRIVATE_KEY environment variable.`);
  }

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid Firebase private key: missing BEGIN PRIVATE KEY header. Please ensure you\'re using the full private_key from your Firebase service account JSON.');
  }

  console.log('[FCM] Initializing with project:', process.env.FIREBASE_PROJECT_ID);
  console.log('[FCM] Client email:', process.env.FIREBASE_CLIENT_EMAIL);
  console.log('[FCM] Private key length:', privateKey.length);

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  adminInitialized = true;
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
const FCM_V1_API_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

// In-memory storage for FCM tokens (in production, use a database)
interface DeviceToken {
  token: string;
  platform: 'web' | 'android' | 'ios';
  registeredAt: string;
  lastActive: string;
  userId?: string;
}

const deviceTokens: Map<string, DeviceToken> = new Map();




async function sendFCMNotification(
  tokens: string[],
  notification: { title: string; body: string; image?: string },
  data?: Record<string, string>
): Promise<{ success: number; failure: number }> {
  console.log(`[FCM] Attempting to send to ${tokens.length} tokens`);
  console.log(`[FCM] Notification:`, notification);
  console.log(`[FCM] Data:`, data);

  try {
    console.log('[FCM] Initializing Firebase Admin...');
    initializeFirebaseAdmin();
    const messaging = getMessaging();
    console.log('[FCM] Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('[FCM] Failed to initialize Firebase:', error);
    console.error('[FCM] Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
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
        data: data || {},
        token: token,
      };

      console.log(`[FCM] Message payload:`, JSON.stringify(message, null, 2));

      // messaging.send() returns a string (message ID) on success
      const messageId = await messaging.send(message);
      if (messageId) {
        successCount++;
        console.log(`[FCM] SUCCESS: Sent to ${token.substring(0, 20)}... (messageId: ${messageId})`);
      } else {
        failureCount++;
        console.error(`[FCM] FAILED: No messageId returned for ${token.substring(0, 20)}`);
      }
    } catch (error: any) {
      failureCount++;
      console.error(`[FCM] ERROR sending to ${token.substring(0, 20)}...`, {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });

      // Remove invalid tokens
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        deviceTokens.delete(token);
        console.log(`[FCM] Removed invalid token: ${token.substring(0, 20)}...`);
      }
    }
  }

  console.log(`[FCM] Send operation complete: ${successCount} success, ${failureCount} failure`);
  return { success: successCount, failure: failureCount };
}

/**
 * POST /api/notifications/register
 * Register a device FCM token for push notifications
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { token, platform, timestamp, userId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      });
    }

    const deviceInfo: DeviceToken = {
      token,
      platform: platform || 'web',
      registeredAt: timestamp || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userId,
    };

    deviceTokens.set(token, deviceInfo);

    console.log(`[Notifications] Registered device: ${platform} - ${token.substring(0, 20)}...`);
    console.log(`[Notifications] Total registered devices: ${deviceTokens.size}`);

    res.json({
      success: true,
      message: 'Device registered successfully',
      deviceCount: deviceTokens.size,
    });
  } catch (error: any) {
    console.error('[Notifications] Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register device',
    });
  }
});

/**
 * POST /api/notifications/send
 * Send push notification to all registered devices
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { title, body, type, data, imageUrl, userId } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required',
      });
    }

    // Get target tokens (filter by userId if specified)
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
        message: 'No devices registered',
        sentCount: 0,
      });
    }

    console.log(`[Notifications] Sending "${title}" to ${tokens.length} devices...`);

    // Send via FCM
    const result = await sendFCMNotification(
      tokens,
      { title, body, image: imageUrl },
      { type: type || 'general', ...data }
    );

    console.log(`[Notifications] Sent: ${result.success}, Failed: ${result.failure}`);

    res.json({
      success: true,
      message: `Notification sent to ${result.success} devices (${result.failure} failed)`,
      sentCount: result.success,
      failedCount: result.failure,
      notification: { title, body, type },
    });
  } catch (error: any) {
    console.error('[Notifications] Send error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

/**
 * POST /api/notifications/send-to-user
 * Send push notification to a specific user
 */
router.post('/send-to-user', async (req: Request, res: Response) => {
  try {
    const { userId, title, body, type, data, imageUrl } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, and body are required',
      });
    }

    // Get tokens for this user
    const tokens = Array.from(deviceTokens.entries())
      .filter(([_, device]) => device.userId === userId)
      .map(([token, _]) => token);

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'User has no registered devices',
        sentCount: 0,
      });
    }

    // Send via FCM
    const result = await sendFCMNotification(
      tokens,
      { title, body, image: imageUrl },
      { type: type || 'general', userId, ...data }
    );

    res.json({
      success: true,
      message: `Notification sent to user's ${result.success} devices`,
      sentCount: result.success,
      failedCount: result.failure,
    });
  } catch (error: any) {
    console.error('[Notifications] Send to user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

/**
 * POST /api/notifications/send-to-token
 * Send push notification to a specific FCM token (for testing)
 */
router.post('/send-to-token', async (req: Request, res: Response) => {
  try {
    const { token, title, body, type, data, imageUrl } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'token, title, and body are required',
      });
    }

    console.log(`[Notifications] Sending to specific token: ${token.substring(0, 30)}...`);

    // Send via FCM
    const result = await sendFCMNotification(
      [token],
      { title, body, image: imageUrl },
      { type: type || 'general', ...data }
    );

    res.json({
      success: result.success > 0,
      message: result.success > 0 ? 'Notification sent!' : 'Failed to send notification',
      result,
    });
  } catch (error: any) {
    console.error('[Notifications] Send to token error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

/**
 * GET /api/notifications/devices
 * Get list of registered devices (admin only)
 */
router.get('/devices', async (req: Request, res: Response) => {
  const devices = Array.from(deviceTokens.values()).map(d => ({
    platform: d.platform,
    registeredAt: d.registeredAt,
    lastActive: d.lastActive,
    userId: d.userId,
    tokenPreview: d.token.substring(0, 20) + '...',
  }));

  res.json({
    success: true,
    count: devices.length,
    devices,
    fcmConfigured: !!FCM_SERVER_KEY,
  });
});

/**
 * DELETE /api/notifications/unregister
 * Unregister a device token
 */
router.delete('/unregister', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    const deleted = deviceTokens.delete(token);

    res.json({
      success: true,
      message: deleted ? 'Device unregistered' : 'Device not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unregister device',
    });
  }
});

/**
 * GET /api/notifications/status
 * Get notification service status
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    status: {
      fcmConfigured: !!FCM_SERVER_KEY,
      registeredDevices: deviceTokens.size,
      platforms: {
        android: Array.from(deviceTokens.values()).filter(d => d.platform === 'android').length,
        ios: Array.from(deviceTokens.values()).filter(d => d.platform === 'ios').length,
        web: Array.from(deviceTokens.values()).filter(d => d.platform === 'web').length,
      },
    },
  });
});

export default router;
