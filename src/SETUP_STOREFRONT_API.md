# 🔧 Fix: Shopify Storefront API Setup

## Problem

You're seeing these errors:
```
[Shopify] Error fetching collection "supreme-offer": Error: Shopify is not configured. 
Please add VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN to your .env file.
```

## Why This Happens

You have the **Admin API token** configured (`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`), but the app also needs a **Storefront API token** to fetch products and collections.

### Two Different Shopify APIs:

1. **Admin API** - Used for creating orders (you have this ✅)
2. **Storefront API** - Used for fetching products, collections, etc. (you need this ❌)

## Solution: Get Your Storefront API Token

### Step 1: Create Storefront API Access

1. Go to your Shopify Admin: https://alclean-pk.myshopify.com/admin
2. Click **Settings** (bottom left)
3. Click **Apps and sales channels**
4. Click **Develop apps**
5. Either:
   - Click on your existing app **"AlClean Mobile App"**, OR
   - Create a new app if you don't have one

### Step 2: Configure Storefront API Scopes

1. Click on **Configuration** tab
2. Scroll to **Storefront API integration**
3. Click **Configure**
4. Enable these scopes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`
   
5. Click **Save**

### Step 3: Install App and Get Token

1. Click **API credentials** tab
2. Under **Storefront API access token** section:
   - If you don't see a token, click **Install app** button first
   - Copy the **Storefront API access token** (starts with something like `shpat_...` or a long alphanumeric string)

### Step 4: Add to Your .env File

1. Open your `.env` file (create one if it doesn't exist)
2. Add these lines:

```env
# Shopify Configuration
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=paste_your_storefront_token_here
VITE_SHOPIFY_ADMIN_API_TOKEN=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
VITE_SHOPIFY_API_VERSION=2025-07

# Backend URL
VITE_BACKEND_URL=http://localhost:3001

# For mobile testing, use:
# VITE_BACKEND_URL=http://192.168.20.107:3001
```

3. Replace `paste_your_storefront_token_here` with the actual token you copied

### Step 5: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification

After restarting, you should see:
- ✅ No more "Shopify is not configured" errors
- ✅ Products loading on the home page
- ✅ Supreme Offers section showing products
- ✅ Categories showing products

## Additional Firebase Setup (If Needed)

If you also see Firebase errors, you'll need to add Firebase credentials to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=app-notification-5e56b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-notification-5e56b
VITE_FIREBASE_STORAGE_BUCKET=app-notification-5e56b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

Get these from: [Firebase Console](https://console.firebase.google.com/) > Project Settings > General

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to Git
- The `.gitignore` file should already exclude `.env`
- Use `.env.example` as a template for other developers
- All sensitive tokens should remain in `.env` only

## Need Help?

If you're still seeing errors after following these steps:

1. Check browser console for specific error messages
2. Verify your Storefront API token is correct (no extra spaces)
3. Ensure your Shopify app has the correct scopes enabled
4. Make sure products are published in your Shopify store
5. Check that collections exist with the handles: `supreme-offer`, `top-cleaning-equipment`, etc.

---

**Quick Checklist:**
- [ ] Created/found Shopify app in Admin
- [ ] Enabled Storefront API scopes
- [ ] Copied Storefront API token
- [ ] Added token to `.env` file
- [ ] Restarted dev server
- [ ] Verified products are loading
