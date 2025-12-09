# 🚀 IMMEDIATE SETUP REQUIRED

## ⚠️ Current Status

✅ **Created:** Both `.env` files (frontend and backend)  
✅ **Configured:** Shopify Admin API token  
✅ **Configured:** Store domain  
❌ **MISSING:** Shopify Storefront API token (causing errors)  
❌ **MISSING:** Firebase credentials (optional for now)

---

## 🎯 NEXT STEP: Get Shopify Storefront API Token

**This is the CRITICAL missing piece causing your errors!**

### Step-by-Step Instructions:

1. **Go to Shopify Admin:**
   - Navigate to: https://alclean-pk.myshopify.com/admin/settings/apps/development

2. **Access Your App:**
   - Look for an existing app (e.g., "AlClean Mobile App" or similar)
   - OR click **"Create an app"** if you don't have one
     - Name: `AlClean Mobile App`
     - App developer: Choose yourself

3. **Configure Storefront API:**
   - Click on your app name
   - Go to **"Configuration"** tab
   - Scroll down to **"Storefront API integration"** section
   - Click **"Configure"**

4. **Enable Required Scopes:**
   Select these checkboxes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`
   
   Click **"Save"**

5. **Get the Access Token:**
   - Go to **"API credentials"** tab
   - If you see a message about installing the app, click **"Install app"**
   - Look for **"Storefront API access token"**
   - Click to reveal the token
   - Copy the entire token (it will be a long string)

6. **Add Token to .env File:**
   - Open `/.env` file in your project root
   - Find this line:
     ```env
     VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_here
     ```
   - Replace `your_storefront_token_here` with your actual token:
     ```env
     VITE_SHOPIFY_STOREFRONT_TOKEN=shpat_abc123xyz789...
     ```
   - Save the file

7. **Restart Your Dev Server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Expected Result

After adding the Storefront API token and restarting, you should see:

✅ No "Shopify is not configured" errors  
✅ Products loading on the home page  
✅ Supreme Offers section populated with products  
✅ All product collections working  

---

## 🔥 Quick Reference

### Your Current Configuration:

| Setting | Value | Status |
|---------|-------|--------|
| **Store Domain** | `alclean-pk.myshopify.com` | ✅ Set |
| **Admin API Token** | `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` | ✅ Set |
| **Storefront API Token** | Not set | ❌ **REQUIRED** |
| **API Version** | `2025-07` | ✅ Set |

### File Locations:

- **Frontend config:** `/.env`
- **Backend config:** `/server/.env`
- **Documentation:** `/ENV_SETUP_COMPLETE_GUIDE.md`

---

## 🆘 Troubleshooting

### Issue: Can't find Storefront API section

**Solution:** Make sure you're looking at a **Custom app** (not a Public/Private app from the old system)

### Issue: Token field is empty

**Solution:** You need to click **"Install app"** first

### Issue: Still getting errors after adding token

**Solution:**
1. Verify no spaces around the `=` sign in `.env`
2. Verify token was copied completely
3. Make sure you fully stopped and restarted the dev server
4. Check that `.env` file is in the project root (same level as `package.json`)

---

## 📱 Optional: Firebase Setup (For Push Notifications)

If you want to enable push notifications, you'll also need to get Firebase credentials.

See: `/ENV_SETUP_COMPLETE_GUIDE.md` section "3. Firebase Credentials"

**For now, you can skip this.** The app will work without notifications.

---

## 🎉 Once Working

After you get the Storefront API token and see products loading:

1. ✅ Test product browsing
2. ✅ Test adding items to cart
3. ✅ Test checkout flow
4. ✅ Verify mobile testing on `http://192.168.20.107:5173`

---

**⏰ Estimated Time:** 5-10 minutes to get the Storefront API token

**Need help?** Check browser console for specific error messages.
