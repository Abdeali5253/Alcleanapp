// Native Push & Local Notifications for Android using Capacitor
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from "@capacitor/push-notifications";
import {
  LocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
} from "@capacitor/local-notifications";
import { BACKEND_URL } from "./base-url";

export interface NativeNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
  imageUrl?: string;
}

const NOTIFICATIONS_STORAGE_KEY = "alclean_notifications";
const FCM_TOKEN_STORAGE_KEY = "alclean_fcm_token";
const NOTIFICATION_SETTINGS_KEY = "alclean_notification_settings";

class NativeNotificationService {
  private fcmToken: string | null = null;
  private notifications: NativeNotification[] = [];
  private listeners: ((notifications: NativeNotification[]) => void)[] = [];
  private isInitialized = false;
  private notificationIdCounter = 1;

  constructor() {
    this.loadNotifications();
    this.loadFCMToken();
  }

  // Check if running on native platform (Android/iOS)
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Initialize push notifications for Android
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (!this.isNativePlatform()) {
      console.log("[NativeNotifications] Not on native platform, skipping");
      return false;
    }

    try {
      console.log("[NativeNotifications] Initializing...");

      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      console.log("[NativeNotifications] Permission status:", permStatus);

      if (permStatus.receive !== "granted") {
        console.warn("[NativeNotifications] Permission not granted");
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Setup listeners
      this.setupPushListeners();

      // Initialize local notifications
      await this.initLocalNotifications();

      this.isInitialized = true;
      console.log("[NativeNotifications] Initialized successfully");
      return true;
    } catch (error) {
      console.error("[NativeNotifications] Initialization failed:", error);
      return false;
    }
  }

