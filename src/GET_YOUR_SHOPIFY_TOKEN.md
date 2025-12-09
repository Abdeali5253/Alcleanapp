# 🔑 How to Get Your Shopify Storefront API Token

## Current Status
✅ `.env` file created  
❌ Missing: **Storefront API Token**

The app can't load products without this token. Follow these steps to get it:

---

## Step-by-Step Instructions

### 1. Open Your Shopify Admin
Go to: **https://alclean-pk.myshopify.com/admin**

### 2. Navigate to Apps
- Click **Settings** (bottom left corner)
- Click **Apps and sales channels**
- Click **Develop apps** button

### 3. Open or Create Your App
**If you already have an app:**
- Click on **"AlClean Mobile App"** (or whatever you named it)

**If you don't have an app yet:**
- Click **Create an app**
- Name it: `AlClean Mobile App`
- Click **Create app**

### 4. Configure Storefront API Scopes
- Click the **Configuration** tab
- Scroll down to **Storefront API integration** section
- Click **Configure** button
- Check these boxes:
  - ✅ `unauthenticated_read_product_listings`
  - ✅ `unauthenticated_read_product_inventory`
  - ✅ `unauthenticated_read_product_tags`
  - ✅ `unauthenticated_read_collection_listings`
- Click **Save** button

### 5. Install the App (If Not Already Installed)
- You might see an **Install app** button at the top
- Click it if you see it
- Confirm the installation

### 6. Get Your Token
- Click the **API credentials** tab (at the top)
- Scroll down to **Storefront API access token** section
- You should see a token (it's a long string of letters and numbers)
- Click the **eye icon** or **copy button** to copy the token

### 7. Add Token to Your .env File
- Open the `/.env` file in your project
- Find this line:
  ```env
  VITE_SHOPIFY_STOREFRONT_TOKEN=YOUR_STOREFRONT_TOKEN_HERE
  ```
- Replace `YOUR_STOREFRONT_TOKEN_HERE` with your actual token:
  ```env
  VITE_SHOPIFY_STOREFRONT_TOKEN=shpss_abc123xyz789...
  ```
- Save the file

### 8. Restart Your Development Server
```bash
# Stop the server (press Ctrl+C in the terminal)
# Then restart:
npm run dev
```

---

## ✅ Verification

After restarting, check your browser console. You should see:
- ✅ No more "SHOPIFY NOT CONFIGURED" errors
- ✅ Products loading on the home page
- ✅ Supreme Offers section showing products
- ✅ Console logs showing: `[Shopify] Loaded X total products`

---

## 🎯 What Your Token Looks Like

Your Storefront API token will look something like one of these:

```
shpss_1234567890abcdef1234567890abcdef
```
or
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

It's usually 32+ characters long.

---

## 🚨 Troubleshooting

### "I don't see the Storefront API section"
**Solution:** You might not have created the app yet. Go back to Step 3 and create a new app.

### "I don't see a token under API credentials"
**Solution:** You need to install the app first. Look for an "Install app" button at the top of the page.

### "I see a token but it's different from what I expected"
**Solution:** Copy it exactly as shown, including all characters. Don't add spaces.

### "I added the token but still getting errors"
**Solution:** 
1. Make sure you saved the `.env` file
2. Make sure the token is on the line with `VITE_SHOPIFY_STOREFRONT_TOKEN=`
3. Make sure there are no extra spaces
4. Restart your dev server completely (Ctrl+C then `npm run dev`)

---

## 📸 Visual Guide

Here's what you're looking for in each step:

**Step 2:** Look for gear icon ⚙️ labeled "Settings"

**Step 3:** In Apps section, you'll see "Develop apps" button

**Step 4:** Look for "Storefront API integration" section with "Configure" button

**Step 6:** Under "API credentials" tab, look for "Storefront API access token" heading

---

## 🔒 Security Note

⚠️ This token is sensitive but less critical than your Admin API token because:
- It can only READ products (not modify them)
- It's designed to be used in frontend apps
- Still, never share it publicly or commit it to Git

---

## Need More Help?

If you're stuck, check:
- [QUICK_FIX_SHOPIFY_ERROR.md](./QUICK_FIX_SHOPIFY_ERROR.md) - Quick reference
- [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md) - Detailed guide
- [ENV_SETUP_COMPLETE_GUIDE.md](./ENV_SETUP_COMPLETE_GUIDE.md) - Complete guide

Or send a screenshot of what you're seeing in Shopify Admin.
