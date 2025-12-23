// Native Push & Local Notifications for Android using Capacitor
// With enhanced logging for Android Studio debugging

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
} from "@capacitor/local-notifications";
import { BACKEND_URL } from "./base-url";

// Enhanced logging function
const log = (tag: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}][${tag}] ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
};

const logError = (tag: string, message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}][${tag}][ERROR] ${message}`, error || '');
};

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
    log("NativeNotif", "Service constructor called");
    log("NativeNotif", `Platform: ${Capacitor.getPlatform()}`);
    log("NativeNotif", `Is Native: ${Capacitor.isNativePlatform()}`);
    this.loadNotifications();
    this.loadFCMToken();
  }

  // Check if running on native platform (Android/iOS)
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Initialize push notifications for Android
  async initialize(): Promise<boolean> {
    log("NativeNotif", "Initialize called", { isInitialized: this.isInitialized });
    
    if (this.isInitialized) {
      log("NativeNotif", "Already initialized, skipping");
      return true;
    }
    
    if (!this.isNativePlatform()) {
      log("NativeNotif", "Not on native platform, skipping initialization");
      return false;
    }

    try {
      log("NativeNotif", "Starting initialization...");

      // Check current permission status
      const currentStatus = await PushNotifications.checkPermissions();
      log("NativeNotif", "Current permission status", currentStatus);

      // Request permission
      log("NativeNotif", "Requesting permissions...");
      const permStatus = await PushNotifications.requestPermissions();
      log("NativeNotif", "Permission result", permStatus);

      if (permStatus.receive !== "granted") {
        logError("NativeNotif", "Permission not granted", permStatus);
        return false;
      }

      // Register for push notifications
      log("NativeNotif", "Registering for push notifications...");
      await PushNotifications.register();
      log("NativeNotif", "Registration requested");

      // Setup listeners
      this.setupPushListeners();

      // Initialize local notifications
      await this.initLocalNotifications();

      this.isInitialized = true;
      log("NativeNotif", "Initialization complete!");
      return true;
    } catch (error) {
      logError("NativeNotif", "Initialization failed", error);
      return false;
    }
  }

  // Setup push notification listeners
  private setupPushListeners(): void {
    log("NativeNotif", "Setting up push listeners...");

    // On registration success - get FCM token
    PushNotifications.addListener("registration", async (token: Token) => {
      log("NativeNotif", "FCM Token received", { 
        token: token.value.substring(0, 50) + "...",
        fullLength: token.value.length 
      });
      this.fcmToken = token.value;
      this.saveFCMToken(token.value);
      await this.registerTokenWithBackend(token.value);
    });

    // On registration error
    PushNotifications.addListener("registrationError", (error: any) => {
      logError("NativeNotif", "Registration error", error);
    });

    // On push notification received (foreground)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        log("NativeNotif", "Push notification received (foreground)", notification);
        this.handlePushNotification(notification);
      }
    );

    // On push notification action performed (user tapped)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        log("NativeNotif", "Notification action performed", action);
        this.handleNotificationAction(action.notification);
      }
    );

    log("NativeNotif", "Push listeners setup complete");
  }

  // Initialize local notifications
  private async initLocalNotifications(): Promise<void> {
    log("LocalNotif", "Initializing local notifications...");
    
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      log("LocalNotif", "Permission status", permStatus);

      // Listen for local notification actions
      LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          log("LocalNotif", "Action performed", action);
          if (action.notification.extra) {
            this.handleNotificationData(action.notification.extra);
          }
        }
      );

      // Listen for local notifications received
      LocalNotifications.addListener(
        "localNotificationReceived",
        (notification) => {
          log("LocalNotif", "Notification received", notification);
        }
      );

      log("LocalNotif", "Local notifications initialized");
    } catch (error) {
      logError("LocalNotif", "Initialization failed", error);
    }
  }

  // Handle incoming push notification
  private handlePushNotification(notification: PushNotificationSchema): void {
    log("NativeNotif", "Handling push notification", notification);
    
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

    // Show local notification for foreground push
    this.showLocalNotification({
      title: nativeNotif.title,
      body: nativeNotif.body,
      id: this.notificationIdCounter++,
      extra: notification.data,
    });

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent("alclean-notification", { detail: nativeNotif }));
    log("NativeNotif", "Push notification handled and stored");
  }

  // Handle notification action (user tap)
  private handleNotificationAction(notification: PushNotificationSchema): void {
    log("NativeNotif", "Handling notification action", notification);
    if (notification.data) {
      this.handleNotificationData(notification.data);
    }
  }

  // Handle notification data for deep linking
  private handleNotificationData(data: Record<string, any>): void {
    log("NativeNotif", "Handling notification data for deep linking", data);
    
    if (data.orderId) {
      log("NativeNotif", "Navigating to tracking");
      window.location.hash = "#/tracking";
    } else if (data.productId) {
      log("NativeNotif", `Navigating to product: ${data.productId}`);
      window.location.hash = `#/product/${data.productId}`;
    } else if (data.deepLink) {
      log("NativeNotif", `Navigating to deep link: ${data.deepLink}`);
      window.location.hash = data.deepLink;
    }
  }

  // Register FCM token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    log("NativeNotif", "Registering token with backend...");
    
    try {
      const payload = {
        token,
        platform: Capacitor.getPlatform(),
        timestamp: new Date().toISOString(),
      };
      log("NativeNotif", "Registration payload", { ...payload, token: token.substring(0, 30) + "..." });

      const response = await fetch(`${BACKEND_URL}/api/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      log("NativeNotif", "Backend registration response", result);

      if (response.ok) {
        log("NativeNotif", "Token registered successfully with backend");
      } else {
        logError("NativeNotif", "Backend registration failed", result);
      }
    } catch (error) {
      logError("NativeNotif", "Backend registration error", error);
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
    if (!this.isNativePlatform()) {
      log("LocalNotif", "Not on native platform, skipping");
      return;
    }

    try {
      const notifId = options.id || this.notificationIdCounter++;
      log("LocalNotif", "Showing notification", { id: notifId, title: options.title });

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
        log("LocalNotif", "Scheduling notification for", options.schedule.at);
        await LocalNotifications.schedule({
          notifications: [
            {
              ...notification,
              schedule: { at: options.schedule.at },
            },
          ],
        });
        log("LocalNotif", "Notification scheduled");
      } else {
        await LocalNotifications.schedule({
          notifications: [notification],
        });
        log("LocalNotif", "Notification shown immediately");
      }
    } catch (error) {
      logError("LocalNotif", "Failed to show notification", error);
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
    
    log("LocalNotif", "Scheduling reminder", { 
      id: notifId, 
      title: options.title, 
      delayMinutes: options.delayMinutes,
      scheduleTime: scheduleTime.toISOString()
    });

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
      log("LocalNotif", "Cancelling notification", { id });
      await LocalNotifications.cancel({ notifications: [{ id }] });
      log("LocalNotif", "Notification cancelled");
    } catch (error) {
      logError("LocalNotif", "Cancel failed", error);
    }
  }

  // Get all pending notifications
  async getPendingNotifications(): Promise<LocalNotificationSchema[]> {
    if (!this.isNativePlatform()) return [];

    try {
      const result = await LocalNotifications.getPending();
      log("LocalNotif", "Pending notifications", result);
      return result.notifications;
    } catch (error) {
      logError("LocalNotif", "Get pending failed", error);
      return [];
    }
  }

  // Create notification channel for Android
  async createNotificationChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== "android") {
      log("LocalNotif", "Not Android, skipping channel creation");
      return;
    }

    try {
      log("LocalNotif", "Creating notification channels...");
      
      await LocalNotifications.createChannel({
        id: "alclean_default",
        name: "AlClean Notifications",
        description: "Order updates, promotions, and alerts",
        importance: 4,
        visibility: 1,
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
        importance: 3,
        sound: "default",
      });

      log("LocalNotif", "Notification channels created successfully");
    } catch (error) {
      logError("LocalNotif", "Channel creation failed", error);
    }
  }

  // Add notification to local storage
  addNotification(notification: NativeNotification): void {
    log("NativeNotif", "Adding notification to storage", { id: notification.id, title: notification.title });
    this.notifications.unshift(notification);
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
      log("NativeNotif", "Check permission result", status);
      if (status.receive === "granted") return "granted";
      if (status.receive === "denied") return "denied";
      return "prompt";
    } catch (error) {
      logError("NativeNotif", "Check permission failed", error);
      return "denied";
    }
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    if (!this.isNativePlatform()) return false;

    try {
      log("NativeNotif", "Requesting permission...");
      const status = await PushNotifications.requestPermissions();
      log("NativeNotif", "Permission request result", status);
      return status.receive === "granted";
    } catch (error) {
      logError("NativeNotif", "Request permission failed", error);
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
      log("NativeNotif", "Settings updated", settings);
    } catch (error) {
      logError("NativeNotif", "Failed to save settings", error);
    }
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    log("NativeNotif", "Sending test notification...");
    
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
    
    log("NativeNotif", "Test notification sent");
  }

  // Private methods
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
        log("NativeNotif", `Loaded ${this.notifications.length} notifications from storage`);
      }
    } catch (error) {
      logError("NativeNotif", "Failed to load notifications", error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      logError("NativeNotif", "Failed to save notifications", error);
    }
  }

  private loadFCMToken(): void {
    try {
      this.fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
      if (this.fcmToken) {
        log("NativeNotif", "Loaded FCM token from storage");
      }
    } catch {}
  }

  private saveFCMToken(token: string): void {
    try {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      log("NativeNotif", "FCM token saved to storage");
    } catch {}
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.getNotifications()));
  }
}

// Export singleton instance
export const nativeNotificationService = new NativeNotificationService();
