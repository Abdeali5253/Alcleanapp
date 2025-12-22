import { 
  initializeFirebase, 
  requestNotificationPermission, 
  onForegroundMessage 
} from './firebase-config';
import { BACKEND_URL } from "./base-url";
import { Capacitor } from "@capacitor/core";


export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'order_update' | 'promotion' | 'discount' | 'sale' | 'new_product' | 'delivery' | 'general';
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
  imageUrl?: string;
}

const isAndroid = () => Capacitor.getPlatform() === "android";

const hasWebNotificationApi = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  typeof Notification !== "undefined";


export interface NotificationSegment {
  id: string;
  name: string;
  description: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'alclean_notifications';
const FCM_TOKEN_STORAGE_KEY = 'alclean_fcm_token';

class NotificationService {
  private fcmToken: string | null = null;
  private notifications: PushNotification[] = [];
  private listeners: ((notifications: PushNotification[]) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.loadNotifications();
    this.loadFCMToken();
  }

  // Initialize Firebase and request permissions
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      console.log('[Notifications] Initializing...');
      
      if (isAndroid()) {
      this.isInitialized = true;
      console.log("[Notifications] Android detected - skipping Web Push init");
      return true;
    }

      // Initialize Firebase
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) {
        console.warn('[Notifications] Firebase not available');
        return false;
      }
      
      // Request notification permission and get token
      const token = await requestNotificationPermission();
      if (token) {
        this.fcmToken = token;
        this.saveFCMToken(token);
        
        // Register token with backend
        await this.registerTokenWithBackend(token);
      }
      
      // Listen for foreground messages
      onForegroundMessage((payload) => {
        this.handleIncomingNotification(payload);
      });
      
      this.isInitialized = true;
      console.log('[Notifications] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
      return false;
    }
  }

  // Register FCM token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      // Use relative path - Kubernetes ingress routes /api/* to backend
      const response = await fetch(`${BACKEND_URL}/api/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: this.getPlatform(),
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        console.log('[Notifications] Token registered with backend');
      } else {
        console.log('[Notifications] Backend returned:', response.status);
      }
    } catch (error) {
      console.log('[Notifications] Backend not available, will retry later');
    }
  }

  // Handle incoming notification
  private handleIncomingNotification(payload: any): void {
    const notification: PushNotification = {
      id: this.generateId(),
      title: payload.notification?.title || payload.data?.title || 'New Notification',
      body: payload.notification?.body || payload.data?.body || '',
      type: payload.data?.type || 'general',
      timestamp: new Date(),
      read: false,
      data: payload.data,
      imageUrl: payload.notification?.image || payload.data?.imageUrl,
    };
    
    this.addNotification(notification);
    
    // Show browser notification if in foreground
    if (!isAndroid() && hasWebNotificationApi() && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.id,
      });
    }
  }

  // Add notification to list
  addNotification(notification: PushNotification): void {
    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): PushNotification[] {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Subscribe to notification changes
  subscribe(callback: (notifications: PushNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Check if notifications are enabled
  async checkPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (isAndroid()) return "denied";
    if (!hasWebNotificationApi()) return "denied";
    return Notification.permission;
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    if (isAndroid()) return false;
    if (!hasWebNotificationApi()) return false;

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted' && !this.fcmToken) {
      const token = await requestNotificationPermission();
      if (token) {
        this.fcmToken = token;
        this.saveFCMToken(token);
        await this.registerTokenWithBackend(token);
      }
    }
    
    return permission === 'granted';
  }

  // Get FCM token
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Private methods
  private loadNotifications(): void {
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
      console.error('[Notifications] Failed to load:', error);
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[Notifications] Failed to save:', error);
    }
  }

  private loadFCMToken(): void {
    try {
      this.fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('[Notifications] Failed to load FCM token:', error);
    }
  }

  private saveFCMToken(token: string): void {
    try {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('[Notifications] Failed to save FCM token:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getNotifications()));
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlatform(): 'web' | 'android' | 'ios' {
    const userAgent = navigator.userAgent || '';
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  }

  // Create a test notification (for development)
  async sendTestNotification(): Promise<void> {
    this.handleIncomingNotification({
      notification: {
        title: '🎉 Test Notification',
        body: 'Push notifications are working! You will receive order updates here.',
      },
      data: {
        type: 'general',
      },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationSegment as NotificationSegmentType };
