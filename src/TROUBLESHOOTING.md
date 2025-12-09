# 🔧 AlClean App - Troubleshooting Guide

## 🚨 Error: "Failed to fetch" when creating Shopify orders

### Problem
You see this error in the browser console:
```
[Shopify] Error creating draft order: TypeError: Failed to fetch
[Order] Failed to create in Shopify, order saved locally only
```

### Cause
This happens because **Shopify Admin API cannot be called directly from the browser** due to CORS (Cross-Origin Resource Sharing) restrictions. The Admin API is designed to be called from a backend server only.

### Solution ✅

You need to create a backend PHP file that acts as a proxy between your app and Shopify.

**Step 1: Create the PHP file**

Create this file on your server:  
`https://app.albizco.com/api/create-shopify-order.php`

**Full PHP code is in:** `/BACKEND_PHP_FILES.md`

**Step 2: Upload to your server**

```bash
# Via FTP/SFTP, upload to:
/api/create-shopify-order.php

# Or via SSH:
scp create-shopify-order.php user@app.albizco.com:/path/to/api/
```

**Step 3: Set correct permissions**

```bash
chmod 644 /api/create-shopify-order.php
chmod 755 /api/
```

**Step 4: Test the endpoint**

```bash
# Test 1: Check if file is accessible
curl https://app.albizco.com/api/create-shopify-order.php

# Should return: {"success":false,"error":"Invalid JSON input"}
# (This is good! It means the file is working)

# Test 2: Send actual data
curl -X POST https://app.albizco.com/api/create-shopify-order.php \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST001",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+92 300 1234567",
    "customerAddress": "Test Address",
    "city": "Karachi",
    "items": [
      {
        "variantId": "gid://shopify/ProductVariant/49804537815359",
        "quantity": 1,
        "title": "Test Product",
        "price": 1000
      }
    ],
    "subtotal": 1000,
    "deliveryCharge": 200,
    "total": 1200,
    "paymentMethod": "cod"
  }'

# Should return: {"success":true,"draftOrderId":"...","orderId":"..."}
```

**Step 5: Place a test order in the app**

1. Go to your app
2. Add products to cart
3. Checkout and place order
4. Check browser console - should see: `[Shopify] Order created successfully`
5. Check Shopify Admin - order should appear with tag "alclean-app"

---

## 🔍 Other Common Issues

### Issue: Backend endpoint returns 404

**Symptoms:**
- `Failed to fetch` or `404 Not Found`
- Endpoint not accessible

**Solutions:**
1. Verify file path is correct: `/api/create-shopify-order.php`
2. Check web server configuration (Apache/Nginx)
3. Ensure directory has read permissions
4. Check for typos in URL

**Test:**
```bash
# Should NOT return 404
curl https://app.albizco.com/api/create-shopify-order.php
```

---

### Issue: Backend returns 500 Internal Server Error

**Symptoms:**
- `500 Internal Server Error`
- No order created in Shopify

**Solutions:**
1. Check PHP error logs:
   ```bash
   tail -f /var/log/php-errors.log
   tail -f /var/log/apache2/error.log
   ```

2. Common causes:
   - PHP syntax error (missing semicolon, bracket)
   - cURL extension not enabled
   - Wrong Shopify API credentials
   - Wrong API version

3. Enable error reporting in PHP:
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```

4. Test Shopify credentials:
   ```php
   // Add at top of create-shopify-order.php temporarily
   var_dump(SHOPIFY_DOMAIN);
   var_dump(SHOPIFY_ADMIN_TOKEN);
   exit;
   ```

---

### Issue: Shopify API returns authentication error

**Symptoms:**
- `Shopify API returned status code: 401`
- `Authentication failed`

**Solutions:**
1. Verify Admin API token is correct
2. Check token hasn't expired
3. Verify token has required permissions:
   - `write_draft_orders`
   - `read_products`
   - `read_customers`

**How to check/regenerate token:**
```
1. Go to Shopify Admin
2. Settings → Apps and sales channels
3. Develop apps → Select your app
4. API credentials → Admin API access token
5. Copy the token
6. Update in create-shopify-order.php:
   define('SHOPIFY_ADMIN_TOKEN', 'shpat_xxx');
```

---

### Issue: Order created locally but not in Shopify

**Symptoms:**
- Order appears in app's tracking page
- Order does NOT appear in Shopify Admin
- Console shows: "Failed to create in Shopify, order saved locally only"

**Solutions:**
1. Check if backend endpoint is uploaded
2. Verify endpoint returns successful response
3. Check browser console for detailed error
4. Test endpoint with curl (see above)

---

### Issue: CORS error when calling backend

**Symptoms:**
- `Access-Control-Allow-Origin` error
- Request blocked by CORS policy

**Solutions:**
1. Add CORS headers to PHP file (already included in provided code):
   ```php
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: POST, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type');
   ```

2. Handle OPTIONS preflight request:
   ```php
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       http_response_code(200);
       exit();
   }
   ```

3. Check Apache/Nginx configuration:
   ```apache
   # Apache .htaccess
   Header set Access-Control-Allow-Origin "*"
   ```

---

### Issue: Invalid variant ID error

**Symptoms:**
- `Invalid variant ID` error from Shopify
- Order fails to create

**Solutions:**
1. Verify products have variant IDs:
   ```javascript
   // In browser console
   const products = JSON.parse(localStorage.getItem('shopify_products'))
   products.forEach(p => console.log(p.title, p.variantId))
   ```

2. Check variant ID format:
   - Correct: `gid://shopify/ProductVariant/12345`
   - Wrong: `12345` or `ProductVariant/12345`

