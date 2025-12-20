# AlClean Mobile App - Development & Deployment Guide

## 📱 Current Status: Web App Complete, Ready for Mobile Build

---

## ✅ **COMPLETED FEATURES**

### Core Features
- ✅ Browse 689 products from Shopify (all collections integrated)
- ✅ Search and filter products (with categories and subcategories)
- ✅ Product categorization (Cleaning Chemicals: 9 subcategories, Equipment: 15 subcategories)
- ✅ Shopping cart with persistence
- ✅ Wishlist feature (per-user, persistent)
- ✅ User authentication (Shopify integration)
- ✅ User profile management (edit name, phone)
- ✅ Order history from Shopify
- ✅ Checkout integration with Shopify
- ✅ Delivery charge calculation (city + weight based)
- ✅ Mobile-responsive design

### Integration
- ✅ Shopify Storefront API (products, customers, orders)
- ✅ Shopify Admin API (order creation)
- ✅ Firebase (notification configuration)
- ✅ MongoDB (caching)

---

## 🎯 **NEXT STEP: BUILD MOBILE APP (APK/AAB)**

### Phase 1: Setup Capacitor (Web to Native Bridge)
Capacitor wraps your React web app into a native Android container.

**Install Capacitor:**
```bash
cd /app/frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

**Initialize Capacitor:**
```bash
npx cap init "AlClean" "pk.alclean.app" --web-dir=dist
```

**Add Android Platform:**
```bash
npx cap add android
```

---

### Phase 2: Configure capacitor.config.ts

Create or update `/app/frontend/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pk.alclean.app',
  appName: 'AlClean',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6DB33F",
      showSpinner: false,
      androidSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

---

### Phase 3: Add Push Notifications Plugin

```bash
npm install @capacitor/push-notifications
```

Update Android Firebase configuration:
1. Download `google-services.json` from Firebase Console
2. Place in `/app/frontend/android/app/google-services.json`

---

### Phase 4: Build Web App

```bash
cd /app/frontend
npm run build
```

This creates the `dist` folder with optimized production build.

---

### Phase 5: Sync to Android

```bash
npx cap sync android
```

This copies the web build to the Android project and updates native dependencies.

---

### Phase 6: Configure Android Project

**Update AndroidManifest.xml** (`android/app/src/main/AndroidManifest.xml`):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="pk.alclean.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:theme="@style/AppTheme.SplashScreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

### Phase 7: Open Android Studio

```bash
npx cap open android
```

This opens your project in Android Studio.

---

### Phase 8: Create Keystore (For Signed APK/AAB)

**Generate keystore:**
```bash
keytool -genkey -v -keystore alclean-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias alclean
```

Save this file securely! You'll need it for all future updates.

**Configure signing in Android Studio:**
1. Build → Generate Signed Bundle/APK
2. Choose "APK" or "Android App Bundle (AAB)"
3. Select your keystore file
4. Enter keystore password
5. Choose release build variant
6. Build

---

### Phase 9: Build APK (For Testing on Phone)

**Option A: Via Android Studio**
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Wait for build to complete
3. Click "locate" to find the APK file
4. Transfer APK to phone via USB/WhatsApp/Email
5. Install on phone (enable "Install from Unknown Sources")

**Option B: Via Command Line**
```bash
cd /app/frontend/android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

### Phase 10: Build AAB (For Play Store)

**App Bundle (AAB) is required for Google Play Store:**

```bash
cd /app/frontend/android
./gradlew bundleRelease
```

AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📱 **Testing on Mobile Phone**

### Method 1: Direct APK Install
1. Build APK (Phase 9)
2. Transfer `app-release.apk` to phone
3. Enable "Install from Unknown Sources" in phone settings
4. Tap APK file to install
5. Open AlClean app
6. Test all features

### Method 2: USB Debugging
1. Connect phone via USB
2. Enable Developer Options on phone
3. Enable USB Debugging
4. In Android Studio, click Run
5. Select your phone from device list
6. App installs and launches automatically

---

## 🏪 **Google Play Store Submission**

### Requirements:
- ✅ AAB file (Phase 10)
- ✅ App icon (512x512 PNG)
- ✅ Feature graphic (1024x500 PNG)
- ✅ Screenshots (minimum 2, various screen sizes)
- ✅ Privacy policy URL
- ✅ App description
- ✅ Developer account ($25 one-time fee)

### Submission Steps:
1. Create Google Play Console account
2. Create new application
3. Upload AAB file
4. Add store listing details
5. Set pricing (Free/Paid)
6. Complete content rating questionnaire
7. Submit for review (2-7 days)

---

## 🔧 **Common Issues & Solutions**

### Issue: Build fails
**Solution:** Check Node.js version (use Node 18+), run `npm install`

### Issue: App crashes on launch
**Solution:** Check AndroidManifest.xml permissions, verify API URLs are correct

### Issue: Network requests fail
**Solution:** Add `android:usesCleartextTraffic="true"` to AndroidManifest.xml

### Issue: Push notifications not working
**Solution:** Verify `google-services.json` is in correct location, check FCM configuration

---

## 📊 **App Specifications**

- **App Name:** AlClean
- **Package ID:** pk.alclean.app
- **Min Android Version:** 7.0 (API 24)
- **Target Android Version:** 14 (API 34)
- **App Size:** ~15-20 MB (estimated)
- **Permissions:** Internet, Network State, Notifications

---

## ✅ **Deployment Checklist**

### Pre-Build
- [x] All features tested and working
- [x] Environment variables configured
- [x] Firebase setup complete
- [x] Shopify integration verified

### Build Setup
- [ ] Capacitor installed
- [ ] Android platform added
- [ ] Keystore generated
- [ ] App icon added
- [ ] Splash screen configured

### Build & Test
- [ ] Web build successful (`npm run build`)
- [ ] Android sync successful (`npx cap sync`)
- [ ] APK generated
- [ ] Tested on physical device
- [ ] All features work on mobile

### Play Store
- [ ] AAB file generated
- [ ] Store listing prepared
- [ ] Screenshots taken
- [ ] Privacy policy created
- [ ] Developer account ready
- [ ] App submitted for review

---

## 🚀 **Quick Start Guide**

**To build APK right now:**
```bash
cd /app/frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "AlClean" "pk.alclean.app" --web-dir=dist
npx cap add android
npm run build
npx cap sync android
npx cap open android
# In Android Studio: Build → Build Bundle/APK → Build APK
```

**To test on phone:**
1. Connect phone via USB
2. Enable USB debugging
3. Click Run in Android Studio
4. Select your device
5. App installs automatically

---

*Last Updated: December 2024*

**Status: Ready for Mobile Build** 📱🚀
