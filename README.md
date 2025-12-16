# AlClean Mobile App

A mobile shopping application for AlClean cleaning products, integrated with Shopify for product management and order processing.

## Project Structure

```
/app
├── frontend/         # React Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities and services
│   │   └── types/       # TypeScript types
│   ├── public/          # Static assets
│   └── .env             # Frontend environment variables
├── backend/          # Express.js backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   └── index.ts     # Main server file
│   └── .env             # Backend environment variables
└── README.md         # This file
```

## Setup

### Prerequisites
- Node.js 18+
- Yarn
- Shopify Store with Storefront and Admin API access

### Environment Variables

**Frontend (.env)**
```
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your-storefront-token
VITE_SHOPIFY_API_VERSION=2025-07
VITE_API_URL=http://localhost:3001
```

**Backend (.env)**
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=your-admin-token
SHOPIFY_API_VERSION=2025-07
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

### Installation

```bash
# Install root dependencies
yarn install

# Install frontend dependencies
cd frontend && yarn install

# Install backend dependencies
cd ../backend && yarn install
```

### Development

```bash
# Run both frontend and backend
yarn dev

# Or run separately
cd frontend && yarn dev  # Runs on port 3000
cd backend && yarn dev   # Runs on port 3001
```

## Features

- ✅ Product browsing with categories
- ✅ Advanced search with voice search
- ✅ Quick filters (price, stock, on sale)
- ✅ Shopping cart with persistence
- ✅ Checkout with Shopify order creation
- ✅ Order tracking
- ✅ User authentication (local)

## Building for Android (Google Play Store)

1. Install Capacitor: `yarn add @capacitor/core @capacitor/cli @capacitor/android`
2. Initialize: `npx cap init`
3. Build: `yarn build`
4. Add Android: `npx cap add android`
5. Sync: `npx cap sync android`
6. Open in Android Studio: `npx cap open android`
7. Build APK/AAB from Android Studio
8. Upload to Google Play Console

## License

Private - AlClean
