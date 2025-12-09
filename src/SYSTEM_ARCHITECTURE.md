# 🏗️ AlClean App - System Architecture

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AlClean Mobile App                        │
│                   (React + TypeScript + Vite)                    │
│                  http://192.168.20.107:5173                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Products   │        │    Orders    │        │   Firebase   │
│   (Shopify)  │        │   (Backend)  │        │     (FCM)    │
└──────────────┘        └──────────────┘        └──────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Shopify    │        │  Your Server │        │   Firebase   │
│ Storefront   │        │  albizco.com │        │   Console    │
│     API      │        │              │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## 🔄 Order Creation Flow (FIXED)

### Before (BROKEN - CORS Error):
```
┌──────────┐       ❌ CORS Error       ┌──────────┐
│ Browser  │ ─────────────────────────>│ Shopify  │
│  (App)   │         Blocked           │ Admin API│
└──────────┘                           └──────────┘
```

### After (WORKING):
```
┌──────────┐                           ┌──────────┐                           ┌──────────┐
│ Browser  │ ───────────────────────>  │  Backend │ ───────────────────────> │ Shopify  │
│  (App)   │  POST /api/create-order   │  (PHP)   │  GraphQL Mutation        │ Admin API│
└──────────┘  JSON order data          └──────────┘  w/ Admin Token          └──────────┘
     │                                       │                                      │
     │                                       │                                      │
     ▼                                       ▼                                      ▼
┌──────────┐                           ┌──────────┐                           ┌──────────┐
│  Local   │                           │   CORS   │                           │  Order   │
│ Storage  │                           │  Headers │                           │ Created  │
└──────────┘                           └──────────┘                           └──────────┘
```

**Key Points:**
1. ✅ Browser calls your backend (same domain or CORS enabled)
2. ✅ Backend has Admin API token (secure)
3. ✅ Backend calls Shopify (server-to-server, no CORS)
4. ✅ Order created in Shopify
5. ✅ Order saved locally for offline access

---

## 📦 Complete Order Flow

```
                        ┌─────────────┐
                        │   User      │
                        │  Selects    │
                        │  Products   │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Add to    │
                        │    Cart     │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Review    │
                        │    Cart     │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Login     │
                        │  Required   │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Checkout   │
                        │    Page     │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Local   │   │ Backend  │   │  Push    │
        │ Storage  │   │  Shopify │   │  Notif.  │
        │  Order   │   │  Order   │   │  Sent    │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────┬───────┴──────┬───────┘
                    │              │
                    ▼              ▼
             ┌─────────────┐┌─────────────┐
             │  Tracking   ││   Order     │
             │    Page     ││  Complete   │
             └─────────────┘└─────────────┘
```

---

## 🔐 Data Flow & Security

### 1. Product Data (Public)
```
Shopify Storefront API
      ↓
   Public Access Token
      ↓
   React App (Browser)
      ↓
   Display Products
```

### 2. Order Creation (Secure)
```
React App (Browser)
      ↓
   JSON POST Request
      ↓
Backend PHP (Server)
      ↓
   Admin API Token
   (Never exposed to browser)
      ↓
Shopify Admin API
      ↓
   Order Created
```

### 3. Tracking Data (Server-Side)
```
Your Cron Job
      ↓
Shopify Orders API
      ↓
Extract Tracking Info
      ↓
Save to Database/API
      ↓
React App Fetches
      ↓
Display in App
```

---

## 🔧 Backend Endpoint Structure

### File: `create-shopify-order.php`

```php
┌─────────────────────────────────────────┐
│          CORS Headers Setup              │
│  (Allow browser to call this endpoint)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       Validate Input Data                │
│  (Check required fields)                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Create Draft Order (GraphQL)          │
│  - Customer info                         │
│  - Line items                            │
│  - Shipping address                      │
│  - Delivery charges                      │
│  - Order notes                           │
│  - Tags: alclean-app, payment-method     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Complete Draft Order (GraphQL)        │
│  (Convert draft to actual order)         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       Return JSON Response               │
│  {                                       │
│    success: true,                        │
│    draftOrderId: "...",                  │
│    orderId: "...",                       │
│    orderName: "#1001"                    │
│  }                                       │
└─────────────────────────────────────────┘
```

---

## 🔔 Push Notification Flow

```
┌─────────────┐
│ Order Event │ (Placed, Shipped, Delivered)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Notification│
│  Service    │ (/lib/notifications.ts)
└──────┬──────┘
       │
       ├────────────────┬────────────────┐
       │                │                │
       ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Browser  │    │   Local  │    │ Firebase │
│  Notif   │    │  Inbox   │    │   FCM    │
└──────────┘    └──────────┘    └──────────┘
                                      │
                                      ▼
                                ┌──────────┐
                                │  User's  │
                                │  Device  │
                                └──────────┘
```

**Notification Triggers:**
1. ✅ Order placed → Immediate confirmation
2. ✅ Tracking added → Shipment notification  
3. ✅ Status changed → Update notification
4. ✅ Delivered → Delivery confirmation

