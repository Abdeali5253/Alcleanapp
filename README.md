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
VITE_API_URL=http://localhost:3001
```

**Backend (.env)**
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your-storefront-token
SHOPIFY_ADMIN_API_TOKEN=your-admin-token
SHOPIFY_API_VERSION=2025-07
TRACKING_ASSIGNMENTS_URL=https://app.albizco.com/end_points/get_tracking.php?company_type=Alclean
TRACKING_NOTIFICATIONS_ENABLED=true
TRACKING_NOTIFICATION_CRON=0 12,17 * * *
TRACKING_NOTIFICATION_TIME_ZONE=Asia/Karachi
TRACKING_NOTIFICATION_LOOKBACK_DAYS=90
LEOPARD_TRACKING_URL=https://your-leopard-tracking-endpoint
LEOPARD_TRACKING_API_KEY=your-leopard-api-key
LEOPARD_TRACKING_API_PASSWORD=your-leopard-api-password
DAEWOO_TRACKING_URL=https://codapi.daewoo.net.pk/api/booking/quickTrack
DAEWOO_API_KEY=your-daewoo-api-key
POSTEX_TRACKING_URL=https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}
POSTEX_API_TOKEN=your-postex-api-token
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

At 12:00 PM and 5:00 PM Pakistan time each day, the backend fetches courier assignments
from Finac once, matches each assignment to its Shopify order only to resolve
the customer identity, and then requests the current tracking timeline from
Leopard, Daewoo, or PostEx. Finac's courier and tracking number are the source
of truth; Shopify fulfillment status is not used to decide which courier to
query. A push notification is sent only when the courier tracking fingerprint
changes.

Keep the backend `data` directory on persistent storage because
`tracking-notification-state.json` prevents duplicate status notifications.
Set the Daewoo and PostEx API credentials before assignments for those
couriers can be checked.

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
