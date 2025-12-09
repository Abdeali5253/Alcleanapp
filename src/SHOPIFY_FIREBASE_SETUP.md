# AlClean App - Shopify & Firebase Integration Setup Guide

This document explains how the Shopify order creation and Firebase push notifications are integrated into the AlClean shopping app.

## 🛒 Shopify Order Integration

### Overview
Orders placed through the app are now automatically created in your Shopify store using the Admin API. This ensures all orders flow through your existing fulfillment system.

### How It Works

1. **When a user places an order:**
   - Order details are collected from the checkout form
   - A Shopify draft order is created via GraphQL Admin API
   - The draft order is automatically completed to create a real order
   - Order appears in your Shopify admin dashboard immediately
   - Local copy is saved for in-app tracking

2. **Order Details Sent to Shopify:**
   - Customer information (name, email, phone)
   - Shipping address and city
   - All cart items with quantities
   - Delivery charge (Rs.200 for major cities, Rs.50/kg for others)
   - Payment method (COD or Bank Transfer)
   - Unique AlClean order number in notes
   - Tags: 'alclean-app', payment method

3. **Configuration:**
   - Shopify Store: `alclean-pk.myshopify.com`
   - API Version: `2025-07`
   - Admin API Token: Configured in `/lib/order-service.ts`

### Important Notes

- **Admin API Token Required:** The app uses Shopify Admin API (not Storefront API) to create orders
- **Current Token:** `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` (hardcoded as fallback)
- **Environment Variable:** Set `VITE_SHOPIFY_ADMIN_API_TOKEN` in `.env` for better security

### What Happens After Order Creation

1. Order appears in Shopify Admin → Orders
2. Your existing tracking system detects the new order
3. Tracking information is synced to the app via your API
4. Push notifications are sent to the user automatically

---

## 🔔 Firebase Push Notifications

### Overview
The app uses Firebase Cloud Messaging (FCM) to send push notifications to users about:
- Order confirmations
- Shipping updates
- Delivery status
- Promotional offers
- New products

### Firebase Project Details

- **Project Name:** app-notification
- **Project ID:** app-notification-5e56b
- **Project Number:** 310536726569
- **Android Package:** pk.alclean.alcleanmobileapp

### Configuration Files

1. **google-services.json** (Android)
   - Provided by you
   - Should be placed in `android/app/` directory for Android build
   - Contains all necessary Firebase configuration

2. **Firebase Config** (Web/React)
   - Located in `/lib/firebase-config.ts`
   - Already configured with your project credentials

### Current Implementation Status

✅ **Implemented:**
- Notification service with local storage
- In-app notification inbox
- Notification settings page
- Browser notifications (Web Notifications API)
- Mock notification system for testing
- Automatic notifications on:
  - Order placement
  - Order shipped (when tracking added)
  - Order delivered

⏳ **Pending Setup (requires backend):**
- Real FCM token generation
- Server-side notification sending
- Background notifications via service worker

### How to Enable Real Push Notifications

#### Step 1: Get Firebase Server Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **app-notification-5e56b**
3. Go to **Project Settings** > **Cloud Messaging**
4. Copy the **Server key** (Legacy)
5. If API not enabled, enable **Cloud Messaging API**

#### Step 2: Get VAPID Key for Web Push

1. In the same **Cloud Messaging** settings
2. Scroll to **Web Push certificates**
3. Click **Generate key pair** (if not already generated)
4. Copy the key pair value
5. Update `VAPID_KEY` in `/lib/firebase-config.ts`

#### Step 3: Install Firebase SDK (Optional for Web)

```bash
npm install firebase
```

Then uncomment the Firebase initialization code in `/lib/firebase-config.ts`

#### Step 4: Backend Integration

Create a server endpoint to send notifications:

**Example PHP endpoint:**
```php
<?php
// save-fcm-token.php
// Save user FCM tokens to database

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'];
$userId = $data['userId'];
$platform = $data['platform']; // 'web' or 'android'

// Save to database
// ...
?>
```

```php
<?php
// send-notification.php
// Send push notification via FCM

$serverKey = 'YOUR_FCM_SERVER_KEY';

$notification = [
    'title' => 'Order Shipped!',
    'body' => 'Your order is on the way',
    'icon' => '/icon-192.png'
];

$data = [
    'orderId' => '12345',
    'type' => 'delivery'
];

$fields = [
    'to' => $fcmToken, // or 'topic' => 'all_users'
    'notification' => $notification,
    'data' => $data
];

$headers = [
    'Authorization: key=' . $serverKey,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

$result = curl_exec($ch);
curl_close($ch);
?>
```