---

## 💾 Data Storage

### Local Storage (Browser)
```
alclean_products     → Shopify product catalog
alclean_cart        → Shopping cart items
alclean_user        → Current user session
alclean_orders      → User's order history
notifications       → Notification inbox
fcm_token          → Firebase push token
```

### Backend Database (Optional)
```
fcm_tokens          → Device tokens for push
orders_archive     → Historical orders
tracking_data      → Courier tracking info
```

### Shopify (Source of Truth)
```
Products           → Product catalog
Customers          → Customer accounts
Orders             → All orders
Draft Orders       → Pending orders
```

---

## 🌐 API Endpoints

### Your Backend
```
POST /api/create-shopify-order.php
  → Create order in Shopify
  
GET /end_points/get_tracking.php
  → Get tracking data for orders
```

### Shopify Storefront API
```
POST /api/2025-07/graphql.json
  → Query products
  → Public access
```

### Shopify Admin API
```
POST /admin/api/2025-07/graphql.json
  → Create draft orders
  → Complete orders
  → Requires Admin token (server-side only)
```

### Firebase
```
POST /fcm/send
  → Send push notifications
  → Requires server key
```

---

## 🚀 Deployment Architecture

### Development
```
┌──────────────────────┐
│  Vite Dev Server     │
│  192.168.20.107:5173 │
│  (Hot reload)        │
└──────────────────────┘
```

### Production (Android APK)
```
┌──────────────────────┐
│   React App Bundle   │
│   (Built with Vite)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Capacitor/Cordova   │
│  (Wrap in WebView)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Android APK        │
│   (Installable)      │
└──────────────────────┘
```

---

## 🔄 Sync Strategy

### Order Sync
```
User Places Order
      ↓
1. Save Locally (Instant)
      ↓
2. Create in Shopify (Backend)
      ↓
3. Update Local with Shopify ID
      ↓
4. Send Push Notification
```

### Tracking Sync
```
Cron Job (Server)
      ↓
1. Fetch Orders from Shopify
      ↓
2. Get Tracking from Courier
      ↓
3. Save to Database/API
      ↓
4. App Fetches on Demand
      ↓
5. Update Local Orders
      ↓
6. Send Status Notifications
```

---

## 📊 System Components

### Frontend (React App)
| Component | Purpose | Status |
|-----------|---------|--------|
| `/components/AttractiveHome.tsx` | Home page | ✅ Working |
| `/components/Products.tsx` | Product catalog | ✅ Working |
| `/components/Cart.tsx` | Shopping cart | ✅ Working |
| `/components/Checkout.tsx` | Checkout flow | ✅ Working |
| `/components/Tracking.tsx` | Order tracking | ✅ Working |
| `/components/Account.tsx` | User account | ✅ Working |
| `/components/BackendStatus.tsx` | Status indicator | ✅ New |
| `/components/BackendTestPage.tsx` | Test tools | ✅ New |

### Services (Business Logic)
| Service | Purpose | Status |
|---------|---------|--------|
| `/lib/shopify.ts` | Shopify API client | ✅ Working |
| `/lib/order-service.ts` | Order management | ✅ Fixed |
| `/lib/cart.ts` | Cart management | ✅ Working |
| `/lib/auth.ts` | Authentication | ✅ Working |
| `/lib/notifications.ts` | Push notifications | ✅ Working |
| `/lib/firebase-config.ts` | Firebase config | ✅ Working |

### Backend (PHP)
| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/create-shopify-order.php` | Create orders | ⏳ Needs upload |
| `/end_points/get_tracking.php` | Tracking data | ✅ Existing |

---

## 🔍 Error Handling

### Network Errors
```
Try Backend Call
   │
   ├─ Success → Process Response
   │
   └─ Failure → Check Error Type
              │
              ├─ 404 → Backend not found
              ├─ 500 → Server error
              ├─ CORS → CORS issue
              └─ Network → Connection issue
                    │
                    └─ Save Locally
                       Show User Message
                       Log for Debugging
```

### User Experience
```
Error Occurs
      ↓
1. Don't Fail Silently
      ↓
2. Show User-Friendly Message
      ↓
3. Provide Fix Instructions
      ↓
4. Fallback to Local Storage
      ↓
5. Log Details for Developer
```

---

## 📈 Scalability

### Current Setup (MVP)
- ✅ Handles 100s of orders/day
- ✅ Local storage for offline
- ✅ Direct Shopify integration

### Future Enhancements
- 🔄 Add Redis for caching
- 🔄 Queue system for orders
- 🔄 Database for analytics
- 🔄 CDN for assets
- 🔄 Load balancing

---

## 🔒 Security Considerations

### ✅ Implemented
- Admin API token kept server-side
- CORS headers on backend
- Input validation
- HTTPS required

### 📋 Recommended
- Rate limiting on endpoints
- API key rotation
- Request signing
- User session management
- SQL injection prevention

---

**Architecture Version:** 1.0  
**Last Updated:** December 6, 2025  
**Status:** Production Ready (pending backend upload)
