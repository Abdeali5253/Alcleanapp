import { Capacitor } from "@capacitor/core";
import { nativeNotificationService, NativeNotification } from "./native-notifications";
import { BACKEND_URL } from "./base-url";

// Firebase modules will be lazy loaded
let initializeFirebase: any = null;
let requestNotificationPermission: any = null;
let onForegroundMessage: any = null;

// Try to load Firebase modules
const loadFirebaseModules = async () => {
  try {
    const module = await import("./firebase-config");
    initializeFirebase = module.initializeFirebase;
    requestNotificationPermission = module.requestNotificationPermission;
    onForegroundMessage = module.onForegroundMessage;
    return true;
  } catch (e) {
    console.log("[Notifications] Firebase config not available:", e);
    return false;
  }
};

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type:
  | "order_update"
  | "promotion"
  | "discount"
  | "sale"
  | "new_product"
  | "delivery"
  | "general";
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationSegment {
  id: string;
  name: string;
  description: string;
}

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  deliveryAlerts: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = "alclean_notifications";
const FCM_TOKEN_STORAGE_KEY = "alclean_fcm_token";
const NOTIFICATION_SETTINGS_KEY = "alclean_notification_settings";

// Helper functions
const isNativePlatform = () => Capacitor.isNativePlatform();

const hasWebNotificationApi = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  typeof Notification !== "undefined";

class NotificationService {
  private fcmToken: string | null = null;
  private notifications: PushNotification[] = [];
  private listeners: ((notifications: PushNotification[]) => void)[] = [];
  private isInitialized = false;
  private settings: NotificationSettings = {
    enabled: true,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    deliveryAlerts: true,
  };

  constructor() {
    console.log("[Notifications] Service constructor");
    console.log("[Notifications] Platform:", Capacitor.getPlatform());
    console.log("[Notifications] Is Native:", isNativePlatform());
    this.loadNotifications();
    this.loadFCMToken();
    this.loadSettings();
  }

