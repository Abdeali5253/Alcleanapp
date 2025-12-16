# AlClean Shopping App
## Professional Cleaning Products E-Commerce Platform

Mobile-first Android shopping application for AlClean cleaning products company, built with React, TypeScript, Vite, and integrated with Shopify GraphQL API and Firebase Cloud Messaging.

[![Status](https://img.shields.io/badge/Status-Active%20Development-success)]()
[![Platform](https://img.shields.io/badge/Platform-Android-green)]()
[![Framework](https://img.shields.io/badge/Framework-React%2018-blue)]()

---

## 🎯 Overview

AlClean is a comprehensive e-commerce mobile application designed specifically for the Pakistani market, offering professional-grade cleaning chemicals and equipment with features like:

- **🛍️ Product Catalog**: Browse wide range of cleaning products synced with Shopify
- **🚚 Smart Delivery**: Fixed Rs.200 for major cities, Rs.50/kg for others
- **💳 Flexible Payments**: Cash on Delivery & Bank Transfer
- **🔔 Push Notifications**: Real-time order updates via Firebase
- **📦 Order Tracking**: Track orders seamlessly through Shopify integration
- **🔐 Secure Authentication**: User accounts with order history

---

## 📁 Project Structure

```
alclean/
├── frontend/                 # React + Vite Mobile App
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   ├── figma/      # Design system components
│   │   │   └── *.tsx       # Feature components
│   │   ├── lib/            # Utilities & services
│   │   │   ├── auth.ts              # Authentication service
│   │   │   ├── cart.ts              # Cart management
│   │   │   ├── shopify.ts           # Shopify API client
│   │   │   ├── notifications.ts     # Firebase FCM
│   │   │   ├── firebase-config.ts   # Firebase setup
│   │   │   └── order-service.ts     # Order handling
│   │   ├── types/          # TypeScript definitions
│   │   ├── styles/         # Global CSS (Tailwind)
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   │   └── manifest.json   # PWA manifest
│   ├── android/            # Capacitor Android project (created in Phase 7)
│   ├── .env                # Environment variables (DO NOT COMMIT)
│   ├── .env.example        # Template for .env
│   ├── package.json
│   ├── vite.config.ts      # Vite configuration
│   └── capacitor.config.ts # Capacitor config (Phase 7)
│
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── notifications.ts  # FCM endpoints
│   │   │   └── shopify.ts        # Shopify proxy endpoints
│   │   └── index.ts              # Server entry
│   ├── .env                # Backend environment (DO NOT COMMIT)
│   ├── .env.example        # Template for .env
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # Root - runs both servers
├── TODO.md                 # 📋 Complete development roadmap
├── MIGRATION_GUIDE.md      # 🚀 Migration instructions
├── migrate-components.sh   # Script to complete migration
├── cleanup-old-files.sh    # Script to clean up old files
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Shopify store with API access
- Firebase project with Cloud Messaging enabled
- Git

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd alclean

# Install all dependencies (root, frontend, backend)
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2. Complete Migration (First Time Setup)

If you have old files in root directory:

```bash
# Make scripts executable
chmod +x migrate-components.sh cleanup-old-files.sh

# Run migration
./migrate-components.sh

# Test that everything works
cd frontend && npm run dev

# If all good, clean up old files
cd .. && ./cleanup-old-files.sh
```

See **MIGRATION_GUIDE.md** for detailed migration instructions.

### 3. Configure Environment Variables

**Frontend** (`/frontend/.env`):
```env
# Shopify Configuration
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
VITE_SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token

# Backend API
VITE_BACKEND_URL=http://localhost:3001

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

**Backend** (`/backend/.env`):
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Shopify Admin API
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.20.107:5173
```

**📝 Note:** Copy `.env.example` files and fill in your credentials. **Never commit `.env` files!**

### 4. Run Development Servers

**Option 1: Run both together (Recommended)**
```bash
# From root directory
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the App

- **Local:** http://localhost:5173
- **Mobile (Network):** http://192.168.20.107:5173 (update to your IP)

---

## 📱 Features

### User Features
- ✅ **Home Page**: Hero carousel with featured products and categories
- ✅ **Product Catalog**: Browse cleaning chemicals and equipment
- ✅ **Search & Filter**: Find products quickly with filters
- ✅ **Shopping Cart**: Add, update, remove items with persistence
- ✅ **User Authentication**: Secure login/signup with Shopify integration
- ✅ **Checkout Flow**: Multi-step checkout with address and payment
- ✅ **Delivery Options**: 
  - Fixed Rs.200 for major cities (Karachi, Lahore, Rawalpindi, etc.)
  - Rs.50/kg for other cities
- ✅ **Payment Methods**: Cash on Delivery (COD) & Bank Transfer
- ✅ **Order Tracking**: Track order status and history
- ✅ **Push Notifications**: Receive order updates via Firebase Cloud Messaging
- ✅ **Profile Management**: Edit profile information
- ✅ **Help & Support**: 
  - Comprehensive FAQ section
  - Return/Exchange policy
  - Delivery timings
  - Store hours
  - Contact information
- ✅ **About Us**: Company information and mission
- ✅ **Bottom Navigation**: Easy access to Home, Products, Cart, Account

### Admin Features
- ✅ **Notification Admin**: Send push notifications to users
- ✅ **Product Management**: Via Shopify Admin
- ✅ **Order Management**: Via Shopify Admin

### Technical Features
- ✅ **Mobile-First Design**: Optimized for Android devices
- ✅ **Responsive UI**: Works on different screen sizes
- ✅ **Offline Support**: Cart persists locally
- ✅ **Real-time Updates**: Live product availability from Shopify
- ✅ **Type-Safe**: Full TypeScript implementation
- ✅ **Fast Performance**: Vite for lightning-fast development and builds
- ✅ **PWA Ready**: Can be installed as Progressive Web App

---

## 🔧 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| React Router DOM | Routing |
| Lucide React | Icons |
| Sonner | Toast notifications |
| Firebase SDK | Push notifications & auth |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| TypeScript | Type safety |
| Firebase Admin SDK | Server-side FCM |

### External Services
| Service | Purpose |
|---------|---------|
| Shopify Storefront API | Product catalog, cart |
| Shopify Admin API | Orders, customers |
| Firebase Cloud Messaging | Push notifications |
| Firebase Authentication | User auth |

---

## 🌐 API Integration

### Shopify Integration

**Storefront API (GraphQL):**
- Fetch products and collections
- Query product variants
- Get product details and images
- Manage customer cart

**Admin API (GraphQL):**
- Create draft orders
- Create customers
- Update order status
- Track order fulfillment

**Configuration:**
- Store: `alclean-pk.myshopify.com`
- API Version: 2024-01
- Requires: Storefront Access Token & Admin Access Token

### Firebase Integration

**Cloud Messaging:**
- Send push notifications
- Manage FCM tokens
- Handle notification permissions
- Background/foreground notifications

**Authentication:**
- Email/password authentication
- Session management
- User profile storage

**Configuration:**
- Requires: Firebase project with FCM enabled
- VAPID key for web push
- Service account for admin SDK

---

## 📱 Mobile Testing

### Local Network Testing

The app is configured for mobile device testing on your local network:

1. **Find your local IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. **Vite is configured to allow network access:**
   Already set in `/frontend/vite.config.ts`:
   ```typescript
   server: {
     host: '0.0.0.0',
     port: 5173,
   }
   ```

3. **Access from mobile device:**
   - Connect phone to same WiFi network
   - Open browser on phone
   - Navigate to: `http://YOUR_IP:5173`
   - Example: `http://192.168.20.107:5173`

4. **Test all features:**
   - Touch interactions
   - Forms and inputs
   - Navigation
   - Notifications (requires HTTPS for production)
   - Cart persistence
   - Checkout flow

---

## 📋 Development Workflow

### Complete Roadmap

See **TODO.md** for the complete development roadmap from local testing to Google Play Console deployment, including:

- ✅ Phase 1: Complete migration
- 🔄 Phase 2: Local testing
- 📦 Phase 3: Build & optimization
- 🚀 Phase 4: Backend deployment
- 🌐 Phase 5: PWA preparation
- 📱 Phase 6: Frontend deployment
- 🤖 Phase 7: Capacitor setup (Android)
- 🛠️ Phase 8: Android build & testing
- 🏪 Phase 9: Play Store preparation
- 📲 Phase 10: Google Play Console
- 📊 Phase 11: Post-publication
- 🔄 Phase 12: Updates & maintenance

### Current Status
```
✅ Project structure migrated
✅ Frontend & backend configured
✅ Features implemented
🔄 Ready for Phase 2: Testing
📍 Next: Complete local testing
🎯 Goal: Google Play Store deployment
```

---

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

cd frontend
rm -rf node_modules package-lock.json
npm install

cd ../backend
rm -rf node_modules package-lock.json
npm install
```

**Shopify API errors:**
- Verify `.env` files exist in both `/frontend` and `/backend`
- Check Shopify tokens are valid and not expired
- Ensure store domain is correct (without https://)
- Restart servers after changing `.env` files

**Backend connection errors:**
- Ensure backend is running: `cd backend && npm run dev`
- Check backend port: Should be `3001`
- Verify `VITE_BACKEND_URL` in `/frontend/.env`
- Check CORS settings in `/backend/.env`

**Port conflicts:**
```bash
# Find process using port
lsof -i :3001  # or :5173

# Kill process
kill -9 <PID>
```

**Firebase notification errors:**
- Verify Firebase config in frontend `.env`
- Check Firebase Admin SDK credentials in backend `.env`
- Ensure VAPID key is correct
- Notification permissions granted in browser/device

**Build errors:**
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 🔐 Security Best Practices

- ✅ Environment variables stored in `.env` (not committed)
- ✅ `.gitignore` includes `.env` files
- ✅ API keys never hardcoded in source
- ✅ CORS configured for specific origins
- ✅ HTTPS enforced in production
- ✅ User authentication required for sensitive operations
- ✅ Firebase security rules configured

**⚠️ NEVER commit:**
- `.env` files
- API keys or tokens
- Firebase service account JSON
- Shopify access tokens
- Signing keystores

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
```

### Android APK Build
See **TODO.md Phase 8** for complete Android build instructions with Capacitor.

### Hosting Options

**Backend:**
- Render (Recommended - Free tier)
- Railway
- Heroku
- DigitalOcean

**Frontend:**
- Vercel (Recommended - Free tier)
- Netlify
- Cloudflare Pages

**See TODO.md Phases 4-6 for detailed deployment instructions.**

---

## 📊 Performance

- ⚡ Vite for fast HMR (< 100ms)
- 📦 Code splitting for optimal bundle size
- 🖼️ Image optimization
- 💨 Lazy loading components
- 🎯 Tree-shaking for minimal bundle
- ⚡ React 18 concurrent features

---

## 🤝 Contributing

This is a proprietary project for AlClean. For internal development:

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit for review
5. Merge to main

---

## 📄 License

Proprietary - AlClean Company  
© 2024 AlClean. All rights reserved.

---

## 📞 Support & Resources

### Documentation
- [Complete Roadmap](TODO.md) - Development phases
- [Migration Guide](MIGRATION_GUIDE.md) - Setup instructions
- [Shopify API Docs](https://shopify.dev/docs/api)
- [Firebase Docs](https://firebase.google.com/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)

### Internal Contacts
- Development Team: [Your email]
- Project Manager: [PM email]
- Support: [Support email]

---

## 🎯 Project Goals

**Short-term (Current):**
- ✅ Complete migration to new structure
- 🔄 Finish local testing
- 📦 Deploy to production
- 📱 Build Android APK

**Mid-term (Next 2-3 months):**
- 📲 Launch on Google Play Store
- 📊 Implement analytics
- ⭐ Gather user feedback
- 🔄 Iterative improvements

**Long-term (6+ months):**
- 🌟 Feature expansions (wishlist, reviews, etc.)
- 🌍 Multi-language support
- 📱 iOS version
- 💳 Additional payment methods
- 🤖 AI-powered product recommendations

---

**Built with ❤️ for AlClean**

*Last Updated: December 16, 2024*
