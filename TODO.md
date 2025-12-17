# AlClean Mobile App - Development & Deployment Guide

Complete checklist for testing locally and publishing to Google Play Store.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Testing Locally](#testing-locally)
4. [Firebase Push Notifications Setup](#firebase-push-notifications-setup)
5. [Building for Android](#building-for-android)
6. [Google Play Store Submission](#google-play-store-submission)
7. [Post-Launch Checklist](#post-launch-checklist)

---

## Prerequisites

### Required Accounts
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Firebase account (already set up ✅)
- [ ] Shopify store with API access (already set up ✅)

### Required Software
- [ ] Node.js v18+ 
- [ ] Yarn package manager
- [ ] Android Studio (for building APK/AAB)
- [ ] Java JDK 17+
- [ ] Git

### Required Files
- [ ] `google-services.json` - Firebase config for Android (already have ✅)
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2, recommended 8)
- [ ] Privacy policy URL

---

## Local Development Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd /app

# Install root dependencies
yarn install

# Install frontend dependencies
cd frontend && yarn install

# Install backend dependencies
cd ../backend && yarn install
```

### Step 2: Configure Environment Variables

**Frontend (.env)** - Already configured:
```env
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=6689542c8727785e3221d3ca952461a6
VITE_SHOPIFY_API_VERSION=2025-07
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=AIzaSyCMZrTCi1giFF6hJOC-MuOBbsqqKp6G6rU
VITE_FIREBASE_PROJECT_ID=app-notification-5e56b
VITE_FIREBASE_MESSAGING_SENDER_ID=310536726569
VITE_FIREBASE_APP_ID=1:310536726569:android:eb53b3a97416f36ef71438
```

**Backend (.env)** - Already configured:
```env
SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=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
SHOPIFY_API_VERSION=2025-07
PORT=3001
```

### Step 3: Start Development Servers

```bash
# Option 1: Run both together
cd /app && yarn dev

# Option 2: Run separately
# Terminal 1 - Backend
cd /app/backend && yarn dev

# Terminal 2 - Frontend
cd /app/frontend && yarn dev
```

### Step 4: Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

---

## Testing Locally

### ✅ Feature Testing Checklist

#### Products
- [ ] Products load from Shopify
- [ ] Categories filter correctly
- [ ] Search works with voice input
- [ ] Quick filters (On Sale, In Stock, Price) work
- [ ] Product detail page shows all info

#### Cart
- [ ] Add products to cart
- [ ] Update quantities
- [ ] Remove items
- [ ] Cart persists after refresh

#### Checkout
- [ ] Fill customer information
- [ ] Select delivery city
- [ ] Choose payment method (COD/Bank Transfer)
- [ ] Order creates in Shopify ⚠️ Test with real order
- [ ] Order confirmation shows

#### Notifications
- [ ] Permission request works
- [ ] Test notification appears
- [ ] Notification inbox displays

### 🧪 API Testing Commands

```bash
# Test backend health
curl http://localhost:3001/health

# Test Shopify connection (replace with real variant ID)
curl -X POST http://localhost:3001/api/shopify/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-001",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "+923001234567",
    "customerAddress": "123 Test Street",
    "city": "Karachi",
    "items": [{"variantId": "gid://shopify/ProductVariant/REAL_ID", "quantity": 1, "title": "Test", "price": 100}],
    "subtotal": 100,
    "deliveryCharge": 150,
    "total": 250,
    "paymentMethod": "cod"
  }'

# Test notification registration
curl -X POST http://localhost:3001/api/notifications/register \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token", "platform": "android"}'
```

---

## Firebase Push Notifications Setup

### Step 1: Firebase Console Setup (Already Done ✅)
- Project: `app-notification-5e56b`
- Package: `pk.alclean.alcleanmobileapp`

### Step 2: Get VAPID Key for Web Push (Optional)
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates", generate a key pair
3. Add to `.env`: `VITE_FIREBASE_VAPID_KEY=your-vapid-key`

### Step 3: For Server-Side Notifications (Production)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Add to backend environment:
```env
FIREBASE_PROJECT_ID=app-notification-5e56b
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@app-notification-5e56b.iam.gserviceaccount.com
```

### Step 4: Testing Notifications Manually

#### Option A: Using Firebase Console (Easiest)
1. Go to https://console.firebase.google.com
2. Select project `app-notification-5e56b`
3. Go to **Engage** → **Messaging** (Cloud Messaging)
4. Click **"Create your first campaign"** or **"New campaign"**
5. Select **"Firebase Notification messages"**
6. Enter:
   - Title: `🎉 Test Notification`
   - Body: `Your AlClean order is ready!`
7. Click **"Send test message"**
8. Enter the FCM token from your app (check console logs)
9. Click **"Test"**

#### Option B: Using cURL (For Developers)
```bash
# Get your Server Key from Firebase Console → Project Settings → Cloud Messaging

# Send notification
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_DEVICE_TOKEN",
    "notification": {
      "title": "🛒 Order Update",
      "body": "Your order #1234 has been shipped!"
    },
    "data": {
      "type": "order_update",
      "orderId": "1234"
    }
  }'
```

#### Option C: Using Firebase Admin SDK (Node.js)
```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: '🎉 Special Offer!',
    body: '50% off on all cleaning products!'
  },
  topic: 'all_users'
};

admin.messaging().send(message)
  .then((response) => console.log('Sent:', response))
  .catch((error) => console.error('Error:', error));
