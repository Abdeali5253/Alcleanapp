# ✅ AlClean App Setup Checklist

Use this checklist to track your setup progress.

---

## 🎯 Critical Setup (Required for App to Work)

### Shopify Storefront API Token ⚠️ **BLOCKING YOUR APP**

- [ ] Opened Shopify Admin: https://alclean-pk.myshopify.com/admin
- [ ] Navigated to Settings → Apps and sales channels → Develop apps
- [ ] Opened/Created app: "AlClean Mobile App"
- [ ] Configured Storefront API scopes (Configuration tab)
  - [ ] `unauthenticated_read_product_listings`
  - [ ] `unauthenticated_read_product_inventory`
  - [ ] `unauthenticated_read_product_tags`
  - [ ] `unauthenticated_read_collection_listings`
- [ ] Clicked Save
- [ ] Installed app (if needed)
- [ ] Copied Storefront API token from API credentials tab
- [ ] Added token to `/.env` file as `VITE_SHOPIFY_STOREFRONT_TOKEN`
- [ ] Restarted dev server (`npm run dev`)
- [ ] Verified products are loading in browser

**Status:** 🔴 **INCOMPLETE - App won't work without this**

---

## 📁 Files Created

- [x] `/.env` - Main environment file (contains your secrets)
- [x] `/.env.example` - Template file (safe to commit)
- [x] Documentation files created

---

## 🔧 Environment Variables Status

### Frontend (/.env)

#### Shopify Configuration
- [x] `VITE_SHOPIFY_STORE_DOMAIN` - ✅ Set to `alclean-pk.myshopify.com`
- [ ] `VITE_SHOPIFY_STOREFRONT_TOKEN` - ❌ **NEEDS YOUR TOKEN**
- [x] `VITE_SHOPIFY_ADMIN_API_TOKEN` - ✅ Set
- [x] `VITE_SHOPIFY_API_VERSION` - ✅ Set to `2025-07`

#### Firebase Configuration (Optional for now)
- [ ] `VITE_FIREBASE_API_KEY` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_PROJECT_ID` - ✅ Set
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_APP_ID` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` - ⚠️ Placeholder
- [ ] `VITE_FIREBASE_VAPID_KEY` - ⚠️ Placeholder

#### Backend Configuration
- [x] `VITE_BACKEND_URL` - ✅ Set to `http://localhost:3001`

---

## 🖥️ Backend Setup (Optional - For Orders & Notifications)

### Backend Environment Variables (/server/.env)

- [ ] Created `/server/.env` file
- [ ] `SHOPIFY_STORE_DOMAIN` - Set
- [ ] `SHOPIFY_ADMIN_API_TOKEN` - Set
- [ ] `FIREBASE_SERVER_KEY` - Set
- [ ] `ALLOWED_ORIGINS` - Set
- [ ] Backend server running (`cd server && npm run dev`)

**Status:** ⚠️ Optional (but needed for order creation and push notifications)

---

## 🧪 Testing Checklist

### After Adding Storefront Token:
- [ ] Dev server restarted
- [ ] No "SHOPIFY NOT CONFIGURED" errors in console
- [ ] Home page loads without errors
- [ ] Products appear on home page
- [ ] Supreme Offers section shows products
- [ ] Can click on products to see details
- [ ] Can add products to cart

### Backend Connection (If Backend is Running):
- [ ] Green "Backend Connected ✓" badge visible in app
- [ ] Can complete checkout
- [ ] Orders appear in Shopify Admin

### Firebase Notifications (If Configured):
- [ ] Notification permission prompt appears
- [ ] Can receive test notifications
- [ ] Notifications appear in inbox

---

## 📚 Quick Reference

### What You Need RIGHT NOW:
1. **Shopify Storefront API Token** - See [GET_YOUR_SHOPIFY_TOKEN.md](./GET_YOUR_SHOPIFY_TOKEN.md)

### What You Need LATER:
2. Firebase credentials (for push notifications)
3. Backend setup (for order creation)

### Help Documents:
- 🚀 **Quick Start:** [GET_YOUR_SHOPIFY_TOKEN.md](./GET_YOUR_SHOPIFY_TOKEN.md)
- ⚡ **Quick Fix:** [QUICK_FIX_SHOPIFY_ERROR.md](./QUICK_FIX_SHOPIFY_ERROR.md)
- 📖 **Detailed Guide:** [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md)
- 🔐 **Complete Guide:** [ENV_SETUP_COMPLETE_GUIDE.md](./ENV_SETUP_COMPLETE_GUIDE.md)

---

## 🎯 Your Next Step

**Right now, you need to:**

1. Go to: https://alclean-pk.myshopify.com/admin/settings/apps/development
2. Get your Storefront API token
3. Add it to `/.env` file
4. Restart dev server

**That's it!** Once you do this, your app will start working.

---

## 💡 Pro Tip

You can test if your token works by checking the browser console after restarting the dev server. You should see:

```
[Shopify] Loaded 50 total products
[Shopify] Collection "supreme-offer": 10 products
```

Instead of:
```
⚠️ SHOPIFY NOT CONFIGURED
```

---

**Last Updated:** After creating `.env` file  
**Status:** 🔴 Waiting for Shopify Storefront API token
