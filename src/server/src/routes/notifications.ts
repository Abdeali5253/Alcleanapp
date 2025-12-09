import { Router, Request, Response } from 'express';

const router = Router();

interface SendNotificationRequest {
  title: string;
  body: string;
  tokens: string[];
  data?: Record<string, string>;
  icon?: string;
  clickAction?: string;
}

interface SubscribeRequest {
  token: string;
  userId?: string;
  email?: string;
  platform?: string;
  deviceId?: string;
}

// In-memory token storage (replace with database in production)
const fcmTokens = new Map<string, {
  token: string;
  userId?: string;
  email?: string;
  platform?: string;
  deviceId?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendFCMNotification(notification: SendNotificationRequest) {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    throw new Error('FCM_SERVER_KEY not configured');
  }

  const message = {
    registration_ids: notification.tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      click_action: notification.clickAction || 'https://your-app-url.com',
    },
    data: notification.data || {},
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FCM API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * POST /api/notifications/send
 * Send push notification to devices
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { title, body, tokens, data, icon, clickAction }: SendNotificationRequest = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required',
      });
    }

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tokens array is required and must not be empty',
      });
    }

    console.log(`[FCM] Sending notification to ${tokens.length} devices`);

    const result = await sendFCMNotification({
      title,
      body,
      tokens,
      data,
      icon,
      clickAction,
    });

    console.log(`[FCM] Notification sent successfully`);

    res.json({
      success: true,
      fcmResponse: result,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('[FCM] Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

/**
 * POST /api/notifications/subscribe
 * Save FCM token for a device
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { token, userId, email, platform, deviceId }: SubscribeRequest = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    const now = new Date();
    const existing = fcmTokens.get(token);

    fcmTokens.set(token, {
      token,
      userId,
      email,
      platform: platform || 'web',
      deviceId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });

    console.log(`[FCM] Token saved: ${token.substring(0, 20)}...`);

    res.json({
      success: true,
      message: 'Token saved successfully',
    });
  } catch (error: any) {
    console.error('[FCM] Error saving token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save token',
    });
  }
});

/**
 * GET /api/notifications/tokens
 * Get all saved tokens (admin only - add auth in production)
 */
router.get('/tokens', (req: Request, res: Response) => {
  const tokens = Array.from(fcmTokens.values());
  res.json({
    success: true,
    count: tokens.length,
    tokens: tokens.map(t => ({
      ...t,
      token: t.token.substring(0, 20) + '...', // Hide full token
    })),
  });
});

/**
 * POST /api/notifications/send-to-user
 * Send notification to specific user by email or userId
 */
router.post('/send-to-user', async (req: Request, res: Response) => {
  try {
    const { email, userId, title, body, data } = req.body;

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        error: 'Email or userId is required',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required',
      });
    }

    // Find tokens for this user
    const userTokens = Array.from(fcmTokens.values())
      .filter(t => t.email === email || t.userId === userId)
      .map(t => t.token);

    if (userTokens.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tokens found for this user',
      });
    }

    console.log(`[FCM] Sending to user (${email || userId}): ${userTokens.length} devices`);

    const result = await sendFCMNotification({
      title,
      body,
      tokens: userTokens,
      data,
    });

    res.json({
      success: true,
      devicesNotified: userTokens.length,
      fcmResponse: result,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('[FCM] Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

export default router;
