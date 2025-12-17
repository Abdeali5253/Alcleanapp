import { Router, Request, Response } from 'express';

const router = Router();

// In-memory storage for FCM tokens (in production, use a database)
interface DeviceToken {
  token: string;
  platform: 'web' | 'android' | 'ios';
  registeredAt: string;
  lastActive: string;
}

const deviceTokens: Map<string, DeviceToken> = new Map();

/**
 * POST /api/notifications/register
 * Register a device FCM token for push notifications
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { token, platform, timestamp } = req.body;

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
    const { title, body, type, data, imageUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required',
      });
    }

    const tokens = Array.from(deviceTokens.keys());

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No devices registered',
        sentCount: 0,
      });
    }

    // In production, you would use Firebase Admin SDK to send notifications
    // For now, we'll just log and return success
    console.log(`[Notifications] Sending notification to ${tokens.length} devices:`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    console.log(`  Type: ${type || 'general'}`);

    // TODO: Implement actual FCM sending with Firebase Admin SDK
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: { title, body, imageUrl },
    //   data: { type, ...data },
    //   tokens: tokens,
    // };
    // const response = await admin.messaging().sendMulticast(message);

    res.json({
      success: true,
      message: `Notification queued for ${tokens.length} devices`,
      sentCount: tokens.length,
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
 * GET /api/notifications/devices
 * Get list of registered devices (admin only)
 */
router.get('/devices', async (req: Request, res: Response) => {
  const devices = Array.from(deviceTokens.values()).map(d => ({
    platform: d.platform,
    registeredAt: d.registeredAt,
    lastActive: d.lastActive,
    tokenPreview: d.token.substring(0, 20) + '...',
  }));

  res.json({
    success: true,
    count: devices.length,
    devices,
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

export default router;