```

### Step 5: Automating Notifications (Production)

1. **Order Updates**: Send notification when order status changes
   ```javascript
   // In your order update webhook/endpoint
   if (order.status === 'shipped') {
     await sendNotification(userId, {
       title: '📦 Order Shipped!',
       body: `Your order #${order.id} is on its way!`,
       data: { type: 'delivery', orderId: order.id }
     });
   }
   ```

2. **Promotional Notifications**: Schedule campaigns in Firebase Console
   - Go to Messaging → Create Campaign
   - Set target audience
   - Schedule delivery time
   - Enable A/B testing if needed

3. **Topic-Based Notifications**: Subscribe users to topics
   ```javascript
   // Subscribe user to promotions topic
   firebase.messaging().subscribeToTopic(fcmToken, 'promotions');
   
   // Send to all subscribed users
   admin.messaging().sendToTopic('promotions', message);
   ```

---

## Building for Android

### Step 1: Install Capacitor

```bash
cd /app/frontend

# Install Capacitor
yarn add @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init "AlClean" "pk.alclean.alcleanmobileapp" --web-dir dist
```

### Step 2: Update capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pk.alclean.alcleanmobileapp',
  appName: 'AlClean',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

### Step 3: Add Push Notification Plugin

```bash
yarn add @capacitor/push-notifications
```

### Step 4: Build the Web App

```bash
# Build production version
yarn build
```

### Step 5: Add Android Platform

```bash
# Add Android
npx cap add android

# Copy web assets to Android
npx cap sync android
```

### Step 6: Copy Firebase Config

```bash
# Copy google-services.json to Android project
cp google-services.json android/app/google-services.json
```

### Step 7: Open in Android Studio

```bash
npx cap open android
```

### Step 8: Configure Android Project

In Android Studio:

1. **Update build.gradle (Project level)**:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

2. **Update build.gradle (App level)**:
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

3. **Update AndroidManifest.xml** - Add permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Step 9: Create Signed APK/AAB

1. In Android Studio: Build → Generate Signed Bundle / APK
2. Create new keystore or use existing
3. **IMPORTANT**: Save keystore file and passwords securely!
4. Select "Android App Bundle" for Play Store
5. Choose "release" build variant
6. Build

---

## Google Play Store Submission

### Step 1: Prepare Store Listing Assets

- [ ] **App Icon** (512x512 PNG, no transparency)
- [ ] **Feature Graphic** (1024x500 PNG)
- [ ] **Screenshots** (minimum 2 per device type):
  - Phone: 1080x1920 or 1080x2340
  - 7-inch tablet: 1200x1920
  - 10-inch tablet: 1800x2560
- [ ] **Short Description** (80 characters max)
- [ ] **Full Description** (4000 characters max)
- [ ] **Privacy Policy URL**
- [ ] **App Category**: Shopping
- [ ] **Content Rating**: Fill questionnaire
- [ ] **Contact Details**: Email, phone, website

### Step 2: Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: AlClean
   - Default language: English
   - App type: App
   - Free or paid: Free
   - Accept declarations

### Step 3: Store Listing

1. **Main store listing**:
   - App name: AlClean - Premium Cleaning Products
   - Short description: Shop premium cleaning products & equipment
   - Full description: (detailed app features)
   - Upload app icon
   - Upload feature graphic
   - Upload screenshots

2. **Graphics**:
   - Add phone screenshots (2-8)
   - Add tablet screenshots (optional)
   - Add promotional video (optional)

### Step 4: App Content

1. **Privacy policy**: Add your privacy policy URL
2. **Ads**: Declare if app contains ads
3. **App access**: All functionality available / Restricted
4. **Content ratings**: Complete questionnaire
5. **Target audience**: Select age group
6. **News apps**: No (unless applicable)
7. **Data safety**: Fill out data collection form

### Step 5: Release Setup

1. Go to "Production" → "Countries/regions"
2. Select countries (Pakistan, etc.)
3. Go to "Production" → "Create new release"
4. Upload your AAB file
5. Add release notes
6. Review and submit

### Step 6: Review Process

- Initial review takes 1-3 days
- May require additional information
- Address any policy violations
- Once approved, app goes live!

---

## Post-Launch Checklist

### Monitoring
- [ ] Set up Google Analytics in Firebase
- [ ] Monitor crash reports in Firebase Crashlytics
- [ ] Track user reviews in Play Console
- [ ] Monitor API health

### Updates
- [ ] Plan regular updates (bug fixes, features)
- [ ] Increment version code for each update
- [ ] Test thoroughly before release
- [ ] Use staged rollout for major updates

### Marketing
- [ ] Share app link with customers
- [ ] Add QR code to website/marketing materials
- [ ] Encourage reviews from happy customers
- [ ] Respond to user reviews

---

## Quick Reference Commands

```bash
# Development
cd /app && yarn dev                    # Start both servers
cd /app/frontend && yarn dev           # Frontend only
cd /app/backend && yarn dev            # Backend only

# Building
cd /app/frontend && yarn build         # Build for production
npx cap sync android                   # Sync to Android
npx cap open android                   # Open in Android Studio

# Testing
curl http://localhost:3001/health      # Check backend
curl http://localhost:3000             # Check frontend

# Logs
cat /tmp/frontend.log                  # Frontend logs
cat /tmp/backend.log                   # Backend logs
```

---

## Support

For issues or questions:
- Check console logs for errors
- Verify environment variables
- Ensure all dependencies are installed
- Test API endpoints individually

---

*Last Updated: December 2024*