3. Re-fetch products from Shopify:
   - Go to Products page
   - Refresh the page
   - Products should load with correct variant IDs

---

### Issue: Notifications not showing

**Symptoms:**
- No browser notification appears
- No notification in inbox

**Solutions:**
1. Check notification permission:
   ```javascript
   // In browser console
   Notification.permission
   // Should be: "granted"
   ```

2. Request permission:
   ```javascript
   // In browser console
   await Notification.requestPermission()
   ```

3. Test notifications:
   - Go to `/notifications/admin`
   - Create test notification
   - Should appear in `/notifications` inbox

4. Check notification settings:
   - Go to `/notifications/settings`
   - Enable all notification types

---

### Issue: Tracking data not syncing

**Symptoms:**
- Tracking number doesn't update
- Order status stays as "pending"

**Solutions:**
1. Verify tracking API is accessible:
   ```bash
   curl https://app.albizco.com/end_points/get_tracking.php
   ```

2. Check phone number format matches:
   - User profile: `+92 300 1234567`
   - Tracking API: `923001234567` or `03001234567`
   - App removes all non-digits for matching

3. Check order number matches:
   - App order: `AC820456`
   - Tracking API `order_id`: `AC820456`

4. Manually trigger sync:
   - Go to `/tracking`
   - Click "Sync" button
   - Check browser console for errors

---

## 🛠️ Debugging Tools

### Browser Console Commands

```javascript
// Check orders
JSON.parse(localStorage.getItem('alclean_orders'))

// Check notifications
JSON.parse(localStorage.getItem('notifications'))

// Check current user
JSON.parse(localStorage.getItem('alclean_user'))

// Test notification
notificationService.sendNotification({
  title: 'Test',
  body: 'Testing notification',
  type: 'general'
})

// Clear all data (fresh start)
localStorage.clear()
location.reload()
```

### Server Commands

```bash
# Check PHP errors
tail -f /var/log/php-errors.log

# Check Apache errors
tail -f /var/log/apache2/error.log

# Test endpoint
curl -I https://app.albizco.com/api/create-shopify-order.php

# Check file permissions
ls -la /path/to/api/create-shopify-order.php
```

### Shopify Admin

```
# Check orders
Shopify Admin → Orders → Filter by tag: "alclean-app"

# Check API credentials
Settings → Apps and sales channels → Develop apps

# Check API logs
Settings → Notifications → Webhooks (for API activity logs)
```

---

## 📋 Pre-launch Checklist

Before deploying to production:

- [ ] Backend PHP file uploaded and accessible
- [ ] Test order creates successfully in Shopify
- [ ] Orders appear with correct customer details
- [ ] Order tagged with "alclean-app"
- [ ] Tracking sync works correctly
- [ ] Notifications appear in inbox
- [ ] Browser notifications work
- [ ] All pages load without errors
- [ ] Mobile responsive design works
- [ ] SSL certificate installed (HTTPS)
- [ ] API credentials are secure (not in git)

---

## 🆘 Still Need Help?

### Check Documentation Files:
1. `/BACKEND_PHP_FILES.md` - Complete PHP code
2. `/INTEGRATION_QUICK_START.md` - Setup guide
3. `/SHOPIFY_FIREBASE_SETUP.md` - Detailed docs
4. `/SYSTEM_FLOW_DIAGRAM.md` - Visual flows

### Check Code Files:
1. `/lib/order-service.ts` - Order creation logic
2. `/lib/shopify.ts` - Shopify API integration
3. `/components/Checkout.tsx` - Checkout flow

### Enable Debug Mode:

```javascript
// In browser console
localStorage.setItem('debug', 'true')

// In PHP file
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Contact Points:
- Check server logs for backend errors
- Check browser console for frontend errors
- Use curl to test API endpoints
- Test with minimal data first

---

## ✅ Success Indicators

You know everything is working when:

1. ✅ Place order in app
2. ✅ See success message
3. ✅ Order appears in Shopify Admin
4. ✅ Order tagged "alclean-app"
5. ✅ Notification appears in inbox
6. ✅ Order shows in tracking page
7. ✅ No errors in console

---

**Last Updated:** December 6, 2025  
**For Support:** Check documentation files or review code comments
