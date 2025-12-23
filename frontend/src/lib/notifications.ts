// Unified Notification Service for AlClean App
// Supports Web (Firebase) and Native (Capacitor) notifications

import { Capacitor } from "@capacitor/core";
import { nativeNotificationService, NativeNotification } from "./native-notifications";
import {
  initializeFirebase,
  requestNotificationPermission as requestWebPermission,
  onForegroundMessage,
} from "./firebase-config";
import { BACKEND_URL } from "./base-url";

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
const isAndroid = () => Capacitor.getPlatform() === "android";
const isIOS = () => Capacitor.getPlatform() === "ios";

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
    this.loadNotifications();
    this.loadFCMToken();
    this.loadSettings();
  }

  // Initialize notification service (auto-detects platform)
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log("[Notifications] Initializing...");
      console.log("[Notifications] Platform:", Capacitor.getPlatform());

      // Use native notifications on Android/iOS
      if (isNativePlatform()) {
        console.log("[Notifications] Using native notifications");
        const success = await nativeNotificationService.initialize();

        if (success) {
          // Create notification channels on Android
          await nativeNotificationService.createNotificationChannel();

          // Sync token
          this.fcmToken = nativeNotificationService.getFCMToken();
          if (this.fcmToken) {
            this.saveFCMToken(this.fcmToken);
          }

          // Subscribe to native notification changes
          nativeNotificationService.subscribe((nativeNotifs) => {
            this.syncFromNativeNotifications(nativeNotifs);
          });
        }

        this.isInitialized = true;
        return success;
      }

      // Use web notifications
      console.log("[Notifications] Using web notifications");

      // Initialize Firebase
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) {
        console.warn("[Notifications] Firebase not available");
        this.isInitialized = true;
        return false;
      }

      // Request notification permission and get token
      const token = await requestWebPermission();
      if (token) {
        this.fcmToken = token;
        this.saveFCMToken(token);
        await this.registerTokenWithBackend(token);
      }

      // Listen for foreground messages
      onForegroundMessage((payload) => {
        this.handleIncomingNotification(payload);
      });

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
      console.log("[Notifications] Backend not available, will retry later");
    }
  }

  // Handle incoming web notification
  private handleIncomingNotification(payload: any): void {
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
  }

  // Add notification to list
  addNotification(notification: PushNotification): void {
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
  }

  // Get all notifications
  getNotifications(): PushNotification[] {
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
  }

  // Get unread count
  getUnreadCount(): number {
    if (isNativePlatform()) {
      return nativeNotificationService.getUnreadCount();
    }
    return this.notifications.filter((n) => !n.read).length;
  }

  // Mark notification as read
  markAsRead(id: string): void {
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
  }

  // Mark all as read
  markAllAsRead(): void {
    if (isNativePlatform()) {
      nativeNotificationService.markAllAsRead();
      return;
    }

    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id: string): void {
    if (isNativePlatform()) {
      nativeNotificationService.deleteNotification(id);
      return;
    }

    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll(): void {
    if (isNativePlatform()) {
      nativeNotificationService.clearAll();
      return;
    }

    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
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
    if (isNativePlatform()) {
      const status = await nativeNotificationService.checkPermission();
      return status === "prompt" ? "default" : status;
    }

    if (!hasWebNotificationApi()) return "denied";
    return Notification.permission;
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    if (isNativePlatform()) {
      const granted = await nativeNotificationService.requestPermission();
      if (granted) {
        // Re-initialize to get token
        await nativeNotificationService.initialize();
        this.fcmToken = nativeNotificationService.getFCMToken();
        if (this.fcmToken) {
          this.saveFCMToken(this.fcmToken);
        }
      }
      return granted;
    }

    if (!hasWebNotificationApi()) return false;

    const permission = await Notification.requestPermission();

    if (permission === "granted" && !this.fcmToken) {
      const token = await requestWebPermission();
      if (token) {
        this.fcmToken = token;
        this.saveFCMToken(token);
        await this.registerTokenWithBackend(token);
      }
    }

    return permission === "granted";
  }

  // Get FCM token
  getFCMToken(): string | null {
    if (isNativePlatform()) {
      return nativeNotificationService.getFCMToken();
    }
    return this.fcmToken;
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    if (isNativePlatform()) {
      return nativeNotificationService.getSettings();
    }
    return { ...this.settings };
  }

  // Update notification settings
  updateSettings(newSettings: NotificationSettings): void {
    this.settings = { ...newSettings };
    this.saveSettings();

    if (isNativePlatform()) {
      nativeNotificationService.updateSettings(newSettings);
    }
  }

  // Schedule a local notification (native only)
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    delayMinutes: number;
    data?: Record<string, any>;
  }): Promise<number | null> {
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
  }

  // Cancel a scheduled notification
  async cancelScheduledNotification(id: number): Promise<void> {
    if (isNativePlatform()) {
      await nativeNotificationService.cancelScheduledNotification(id);
    }
  }

  // Show immediate local notification (native only)
  async showLocalNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    if (isNativePlatform()) {
      await nativeNotificationService.showLocalNotification({
        title,
        body,
        extra: data,
      });
    }
  }

  // Create a test notification
  async sendTestNotification(): Promise<void> {
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
  }

  // Private methods
  private loadNotifications(): void {
    if (isNativePlatform()) return; // Native service handles its own storage

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
    this.listeners.forEach((callback) => callback(this.getNotifications()));
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationSegment as NotificationSegmentType };