  // Initialize notification service (auto-detects platform)
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log("[Notifications] Already initialized");
      return true;
    }

    try {
      console.log("[Notifications] Initializing...");

      // Use native notifications on Android/iOS
      if (isNativePlatform()) {
        console.log("[Notifications] Using native notifications");

        try {
          const success = await nativeNotificationService.initialize();
          console.log("[Notifications] Native init result:", success);

          if (success) {
            // Create notification channels on Android (non-blocking)
            nativeNotificationService.createNotificationChannel().catch(e => {
              console.error("[Notifications] Channel creation failed:", e);
            });

            // Sync token
            this.fcmToken = nativeNotificationService.getFCMToken();
            if (this.fcmToken) {
              this.saveFCMToken(this.fcmToken);
              // Fetch recent notifications from backend
              await this.fetchNotificationHistory(this.fcmToken);
            }

            // Subscribe to native notification changes
            nativeNotificationService.subscribe((nativeNotifs) => {
              this.syncFromNativeNotifications(nativeNotifs);
            });

            // Subscribe to token changes to fetch notification history
            nativeNotificationService.subscribeToToken(async (token) => {
              console.log("[Notifications] Token received, fetching notification history");
              await this.fetchNotificationHistory(token);
            });
          }
        } catch (e) {
          console.error("[Notifications] Native init error:", e);
        }

        this.isInitialized = true;
        return true;
      }

      // Use web notifications
      console.log("[Notifications] Using web notifications");

      const firebaseLoaded = await loadFirebaseModules();
      if (firebaseLoaded && initializeFirebase) {
        try {
          const firebaseApp = initializeFirebase();
          if (!firebaseApp) {
            console.warn("[Notifications] Firebase not available");
            this.isInitialized = true;
            return false;
          }

          // Listen for foreground messages
          if (onForegroundMessage) {
            onForegroundMessage((payload: any) => {
              this.handleIncomingNotification(payload);
            });
          }
        } catch (e) {
          console.error("[Notifications] Firebase init error:", e);
        }
      }

      this.isInitialized = true;
      console.log("[Notifications] Initialized successfully");
      return true;
    } catch (error) {
      console.error("[Notifications] Initialization failed:", error);
      this.isInitialized = true;
      return false;
    }
  }

  // Sync notifications from native service
  private syncFromNativeNotifications(nativeNotifs: NativeNotification[]): void {
    try {
      this.notifications = nativeNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type as PushNotification["type"],
        timestamp: new Date(n.timestamp),
        read: n.read,
        data: n.data,
        imageUrl: n.imageUrl,
      }));
      this.notifyListeners();
    } catch (e) {
      console.error("[Notifications] Sync error:", e);
    }
  }

  // Register FCM token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log("[Notifications] Token registered with backend");
      } else {
        console.log("[Notifications] Backend returned:", response.status);
      }
    } catch (error) {
      console.log("[Notifications] Backend not available");
    }
  }

  // Handle incoming web notification
  private handleIncomingNotification(payload: any): void {
    try {
      const notification: PushNotification = {
        id: this.generateId(),
        title: payload.notification?.title || payload.data?.title || "New Notification",
        body: payload.notification?.body || payload.data?.body || "",
        type: payload.data?.type || "general",
        timestamp: new Date(),
        read: false,
        data: payload.data,
        imageUrl: payload.notification?.image || payload.data?.imageUrl,
      };

      this.addNotification(notification);

      // Show browser notification if in foreground
      if (!isNativePlatform() && hasWebNotificationApi() && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.body,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: notification.id,
        });
      }
    } catch (e) {
      console.error("[Notifications] Handle incoming error:", e);
    }
  }

  // Add notification to list
  addNotification(notification: PushNotification): void {
    try {
      if (isNativePlatform()) {
        nativeNotificationService.addNotification({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          timestamp: notification.timestamp.getTime(),
          read: notification.read,
          data: notification.data,
          imageUrl: notification.imageUrl,
        });
        return;
      }

      this.notifications.unshift(notification);
      this.saveNotifications();
      this.notifyListeners();
    } catch (e) {
      console.error("[Notifications] Add notification error:", e);
    }
  }

  // Get all notifications
  getNotifications(): PushNotification[] {
    try {
      if (isNativePlatform()) {
        const nativeNotifs = nativeNotificationService.getNotifications();
        return nativeNotifs.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type as PushNotification["type"],
          timestamp: new Date(n.timestamp),
          read: n.read,
          data: n.data,
          imageUrl: n.imageUrl,
        }));
      }
      return [...this.notifications];
    } catch (e) {
      console.error("[Notifications] Get notifications error:", e);
      return [];
    }
  }

  // Get unread count
  getUnreadCount(): number {
    try {
      if (isNativePlatform()) {
        return nativeNotificationService.getUnreadCount();
      }
      return this.notifications.filter((n) => !n.read).length;
    } catch (e) {
      return 0;
    }
  }

  // Mark notification as read
  markAsRead(id: string): void {
    try {
      if (isNativePlatform()) {
        nativeNotificationService.markAsRead(id);
        return;
      }

      const notification = this.notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
        this.saveNotifications();
        this.notifyListeners();
      }
    } catch (e) {
      console.error("[Notifications] Mark as read error:", e);
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    try {
      if (isNativePlatform()) {
        nativeNotificationService.markAllAsRead();
        return;
      }

      this.notifications.forEach((n) => (n.read = true));
      this.saveNotifications();
      this.notifyListeners();
    } catch (e) {
      console.error("[Notifications] Mark all as read error:", e);
    }
  }

  // Delete notification
  deleteNotification(id: string): void {
    try {
      if (isNativePlatform()) {
        nativeNotificationService.deleteNotification(id);
        return;
      }

      this.notifications = this.notifications.filter((n) => n.id !== id);
      this.saveNotifications();
      this.notifyListeners();
    } catch (e) {
      console.error("[Notifications] Delete notification error:", e);
    }
  }

  // Clear all notifications
  clearAll(): void {
    try {
      if (isNativePlatform()) {
        nativeNotificationService.clearAll();
        return;
      }

      this.notifications = [];
      this.saveNotifications();
      this.notifyListeners();
    } catch (e) {
      console.error("[Notifications] Clear all error:", e);
    }
  }

  // Subscribe to notification changes
  subscribe(callback: (notifications: PushNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  // Check if notifications are enabled
  async checkPermission(): Promise<"granted" | "denied" | "default"> {
    try {
      if (isNativePlatform()) {
        const status = await nativeNotificationService.checkPermission();
        return status === "prompt" ? "default" : status;
      }

      if (!hasWebNotificationApi()) return "denied";
      return Notification.permission;
    } catch (e) {
      console.error("[Notifications] Check permission error:", e);
      return "denied";
    }
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    console.log("[Notifications] requestPermission called, isNative:", isNativePlatform());

    try {
      if (isNativePlatform()) {
        const granted = await nativeNotificationService.requestPermission();
        console.log("[Notifications] Native permission result:", granted);

        if (granted) {
          // Update FCM token after permission granted
          setTimeout(() => {
            this.fcmToken = nativeNotificationService.getFCMToken();
            if (this.fcmToken) {
              this.saveFCMToken(this.fcmToken);
            }
          }, 1000);
        }
        return granted;
      }

      if (!hasWebNotificationApi()) {
        console.log("[Notifications] Web notification API not available");
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log("[Notifications] Web permission result:", permission);

      if (permission === "granted" && !this.fcmToken) {
        try {
          await loadFirebaseModules();
          if (requestNotificationPermission) {
            const token = await requestNotificationPermission();
            if (token) {
              this.fcmToken = token;
              this.saveFCMToken(token);
              await this.registerTokenWithBackend(token);
            }
          }
        } catch (e) {
          console.error("[Notifications] Token request error:", e);
        }
      }

      return permission === "granted";
    } catch (e) {
      console.error("[Notifications] Request permission error:", e);
      return false;
    }
  }

  // Try to register if permission already granted
  async tryRegisterIfPermitted(): Promise<boolean> {
    if (isNativePlatform()) {
      const registered = await nativeNotificationService.tryRegisterIfPermitted();
      if (registered) {
        // Wait a bit for token to arrive via listener
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.fcmToken = nativeNotificationService.getFCMToken();
        if (this.fcmToken) {
          this.saveFCMToken(this.fcmToken);
        }
      }
      return registered;
    }
    return false;
  }

  // Get FCM token
  getFCMToken(): string | null {
    try {
      if (isNativePlatform()) {
        return nativeNotificationService.getFCMToken();
      }
      return this.fcmToken;
    } catch (e) {
      return null;
    }
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    try {
      if (isNativePlatform()) {
        return nativeNotificationService.getSettings();
      }
      return { ...this.settings };
    } catch (e) {
      return {
        enabled: true,
        orderUpdates: true,
        promotions: true,
        newProducts: true,
        deliveryAlerts: true,
      };
    }
  }

  // Update notification settings
  updateSettings(newSettings: NotificationSettings): void {
    try {
      this.settings = { ...newSettings };
      this.saveSettings();

      if (isNativePlatform()) {
        nativeNotificationService.updateSettings(newSettings);
      }
    } catch (e) {
      console.error("[Notifications] Update settings error:", e);
    }
  }

  // Schedule a local notification (native only)
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    delayMinutes: number;
    data?: Record<string, any>;
  }): Promise<number | null> {
    try {
      if (!isNativePlatform()) {
        console.warn("[Notifications] Local notifications only available on native platforms");
        return null;
      }

      return await nativeNotificationService.scheduleReminder({
        title: options.title,
        body: options.body,
        delayMinutes: options.delayMinutes,
        extra: options.data,
      });
    } catch (e) {
      console.error("[Notifications] Schedule notification error:", e);
      return null;
    }
  }

  // Cancel a scheduled notification
  async cancelScheduledNotification(id: number): Promise<void> {
    try {
      if (isNativePlatform()) {
        await nativeNotificationService.cancelScheduledNotification(id);
      }
    } catch (e) {
      console.error("[Notifications] Cancel scheduled error:", e);
    }
  }

  // Show immediate local notification (native only)
  async showLocalNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    try {
      if (isNativePlatform()) {
        await nativeNotificationService.showLocalNotification({
          title,
          body,
          extra: data,
        });
      }
    } catch (e) {
      console.error("[Notifications] Show local notification error:", e);
    }
  }

  // Create a test notification
  async sendTestNotification(): Promise<void> {
    console.log("[Notifications] sendTestNotification called");

    try {
      if (isNativePlatform()) {
        await nativeNotificationService.sendTestNotification();
        return;
      }

      this.handleIncomingNotification({
        notification: {
          title: "🎉 Test Notification",
          body: "Push notifications are working! You will receive order updates here.",
        },
        data: {
          type: "general",
        },
      });
    } catch (e) {
      console.error("[Notifications] Send test notification error:", e);
    }
  }

  // Fetch notification history from backend
  private async fetchNotificationHistory(token: string): Promise<void> {
    console.log("[Notifications] Fetching notification history for token:", token.substring(0, 20) + "...");
    try {
      const url = `${BACKEND_URL}/api/notifications/history?token=${encodeURIComponent(token)}`;
      console.log("[Notifications] History URL:", url);
      const response = await fetch(url);
      console.log("[Notifications] History response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("[Notifications] History data:", data);
        if (data.success && data.notifications) {
          console.log(`[Notifications] Found ${data.notifications.length} notifications in history`);
          // Add any missing notifications to inbox
          data.notifications.forEach((notif: any) => {
            const existing = this.notifications.find(n => n.id === notif.id);
            if (!existing) {
              console.log("[Notifications] Adding notification from history:", notif.title);
              this.addNotification({
                id: notif.id,
                title: notif.title,
                body: notif.body,
                type: notif.data?.type || 'general',
                timestamp: new Date(notif.timestamp),
                read: notif.read || false,
                data: notif.data,
                imageUrl: notif.data?.imageUrl
              });
            } else {
              console.log("[Notifications] Notification already exists:", notif.title);
            }
          });
          console.log(`[Notifications] Fetched ${data.notifications.length} notifications from history`);
        } else {
          console.log("[Notifications] No notifications in history or invalid response");
        }
      } else {
        console.log("[Notifications] History fetch failed:", response.status, await response.text());
      }
    } catch (e) {
      console.error("[Notifications] History fetch error:", e);
    }
  }

  // Private methods
  private loadNotifications(): void {
    if (isNativePlatform()) return;

    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.error("[Notifications] Failed to load:", error);
    }
  }

  private saveNotifications(): void {
    if (isNativePlatform()) return;

    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error("[Notifications] Failed to save:", error);
    }
  }

  private loadFCMToken(): void {
    try {
      this.fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error("[Notifications] Failed to load FCM token:", error);
    }
  }

  private saveFCMToken(token: string): void {
    try {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error("[Notifications] Failed to save FCM token:", error);
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error("[Notifications] Failed to load settings:", error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("[Notifications] Failed to save settings:", error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.getNotifications());
      } catch (e) {
        console.error("[Notifications] Listener error:", e);
      }
    });

    // Dispatch custom event for components listening on window
    window.dispatchEvent(new CustomEvent("alclean-notification"));
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationSegment as NotificationSegmentType };