#### Step 5: Integrate with Tracking System

Update your existing tracking cron job to send notifications:

```php
// In your tracking sync script
// When tracking status changes:

if ($status_changed) {
    // Send notification via FCM
    $notification = [
        'title' => 'Order Update',
        'body' => "Your order is now $new_status"
    ];
    
    sendFCMNotification($userToken, $notification);
}
```

### Testing Notifications

The app includes a notification admin panel for testing:

1. Navigate to `/notifications/admin`
2. Create test notifications
3. See them appear in the notification inbox
4. Test browser notifications

### Notification Types

| Type | When Sent | Example |
|------|-----------|---------|
| `order_update` | Order status changes | "Order #AC123456 confirmed" |
| `delivery` | Tracking updated | "Order shipped via Daewoo" |
| `discount` | Promotional offers | "20% off this weekend!" |
| `sale` | Flash sales | "Buy 2 Get 1 Free" |
| `new_product` | New products added | "New eco-friendly cleaner" |

---

## 🔄 Integration Flow

### Complete Order Journey

```
1. User adds items to cart
   ↓
2. User goes to checkout
   ↓
3. User fills delivery details
   ↓
4. User places order
   ↓
5. ORDER CREATED IN SHOPIFY ✓
   - Draft order created
   - Automatically completed
   - Appears in Shopify admin
   ↓
6. NOTIFICATION SENT ✓
   - "Order placed successfully"
   ↓
7. Your existing tracking system processes order
   - Assigns to Daewoo/PostEx
   - Generates tracking number
   ↓
8. Tracking data synced to app API
   ↓
9. App syncs tracking data
   ↓
10. NOTIFICATION SENT ✓
    - "Order shipped"
    ↓
11. Order delivered
    ↓
12. NOTIFICATION SENT ✓
    - "Order delivered"
```

---

## 📱 For Android Deployment

### Firebase Setup for Android

1. **Add google-services.json:**
   ```
   android/
   └── app/
       └── google-services.json  ← Place here
   ```

2. **Update build.gradle:**
   ```gradle
   // android/build.gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.3.15'
       }
   }
   
   // android/app/build.gradle
   apply plugin: 'com.google.gms.google-services'
   
   dependencies {
       implementation 'com.google.firebase:firebase-messaging:23.1.2'
   }
   ```

3. **Handle notifications in MainActivity:**
   - Firebase SDK will handle token registration automatically
   - Implement notification handler in your React Native code

---

## 🔐 Security Recommendations

1. **Move API tokens to environment variables:**
   ```bash
   # .env
   VITE_SHOPIFY_ADMIN_API_TOKEN=your_token_here
   VITE_FCM_SERVER_KEY=your_key_here
   ```

2. **Never commit sensitive keys to git:**
   ```
   # .gitignore
   .env
   .env.local
   google-services.json  # Don't commit this
   ```

3. **Use different tokens for development and production**

4. **Rotate API tokens periodically**

---

## 🐛 Troubleshooting

### Orders not appearing in Shopify?

1. Check browser console for errors
2. Verify Admin API token is correct
3. Ensure Admin API permissions include:
   - `write_draft_orders`
   - `read_products`
   - `read_customers`
4. Check Shopify API version compatibility

### Push notifications not working?

1. Check notification permission is granted
2. Verify Firebase project credentials
3. Check FCM server key is correct
4. Test with mock notifications first
5. Check browser console for FCM errors

### Tracking not syncing?

1. Verify tracking API is accessible: `https://app.albizco.com/end_points/get_tracking.php`
2. Check phone number format matches
3. Ensure order numbers match between systems
4. Click "Sync" button in tracking page

---

## 📞 Support

For questions about:
- **Shopify integration:** Check Shopify Admin API docs
- **Firebase setup:** Check Firebase Console documentation
- **App functionality:** Review component code in `/components/`
- **Order service:** Check `/lib/order-service.ts`
- **Notifications:** Check `/lib/notifications.ts`

---

## ✅ Next Steps

1. [ ] Add Shopify Admin API token to environment variables
2. [ ] Get Firebase Server Key from console
3. [ ] Get VAPID key for web push
4. [ ] Set up backend endpoint to receive FCM tokens
5. [ ] Integrate FCM notifications with tracking system
6. [ ] Test end-to-end order flow
7. [ ] Test notifications on Android device
8. [ ] Deploy to production

---

**Last Updated:** December 6, 2025
**App Version:** 1.0.0
**Integration Status:** Shopify ✓ | Firebase (Mock) ⏳
