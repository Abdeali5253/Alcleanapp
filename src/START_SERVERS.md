# 🚀 Start Your AlClean App

## ✅ Prerequisites Checklist

Before starting the servers, make sure you have:

- [x] ✅ Created `/.env` file (already created)
- [x] ✅ Created `/server/.env` file (already created)
- [ ] ⚠️ Added Storefront API token to `/.env` file
- [ ] ⚠️ Installed backend dependencies

## 🎯 Quick Start

### Step 1: Install Backend Dependencies (First Time Only)

```bash
cd server
npm install
cd ..
```

### Step 2: Start Backend Server

Open **Terminal 1** and run:

```bash
cd server
npm run dev
```

You should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AlClean Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3001
🌍 Environment: development
🛍️  Shopify Store: alclean-pk.myshopify.com
🔔 Firebase: Not configured
🔗 CORS Allowed: http://localhost:5173, http://192.168.20.107:5173
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Start Frontend Server

Open **Terminal 2** and run:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.20.107:5173/
  ➜  press h + enter to show help
```

### Step 4: Open the App

**On Computer:**
- Open browser: `http://localhost:5173`

**On Mobile (same WiFi):**
- Open browser: `http://192.168.20.107:5173`

## ✅ Verify Everything is Working

### Check 1: Backend Health

Open in browser: `http://localhost:3001/health`

**Should return:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T...",
  "shopify": {
    "configured": true,
    "store": "alclean-pk.myshopify.com"
  }
}
```

### Check 2: Shopify Connection

```bash
cd server
node test-shopify-connection.js
```

**Should show:**
```
✅ CONNECTION SUCCESSFUL!
📊 Shop Information:
   Shop Name:     AlClean PK
   ...
```

### Check 3: Frontend Products

Open browser console (F12) and look for:
```
[Shopify] Loaded XX total products
[Shopify] Product distribution: ...
```

If you see "Shopify not configured" error:
→ Add Storefront API token to `/.env` (see below)

## ⚠️ If Products Don't Load

You need to add the **Storefront API token** to `/.env` file:

### Quick Fix:

1. **Get token from Shopify:**
   ```
   https://alclean-pk.myshopify.com/admin/settings/apps/development
   ```
   - Click your app → Configuration → Storefront API → Configure
   - Enable: `unauthenticated_read_product_listings` and `unauthenticated_read_collection_listings`
   - Save → Install app
   - Copy token from "API credentials" tab

2. **Add to /.env:**
   Open `/.env` and update:
   ```env
   VITE_SHOPIFY_STOREFRONT_TOKEN=paste_your_token_here
   ```

3. **Restart frontend:**
   - Stop server (Ctrl+C in Terminal 2)
   - Run `npm run dev` again

## 📱 Mobile Testing Setup

### For Mobile Device Testing:

1. **Make sure both devices are on same WiFi**

2. **Update /.env for mobile backend access:**
   ```env
   VITE_API_URL=http://192.168.20.107:3001
   ```

3. **Restart frontend server**

4. **Access on mobile:**
   ```
   http://192.168.20.107:5173
   ```

## 🛒 Test Order Placement

1. ✅ Browse products (should load from Shopify)
2. ✅ Add items to cart
3. ✅ Login to account
4. ✅ Go to checkout
5. ✅ Fill in customer details
6. ✅ Choose payment method
7. ✅ Place order

**Order should:**
- ✅ Save locally
- ✅ Create draft order in Shopify
- ✅ Complete to actual order
- ✅ Appear in Shopify Admin Dashboard
- ✅ Show success message with order number

## 🔍 Troubleshooting

### Backend won't start

**Error:** `Cannot find module 'express'`
```bash
cd server
npm install
npm run dev
```

### Frontend won't start

**Error:** Dependencies issue
```bash
npm install
npm run dev
```

### Products not loading

**Error:** "Shopify not configured"
- Add Storefront API token to `/.env`
- Restart frontend server

### Orders not creating

**Error:** Backend connection failed
- Make sure backend is running
- Check `VITE_API_URL` in `/.env` matches backend URL
- Verify backend is accessible: `http://localhost:3001/health`

### Mobile can't access

**Error:** Network error
- Both devices on same WiFi?
- Update `VITE_API_URL` to `http://192.168.20.107:3001`
- Check firewall isn't blocking port 5173 and 3001

## 📊 Environment Files Status

### /.env (Frontend)
| Variable | Status |
|----------|--------|
| VITE_SHOPIFY_STORE_DOMAIN | ✅ Set |
| VITE_SHOPIFY_ADMIN_API_TOKEN | ✅ Set |
| VITE_SHOPIFY_STOREFRONT_TOKEN | ⚠️ You need to add |
| VITE_SHOPIFY_API_VERSION | ✅ Set |
| VITE_API_URL | ✅ Set |

### /server/.env (Backend)
| Variable | Status |
|----------|--------|
| SHOPIFY_STORE_DOMAIN | ✅ Set |
| SHOPIFY_ADMIN_API_TOKEN | ✅ Set |
| SHOPIFY_API_VERSION | ✅ Set |
| PORT | ✅ Set |
| ALLOWED_ORIGINS | ✅ Set |

## 🎯 What Works Right Now

✅ Backend server
✅ Shopify Admin API integration
✅ Order creation system
✅ Draft order management
✅ CORS for mobile testing
✅ Health check endpoint
✅ Order tracking system

## ⚠️ What You Need to Add

- **Storefront API Token** - For fetching products (2 minutes to get)
- **Firebase Credentials** - For push notifications (optional)

## 📖 More Help

- **Quick Start:** [QUICK_START_ORDER_PLACEMENT.md](./QUICK_START_ORDER_PLACEMENT.md)
- **Complete Fix Guide:** [SHOPIFY_ORDER_FIX_COMPLETE.md](./SHOPIFY_ORDER_FIX_COMPLETE.md)
- **Order Fix Summary:** [ORDER_PLACEMENT_FIXED.md](./ORDER_PLACEMENT_FIXED.md)
- **Detailed Setup:** [ENV_SETUP_COMPLETE_GUIDE.md](./ENV_SETUP_COMPLETE_GUIDE.md)

---

## 🎉 Ready to Go!

Once you add the Storefront API token, everything will work perfectly! 🚀

**Priority:** Get Storefront API token → Add to `/.env` → Restart → Test!
