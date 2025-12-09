# ⚡ Quick Fix: Shopify Configuration Errors

## The Error You're Seeing

```
[Shopify] Error fetching collection "supreme-offer": Error: Shopify is not configured. 
Please add VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN to your .env file.
```

## 🎯 Quick Solution (5 Minutes)

### Step 1: Get Your Storefront API Token

1. Open: https://alclean-pk.myshopify.com/admin/settings/apps/development
2. Click your app (or create new app)
3. Go to **Configuration** → **Storefront API** → **Configure**
4. Enable these:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
5. Click **Save**
6. Go to **API credentials** tab
7. Copy the **Storefront API access token**

### Step 2: Create/Update Your .env File

Create a file named `.env` in your project root with:

```env
# Shopify Store Configuration
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=paste_token_from_step1_here
VITE_SHOPIFY_ADMIN_API_TOKEN=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
VITE_SHOPIFY_API_VERSION=2025-07

# Backend URL (adjust for your setup)
VITE_BACKEND_URL=http://localhost:3001
```

### Step 3: Restart Dev Server

```bash
# Press Ctrl+C to stop current server
# Then restart:
npm run dev
```

## ✅ Verification

After restart, you should see:
- ✅ Products loading on home page
- ✅ Supreme Offers section populated
- ✅ No more "Shopify is not configured" errors in console

## 🔍 Still Not Working?

### Check 1: Verify Token Format
Your Storefront token should look like:
- `shpat_xxxxxxxxxxxxx` OR
- A long alphanumeric string (32+ characters)

### Check 2: Verify Store Domain
Should be: `alclean-pk.myshopify.com` (without `https://`)

### Check 3: Check Console
Open browser console (F12) and look for specific error messages

## 📚 Need More Help?

See detailed guide: [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md)

---

**TL;DR:** You need a **Storefront API token** (different from Admin API token) in your `.env` file.
