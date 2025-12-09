# 🚀 Quick Start - Order Placement Fix

## ✅ What's Already Done

I've configured your Shopify credentials to fix the order placement issue:

### Backend (✅ Complete)
- Created `/server/.env` with your Admin API credentials
- Shopify Admin API token configured
- Store domain set to `alclean-pk.myshopify.com`
- CORS configured for local and mobile testing

### Frontend (⚠️ Action Required)
- Created `/.env` with partial configuration
- Admin API token configured
- **Missing:** Storefront API token (needed for fetching products)

## 🎯 What You Need to Do (5 Minutes)

### Step 1: Get Storefront API Token

Go to this URL:
```
https://alclean-pk.myshopify.com/admin/settings/apps/development
```

1. Click on your app (or create "AlClean Mobile App")
2. Configuration tab → Storefront API → Configure
3. Enable these scopes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_collection_listings`
4. Save → Install app
5. Go to "API credentials" tab
6. Copy the **Storefront API access token**

### Step 2: Add Token to .env

Open `/.env` file (in project root) and replace:
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_here
```

With your actual token:
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Start Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm install  # First time only
npm run dev
```

### Step 4: Test Order Placement

1. Open app in browser: `http://localhost:5173`
2. Browse products (they should load now)
3. Add items to cart
4. Go to checkout
5. Fill in details and place order
6. Order should appear in Shopify admin!

## 🧪 Verify Everything is Working

### Test Backend Connection

```bash
cd server
node test-shopify-connection.js
```

You should see:
```
✅ CONNECTION SUCCESSFUL!
📊 Shop Information:
   Shop Name:     AlClean PK
   ...
```

### Check Backend Health

Open in browser: `http://localhost:3001/health`

Should return:
```json
{
  "status": "ok",
  "shopify": {
    "configured": true,
    "store": "alclean-pk.myshopify.com"
  }
}
```

## 📱 Mobile Testing

To test on your Android device (IP: 192.168.20.107):

1. Update `/.env`:
   ```env
   VITE_API_URL=http://192.168.20.107:3001
   ```

2. Restart both servers

3. Access on mobile: `http://192.168.20.107:5173`

## 🔍 Troubleshooting

### Products not loading?
→ Add Storefront API token (Step 1-2 above)

### Backend connection error?
→ Make sure backend is running: `cd server && npm run dev`

### Orders not creating in Shopify?
→ Check backend console logs for errors
→ Run test script: `node server/test-shopify-connection.js`

### "Shopify credentials not configured"?
→ Check `/server/.env` exists and has correct values

## 📊 What Happens When You Place an Order

1. ✅ Order saved locally (for offline access)
2. ✅ Sent to backend API
3. ✅ Backend creates draft order in Shopify
4. ✅ Draft order completed (becomes actual order)
5. ✅ Order appears in Shopify admin dashboard
6. ✅ Customer gets push notification (if Firebase configured)
7. ✅ Order trackable via tracking page

## 📝 Your Credentials (Summary)

### Already Configured ✅
- Store: `alclean-pk.myshopify.com`
- Admin API Token: `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`
- API Key: `346606290edaaf285ad9a0f496e1de51`
- API Password: `868dba6a24bce1fbc240e3aac35534d7`

### You Need to Add ⚠️
- Storefront API Token: Get from Shopify Admin (see Step 1)

## 🎉 That's It!

Once you add the Storefront API token and restart the servers, everything will work perfectly!

**Priority:** Get the Storefront API token (takes 2 minutes) → Add to `.env` → Restart server → Test! 🚀

---

**Need help?** Check these files:
- Detailed guide: [SHOPIFY_ORDER_FIX_COMPLETE.md](./SHOPIFY_ORDER_FIX_COMPLETE.md)
- Environment setup: [ENV_SETUP_COMPLETE_GUIDE.md](./ENV_SETUP_COMPLETE_GUIDE.md)
- Storefront API: [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md)
