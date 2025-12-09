# 🚀 START HERE - AlClean App Setup

## 🔴 Current Issue

Your app is showing this error:

```
⚠️  SHOPIFY NOT CONFIGURED
Missing required environment variables:
  - VITE_SHOPIFY_STORE_DOMAIN
  - VITE_SHOPIFY_STOREFRONT_TOKEN
```

## ✅ What I Just Did For You

I've created a `.env` file with most values already filled in. **You just need to add ONE thing:**

Your **Shopify Storefront API Token**

---

## 🎯 What You Need to Do (5 Minutes)

### Step 1: Get Your Token from Shopify

1. **Go here:** https://alclean-pk.myshopify.com/admin/settings/apps/development

2. **Click on your app** (or create new app if you don't have one)

3. **Click "Configuration" tab** → Find "Storefront API integration" → Click "Configure"

4. **Check these boxes:**
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`

5. **Click "Save"**

6. **If you see "Install app" button, click it**

7. **Click "API credentials" tab** → Copy the **Storefront API access token**

### Step 2: Add Token to Your .env File

1. **Open the file:** `/.env` (in your project root folder)

2. **Find this line:**
   ```env
   VITE_SHOPIFY_STOREFRONT_TOKEN=YOUR_STOREFRONT_TOKEN_HERE
   ```

3. **Replace** `YOUR_STOREFRONT_TOKEN_HERE` with your actual token

4. **Save the file**

### Step 3: Restart Your Dev Server

```bash
# Press Ctrl+C to stop the server
# Then run:
npm run dev
```

---

## ✅ How to Know It Worked

After restarting, open your browser and check the console (press F12):

### ✅ SUCCESS - You should see:
```
[Shopify] Loaded 50 total products
[Shopify] Collection "supreme-offer": 10 products
```

### ❌ STILL BROKEN - You'll still see:
```
⚠️  SHOPIFY NOT CONFIGURED
```

If still broken:
- Double-check the token is correct (no extra spaces)
- Make sure you saved the `.env` file
- Make sure you restarted the server completely

---

## 📚 Need More Help?

### If you're stuck getting the token:
👉 **[GET_YOUR_SHOPIFY_TOKEN.md](./GET_YOUR_SHOPIFY_TOKEN.md)** - Step-by-step with screenshots

### If you want to track your progress:
👉 **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Complete checklist

### If you want ALL the details:
👉 **[ENV_SETUP_COMPLETE_GUIDE.md](./ENV_SETUP_COMPLETE_GUIDE.md)** - Full guide

---

## 🎯 Quick Reference

### Your Store Info (Already Configured):
- ✅ Store Domain: `alclean-pk.myshopify.com`
- ✅ Admin API Token: `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`
- ✅ Backend URL: `http://localhost:3001`

### What You Still Need:
- ❌ **Storefront API Token** - Get from Shopify Admin

---

## 💡 Why Do You Need This Token?

- **Admin API Token** (you have) = For creating orders
- **Storefront API Token** (you need) = For reading products

Your app needs to READ products to display them. That's why it won't work without the Storefront token.

---

## 🔒 Security Note

The `.env` file is already protected:
- ✅ Listed in `.gitignore` (won't be committed to Git)
- ✅ Only you have it
- ✅ Safe to store local credentials

---

**That's it! Just get the token from Shopify, add it to `.env`, restart, and you're done!** 🎉
