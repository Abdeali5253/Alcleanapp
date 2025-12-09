# 📍 Exactly Where to Put Your Shopify Token

## 🎯 The File

Open this file in your code editor:
```
/.env
```

(It's in the root folder of your project, same level as `package.json`)

---

## 🔍 Find This Line

Look for **line 11** in the `.env` file:

```env
VITE_SHOPIFY_STOREFRONT_TOKEN=YOUR_STOREFRONT_TOKEN_HERE
```

---

## ✏️ Replace With Your Token

**BEFORE:**
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=YOUR_STOREFRONT_TOKEN_HERE
```

**AFTER:**
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=shpss_abc123xyz789yourActualTokenHere
```

---

## ⚠️ Important Rules

1. **No spaces** around the `=` sign
   - ✅ Good: `VITE_SHOPIFY_STOREFRONT_TOKEN=abc123`
   - ❌ Bad: `VITE_SHOPIFY_STOREFRONT_TOKEN = abc123`

2. **No quotes** around the token
   - ✅ Good: `VITE_SHOPIFY_STOREFRONT_TOKEN=abc123`
   - ❌ Bad: `VITE_SHOPIFY_STOREFRONT_TOKEN="abc123"`

3. **Copy the ENTIRE token** (usually 32+ characters)
   - Don't leave any part of the token out
   - Don't add any extra characters

4. **Save the file** after editing
   - Press Ctrl+S (Windows/Linux) or Cmd+S (Mac)

---

## 📝 Example of Complete .env File

After you add your token, your `.env` file should look like this:

```env
# ====================================
# SHOPIFY CONFIGURATION
# ====================================

# Your Shopify store domain (without https://)
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com

# Shopify Storefront API Access Token (for product fetching)
VITE_SHOPIFY_STOREFRONT_TOKEN=shpss_1234567890abcdef1234567890abcdef
                              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                              YOUR ACTUAL TOKEN GOES HERE

# Shopify Admin API Token (for order creation)
VITE_SHOPIFY_ADMIN_API_TOKEN=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

# Shopify API Version
VITE_SHOPIFY_API_VERSION=2025-07
```

---

## ✅ How to Verify You Did It Right

### 1. Check the line

Your line 11 should look like:
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=shpss_[long string of letters and numbers]
```

NOT like:
```env
VITE_SHOPIFY_STOREFRONT_TOKEN=YOUR_STOREFRONT_TOKEN_HERE
```

### 2. Check for common mistakes

- [ ] Did you remove `YOUR_STOREFRONT_TOKEN_HERE`?
- [ ] Did you paste your actual token?
- [ ] Are there no spaces around the `=`?
- [ ] Are there no quotes around the token?
- [ ] Did you save the file?

### 3. Restart the dev server

```bash
# Stop the server (Ctrl+C)
# Start it again:
npm run dev
```

### 4. Check the browser console

Open browser console (F12) and look for:

✅ **SUCCESS:**
```
[Shopify] Loaded 50 total products
```

❌ **STILL WRONG:**
```
⚠️  SHOPIFY NOT CONFIGURED
```

---

## 🆘 Still Not Working?

### Double-check these things:

1. **File name:** Must be exactly `.env` (not `.env.txt` or `env`)
2. **File location:** Must be in project root (same folder as `package.json`)
3. **Token copied correctly:** Copy the ENTIRE token from Shopify
4. **Server restarted:** Must stop and start again (Ctrl+C then `npm run dev`)
5. **No typos:** Variable name must be exactly `VITE_SHOPIFY_STOREFRONT_TOKEN`

### Token format check:

Your token should be one of these formats:
- `shpss_` followed by 32+ characters
- A long alphanumeric string (32-64 characters)

**Examples of VALID token formats:**
```
shpss_1234567890abcdef1234567890abcdef
abc123def456ghi789jkl012mno345pqr678
```

**Examples of INVALID (these won't work):**
```
YOUR_STOREFRONT_TOKEN_HERE  ← You forgot to replace this!
shpat_...                   ← This is Admin API token (wrong one)
(empty)                      ← You left it blank
```

---

## 🎯 Quick Troubleshooting

### Error: "SHOPIFY NOT CONFIGURED"
**Fix:** You haven't added the token yet, or it's wrong

### Error: Token is invalid
**Fix:** Make sure you copied the STOREFRONT token, not the ADMIN token

### Error: Products still not loading
**Fix:** 
1. Check browser console for specific error
2. Verify token in Shopify Admin
3. Make sure you restarted the dev server

---

## 📞 Need Help Getting the Token?

See [GET_YOUR_SHOPIFY_TOKEN.md](./GET_YOUR_SHOPIFY_TOKEN.md) for step-by-step instructions on getting the token from Shopify Admin.

---

**Remember:** After editing `.env`, you MUST restart the dev server for changes to take effect!
