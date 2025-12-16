# AlClean Migration Guide
## Quick Start: Moving from Root to /frontend Structure

This guide helps you complete the migration from the old root-level structure to the new organized `/frontend` and `/backend` structure.

---

## 🚀 Quick Migration (5 minutes)

### Step 1: Run Migration Script

```bash
# Make script executable
chmod +x migrate-components.sh

# Run migration
./migrate-components.sh
```

**What it does:**
- ✅ Copies all components to `/frontend/src/components/`
- ✅ Copies UI components to `/frontend/src/components/ui/`
- ✅ Copies Figma components to `/frontend/src/components/figma/`
- ✅ Handles App.tsx if needed

### Step 2: Test Everything Works

```bash
# Install dependencies (if not already done)
cd frontend
npm install

# Start dev server
npm run dev
```

**Open:** http://localhost:5173

**Check:**
- ✅ App loads without errors
- ✅ All pages are accessible
- ✅ No red errors in browser console
- ✅ Navigation works

### Step 3: Test Backend

```bash
# Open new terminal
cd backend
npm install
npm run dev
```

**Check:**
- ✅ Backend runs on port 3001
- ✅ No errors in terminal

### Step 4: Test Both Together

```bash
# From root directory
npm run dev
```

This runs both frontend and backend concurrently.

**Test:**
- ✅ Products load from Shopify
- ✅ Notifications can be sent
- ✅ All features work

### Step 5: Clean Up Old Files

**⚠️ ONLY do this AFTER testing everything works!**

```bash
# From root directory
chmod +x cleanup-old-files.sh
./cleanup-old-files.sh
```

**This deletes:**
- `/components/` folder
- `/lib/` folder (old one)
- `/types/` folder (old one)
- `/styles/` folder (old one)
- `/server/` folder
- Root `App.tsx`, `main.tsx`, etc.

---

## 📁 New Project Structure

```
alclean/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/      # ✅ All React components here
│   │   │   ├── ui/         # ✅ Shadcn UI components
│   │   │   ├── figma/      # ✅ Figma utilities
│   │   │   └── *.tsx       # ✅ App components
│   │   ├── lib/            # ✅ Utilities and services
│   │   │   ├── auth.ts
│   │   │   ├── cart.ts
│   │   │   ├── firebase-config.ts
│   │   │   ├── notifications.ts
│   │   │   ├── shopify.ts
│   │   │   └── ...
│   │   ├── types/          # ✅ TypeScript types
│   │   ├── styles/         # ✅ Global CSS
│   │   ├── App.tsx         # ✅ Main app component
│   │   └── main.tsx        # ✅ Entry point
│   ├── public/             # Static assets
│   ├── .env                # ✅ Frontend environment variables
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── notifications.ts
│   │   │   └── shopify.ts
│   │   └── index.ts
│   ├── .env                # ✅ Backend environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # ✅ Root - runs both servers
├── TODO.md                 # ✅ Complete roadmap
├── MIGRATION_GUIDE.md      # ✅ This file
├── migrate-components.sh   # ✅ Migration script
└── cleanup-old-files.sh    # ✅ Cleanup script
```

---

## 🔧 Environment Variables

### Frontend (.env files already configured ✅)
Located: `/frontend/.env`

```env
# Already set up! Don't need to change unless updating services
VITE_BACKEND_URL=http://localhost:3001
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
# ... Firebase vars
```

### Backend (.env files already configured ✅)
Located: `/backend/.env`

```env
# Already set up! Don't need to change unless updating services
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-key"
# ... other vars
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/components/...'"

**Problem:** Old import paths from root structure

**Solution:** Migration script should handle this, but if you see errors:
```typescript
// Old (won't work)
import { Button } from '@/components/ui/button';

// New (correct)
import { Button } from './components/ui/button';
// or
import { Button } from '../components/ui/button';
```

### Issue: "Failed to fetch products"

**Problem:** Backend not running or wrong URL

**Solution:**
1. Make sure backend is running: `cd backend && npm run dev`
2. Check frontend `.env` has: `VITE_BACKEND_URL=http://localhost:3001`
3. Check backend is actually on port 3001

### Issue: "Module not found: firebase"

**Problem:** Dependencies not installed

**Solution:**
```bash
cd frontend
npm install
```

### Issue: Migration script permission denied

**Problem:** Script not executable

**Solution:**
```bash
chmod +x migrate-components.sh cleanup-old-files.sh
```

### Issue: "Port 3001 already in use"

**Problem:** Another process using port 3001

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill it (replace PID with actual process ID)
kill -9 PID
```

---

## ✅ Verification Checklist

After migration, verify:

### Frontend
- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:5173
- [ ] Homepage shows hero carousel
- [ ] Products page loads products
- [ ] Cart functionality works
- [ ] All pages accessible via bottom nav
- [ ] No console errors (except warnings OK)

### Backend
- [ ] `npm run dev` starts on port 3001
- [ ] No errors in terminal
- [ ] Can send notifications from NotificationAdmin page
- [ ] Shopify integration works

### Both Together
- [ ] `npm run dev` from root runs both
- [ ] Frontend can call backend APIs
- [ ] Products load from Shopify
- [ ] Notifications work end-to-end
- [ ] No CORS errors

---

## 📱 Mobile Testing

After migration works locally, test on mobile:

### Update Vite Config for Network Access

Already configured in `/frontend/vite.config.ts`:
```typescript
server: {
  host: '0.0.0.0',  // Allows network access
  port: 5173,
}
```

### Find Your Local IP

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep inet
```

Look for something like: `192.168.20.107`

### Access from Mobile

1. Make sure phone and computer on same WiFi
2. Open on phone: `http://192.168.20.107:5173`
3. Test all features

---

## 🎯 Next Steps After Migration

1. **Complete local testing** (see TODO.md Phase 2)
2. **Deploy backend** to Render (Phase 4)
3. **Deploy frontend** to Vercel (Phase 6)
4. **Set up Capacitor** for Android (Phase 7)
5. **Build APK** (Phase 8)
6. **Publish to Play Store** (Phase 9-10)

**See TODO.md for complete roadmap!**

---

## 📞 Need Help?

1. Check TODO.md for detailed instructions
2. Review error messages carefully
3. Check browser console (F12) for errors
4. Check terminal output for errors
5. Verify environment variables are correct

---

**Happy coding! 🚀**
