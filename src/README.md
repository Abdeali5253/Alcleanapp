# 🧼 AlClean - Shopping App

A modern mobile-first shopping application for AlClean cleaning products with Shopify integration and push notifications.

---

## ⚡ Quick Start

**🚨 IMPORTANT:** You need a Shopify Storefront API token to run this app!

### First Time Setup?

1. **Get Your Shopify Token** - [**GET_YOUR_SHOPIFY_TOKEN.md**](./GET_YOUR_SHOPIFY_TOKEN.md) ⭐ **START HERE**
2. **Setup Checklist** - [**SETUP_CHECKLIST.md**](./SETUP_CHECKLIST.md) - Track your progress
3. **Having Issues?** - [**QUICK_FIX_SHOPIFY_ERROR.md**](./QUICK_FIX_SHOPIFY_ERROR.md) - Quick fix guide

### Already Have Your Token?

1. Edit `/.env` file
2. Add your Storefront API token
3. Run `npm run dev`
4. Done! ✅

---

## ✨ Features

### 🛍️ Shopping Experience
- Product catalog from Shopify
- Smart cart management
- Multiple payment options (COD, Bank Transfer)
- Dynamic delivery charges (Rs.200 for major cities, Rs.50/kg others)
- Product categories (Chemicals & Equipment)

### 📦 Order Management
- Real-time order tracking
- Integration with Shopify Admin API
- Automatic order creation in Shopify
- Sync with existing tracking system
- Order status updates

### 🔔 Push Notifications
- Firebase Cloud Messaging integration
- Order placement confirmations
- Shipment notifications
- Delivery updates
- In-app notification inbox
- Customizable notification settings

### 👤 User Features
- User authentication (login/signup)
- Profile management
- Order history
- Help & Support with FAQs
- About Us & Contact pages

### 🎨 UI/UX
- Mobile-first responsive design
- Hero banner carousel
- Bottom navigation
- Smooth animations
- Modern, clean interface

---

## 📁 Project Structure

```
alclean-app/
├── server/                  # Node.js/TypeScript backend
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── routes/
│   │   │   ├── shopify.ts  # Shopify integration
│   │   │   └── notifications.ts  # FCM integration
│   ├── package.json
│   └── .env
│
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── AttractiveHome.tsx
│   │   ├── Products.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Tracking.tsx
│   │   └── ...
│   ├── lib/               # Services & utilities
│   │   ├── shopify.ts    # Shopify client
│   │   ├── order-service.ts  # Order management
│   │   ├── cart.ts       # Cart management
│   │   ├── auth.ts       # Authentication
│   │   └── notifications.ts  # Push notifications
│   └── App.tsx
│
├── public/                # Static assets
├── .env                   # Frontend config
└── README.md
```

---

## 🔧 Configuration Guide

### Getting Shopify Credentials

⚠️ **IMPORTANT:** You need TWO different API tokens from Shopify:

#### 1. Storefront API Token (for fetching products)

1. Go to Shopify Admin: https://alclean-pk.myshopify.com/admin
2. Settings  Apps and sales channels → Develop apps
3. Create or select app: "AlClean Mobile App"
4. Configuration tab → Storefront API integration → Configure
5. Enable scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
6. Save → Install app
7. API credentials tab → Copy **Storefront API access token**
8. Add to `.env`: `VITE_SHOPIFY_STOREFRONT_TOKEN=your_token`

#### 2. Admin API Token (for creating orders)

1. Same app → Configuration tab → Admin API
2. Configure Admin API scopes:
   - `read_products`
   - `write_draft_orders`
   - `write_orders`
3. Install app and copy **Admin API access token**
4. Add to `.env`: `VITE_SHOPIFY_ADMIN_API_TOKEN=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`

**Store Configuration:**
- Store domain: `alclean-pk.myshopify.com`
- Add to `.env`: `VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com`

📖 **Detailed setup guide:** See [SETUP_STOREFRONT_API.md](./SETUP_STOREFRONT_API.md)

### Getting Firebase Keys

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `app-notification-5e56b`
3. Project Settings → General:
   - Copy all config values
4. Project Settings → Cloud Messaging:
   - Copy "Server key" (for backend)
   - Copy "Web Push certificate" (VAPID key)

---

## 🧪 Testing

### Test Backend Connection

