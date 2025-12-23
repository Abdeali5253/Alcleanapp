# AlClean Mobile App - Android Notification System

## 📱 Current Status: Android Push Notifications Implemented

---

## ✅ **COMPLETED - ANDROID NOTIFICATIONS**

### Push Notifications (FCM)
- ✅ Firebase Cloud Messaging configured
- ✅ `google-services.json` added to Android project
- ✅ Native push notification handling via `@capacitor/push-notifications`
- ✅ FCM token registration with backend
- ✅ Foreground notification handling
- ✅ Background notification handling
- ✅ Deep linking from notifications
- ✅ Notification channels for Android 8.0+

### Local Notifications
- ✅ `@capacitor/local-notifications` installed
- ✅ Scheduled notification support
- ✅ Immediate local notification support
- ✅ Custom notification icons and colors
- ✅ Multiple notification channels (default, orders, promotions)

### Notification UI
- ✅ Notification inbox with read/unread status
- ✅ Notification settings page
- ✅ Test notification buttons
- ✅ Scheduled notification test (10 seconds)
- ✅ Permission request prompt

---

## 🚀 **BUILD INSTRUCTIONS**

### Prerequisites
- Node.js 22+ (required for Capacitor CLI)
- Android Studio (with SDK 34)
- Java 17+

### Step 1: Install Dependencies
```bash
cd /app/frontend
npm install
```

### Step 2: Build Web App
```bash
npm run build
```

### Step 3: Sync Capacitor (requires Node 22+)
```bash
npx cap sync android
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```
Or manually open `/app/frontend/android` folder in Android Studio.

### Step 5: Build APK
In Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Wait for build to complete
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 6: Generate Signed APK/AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease  # For AAB
./gradlew assembleRelease  # For APK
```

---

## 📁 **FILE STRUCTURE - NOTIFICATION SYSTEM**

```
/app/frontend/
├── android/app/
│   ├── google-services.json          # Firebase config
│   ├── build.gradle                   # Firebase dependencies
│   └── src/main/
│       ├── AndroidManifest.xml        # Permissions & FCM service
│       └── res/
│           ├── drawable/
│           │   └── ic_stat_notification.xml  # Notification icon
│           └── values/
│               └── colors.xml         # Notification color (#6DB33F)
│
├── src/lib/
│   ├── native-notifications.ts        # Native notification service
│   ├── notifications.ts               # Unified notification service
│   └── firebase-config.ts             # Firebase web config
│
└── src/components/
    ├── NotificationPrompt.tsx         # Permission request prompt
    ├── NotificationSettings.tsx       # Settings page with test buttons
    └── NotificationInbox.tsx          # Notification inbox
```

---

## 🔔 **NOTIFICATION FEATURES**

### Push Notification Types
| Type | Description | Channel |
|------|-------------|---------|
| `order_update` | Order status changes | alclean_orders |
| `delivery` | Delivery updates | alclean_orders |
| `promotion` | Discounts & offers | alclean_promotions |
| `discount` | Discount codes | alclean_promotions |
| `sale` | Flash sales | alclean_promotions |
| `new_product` | New arrivals | alclean_default |
| `general` | General updates | alclean_default |

### Local Notification Methods
```typescript
// Show immediate notification
await notificationService.showLocalNotification(
  "Title",
  "Body message",
  { type: "order_update" }
);

// Schedule notification (in minutes)
const id = await notificationService.scheduleLocalNotification({
  title: "Reminder",
  body: "Your order is ready!",
  delayMinutes: 30,
  data: { orderId: "123" }
});

// Cancel scheduled notification
await notificationService.cancelScheduledNotification(id);
```

---

## 🧪 **TESTING NOTIFICATIONS**

### Test from Settings Page
1. Open app → Account → Notification Settings
2. Enable notifications
3. Click "Send Test" for immediate notification
4. Click "Schedule (10s)" for delayed notification

### Test from Backend (Admin)
```bash
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Push",
    "body": "This is a test notification",
    "type": "general"
  }'
```

### Check Registered Devices
```bash
curl http://localhost:3001/api/notifications/devices
```

---

## ⚠️ **IMPORTANT NOTES**

### Firebase Server Key (for backend push)
To send push notifications from the backend, you need:
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Get the "Server Key" (Legacy) or set up Firebase Admin SDK
3. Add to backend `.env`: `FCM_SERVER_KEY=your_key_here`

### Android 13+ Permission
Android 13 and above requires explicit notification permission:
- The app automatically requests permission on first launch
- Users can enable/disable in Notification Settings

### Deep Linking
Notifications can deep link to specific screens:
- Order notifications → `/tracking`
- Product notifications → `/product/{id}`
- Custom deep links via `data.deepLink`

---

## 📊 **APP SPECIFICATIONS**

- **App Name:** AlClean
- **Package ID:** com.alclean.app
- **Min Android Version:** 7.0 (API 24)
- **Target Android Version:** 14 (API 34)
- **Notification Icon:** Bell icon in green (#6DB33F)
- **Permissions:** Internet, Network State, Notifications, Vibrate, Wake Lock

---

## ✅ **DEPLOYMENT CHECKLIST**

### Android Build
- [x] Firebase project created
- [x] google-services.json configured
- [x] AndroidManifest.xml updated
- [x] Notification channels defined
- [x] Push notification plugin installed
- [x] Local notification plugin installed
- [x] Native notification service created
- [x] Test notifications working
- [ ] Build APK and test on device
- [ ] Test push notifications from backend
- [ ] Test deep linking
- [ ] Submit to Play Store

---

*Last Updated: December 2024*
*Status: Ready for APK Build* 📱🔔
