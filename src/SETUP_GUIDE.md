# 📚 AlClean App - Complete Setup Guide

> Everything you need to build, test, and publish your app

---

## 📋 Table of Contents

1. [VS Code Development Setup](#1-vs-code-development-setup)
2. [Android Build Setup](#2-android-build-setup)
3. [Firebase Notifications (Optional)](#3-firebase-notifications-optional)
4. [Publishing to Play Store](#4-publishing-to-play-store)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. VS Code Development Setup

### Why VS Code?

✅ **Fast** - Starts in seconds (vs Android Studio's minutes)
✅ **Lightweight** - Uses less RAM
✅ **Hot Reload** - See changes instantly
✅ **Better Coding** - IntelliSense, autocomplete
✅ **99% of work** - Code all day in VS Code

❌ **Android Studio** - Only use for final builds (1% of time)

### Install VS Code

1. Download: [code.visualstudio.com](https://code.visualstudio.com/)
2. Install for your OS

### Essential Extensions

Open VS Code → Extensions (Ctrl+Shift+X) → Install:

1. **ES7+ React/Redux/React-Native snippets**
2. **Tailwind CSS IntelliSense**
3. **ESLint**
4. **Prettier - Code formatter**
5. **Auto Rename Tag** (recommended)

### Project Setup in VS Code

\`\`\`bash
# Open project
cd alclean-app
code .

# Create VS Code settings
mkdir .vscode
\`\`\`

Create **`.vscode/settings.json`**:

\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["class(Name)?\\\\s*=\\\\s*['\"\`]([^'\"\`]*)['\"\`]"]
  ]
}
\`\`\`

### Daily Workflow

\`\`\`bash
# Morning
code .                # Open VS Code
npm run dev          # Start dev server

# Code all day!
# Changes appear instantly in browser
# Test in mobile view: F12 → Device Toolbar

# Evening
git add .
git commit -m "Feature: Added X"
git push

# Close VS Code
\`\`\`

### Useful Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Command Palette | Ctrl+Shift+P | Cmd+Shift+P |
| Quick Open | Ctrl+P | Cmd+P |
| Find in Files | Ctrl+Shift+F | Cmd+Shift+F |
| Toggle Terminal | Ctrl+\` | Ctrl+\` |
| Format Document | Shift+Alt+F | Shift+Option+F |

### VS Code Tips

**Split Editor:**
- Drag file tab to right → Edit 2 files side-by-side

**Multi-cursor:**
- Alt+Click → Edit multiple lines at once

**Quick File Navigation:**
- Ctrl+P → Type filename → Enter

**Go to Definition:**
- Click function → Press F12

---

## 2. Android Build Setup

### Prerequisites

- Node.js 18+ installed
- VS Code installed
- 2-3 hours of time

### Step 1: Install Android Studio

1. **Download**: [developer.android.com/studio](https://developer.android.com/studio)
2. **Install** Android Studio
3. **Run setup wizard**:
   - Install Android SDK (API 34)
   - Install Android SDK Build-Tools
   - Install Android Emulator
4. **Verify**: Open Android Studio → Check it loads

### Step 2: Install Java JDK

1. **Download**: [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/)
2. **Install** JDK
3. **Verify**:
   \`\`\`bash
   java --version
   # Should show: java 17.x.x
   \`\`\`

### Step 3: Install Capacitor

In your project folder (VS Code terminal):

\`\`\`bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init

# When prompted:
# App name: AlClean
# App ID: com.alclean.app
# Web directory: dist
\`\`\`

This creates **`capacitor.config.ts`**

### Step 4: Configure Capacitor

Edit **`capacitor.config.ts`**:

\`\`\`typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alclean.app',
  appName: 'AlClean',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#ffffff'
  }
};

export default config;
\`\`\`

### Step 5: Build & Add Android

\`\`\`bash
# Build your web app
npm run build

# Add Android platform
npx cap add android

# This creates android/ folder
\`\`\`

### Step 6: Add App Logo

**Option A: Use Android Studio (Recommended)**

1. Open Android Studio: \`npx cap open android\`
2. Right-click \`res\` folder → New → Image Asset
3. Upload your 512x512px logo
4. Generate all sizes
5. Done!

**Option B: Manual (Advanced)**

Place your logo in these folders:
- \`android/app/src/main/res/mipmap-hdpi/ic_launcher.png\` (72x72)
- \`android/app/src/main/res/mipmap-mdpi/ic_launcher.png\` (48x48)
- \`android/app/src/main/res/mipmap-xhdpi/ic_launcher.png\` (96x96)
- \`android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png\` (144x144)
- \`android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png\` (192x192)

### Step 7: Update App Colors

Edit **`android/app/src/main/res/values/colors.xml`**:

\`\`\`xml
<resources>
    <color name="colorPrimary">#6DB33F</color>
    <color name="colorPrimaryDark">#5da035</color>
    <color name="colorAccent">#6DB33F</color>
</resources>
\`\`\`

### Step 8: Test in Emulator

\`\`\`bash
# Open Android Studio
npx cap open android

# Wait for Gradle sync (5-10 mins first time)

# Create emulator:
# Tools → Device Manager → Create Device → Pixel 5

# Run app:
# Click green Run button → Select emulator

# App launches! Test everything.
\`\`\`

### Step 9: Test on Real Device

**Enable Developer Mode on Phone:**
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back → Developer Options
4. Enable "USB Debugging"

**Connect & Run:**
\`\`\`bash
# Connect phone via USB
# Allow USB debugging on phone

# In Android Studio:
# Select your device from dropdown
# Click Run

# App installs and runs on your phone!
\`\`\`

### Step 10: Generate Signed APK/AAB

**Create Keystore (ONE TIME ONLY):**

\`\`\`bash
keytool -genkey -v -keystore alclean-release-key.jks \\
  -keyalg RSA -keysize 2048 -validity 10000 -alias alclean

# Enter password (SAVE THIS!)
# First and Last Name: AlClean
# Organization: AlClean Pakistan
# City: Your City
# State: Your Province
# Country Code: PK
\`\`\`

**⚠️ BACKUP YOUR KEYSTORE!**
- Copy \`alclean-release-key.jks\` to safe location
- Save password in password manager
- Email yourself a backup
- **Without this, you can NEVER update your app!**

**Generate Signed AAB:**

1. In Android Studio: Build → Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Click "Create new..." or "Choose existing..."
4. Browse to keystore file
5. Enter passwords
6. Select "release"
7. Check V1 and V2 signatures
8. Click "Create"

**Find your AAB:**
- Location: \`android/app/release/app-release.aab\`
- This is what you upload to Play Store!

### When to Use Each Tool

| Task | Tool | When |
|------|------|------|
| Writing code | VS Code | Daily |
| Testing features | Browser | Daily |
| Fixing bugs | VS Code | Daily |
| Building APK/AAB | Android Studio | Before release |
| Testing on phone | Android Studio | Weekly |
| Final build | Android Studio | Monthly |

---

## 3. Firebase Notifications (Optional)

> Skip this section if you want to launch first and add later

### Why Firebase?

- Send push notifications to all users
- Free unlimited notifications
- Target by city or user segment
- Schedule notifications
- Track delivery & open rates

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: **alclean-app**
4. Enable Google Analytics (recommended)
5. Create project (takes 1 min)

### Step 2: Add Android App

1. Click Android icon (🤖)
2. Package name: **com.alclean.app**
3. App nickname: **AlClean**
4. Click "Register app"
5. Download **google-services.json**

### Step 3: Add Config Files

**Place google-services.json:**
\`\`\`
android/app/google-services.json
\`\`\`

**Update `android/build.gradle`:**
\`\`\`gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}
\`\`\`

**Update `android/app/build.gradle`:**

Add at bottom:
\`\`\`gradle
apply plugin: 'com.google.gms.google-services'
\`\`\`

Add in dependencies:
\`\`\`gradle
implementation 'com.google.firebase:firebase-messaging:23.1.2'
\`\`\`

### Step 4: Install Capacitor Plugin

\`\`\`bash
npm install @capacitor/push-notifications
npx cap sync android
\`\`\`

### Step 5: Update Config

In Firebase Console → Project Settings → Copy config values

Update **`lib/notifications.ts`**:

\`\`\`typescript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "alclean-app.firebaseapp.com",
  projectId: "alclean-app",
  storageBucket: "alclean-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
\`\`\`

### Step 6: Test Notifications

**From Firebase Console:**
1. Go to Cloud Messaging
2. Click "Send your first message"
3. Title: "Test Notification"
4. Text: "Testing from Firebase!"
5. Select your app
6. Send!

**From Admin Panel:**
1. Build and run app on phone
2. Open app → Allow notifications
3. Go to /notifications/admin
4. Send test notification
5. Check your phone!

---

## 4. Publishing to Play Store

### Step 1: Create Play Console Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with Google account
3. Pay $25 registration fee (one-time)
4. Complete developer profile
5. Verify email

### Step 2: Prepare Store Assets

**App Icon** (512x512px PNG)
- Transparent background
- Your AlClean logo

**Feature Graphic** (1024x500px JPG/PNG)
- Banner with logo + tagline

**Screenshots** (4-6 images, 1080x1920px portrait)
- Home page
- Product listing
- Product detail
- Shopping cart
- Checkout

**Use Android emulator to capture perfect screenshots:**
- Open emulator
- Navigate to each page
- Click camera icon in emulator toolbar

### Step 3: Write App Description

**Short Description** (80 chars max):
\`\`\`
Premium cleaning products for home & business in Pakistan
\`\`\`

**Full Description** (4000 chars max):
\`\`\`
🧼 AlClean - Your Trusted Source for Premium Cleaning Products

Welcome to AlClean, Pakistan's premier destination for high-quality 
cleaning chemicals and equipment.

✨ FEATURES:
• 20+ Premium cleaning products
• 9 Chemical categories & 11 Equipment categories
• Fast delivery across Pakistan
• COD & Bank Transfer payment
• Easy search and filtering
• Order tracking

🚚 DELIVERY:
• Major Cities: Rs. 200 flat (Karachi, Lahore, Islamabad, Rawalpindi)
• Other Cities: Rs. 50/kg

🧴 CLEANING CHEMICALS:
All-Purpose Cleaners • Disinfectants • Floor Cleaners • Glass Cleaners
Bathroom Cleaners • Kitchen Degreasers • Carpet Cleaners • Specialty Solutions

🧹 CLEANING EQUIPMENT:
Mops & Buckets • Brooms • Vacuum Cleaners • Pressure Washers
Safety Equipment • Professional Tools • And more!

💚 WHY ALCLEAN?
Premium quality • Competitive pricing • Reliable delivery
Excellent customer service • Trusted by businesses

Download now for hassle-free shopping!
\`\`\`

### Step 4: Create Privacy Policy

Use [privacypolicygenerator.info](https://www.privacypolicygenerator.info/)

**Required sections:**
- What data collected: Name, address, phone (for orders)
- How used: Order fulfillment, delivery
- Data security measures
- User rights

Host on your website or use a free host.

### Step 5: Create App in Play Console

1. Click "Create app"
2. App name: **AlClean**
3. Default language: English (US)
4. App or game: App
5. Free or paid: Free
6. Accept policies

### Step 6: Complete All Sections

**App Content:**
- [ ] App access: All features available
- [ ] Ads: No ads
- [ ] Content rating: Complete questionnaire (likely "Everyone")
- [ ] Target audience: 13+
- [ ] Data safety: What data you collect
- [ ] Privacy policy: Your URL

**Store Listing:**
- [ ] App icon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots (4-8 images)
- [ ] Short description
- [ ] Full description
- [ ] App category: Shopping
- [ ] Email: support@alclean.com

**Countries:**
- [ ] Select Pakistan (and others if desired)

### Step 7: Upload AAB & Submit

1. Go to "Production" → "Create new release"
2. Upload \`app-release.aab\`
3. Version: 1.0.0
4. Release notes:
   \`\`\`
   🎉 Initial release of AlClean

   • Browse 20+ premium cleaning products
   • Easy ordering with COD or bank transfer
   • Track your orders
   • Fast delivery across Pakistan
   \`\`\`
5. Click "Review release"
6. Fix any errors
7. Click "Start rollout to Production"

### Step 8: Wait for Review

- **Review time:** 1-3 days (usually)
- **Email notifications:** Google sends updates
- **If approved:** App goes live! 🎉
- **If rejected:** Read email, fix issues, resubmit

---

## 5. Troubleshooting

### Build Errors

**Error: Module not found**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Error: Port already in use**
\`\`\`bash
npx kill-port 5173
# Or restart computer
\`\`\`

**Error: Gradle sync failed**
\`\`\`bash
cd android
./gradlew clean
cd ..
npx cap sync android
\`\`\`

### Android Studio Issues

**Gradle build slow:**
- First build takes 10-15 minutes (normal)
- Subsequent builds are faster
- Close other apps to free RAM

**Emulator won't start:**
- Enable virtualization in BIOS
- Or use real device instead

**App crashes on launch:**
- Check AndroidManifest.xml permissions
- Check Logcat for errors
- Verify all assets copied

### Notification Issues

**Not receiving notifications:**
- Check internet connection
- Verify notification permission granted
- Check Firebase config is correct
- Ensure FCM token generated

**Notifications work in browser but not Android:**
- Add google-services.json to Android
- Add FCM dependency to build.gradle
- Sync and rebuild

### Play Store Rejection

**Common reasons:**
- Missing privacy policy
- Incomplete store listing
- Missing required screenshots
- Content policy violation

**How to fix:**
1. Read rejection email carefully
2. Fix exact issues mentioned
3. Resubmit

---

## 📚 Quick Reference

### Important Commands

\`\`\`bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Capacitor
npx cap sync android     # Sync web to Android
npx cap open android     # Open Android Studio
npx cap add android      # Add Android (first time)

# Cleanup
npm install              # Install dependencies
rm -rf node_modules      # Remove node_modules
\`\`\`

### Important Files

\`\`\`
lib/mockData.ts          # Edit products
lib/categories.ts        # Edit categories
styles/globals.css       # Edit colors
capacitor.config.ts      # App configuration
android/app/build.gradle # Android version
\`\`\`

### Important URLs

- Firebase Console: console.firebase.google.com
- Play Console: play.google.com/console
- Android Studio: developer.android.com/studio

---

## ✅ Final Checklist

Before launching:

- [ ] Logo added to all sizes
- [ ] Brand colors updated
- [ ] Contact info updated
- [ ] Products customized
- [ ] Tested in browser
- [ ] Tested in emulator
- [ ] Tested on real phone
- [ ] All features working
- [ ] Keystore backed up
- [ ] Signed AAB generated
- [ ] Store assets prepared
- [ ] Privacy policy created
- [ ] Play Console account ready
- [ ] All sections completed
- [ ] App submitted for review

---

## 🎉 You're Done!

Follow this guide step-by-step and you'll have your app live on Play Store in 1-2 weeks!

**Questions?** Check:
1. This guide (SETUP_GUIDE.md)
2. Main README (README.md)
3. Launch checklist (TODO.md)
4. Browser console for errors (F12)

**Good luck! 🚀🧼📱**
