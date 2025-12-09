# 🔐 Complete Environment Variables Setup Guide

This guide will help you set up all required environment variables for both frontend and backend.

---

## 📋 Quick Setup Checklist

- [ ] Frontend `.env` file created
- [ ] Backend `server/.env` file created  
- [ ] Shopify Storefront API token obtained
- [ ] Shopify Admin API token verified
- [ ] Firebase credentials obtained
- [ ] Both dev servers restarted

---

## 🎯 Frontend Environment Variables

### Location: `/.env` (project root)

```env
# ============================================
# SHOPIFY CONFIGURATION
# ============================================

# Your Shopify store domain (without https://)
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com

# Shopify Storefront API Access Token
# Get from: Shopify Admin > Settings > Apps > Develop apps > 
# Your App > API credentials > Storefront API access token
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_here

# Shopify Admin API Token (for order creation)
VITE_SHOPIFY_ADMIN_API_TOKEN=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

# Shopify API Version
VITE_SHOPIFY_API_VERSION=2025-07

# ============================================
# FIREBASE CONFIGURATION (Frontend)
# ============================================

# Get these from: Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=app-notification-5e56b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-notification-5e56b
VITE_FIREBASE_STORAGE_BUCKET=app-notification-5e56b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Cloud Messaging VAPID Key
# Get from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# ============================================
# BACKEND API CONFIGURATION
# ============================================

# Backend server URL - Local development
VITE_BACKEND_URL=http://localhost:3001

# Backend server URL - Mobile testing on same network
# VITE_BACKEND_URL=http://192.168.20.107:3001
```

---

## 🖥️ Backend Environment Variables

### Location: `/server/.env`

```env
# ============================================
# SERVER CONFIGURATION
# ============================================

PORT=3001
NODE_ENV=development

# ============================================
# SHOPIFY ADMIN API (Backend)
# ============================================

SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=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
SHOPIFY_API_VERSION=2025-07

# ============================================
# FIREBASE CLOUD MESSAGING (Backend)
# ============================================

# Firebase Server Key (for sending push notifications)
# Get from: Firebase Console > Project Settings > Cloud Messaging > Server key
FIREBASE_SERVER_KEY=your_firebase_server_key_here

# ============================================
# CORS CONFIGURATION
# ============================================

# Allowed origins (comma-separated)
# For local development
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.20.107:5173

# For production, add your production URLs
# ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

---

## 🔑 How to Get Each Credential

### 1. Shopify Storefront API Token (REQUIRED - Currently Missing!)

**This is what's causing your current errors!**

1. Go to: https://alclean-pk.myshopify.com/admin/settings/apps/development
2. Click on your app (or create new app "AlClean Mobile App")
3. Click **Configuration** tab
4. Scroll to **Storefront API integration**
5. Click **Configure**
6. Enable these scopes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`
7. Click **Save**
8. Click **API credentials** tab
9. If you don't see a token, click **Install app** first
10. Copy the **Storefront API access token**
11. Paste into frontend `.env` as `VITE_SHOPIFY_STOREFRONT_TOKEN`

### 2. Shopify Admin API Token (Already Have!)

You already have this: `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`

Add to:
- Frontend `.env` as `VITE_SHOPIFY_ADMIN_API_TOKEN`
- Backend `server/.env` as `SHOPIFY_ADMIN_API_TOKEN`

### 3. Firebase Credentials

**Frontend Config (7 values):**

1. Go to: https://console.firebase.google.com/
2. Select project: **app-notification-5e56b**
3. Click ⚙️ (Settings) > **Project settings**
4. Scroll to **Your apps** section
5. Click on your web app (or create one)
6. Copy all the config values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
   - `measurementId` → `VITE_FIREBASE_MEASUREMENT_ID`

**VAPID Key (Web Push):**

1. Same Firebase Console page
2. Click **Cloud Messaging** tab
3. Scroll to **Web configuration**
4. Under **Web Push certificates**, copy the **Key pair** value
5. Add to frontend `.env` as `VITE_FIREBASE_VAPID_KEY`

**Backend Server Key:**

1. Same **Cloud Messaging** tab
2. Copy **Server key** (starts with `AAAAxxx...`)
3. Add to backend `server/.env` as `FIREBASE_SERVER_KEY`

---

## ✅ Verification Steps

### After Setting Up Frontend .env:

1. **Stop your dev server** (Ctrl+C)
2. **Restart it:**
   ```bash
   npm run dev
   ```
3. **Check browser console** - you should see:
   - ✅ No "Shopify is not configured" errors
   - ✅ Products loading
   - ✅ Supreme Offers section populated

### After Setting Up Backend server/.env:

1. **Stop your backend server** (Ctrl+C)
2. **Restart it:**
   ```bash
   cd server
   npm run dev
   ```
3. **Test health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```
4. **Check for green badge** in app: "Backend Connected ✓"

---

## 🚨 Common Issues

### Issue: Still seeing "Shopify is not configured"

**Cause:** Environment variables not loaded

**Solution:**
1. Make sure `.env` file is in project root (same level as `package.json`)
2. Restart dev server completely (Ctrl+C then `npm run dev`)
3. Check for typos in variable names (must be EXACTLY as shown)
4. Make sure there are no spaces around the `=` sign

### Issue: Firebase push notifications not working

**Cause:** Missing or incorrect Firebase credentials

**Solution:**
1. Verify all 7 Firebase frontend variables are set
2. Verify VAPID key is correct (under Cloud Messaging > Web Push certificates)
3. Verify backend server key is correct
4. Check Firebase Console > Cloud Messaging for any errors

### Issue: Backend connection failed

**Cause:** Backend not running or wrong URL

**Solution:**
1. Make sure backend is running: `cd server && npm run dev`
2. Check `VITE_BACKEND_URL` matches where backend is running
3. For mobile testing, use your network IP (e.g., `http://192.168.20.107:3001`)

---

## 🔒 Security Reminders

⚠️ **IMPORTANT:**

1. **Never commit `.env` files to Git!**
   - Already protected by `.gitignore`
   
2. **Never share API tokens publicly**
   - Keep tokens in `.env` only
   - Use `.env.example` for sharing templates

3. **Different tokens for different purposes:**
   - Storefront API = Read products (safe for frontend)
   - Admin API = Create orders (must be protected)
   - Firebase keys = Different security levels

4. **Production deployment:**
   - Use environment variables in your hosting platform
   - Don't include `.env` in production builds
   - Rotate tokens if they're exposed

---

## 📚 Related Documentation

- **Quick Fix Guide:** [QUICK_FIX_SHOPIFY_ERROR.md](./QUICK_FIX_SHOPIFY_ERROR.md)
- **Detailed Storefront Setup:** [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md)
- **Main README:** [README.md](./README.md)

---

## 💡 Tips

1. **Use `.env.example` as a template:**
   ```bash
   cp .env.example .env
   cp .env.example server/.env
   ```
   Then fill in your actual values

2. **Test one service at a time:**
   - First: Get Shopify working (Storefront API)
   - Then: Test backend connection
   - Finally: Set up Firebase notifications

3. **Keep a backup of your tokens:**
   - Store them securely (password manager)
   - Don't lose access to Shopify Admin or Firebase Console

---

**Need help?** Check the browser console and backend terminal for specific error messages.
