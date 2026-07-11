// Native Push & Local Notifications for Android and iOS using Capacitor
// With defensive error handling to prevent crashes

import { Capacitor } from "@capacitor/core";
import { BACKEND_URL } from "./base-url";

const shouldLog = import.meta.env.DEV;

// Enhanced logging function
const log = (tag: string, message: string, data?: any) => {
  if (!shouldLog) return;
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}][${tag}] ${message}`;

  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
};

const logError = (tag: string, message: string, error?: any) => {
  if (!shouldLog) return;
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}][${tag}][ERROR] ${message}`, error || "");
};

// Safe dynamic imports to prevent crashes if plugins are not available
let FirebaseMessaging: any = null;
let LocalNotifications: any = null;

const loadPlugins = async () => {
  try {
    const messagingModule = await import("@capacitor-firebase/messaging");
    FirebaseMessaging = messagingModule.FirebaseMessaging;
    log("NativeNotif", "FirebaseMessaging plugin loaded");
  } catch (e) {
    logError("NativeNotif", "Failed to load FirebaseMessaging plugin", e);
  }

  try {
    const localModule = await import("@capacitor/local-notifications");
    LocalNotifications = localModule.LocalNotifications;
    log("NativeNotif", "LocalNotifications plugin loaded");
  } catch (e) {
    logError("NativeNotif", "Failed to load LocalNotifications plugin", e);
  }
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
  private tokenListeners: ((token: string) => void)[] = [];
  private isInitialized = false;
  private notificationIdCounter = 1;
  private pluginsLoaded = false;
  private readonly duplicateWindowMs = 10 * 60 * 1000;
  private localListenersAttached = false;

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

  // Load plugins safely
  private async ensurePluginsLoaded(): Promise<boolean> {
    if (this.pluginsLoaded) return true;

    try {
      await loadPlugins();
      this.pluginsLoaded = true;
      return true;
    } catch (e) {
      logError("NativeNotif", "Failed to load plugins", e);
      return false;
    }
  }

  // Initialize push notifications for Android
  async initialize(): Promise<boolean> {
    log("NativeNotif", "Initialize called", {
      isInitialized: this.isInitialized,
    });

    if (this.isInitialized) {
      log("NativeNotif", "Already initialized, skipping");
      return true;
    }

    if (!this.isNativePlatform()) {
      log("NativeNotif", "Not on native platform, skipping initialization");
      this.isInitialized = true;
      return false;
    }

    try {
      log("NativeNotif", "Starting initialization...");

      // Load plugins first
      const pluginsOk = await this.ensurePluginsLoaded();
      if (!pluginsOk || !FirebaseMessaging) {
        logError("NativeNotif", "Plugins not available");
        this.isInitialized = true;
        return false;
      }

      // Check current permission status
      try {
        const currentStatus = await FirebaseMessaging.checkPermissions();
        log("NativeNotif", "Current permission status", currentStatus);

        // Setup listeners BEFORE registering
        await this.setupPushListeners();

        if (currentStatus.receive === "granted") {
          // Already granted, register to get token
          log(
            "NativeNotif",
            "Permission already granted, registering for push...",
          );
          try {
            await this.refreshFCMToken();
            log("NativeNotif", "FCM token requested");
          } catch (regError) {
            logError("NativeNotif", "Registration failed", regError);
          }
        } else {
          // Permission is prompt or denied - don't auto-request, let user trigger it
          log("NativeNotif", "Permission status:", currentStatus.receive);
        }
      } catch (e) {
        logError("NativeNotif", "Failed to check permissions", e);
        await this.setupPushListeners();
      }

      // Initialize local notifications (non-blocking)
      this.initLocalNotifications().catch((e) => {
        logError(
          "NativeNotif",
          "Local notifications init failed (non-blocking)",
          e,
        );
      });

      this.isInitialized = true;
      log("NativeNotif", "Initialization complete!");
      return true;
    } catch (error) {
      logError("NativeNotif", "Initialization failed", error);
      this.isInitialized = true;
      return false;
    }
  }

  // Request permission and register (separate from initialize)
  async registerForPush(): Promise<boolean> {
    log("NativeNotif", "registerForPush called");

    if (!this.isNativePlatform()) {
      log("NativeNotif", "Not native platform, skipping");
      return false;
    }

    try {
      // Ensure plugins are loaded
      log("NativeNotif", "Ensuring plugins loaded...");
      const pluginsLoaded = await this.ensurePluginsLoaded();
      if (!pluginsLoaded) {
        logError("NativeNotif", "Failed to load plugins");
        return false;
      }

      if (!FirebaseMessaging) {
        logError("NativeNotif", "FirebaseMessaging plugin not available");
        return false;
      }

      // Step 1: Request permission with timeout protection
      log("NativeNotif", "Step 1: Requesting permissions...");
      let permStatus: any = null;

      try {
        // Create a promise that times out after 30 seconds
        const permPromise = FirebaseMessaging.requestPermissions();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Permission request timeout")),
            30000,
          );
        });

        permStatus = await Promise.race([permPromise, timeoutPromise]);
        log("NativeNotif", "Permission result", permStatus);
      } catch (permError: any) {
        logError(
          "NativeNotif",
          "Permission request failed",
          permError?.message || permError,
        );
        return false;
      }

      if (!permStatus || permStatus.receive !== "granted") {
        log("NativeNotif", "Permission not granted", permStatus);
        return false;
      }

      // Step 2: Request the Firebase registration token.
      log("NativeNotif", "Step 2: Requesting FCM token...");
      try {
        await this.setupPushListeners();
        return await this.refreshFCMToken();
      } catch (regError: any) {
        logError(
          "NativeNotif",
          "Registration call failed",
          regError?.message || regError,
        );
        return false;
      }
    } catch (error: any) {
      logError(
        "NativeNotif",
        "registerForPush failed",
        error?.message || error,
      );
      return false;
    }
  }

  // Setup push notification listeners
  private listenersAttached = false;

  private async acceptFCMToken(token: string): Promise<void> {
    this.fcmToken = token;
    this.saveFCMToken(token);
    await this.registerTokenWithBackend(token);
    this.tokenListeners.forEach((listener) => {
      try {
        listener(token);
      } catch (error) {
        logError("NativeNotif", "Token listener error", error);
      }
    });
  }

  private async refreshFCMToken(): Promise<boolean> {
    if (!FirebaseMessaging) return false;

    try {
      const result = await FirebaseMessaging.getToken();
      if (!result?.token) {
        logError("NativeNotif", "Firebase Messaging returned no FCM token");
        return false;
      }
      await this.acceptFCMToken(result.token);
      return true;
    } catch (error) {
      logError("NativeNotif", "Failed to retrieve FCM token", error);
      return false;
    }
  }

  private async setupPushListeners(): Promise<void> {
    if (!FirebaseMessaging) {
      log("NativeNotif", "Cannot setup listeners - plugin not loaded");
      return;
    }

    if (this.listenersAttached) {
      log("NativeNotif", "Listeners already attached, skipping");
      return;
    }

    log("NativeNotif", "Setting up push listeners...");

    try {
      // Remove all existing listeners first to be safe
      await FirebaseMessaging.removeAllListeners();

      FirebaseMessaging.addListener("tokenReceived", async (event: any) => {
        try {
          const token = event?.token;
          if (!token) return;
          log("NativeNotif", "FCM Token received", {
            token: token.substring(0, 50) + "...",
            fullLength: token.length,
          });
          await this.acceptFCMToken(token);
        } catch (e) {
          logError("NativeNotif", "Error in registration listener", e);
        }
      });

      // On push notification received (foreground)
      FirebaseMessaging.addListener(
        "notificationReceived",
        (event: any) => {
          try {
            const notification = event?.notification || event;
            log("NativeNotif", "🔔 PUSH NOTIFICATION RECEIVED (foreground)", {
              title: notification?.title,
              body: notification?.body,
              data: notification?.data,
              fullNotification: notification,
            });
            this.handlePushNotification(notification);
          } catch (e) {
            logError("NativeNotif", "Error handling push notification", e);
          }
        },
      );

      // On push notification action performed (user tapped)
      FirebaseMessaging.addListener(
        "notificationActionPerformed",
        (action: any) => {
          try {
            log("NativeNotif", "👆 NOTIFICATION ACTION PERFORMED (tapped)", {
              action: action,
              notification: action?.notification,
            });
            this.handleNotificationAction(action.notification);
          } catch (e) {
            logError("NativeNotif", "Error handling notification action", e);
          }
        },
      );

      this.listenersAttached = true;
      log("NativeNotif", "Push listeners setup complete");
    } catch (e) {
      logError("NativeNotif", "Failed to setup push listeners", e);
    }
  }

  // Initialize local notifications
  private async initLocalNotifications(): Promise<void> {
    if (!LocalNotifications) {
      log("LocalNotif", "Plugin not available, skipping");
      return;
    }

    log("LocalNotif", "Initializing local notifications...");

    try {
      await this.attachLocalNotificationListeners();

      if (Capacitor.getPlatform() === "android") {
        const permStatus = await LocalNotifications.requestPermissions();
        log("LocalNotif", "Permission status", permStatus);
      } else {
        log(
          "LocalNotif",
          "Skipping eager local notification permission request on iOS",
        );
      }

      log("LocalNotif", "Local notifications initialized");
    } catch (error) {
      logError("LocalNotif", "Initialization failed", error);
    }
  }

  private async attachLocalNotificationListeners(): Promise<void> {
    if (!LocalNotifications || this.localListenersAttached) {
      return;
    }

    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action: any) => {
        try {
          log("LocalNotif", "Action performed", action);
          if (action.notification?.extra) {
            this.handleNotificationData(action.notification.extra);
          }
        } catch (e) {
          logError("LocalNotif", "Error in action listener", e);
        }
      },
    );

    LocalNotifications.addListener(
      "localNotificationReceived",
      (notification: any) => {
        log("LocalNotif", "Notification received", notification);
      },
    );

    this.localListenersAttached = true;
  }

  private async requestLocalNotificationPermissionIfNeeded(): Promise<void> {
    if (!LocalNotifications) return;

    try {
      await this.attachLocalNotificationListeners();

      if (Capacitor.getPlatform() !== "ios") {
        return;
      }

      const currentStatus = await LocalNotifications.checkPermissions();
      log("LocalNotif", "Current iOS local notification permission", currentStatus);

      if (currentStatus.display === "granted") {
        return;
      }

      const updatedStatus = await LocalNotifications.requestPermissions();
      log("LocalNotif", "Updated iOS local notification permission", updatedStatus);
    } catch (error) {
      logError("LocalNotif", "Failed requesting iOS local permission", error);
    }
  }

  // Handle incoming push notification
  private handlePushNotification(notification: any): void {
    log("NativeNotif", "Handling push notification", notification);

    // Handle FCM structure where title/body might be in notification.notification
    const title =
      notification?.notification?.title || notification?.title || "AlClean";
    const body = notification?.notification?.body || notification?.body || "";
    const imageUrl =
      notification?.notification?.image || notification?.data?.imageUrl;

    const nativeNotif: NativeNotification = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      type: notification?.data?.type || "general",
      timestamp: Date.now(),
      read: false,
      data: notification?.data,
      imageUrl,
    };

    this.addNotification(nativeNotif);

    // Store in backend for history
    this.storeReceivedNotificationInBackend(nativeNotif).catch((e) => {
      logError(
        "NativeNotif",
        "Failed to store received notification in backend",
        e,
      );
    });

    // Show local notification for foreground push (Android popup)
    this.showLocalNotification({
      title: nativeNotif.title,
      body: nativeNotif.body,
      id: Math.floor(Math.random() * 100000), // Random ID to prevent overwriting
      extra: notification?.data,
    }).catch((e) =>
      logError("NativeNotif", "Failed to show local notification", e),
    );

    // Dispatch event for UI updates - SPECIFIC TO TOAST
    try {
      console.log(
        "[NativeNotif] Dispatching alclean-notification-toast for:",
        nativeNotif.title,
      );
      window.dispatchEvent(
        new CustomEvent("alclean-notification-toast", { detail: nativeNotif }),
      );

      // Also dispatch generic event for inbox refresh
      window.dispatchEvent(new CustomEvent("alclean-notification"));
    } catch (e) {
      logError("NativeNotif", "Failed to dispatch event", e);
    }

    log("NativeNotif", "Push notification handled and stored");
  }

  // Handle notification action (user tap)
  private handleNotificationAction(notification: any): void {
    log("NativeNotif", "Handling notification action", notification);

    // For background notifications, add to inbox when user taps
    if (notification) {
      // Use data from FCM payload first (includes title/body from backend), then fall back to notification object
      const title =
        notification?.data?.title ||
        notification?.notification?.title ||
        notification?.title ||
        "New Notification";
      const body =
        notification?.data?.body ||
        notification?.notification?.body ||
        notification?.body ||
        "You have a new notification";
      const imageUrl =
        notification?.data?.imageUrl ||
        notification?.notification?.image ||
        notification?.data?.imageUrl;

      const nativeNotif: NativeNotification = {
        id: `tapped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        body,
        type: notification?.data?.type || "general",
        timestamp: notification?.data?.timestamp
          ? new Date(notification.data.timestamp).getTime()
          : Date.now(),
        read: false,
        data: notification?.data,
        imageUrl,
      };

      this.addNotification(nativeNotif);

      // Store in backend for history
      this.storeReceivedNotificationInBackend(nativeNotif).catch((e) => {
        logError(
          "NativeNotif",
          "Failed to store tapped notification in backend",
          e,
        );
      });

      log("NativeNotif", "Added tapped notification to inbox", { title, body });
    }

    if (notification?.data) {
      this.handleNotificationData(notification.data);
    }
  }

  // Handle notification data for deep linking
  private handleNotificationData(data: Record<string, any>): void {
    log("NativeNotif", "Handling notification data for deep linking", data);

    try {
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
    } catch (e) {
      logError("NativeNotif", "Failed to handle deep link", e);
    }
  }

  // Register FCM token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    if (!token) {
      logError("NativeNotif", "No token to register");
      return;
    }

    log("NativeNotif", "Registering token with backend...");

    try {
      const payload = {
        token,
        platform: Capacitor.getPlatform(),
        timestamp: new Date().toISOString(),
      };
      log("NativeNotif", "Registration payload prepared", {
        platform: payload.platform,
        timestamp: payload.timestamp,
      });

      const backendUrl = BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        log("NativeNotif", "Backend registration response", result);
        log("NativeNotif", "Token registered successfully with backend");
      } else {
        logError(
          "NativeNotif",
          `Backend registration failed: ${response.status}`,
        );
      }
    } catch (error) {
      logError(
        "NativeNotif",
        "Backend registration error (backend may be offline)",
        error,
      );
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

    if (!LocalNotifications) {
      log("LocalNotif", "Plugin not available, skipping");
      return;
    }

    try {
      const notifId = options.id || this.notificationIdCounter++;
      log("LocalNotif", "Showing notification", {
        id: notifId,
        title: options.title,
      });

      const notification: any = {
        id: notifId,
        title: options.title,
        body: options.body,
        largeBody: options.body,
        summaryText: "AlClean",
        extra: options.extra,
        iconColor: "#6DB33F",
        sound: "default",
        channelId: "alclean_high_priority_v1", // Using a fresh channel ID
        allowHtml: true,
        smallIcon: "ic_stat_notification",
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
    const scheduleTime = new Date(
      Date.now() + options.delayMinutes * 60 * 1000,
    );

    log("LocalNotif", "Scheduling reminder", {
      id: notifId,
      title: options.title,
      delayMinutes: options.delayMinutes,
      scheduleTime: scheduleTime.toISOString(),
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
    if (!this.isNativePlatform() || !LocalNotifications) return;

    try {
      log("LocalNotif", "Cancelling notification", { id });
      await LocalNotifications.cancel({ notifications: [{ id }] });
      log("LocalNotif", "Notification cancelled");
    } catch (error) {
      logError("LocalNotif", "Cancel failed", error);
    }
  }

  // Get all pending notifications
  async getPendingNotifications(): Promise<any[]> {
    if (!this.isNativePlatform() || !LocalNotifications) return [];

    try {
      const result = await LocalNotifications.getPending();
      log("LocalNotif", "Pending notifications", result);
      return result.notifications || [];
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

    if (!LocalNotifications) {
      log("LocalNotif", "Plugin not available, skipping channel creation");
      return;
    }

    try {
      log("LocalNotif", "Creating notification channels...");

      await LocalNotifications.createChannel({
        id: "alclean_high_priority_v1",
        name: "Urgent Updates",
        description:
          "Important AlClean notifications that pop up even if app is open",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#6DB33F",
      });

      await LocalNotifications.createChannel({
        id: "alclean_default",
        name: "Standard Notifications",
        description: "General AlClean notifications",
        importance: 3,
        visibility: 1,
        sound: "default",
        vibration: true,
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
    const existing = this.notifications.find((current) => {
      const sameContent =
        current.title === notification.title &&
        current.body === notification.body &&
        current.type === notification.type &&
        (current.data?.orderId || "") === (notification.data?.orderId || "") &&
        (current.data?.productId || "") ===
          (notification.data?.productId || "") &&
        (current.data?.deepLink || "") ===
          (notification.data?.deepLink || "") &&
        (current.imageUrl || "") === (notification.imageUrl || "");

      if (!sameContent) {
        return false;
      }

      return (
        Math.abs(current.timestamp - notification.timestamp) <
        this.duplicateWindowMs
      );
    });

    if (existing) {
      if (notification.read && !existing.read) {
        existing.read = true;
        this.saveNotifications();
        this.notifyListeners();
      }
      return;
    }

    log("NativeNotif", "Adding notification to storage", {
      id: notification.id,
      title: notification.title,
    });
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
  subscribe(
    callback: (notifications: NativeNotification[]) => void,
  ): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  // Subscribe to token changes
  subscribeToToken(callback: (token: string) => void): () => void {
    this.tokenListeners.push(callback);
    return () => {
      this.tokenListeners = this.tokenListeners.filter((l) => l !== callback);
    };
  }

  // Check permission status
  async checkPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!this.isNativePlatform()) return "denied";

    try {
      await this.ensurePluginsLoaded();
      if (!FirebaseMessaging) return "denied";

      const status = await FirebaseMessaging.checkPermissions();
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

      // Make sure we're initialized first
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Then register for push
      const result = await this.registerForPush();
      if (result) {
        await this.requestLocalNotificationPermissionIfNeeded();
      }
      log("NativeNotif", "Permission request result", { result });
      return result;
    } catch (error) {
      logError("NativeNotif", "Request permission failed", error);
      return false;
    }
  }

  // Get FCM token
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Try to register if permission is granted but no token
  async tryRegisterIfPermitted(): Promise<boolean> {
    if (!this.isNativePlatform()) return false;
    try {
      await this.ensurePluginsLoaded();
      if (!FirebaseMessaging) return false;

      const status = await FirebaseMessaging.checkPermissions();
      log("NativeNotif", "tryRegisterIfPermitted - Permission status:", status);

      if (status.receive === "granted") {
        log("NativeNotif", "Permission is granted, refreshing FCM token...");
        await this.setupPushListeners();
        return await this.refreshFCMToken();
      }

      return false;
    } catch (e) {
      logError("NativeNotif", "tryRegisterIfPermitted failed", e);
      return false;
    }
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

  // Store received notification in backend for history
  private async storeReceivedNotificationInBackend(
    notification: NativeNotification,
  ): Promise<void> {
    if (!this.fcmToken) {
      log("NativeNotif", "No FCM token available, skipping backend storage");
      return;
    }

    try {
      const backendUrl = BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/notifications/store-received`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: this.fcmToken,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            timestamp: new Date(notification.timestamp).toISOString(),
          }),
        },
      );

      if (response.ok) {
        log("NativeNotif", "Notification stored in backend successfully");
      } else {
        logError(
          "NativeNotif",
          `Failed to store notification in backend: ${response.status}`,
        );
      }
    } catch (error: any) {
      logError(
        "NativeNotif",
        "Error storing notification in backend",
        error?.message || error,
      );
    }
  }

  // Private methods
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
        log(
          "NativeNotif",
          `Loaded ${this.notifications.length} notifications from storage`,
        );
      }
    } catch (error) {
      logError("NativeNotif", "Failed to load notifications", error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(this.notifications),
      );
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
    this.listeners.forEach((callback) => {
      try {
        callback(this.getNotifications());
      } catch (e) {
        logError("NativeNotif", "Listener callback failed", e);
      }
    });
  }
}

// Export singleton instance
export const nativeNotificationService = new NativeNotificationService();
