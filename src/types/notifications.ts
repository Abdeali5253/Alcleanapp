// Notification types for AlClean App

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  timestamp: number;
  read: boolean;
  type: NotificationType;
  imageUrl?: string;
  actionUrl?: string;
}

export type NotificationType =
  | "order_update"
  | "discount"
  | "sale"
  | "promotion"
  | "delivery"
  | "general"
  | "new_product";

export interface NotificationData {
  orderId?: string;
  productId?: string;
  discountCode?: string;
  deepLink?: string;
  [key: string]: any;
}

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  deliveryAlerts: boolean;
}

export interface FCMToken {
  token: string;
  platform: "web" | "android" | "ios";
  deviceId: string;
  userId?: string;
  createdAt: number;
  lastUpdated: number;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  targetAudience: "all" | "specific" | "segment";
  userIds?: string[];
  segment?: NotificationSegment;
  data?: NotificationData;
  imageUrl?: string;
  actionUrl?: string;
  scheduledFor?: number;
}

export type NotificationSegment = 
  | "all_users"
  | "active_customers"
  | "inactive_customers"
  | "karachi"
  | "lahore"
  | "islamabad"
  | "rawalpindi";

export interface NotificationStats {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
}