```bash
# Health check
curl http://localhost:3001/health

# Expected: { "status": "ok", ... }
```

### Test Shopify Integration

```bash
# Place test order
curl -X POST http://localhost:3001/api/shopify/create-order \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

### Test in Browser

1. Open app: http://192.168.20.107:5173
2. Check for green "Backend Connected ✓" badge
3. Add products to cart
4. Complete checkout
5. Check Shopify Admin for order

---

## 📱 Mobile Testing

### On Android Device

1. Connect device to same WiFi network
2. Open browser
3. Navigate to: `http://192.168.20.107:5173`
4. App should load and function fully

### Network Configuration

The Vite server is configured to accept connections from your IP:
```javascript
// vite.config.ts
server: {
  host: '0.0.0.0',
  port: 5173,
}
```

---

## 🚀 Deployment

### Backend Deployment

**Option 1: Your Server (app.albizco.com)**
```bash
# SSH to server
ssh user@app.albizco.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Upload files and install
cd /path/to/server
npm install
npm run build

# Run with PM2
sudo npm install -g pm2
pm2 start dist/index.js --name alclean-backend
pm2 save
pm2 startup
```

**Option 2: Serverless (Vercel/Railway/Render)**
```bash
# Deploy to Vercel
vercel --prod

# Or Railway
railway up

# Or Render
# Connect GitHub repo and deploy
```

### Frontend Deployment

**For Web:**
```bash
npm run build
# Upload dist/ folder to your hosting
```

**For Android APK:**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# Add Android platform
npx cap add android

# Build
npm run build
npx cap copy
npx cap sync

# Open Android Studio
npx cap open android
```

---

## 📖 Documentation

- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Detailed backend setup guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System design and flows
- **[INTEGRATION_QUICK_START.md](./INTEGRATION_QUICK_START.md)** - Integration guide

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin support

### Integrations
- **Shopify** - E-commerce platform
  - Storefront API (products)
  - Admin API (orders)
- **Firebase** - Push notifications
  - Cloud Messaging (FCM)

---

##  Security

### Environment Variables
Never commit `.env` files:
```gitignore
.env
.env.local
.env.*.local
server/.env
```

### API Keys
- Shopify Admin API token - server-side only
- Firebase server key - server-side only
- VAPID key - safe for client-side

### CORS
Configure allowed origins in `server/.env`:
```env
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

---

## 📊 Features Roadmap

### Current (v1.0)
- ✅ Product catalog
- ✅ Shopping cart
- ✅ Checkout flow
- ✅ Shopify integration
- ✅ Push notifications
- ✅ Order tracking
- ✅ User authentication

### Planned (v1.1)
- 🔄 Payment gateway integration
- 🔄 Advanced search & filters
- 🔄 Product reviews
- 🔄 Wishlist
- 🔄 Referral system

### Future (v2.0)
- 🔄 Native mobile apps (iOS/Android)
- 🔄 Offline mode
- 🔄 AR product preview
- 🔄 Voice search

---

## 🐛 Known Issues

### Issue: Backend connection error on mobile
**Solution:** Make sure both backend and frontend URLs use your network IP (e.g., `192.168.20.107`)

### Issue: Notifications not showing
**Solution:** Check Firebase keys are correctly configured in both frontend and backend `.env` files

### Issue: Orders not appearing in Shopify
**Solution:** Verify Shopify Admin API token has `write_draft_orders` permission

---

## 📞 Support

### Documentation
- Check `/TROUBLESHOOTING.md` for common issues
- Read `/BACKEND_SETUP.md` for setup details
- See `/SYSTEM_ARCHITECTURE.md` for system overview

### Debugging
- **Backend logs:** Check terminal where `npm run dev` is running
- **Frontend logs:** Open browser console (F12)
- **Shopify errors:** Check backend terminal for detailed error messages
- **Firebase errors:** Check Firebase Console → Cloud Messaging

---

## 📄 License

This project is proprietary software for AlClean.

---

## 👥 Credits

Developed for AlClean - Professional Cleaning Solutions

---

## 🎯 Getting Started Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Firebase project created
- [ ] Shopify app configured
- [ ] Backend running (`cd server && npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Green "Backend Connected" shows in app
- [ ] Test order placed successfully
- [ ] Order appears in Shopify Admin

---

**Version:** 1.0.0  
**Last Updated:** December 6, 2025  
**Status:** Production Ready