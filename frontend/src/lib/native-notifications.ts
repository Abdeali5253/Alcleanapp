// Native Push & Local Notifications for Android and iOS using Capacitor
// With defensive error handling to prevent crashes

import { Capacitor } from "@capacitor/core";

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

// Safe dynamic imports to prevent crashes if plugins are not available
let PushNotifications: any = null;
let LocalNotifications: any = null;

const loadPlugins = async () => {
  try {
    const pushModule = await import("@capacitor/push-notifications");
    PushNotifications = pushModule.PushNotifications;
    log("NativeNotif", "PushNotifications plugin loaded");
  } catch (e) {
    logError("NativeNotif", "Failed to load PushNotifications plugin", e);
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
    log("NativeNotif", "Initialize called", { isInitialized: this.isInitialized });
    
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
      if (!pluginsOk || !PushNotifications) {
        logError("NativeNotif", "Plugins not available");
        this.isInitialized = true;
        return false;
      }

      // Check current permission status
      try {
        const currentStatus = await PushNotifications.checkPermissions();
        log("NativeNotif", "Current permission status", currentStatus);
        
        // Setup listeners BEFORE registering
        this.setupPushListeners();
        
        if (currentStatus.receive === "granted") {
          // Already granted, register to get token
          log("NativeNotif", "Permission already granted, registering for push...");
          try {
            await PushNotifications.register();
            log("NativeNotif", "Registration requested");
          } catch (regError) {
            logError("NativeNotif", "Registration failed", regError);
          }
        } else {
          // Permission is prompt or denied - don't auto-request, let user trigger it
          log("NativeNotif", "Permission status:", currentStatus.receive);
        }
      } catch (e) {
        logError("NativeNotif", "Failed to check permissions", e);
        this.setupPushListeners();
      }

      // Initialize local notifications (non-blocking)
      this.initLocalNotifications().catch(e => {
        logError("NativeNotif", "Local notifications init failed (non-blocking)", e);
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

    // If we already have a token, no need to register again
    if (this.fcmToken) {
      log("NativeNotif", "Already have FCM token, skipping registration");
      return true;
    }

    try {
      // Ensure plugins are loaded
      log("NativeNotif", "Ensuring plugins loaded...");
      const pluginsLoaded = await this.ensurePluginsLoaded();
      if (!pluginsLoaded) {
        logError("NativeNotif", "Failed to load plugins");
        return false;
      }

      if (!PushNotifications) {
        logError("NativeNotif", "PushNotifications plugin not available");
        return false;
      }

      // Step 1: Request permission with timeout protection
      log("NativeNotif", "Step 1: Requesting permissions...");
      let permStatus: any = null;

      try {
        // Create a promise that times out after 30 seconds
        const permPromise = PushNotifications.requestPermissions();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Permission request timeout")), 30000);
        });

        permStatus = await Promise.race([permPromise, timeoutPromise]);
        log("NativeNotif", "Permission result", permStatus);
      } catch (permError: any) {
        logError("NativeNotif", "Permission request failed", permError?.message || permError);
        return false;
      }

      if (!permStatus || permStatus.receive !== "granted") {
        log("NativeNotif", "Permission not granted", permStatus);
        return false;
      }

      // Step 2: Small delay to let the system settle
      log("NativeNotif", "Step 2: Waiting before registration...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Register for push notifications
      log("NativeNotif", "Step 3: Registering for push...");
      try {
        // Ensure listeners are set up before registering
        if (!this.isInitialized) {
          this.setupPushListeners();
        }

        await PushNotifications.register();
        log("NativeNotif", "Registration call completed - waiting for token...");

        // Wait for token to arrive via listener (up to 10 seconds)
        const tokenWaitStart = Date.now();
        while (!this.fcmToken && (Date.now() - tokenWaitStart) < 10000) {
          await new Promise(resolve => setTimeout(resolve, 500));
          log("NativeNotif", "Waiting for FCM token...", { hasToken: !!this.fcmToken, elapsed: Date.now() - tokenWaitStart });
        }

        if (this.fcmToken) {
          log("NativeNotif", "FCM Token received successfully!");
          return true;
        } else {
          logError("NativeNotif", "FCM Token not received within timeout. Check google-services.json and Firebase configuration.");
          return false;
        }
      } catch (regError: any) {
        logError("NativeNotif", "Registration call failed", regError?.message || regError);
        return false;
      }
    } catch (error: any) {
      logError("NativeNotif", "registerForPush failed", error?.message || error);
      return false;
    }
  }

  // Setup push notification listeners
  private setupPushListeners(): void {
    if (!PushNotifications) {
      log("NativeNotif", "Cannot setup listeners - plugin not loaded");
      return;
    }

    log("NativeNotif", "Setting up push listeners...");

    try {
      // On registration success - get FCM token
      PushNotifications.addListener("registration", async (token: any) => {
        try {
          log("NativeNotif", "FCM Token received", {
            token: token.value ? token.value.substring(0, 50) + "..." : "null",
            fullLength: token.value?.length || 0
          });
          this.fcmToken = token.value;
          this.saveFCMToken(token.value);
          await this.registerTokenWithBackend(token.value);

          // Notify token listeners
          this.tokenListeners.forEach(listener => {
            try {
              listener(token.value);
            } catch (e) {
              logError("NativeNotif", "Token listener error", e);
            }
          });
        } catch (e) {
          logError("NativeNotif", "Error in registration listener", e);
        }
      });

      // On registration error
      PushNotifications.addListener("registrationError", (error: any) => {
        logError("NativeNotif", "Registration error", error);
      });

      // On push notification received (foreground)
      PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
        try {
          log("NativeNotif", "🔔 PUSH NOTIFICATION RECEIVED (foreground)", {
            title: notification?.title,
            body: notification?.body,
            data: notification?.data,
            fullNotification: notification
          });
          this.handlePushNotification(notification);

          // Also show an alert for testing
          alert(`Push received: ${notification?.title} - ${notification?.body}`);
        } catch (e) {
          logError("NativeNotif", "Error handling push notification", e);
        }
      });

      // On push notification action performed (user tapped)
      PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
        try {
          log("NativeNotif", "👆 NOTIFICATION ACTION PERFORMED (tapped)", {
            action: action,
            notification: action?.notification
          });
          this.handleNotificationAction(action.notification);
        } catch (e) {
          logError("NativeNotif", "Error handling notification action", e);
        }
      });

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
      const permStatus = await LocalNotifications.requestPermissions();
      log("LocalNotif", "Permission status", permStatus);

      // Listen for local notification actions
      LocalNotifications.addListener("localNotificationActionPerformed", (action: any) => {
        try {
          log("LocalNotif", "Action performed", action);
          if (action.notification?.extra) {
            this.handleNotificationData(action.notification.extra);
          }
        } catch (e) {
          logError("LocalNotif", "Error in action listener", e);
        }
      });

      // Listen for local notifications received
      LocalNotifications.addListener("localNotificationReceived", (notification: any) => {
        log("LocalNotif", "Notification received", notification);
      });

      log("LocalNotif", "Local notifications initialized");
    } catch (error) {
      logError("LocalNotif", "Initialization failed", error);
    }
  }

  // Handle incoming push notification
  private handlePushNotification(notification: any): void {
    log("NativeNotif", "Handling push notification", notification);

    // Handle FCM structure where title/body might be in notification.notification
    const title = notification?.title || notification?.notification?.title || "AlClean";
    const body = notification?.body || notification?.notification?.body || "";
    const imageUrl = notification?.data?.imageUrl || notification?.notification?.image;

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
    this.storeReceivedNotificationInBackend(nativeNotif).catch(e => {
      logError("NativeNotif", "Failed to store received notification in backend", e);
    });

    // Show local notification for foreground push (non-blocking)
    this.showLocalNotification({
      title: nativeNotif.title,
      body: nativeNotif.body,
      id: this.notificationIdCounter++,
      extra: notification?.data,
    }).catch(e => logError("NativeNotif", "Failed to show local notification", e));

    // Dispatch event for UI updates
    try {
      window.dispatchEvent(new CustomEvent("alclean-notification", { detail: nativeNotif }));
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
      const title = notification?.title || notification?.notification?.title || "AlClean";
      const body = notification?.body || notification?.notification?.body || "";
      const imageUrl = notification?.data?.imageUrl || notification?.notification?.image;

      const nativeNotif: NativeNotification = {
        id: `tapped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      this.storeReceivedNotificationInBackend(nativeNotif).catch(e => {
        logError("NativeNotif", "Failed to store tapped notification in backend", e);
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
      log("NativeNotif", "Registration payload", { ...payload, token: token.substring(0, 30) + "..." });

      // Get backend URL from env or use relative path
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || "";
      
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
        logError("NativeNotif", `Backend registration failed: ${response.status}`);
      }
    } catch (error) {
      logError("NativeNotif", "Backend registration error (backend may be offline)", error);
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
      log("LocalNotif", "Showing notification", { id: notifId, title: options.title });

      const notification: any = {
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
      if (!PushNotifications) return "denied";
      
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
      
      // Make sure we're initialized first
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Then register for push
      const result = await this.registerForPush();
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
    if (this.fcmToken) {
      log("NativeNotif", "Already have FCM token, skipping registration");
      return true;
    }

    try {
      await this.ensurePluginsLoaded();
      if (!PushNotifications) return false;

      const status = await PushNotifications.checkPermissions();
      log("NativeNotif", "tryRegisterIfPermitted - Permission status:", status);

      if (status.receive === "granted") {
        log("NativeNotif", "Permission is granted, registering now...");
        await PushNotifications.register();
        log("NativeNotif", "Registration call made");
        return true;
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
  private async storeReceivedNotificationInBackend(notification: NativeNotification): Promise<void> {
    if (!this.fcmToken) {
      log("NativeNotif", "No FCM token available, skipping backend storage");
      return;
    }

    try {
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/notifications/store-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: this.fcmToken,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          timestamp: new Date(notification.timestamp).toISOString(),
        }),
      });

      if (response.ok) {
        log("NativeNotif", "Notification stored in backend successfully");
      } else {
        logError("NativeNotif", `Failed to store notification in backend: ${response.status}`);
      }
    } catch (error: any) {
      logError("NativeNotif", "Error storing notification in backend", error?.message || error);
    }
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
