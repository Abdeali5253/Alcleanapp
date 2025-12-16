# AlClean Shopping App

Mobile-first shopping application for AlClean cleaning products company, built with React, TypeScript, Vite, and integrated with Shopify GraphQL API and Firebase Cloud Messaging.

## 📁 Project Structure

```
AlClean/
├── frontend/              # React + Vite frontend application
│   ├── src/
│   │   ├── components/   # React components (copying in progress)
│   │   ├── lib/          # Utilities and API clients
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── .env              # Frontend environment variables
│   └── package.json      # Frontend dependencies
│
├── backend/              # Express.js backend server
│   ├── src/
│   │   ├── routes/       # API routes (Shopify, Notifications)
│   │   └── index.ts      # Server entry point
│   ├── .env              # Backend environment variables
│   └── package.json      # Backend dependencies
│
└── package.json          # Root package.json to run both servers
```

**Note:** Old structure at root level (`/components`, `/lib`, `/App.tsx`, etc.) is being migrated to `/frontend/src/`. Delete these files locally once migration is complete.

**Note:** `/server` folder was a duplicate of `/backend` and has been removed. Use `/backend` only.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend** (`/frontend/.env`):
```env
VITE_SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
VITE_SHOPIFY_ADMIN_API_TOKEN=your_admin_token
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`/backend/.env`):
```env
PORT=3001
SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=your_admin_token
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.20.107:5173
```

### 3. Run Development Servers

**Option 1: Run both servers together (recommended)**
```bash
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

### 4. Access the App
- **Local:** http://localhost:5173
- **Mobile:** http://192.168.20.107:5173 (update IP to your network IP)

## 📱 Features

### Completed
- ✅ Home page with hero banner carousel
- ✅ Product categories (cleaning chemicals & equipment)
- ✅ Bottom navigation
- ✅ Shopping cart functionality
- ✅ Product sorting and filtering
- ✅ Delivery system (Rs.200 for major cities, Rs.50/kg for others)
- ✅ Checkout with COD and bank transfer
- ✅ Shopify integration for products and orders
- ✅ Firebase Cloud Messaging for push notifications
- ✅ Authentication (login required before checkout)
- ✅ Signup page connected to Shopify
- ✅ Help & Support with FAQs (return/exchange, delivery, store hours)
- ✅ Account menu (edit profile only, removed payment methods & addresses)

### In Progress
- 🔄 Migrating components from root to `/frontend/src/components/`
- 🔄 Migrating lib files to `/frontend/src/lib/`
- 🔄 Migrating types to `/frontend/src/types/`
- 🔄 Migrating styles to `/frontend/src/styles/`

## 🔧 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Shopify Storefront API (GraphQL)
- Firebase SDK

**Backend:**
- Node.js
- Express.js
- TypeScript
- Shopify Admin API (GraphQL)
- Firebase Admin SDK

## 📦 Key Dependencies

- `react`, `react-dom` - UI framework
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `recharts` - Charts (if needed)
- `sonner` - Toast notifications
- `firebase` - Push notifications & auth

## 🌐 API Integration

### Shopify
- **Storefront API:** Fetch products, collections, manage cart
- **Admin API:** Create orders, manage customers
- **Store:** alclean-pk.myshopify.com

### Firebase
- **Cloud Messaging:** Push notifications
- **Authentication:** User login/signup

## 🔐 Environment Setup

1. Get Shopify Storefront API token from Shopify Admin
2. Get Firebase credentials from Firebase Console
3. Copy `.env.example` to `.env` in both `/frontend` and `/backend`
4. Fill in the credentials
5. Restart servers

## 📱 Mobile Testing

The app is configured for mobile testing on your local network:
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update Vite config if needed (already set to 192.168.20.107)
3. Access from mobile: `http://YOUR_IP:5173`

## 🆘 Troubleshooting

**Shopify errors:**
- Ensure `.env` files exist in both `/frontend` and `/backend`
- Verify Shopify tokens are correct
- Restart servers after changing `.env` files

**Port conflicts:**
- Backend must run on port 3001
- Frontend runs on port 5173
- Kill processes if ports are in use

**Cannot connect to backend:**
- Check backend is running on http://localhost:3001
- Verify `VITE_BACKEND_URL` in `/frontend/.env`
- Check CORS settings in `/backend/.env`

## 📄 License

Proprietary - AlClean Company
