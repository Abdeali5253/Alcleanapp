// Notification service for AlClean App
// Handles Firebase Cloud Messaging (FCM) integration

import {
  PushNotification,
  NotificationSettings,
  FCMToken,
  SendNotificationRequest,
} from "../types/notifications";

// Firebase configuration from environment variables
const getFirebaseConfig = () => {
  // Safely access import.meta.env
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "app-notification-5e56b",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || "",
  };
};

const FIREBASE_CONFIG = getFirebaseConfig();

class NotificationService {
  private fcmToken: string | null = null;
  private notifications: PushNotification[] = [];
  private settings: NotificationSettings = {
    enabled: true,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    deliveryAlerts: true,
  };

  /**
   * Initialize notification service
   * Call this when app starts
   */
  async initialize(): Promise<void> {
    // Load saved settings
    this.loadSettings();
    
    // Load notification history
    this.loadNotifications();

    // Request permission and get token
    if (this.settings.enabled) {
      await this.requestPermission();
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      await this.getToken();
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await this.getToken();
        return true;
      }
    }

    return false;
  }

  /**
   * Get FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      // Check if token is already cached
      const cached = localStorage.getItem('fcm_token');
      if (cached) {
        this.fcmToken = cached;
        return cached;
      }

      // Generate device-specific token
      const deviceToken = this.generateDeviceToken();
      this.fcmToken = deviceToken;
      
      // Save token to backend and local storage
      await this.saveToken(deviceToken);
      localStorage.setItem('fcm_token', deviceToken);
      
      return deviceToken;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Generate device-specific token
   */
  private generateDeviceToken(): string {
    const deviceId = this.getDeviceId();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `fcm_${deviceId}_${timestamp}_${random}`;
  }

  /**
   * Get or create device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Save FCM token to backend
   */
  private async saveToken(token: string): Promise<void> {
    try {
      // Safely access import.meta.env
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
      const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
      
      const userStr = localStorage.getItem('alclean_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch(`${apiUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId: user?.id,
          email: user?.email,
          platform: 'web',
          deviceId: this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save token');
      }

      console.log('[FCM] Token saved to backend');
    } catch (error) {
      console.error('[FCM] Error saving token:', error);
      // Don't fail if backend is not available
    }
  }

  /**
   * Handle incoming notification
   */
  handleNotification(notification: PushNotification): void {
    // Add to notification history
    this.notifications.unshift(notification);
    this.saveNotifications();

    // Show browser notification if permitted
    if (Notification.permission === "granted") {
      this.showBrowserNotification(notification);
    }

    // Trigger custom event for app to handle
    window.dispatchEvent(
      new CustomEvent("alclean-notification", { detail: notification })
    );
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: PushNotification): void {
    const options: NotificationOptions = {
      body: notification.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: notification.data,
      tag: notification.id,
      requireInteraction: false,
    };

    if (notification.imageUrl) {
      options.image = notification.imageUrl;
    }

    new Notification(notification.title, options);
  }

  /**
   * Get all notifications
   */
  getNotifications(): PushNotification[] {
    return this.notifications;
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.saveNotifications();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // If notifications were disabled, clear token
    if (!newSettings.enabled) {
      this.fcmToken = null;
      localStorage.removeItem("fcm_token");
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Send notification (admin function)
   * In production, this should be called from your backend
   */
  async sendNotification(request: SendNotificationRequest): Promise<boolean> {
    // This is a mock function for demonstration
    // In production, this should be called from your backend server

    console.log("Sending notification:", request);

    // Mock: Create notification locally
    const notification: PushNotification = {
      id: this.generateId(),
      title: request.title,
      body: request.body,
      type: request.type,
      data: request.data,
      imageUrl: request.imageUrl,
      actionUrl: request.actionUrl,
      timestamp: Date.now(),
      read: false,
    };

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Handle locally
    this.handleNotification(notification);

    return true;

    /* 
    // In production, use this code on your backend:
    
    const message = {
      notification: {
        title: request.title,
        body: request.body,
        image: request.imageUrl
      },
      data: request.data || {},
      topic: request.targetAudience === 'all' ? 'all_users' : 'specific',
      // or use tokens for specific users
      // tokens: userTokens
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    return response.ok;
    */
  }

  /**
   * Subscribe to notification topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    if (!this.fcmToken) return;

    // TODO: Implement topic subscription
    // In production, send token to backend which subscribes to topic
    console.log(`Subscribing to topic: ${topic}`);
  }

  /**
   * Private helper methods
   */

  private loadSettings(): void {
    const saved = localStorage.getItem("notification_settings");
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  private saveSettings(): void {
    localStorage.setItem("notification_settings", JSON.stringify(this.settings));
  }

  private loadNotifications(): void {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      this.notifications = JSON.parse(saved);
    } else {
      // Add welcome notification
      this.notifications = [
        {
          id: this.generateId(),
          title: "Welcome to AlClean! 🧼",
          body: "Get notified about exclusive discounts, new products, and order updates!",
          type: "general",
          timestamp: Date.now(),
          read: false,
        },
      ];
      this.saveNotifications();
    }
  }

  private saveNotifications(): void {
    // Only save last 100 notifications
    const toSave = this.notifications.slice(0, 100);
    localStorage.setItem("notifications", JSON.stringify(toSave));
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlatform(): "web" | "android" | "ios" {
    // Detect platform
    const userAgent = navigator.userAgent || "";
    if (/android/i.test(userAgent)) return "android";
    if (/iPad|iPhone|iPod/.test(userAgent)) return "ios";
    return "web";
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper function to create test notifications (for development)
export function createTestNotification(type: PushNotification["type"]): void {
  const testNotifications = {
    order_update: {
      title: "Order Updated 📦",
      body: "Your order #12345 has been dispatched and is on the way!",
      type: "order_update" as const,
      data: { orderId: "12345" },
    },
    discount: {
      title: "Special Discount! 🎉",
      body: "Get 20% off on all cleaning chemicals this weekend!",
      type: "discount" as const,
      data: { discountCode: "CLEAN20" },
    },
    sale: {
      title: "Flash Sale! ⚡",
      body: "Limited time offer: Buy 2 Get 1 Free on selected products!",
      type: "sale" as const,
    },
    new_product: {
      title: "New Product Alert! ✨",
      body: "Check out our new eco-friendly multi-purpose cleaner!",
      type: "new_product" as const,
      data: { productId: "eco-cleaner-001" },
    },
    delivery: {
      title: "Out for Delivery 🚚",
      body: "Your order will be delivered today between 2-5 PM",
      type: "delivery" as const,
      data: { orderId: "12345" },
    },
  };

  const notification = testNotifications[type];
  if (notification) {
    notificationService.handleNotification({
      id: `test_${Date.now()}`,
      ...notification,
      timestamp: Date.now(),
      read: false,
    });
  }
}
