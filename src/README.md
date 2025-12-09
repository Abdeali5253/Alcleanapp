# 🧼 AlClean Shopping App

A mobile-first shopping application for AlClean cleaning products with Shopify GraphQL integration, Firebase push notifications, and complete checkout flow.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend (/.env):**
```env
# Shopify
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_api_token
VITE_SHOPIFY_ADMIN_API_TOKEN=your_admin_api_token
VITE_SHOPIFY_API_VERSION=2025-07

# Firebase (optional - for push notifications)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=app-notification-5e56b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-notification-5e56b
VITE_FIREBASE_STORAGE_BUCKET=app-notification-5e56b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# Backend
VITE_BACKEND_URL=http://localhost:3001
# For mobile testing: http://192.168.20.107:3001
```

**Backend (server/.env):**
```env
PORT=3001
NODE_ENV=development

# Shopify
SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=your_admin_api_token
SHOPIFY_API_VERSION=2025-07

# Firebase (optional)
FIREBASE_SERVER_KEY=your_server_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.20.107:5173
```

### 3. Start Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  
Mobile: http://192.168.20.107:5173

---

## 🏗️ Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Integration:** Shopify GraphQL API (Storefront + Admin)
- **Notifications:** Firebase Cloud Messaging
- **Auth:** localStorage-based authentication
- **UI:** shadcn/ui components + Lucide icons

---

## 📁 Project Structure

```
/
├── components/           # React components
│   ├── AttractiveHome.tsx
│   ├── Products.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── Account.tsx
│   ├── NotificationInbox.tsx
│   └── ui/              # Reusable UI components
├── lib/                 # Utilities & services
│   ├── shopify.ts       # Shopify API client
│   ├── cart.ts          # Cart management
│   ├── auth.ts          # Authentication
│   ├── notifications.ts # FCM service
│   └── order-service.ts # Order creation
├── server/              # Backend
│   └── src/
│       ├── index.ts     # Express server
│       └── routes/
│           ├── shopify.ts
│           └── notifications.ts
├── .env                 # Frontend config
└── server/.env          # Backend config
```

---

## 🔑 Getting Shopify API Tokens

### Storefront API Token (Required)

1. Go to: Shopify Admin > Settings > Apps and sales channels > Develop apps
2. Create or select your app
3. Configuration > Storefront API > Enable scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
4. API credentials > Copy **Storefront API access token**

### Admin API Token (Required for Orders)

1. Same app > Configuration > Admin API
2. Enable scopes:
   - `write_draft_orders`
   - `read_draft_orders`
   - `write_orders`
3. Install app > Copy **Admin API access token**

---

## 🛍️ Features

### Shopping
- Product catalog with categories (Chemicals & Equipment)
- Hero carousel banner
- Search & filter
- Product detail pages
- Cart with quantity management
- Supreme offers section

### Checkout & Delivery
- COD and Bank Transfer payment options
- Fixed Rs.200 delivery for major cities
- Rs.50/kg for other cities
- Authentication required before checkout
- Order placement to Shopify

### User Account
- Login/Signup with Shopify integration
- Edit profile
- Order tracking
- Help & Support with FAQs
- About & Contact pages

### Notifications (Optional)
- Push notifications via Firebase
- Order confirmations
- Shipment updates
- Notification inbox
- Settings & preferences

---

## 🧹 Unused Components to Delete

If you want to minimize the project, these UI components are likely **NOT used** and can be deleted:

```
/components/ui/
├── accordion.tsx         ❌
├── alert-dialog.tsx      ❌
├── alert.tsx             ❌
├── aspect-ratio.tsx      ❌
├── avatar.tsx            ❌
├── breadcrumb.tsx        ❌
├── calendar.tsx          ❌
├── card.tsx              ❌
├── carousel.tsx          ❌
├── chart.tsx             ❌
├── checkbox.tsx          ❌
├── collapsible.tsx       ❌
├── command.tsx           ❌
├── context-menu.tsx      ❌
├── dialog.tsx            ❌
├── dropdown-menu.tsx     ❌
├── form.tsx              ❌
├── hover-card.tsx        ❌
├── menubar.tsx           ❌
├── navigation-menu.tsx   ❌
├── pagination.tsx        ❌
├── popover.tsx           ❌
├── progress.tsx          ❌
├── radio-group.tsx       ❌
├── resizable.tsx         ❌
├── scroll-area.tsx       ❌
├── select.tsx            ❌
├── separator.tsx         ❌
├── sheet.tsx             ❌
├── sidebar.tsx           ❌
├── skeleton.tsx          ❌
├── slider.tsx            ❌
├── switch.tsx            ❌
├── table.tsx             ❌
├── tabs.tsx              ❌
├── textarea.tsx          ❌
├── toggle-group.tsx      ❌
├── toggle.tsx            ❌
└── tooltip.tsx           ❌
```

**Keep these (actively used):**
- ✅ `button.tsx`
- ✅ `input.tsx`
- ✅ `label.tsx`
- ✅ `sonner.tsx` (toast notifications)
- ✅ `drawer.tsx` (for mobile filters)
- ✅ `use-mobile.ts`
- ✅ `utils.ts`

---

## 🧪 Testing

### Test Backend Connection
Visit: http://localhost:5173/backend-test

### Test Shopify Products
Open browser console and check for:
- `[Shopify] Loaded X total products`
- No "Shopify is not configured" errors

### Test Order Placement
1. Add products to cart
2. Go to checkout
3. Login/signup
4. Fill delivery details
5. Place order
6. Check Shopify Admin > Orders

---

## 📱 Mobile Testing

Configure Vite for network access:

**vite.config.ts:**
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})
```

Then access from mobile: http://192.168.20.107:5173

---

## 🔒 Security

- Never commit `.env` files (already in .gitignore)
- Store API tokens securely
- Use environment variables for all credentials
- Storefront API token is safe for frontend (read-only)
- Admin API token must be protected (order creation)

---

## 🐛 Troubleshooting

### "Shopify is not configured" error
- Check `.env` file exists in project root
- Verify `VITE_SHOPIFY_STOREFRONT_TOKEN` is set
- Restart dev server completely

### Products not loading
- Check browser console for errors
- Verify Shopify Storefront API scopes are enabled
- Test connection: `/backend-test` page

### Backend connection failed
- Ensure backend is running: `cd server && npm run dev`
- Check `VITE_BACKEND_URL` matches backend port
- Verify CORS settings in `server/.env`

### Orders not creating in Shopify
- Check `VITE_SHOPIFY_ADMIN_API_TOKEN` is set
- Verify Admin API scopes include `write_draft_orders`
- Check backend logs for errors

---

## 📄 License

Private project for AlClean

---

**Need help?** Check browser console and backend terminal for error messages.