  // Setup push notification listeners
  private setupPushListeners(): void {
    // On registration success - get FCM token
    PushNotifications.addListener("registration", async (token: Token) => {
      console.log("[NativeNotifications] FCM Token:", token.value.substring(0, 30) + "...");
      this.fcmToken = token.value;
      this.saveFCMToken(token.value);
      await this.registerTokenWithBackend(token.value);
    });

    // On registration error
    PushNotifications.addListener("registrationError", (error: any) => {
      console.error("[NativeNotifications] Registration error:", error);
    });

    // On push notification received (foreground)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("[NativeNotifications] Push received:", notification);
        this.handlePushNotification(notification);
      }
    );

    // On push notification action performed (user tapped)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        console.log("[NativeNotifications] Action performed:", action);
        this.handleNotificationAction(action.notification);
      }
    );
  }

  // Initialize local notifications
  private async initLocalNotifications(): Promise<void> {
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      console.log("[LocalNotifications] Permission:", permStatus);

      // Listen for local notification actions
      LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          console.log("[LocalNotifications] Action:", action);
          // Handle local notification tap
          if (action.notification.extra) {
            this.handleNotificationData(action.notification.extra);
          }
        }
      );

      // Listen for local notifications received
      LocalNotifications.addListener(
        "localNotificationReceived",
        (notification) => {
          console.log("[LocalNotifications] Received:", notification);
        }
      );
    } catch (error) {
      console.error("[LocalNotifications] Init failed:", error);
    }
  }

  // Handle incoming push notification
  private handlePushNotification(notification: PushNotificationSchema): void {
    const nativeNotif: NativeNotification = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: notification.title || "AlClean",
      body: notification.body || "",
      type: notification.data?.type || "general",
      timestamp: Date.now(),
      read: false,
      data: notification.data,
      imageUrl: notification.data?.imageUrl,
    };

    this.addNotification(nativeNotif);

    // Show local notification for foreground push (Android shows it automatically in background)
    this.showLocalNotification({
      title: nativeNotif.title,
      body: nativeNotif.body,
      id: this.notificationIdCounter++,
      extra: notification.data,
    });

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent("alclean-notification", { detail: nativeNotif }));
  }

  // Handle notification action (user tap)
  private handleNotificationAction(notification: PushNotificationSchema): void {
    console.log("[NativeNotifications] Handling action for:", notification);
    if (notification.data) {
      this.handleNotificationData(notification.data);
    }
  }

  // Handle notification data for deep linking
  private handleNotificationData(data: Record<string, any>): void {
    // Navigate based on notification type
    if (data.orderId) {
      window.location.hash = "#/tracking";
    } else if (data.productId) {
      window.location.hash = `#/product/${data.productId}`;
    } else if (data.deepLink) {
      window.location.hash = data.deepLink;
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
        console.log("[NativeNotifications] Token registered with backend");
      } else {
        console.warn("[NativeNotifications] Backend returned:", response.status);
      }
    } catch (error) {
      console.warn("[NativeNotifications] Backend not available:", error);
    }
  }

  // Show a local notification
  async showLocalNotification(options: {
    title: string;
    body: string;
    id?: number;
    extra?: Record<string, any>;
    schedule?: { at: Date };
  }): Promise<void> {
    if (!this.isNativePlatform()) return;

    try {
      const notifId = options.id || this.notificationIdCounter++;

      const notification: LocalNotificationSchema = {
        id: notifId,
        title: options.title,
        body: options.body,
        largeBody: options.body,
        summaryText: "AlClean",
        extra: options.extra,
        smallIcon: "ic_stat_notification",
        iconColor: "#6DB33F",
        sound: "default",
        channelId: "alclean_default",
      };

      if (options.schedule) {
        // Scheduled notification
        await LocalNotifications.schedule({
          notifications: [
            {
              ...notification,
              schedule: { at: options.schedule.at },
            },
          ],
        });
        console.log("[LocalNotifications] Scheduled:", notification.title);
      } else {
        // Immediate notification
        await LocalNotifications.schedule({
          notifications: [notification],
        });
        console.log("[LocalNotifications] Shown:", notification.title);
      }
    } catch (error) {
      console.error("[LocalNotifications] Failed to show:", error);
    }
  }

  // Schedule a reminder notification
  async scheduleReminder(options: {
    title: string;
    body: string;
    delayMinutes: number;
    extra?: Record<string, any>;
  }): Promise<number> {
    const notifId = this.notificationIdCounter++;
    const scheduleTime = new Date(Date.now() + options.delayMinutes * 60 * 1000);

    await this.showLocalNotification({
      ...options,
      id: notifId,
      schedule: { at: scheduleTime },
    });

    return notifId;
  }

  // Cancel a scheduled notification
  async cancelScheduledNotification(id: number): Promise<void> {
    if (!this.isNativePlatform()) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log("[LocalNotifications] Cancelled:", id);
    } catch (error) {
      console.error("[LocalNotifications] Cancel failed:", error);
    }
  }

  // Get all pending notifications
  async getPendingNotifications(): Promise<LocalNotificationSchema[]> {
    if (!this.isNativePlatform()) return [];

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error("[LocalNotifications] Get pending failed:", error);
      return [];
    }
  }

  // Create notification channel for Android
  async createNotificationChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== "android") return;

    try {
      await LocalNotifications.createChannel({
        id: "alclean_default",
        name: "AlClean Notifications",
        description: "Order updates, promotions, and alerts",
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#6DB33F",
      });

      await LocalNotifications.createChannel({
        id: "alclean_orders",
        name: "Order Updates",
        description: "Updates about your orders",
        importance: 4,
        sound: "default",
        vibration: true,
      });

      await LocalNotifications.createChannel({
        id: "alclean_promotions",
        name: "Promotions & Offers",
        description: "Discounts and special offers",
        importance: 3, // DEFAULT
        sound: "default",
      });

      console.log("[LocalNotifications] Channels created");
    } catch (error) {
      console.error("[LocalNotifications] Channel creation failed:", error);
    }
  }

  // Add notification to local storage
  addNotification(notification: NativeNotification): void {
    this.notifications.unshift(notification);
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    this.saveNotifications();
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): NativeNotification[] {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  // Mark as read
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Subscribe to changes
  subscribe(callback: (notifications: NativeNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  // Check permission status
  async checkPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!this.isNativePlatform()) return "denied";

    try {
      const status = await PushNotifications.checkPermissions();
      if (status.receive === "granted") return "granted";
      if (status.receive === "denied") return "denied";
      return "prompt";
    } catch {
      return "denied";
    }
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    if (!this.isNativePlatform()) return false;

    try {
      const status = await PushNotifications.requestPermissions();
      return status.receive === "granted";
    } catch {
      return false;
    }
  }

  // Get FCM token
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Get settings
  getSettings() {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      enabled: true,
      orderUpdates: true,
      promotions: true,
      newProducts: true,
      deliveryAlerts: true,
    };
  }

  // Update settings
  updateSettings(settings: any): void {
    try {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("[NativeNotifications] Failed to save settings:", error);
    }
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    if (this.isNativePlatform()) {
      await this.showLocalNotification({
        title: "🎉 Test Notification",
        body: "Push notifications are working! You will receive order updates here.",
        extra: { type: "general" },
      });
    }

    // Also add to inbox
    this.addNotification({
      id: `test_${Date.now()}`,
      title: "🎉 Test Notification",
      body: "Push notifications are working! You will receive order updates here.",
      type: "general",
      timestamp: Date.now(),
      read: false,
    });
  }

  // Private methods
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error("[NativeNotifications] Failed to load:", error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error("[NativeNotifications] Failed to save:", error);
    }
  }

  private loadFCMToken(): void {
    try {
      this.fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    } catch {}
  }

  private saveFCMToken(token: string): void {
    try {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch {}
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.getNotifications()));
  }
}

// Export singleton instance
export const nativeNotificationService = new NativeNotificationService();
