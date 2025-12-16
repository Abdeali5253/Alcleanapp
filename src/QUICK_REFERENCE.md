# AlClean - Quick Reference Guide
## Essential Commands & Information

This is your quick reference for common tasks. For detailed instructions, see TODO.md and README.md.

---

## 🚀 Getting Started (First Time)

```bash
# 1. Complete migration
chmod +x migrate-components.sh cleanup-old-files.sh
./migrate-components.sh

# 2. Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# 3. Set up environment variables
# Copy .env.example to .env in /frontend and /backend
# Fill in your Shopify and Firebase credentials

# 4. Test locally
npm run dev

# 5. If everything works, clean up
./cleanup-old-files.sh
```

---

## ⚡ Daily Development Commands

### Start Development Servers

```bash
# Run both frontend & backend
npm run dev

# Run frontend only
cd frontend && npm run dev

# Run backend only
cd backend && npm run dev
```

### Access App

- **Local:** http://localhost:5173
- **Mobile:** http://192.168.20.107:5173 (use your IP)
- **Backend API:** http://localhost:3001

### Build for Production

```bash
# Frontend production build
cd frontend
npm run build

# Preview production build
npm run preview
```

---

## 📁 File Locations

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| Frontend env | `/frontend/.env` | Shopify & Firebase config |
| Backend env | `/backend/.env` | Server & API config |
| Vite config | `/frontend/vite.config.ts` | Dev server settings |
| Capacitor config | `/frontend/capacitor.config.ts` | Android app config (Phase 7) |
| Package root | `/package.json` | Runs both servers |

### Source Code

| Type | Location |
|------|----------|
| Components | `/frontend/src/components/` |
| UI Components | `/frontend/src/components/ui/` |
| Utilities | `/frontend/src/lib/` |
| Types | `/frontend/src/types/` |
| Styles | `/frontend/src/styles/` |
| Main App | `/frontend/src/App.tsx` |
| Entry Point | `/frontend/src/main.tsx` |
| Backend Routes | `/backend/src/routes/` |

---

## 🔧 Environment Variables

### Frontend (`.env`)

```env
# Required for basic functionality
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxx
VITE_BACKEND_URL=http://localhost:3001

# Required for Firebase notifications
VITE_FIREBASE_API_KEY=AIzaSyxxxxx
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_VAPID_KEY=BPxxxxx

# See .env.example for complete list
```

### Backend (`.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Shopify Admin
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxxxx

# See .env.example for complete list
```

---

## 🧪 Testing Checklist

### Before Committing Code

- [ ] App runs without errors: `npm run dev`
- [ ] No console errors (check browser DevTools)
- [ ] All pages load correctly
- [ ] Features work as expected
- [ ] Mobile responsive (test at different screen sizes)
- [ ] No TypeScript errors: `npm run build`

### Before Deploying

- [ ] All tests pass (when tests are added)
- [ ] Production build works: `cd frontend && npm run build && npm run preview`
- [ ] Environment variables updated for production
- [ ] No sensitive data in code
- [ ] Performance is acceptable

---

## 🐛 Quick Fixes

### App Won't Start

```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
npm run dev
```

### Port Already in Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill it (replace PID)
kill -9 <PID>

# Or use a different port in backend/.env
PORT=3002
```

### Shopify API Not Working

1. Check `.env` files exist
2. Verify tokens are correct
3. Check store domain (no https://)
4. Restart servers: `Ctrl+C` then `npm run dev`

### Firebase Notifications Not Working

1. Check Firebase config in frontend `.env`
2. Verify VAPID key is correct
3. Check notification permissions in browser
4. Test with NotificationAdmin page

### Can't Access on Mobile

1. Check both devices on same WiFi
2. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Update IP in URL: `http://YOUR_IP:5173`
4. Check firewall isn't blocking port 5173

---

## 📱 Capacitor (Android) Commands

### Setup (Phase 7)

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
```

### Development Workflow

```bash
# After making changes
npm run build
npx cap sync

# Open in Android Studio
npx cap open android

# Update plugins
npx cap sync

# Copy web assets only
npx cap copy
```

### Build Android

```bash
# In Android Studio
# Build → Generate Signed Bundle/APK → Android App Bundle
# OR
# Build → Build Bundle(s)/APK(s) → Build APK(s)
```

---

## 🔍 Useful Inspections

### Check What's Running

```bash
# Check if port is in use
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# See all node processes
ps aux | grep node
```

### View Logs

```bash
# Frontend (in browser)
# Press F12 → Console tab

# Backend (in terminal)
# Logs show automatically where you ran `npm run dev`
```

### Check Environment

```bash
# Verify Node version (should be 18+)
node --version

# Verify npm version
npm --version

# Check installed packages
npm list --depth=0
```

---

## 📦 Project Structure Quick View

```
alclean/
├── frontend/         → React app (mobile UI)
│   ├── src/         → Source code
│   │   ├── components/  → React components
│   │   ├── lib/        → Utilities
│   │   └── App.tsx     → Main component
│   └── .env         → Frontend config (DON'T COMMIT)
│
├── backend/         → Express API
│   ├── src/         → Source code
│   └── .env         → Backend config (DON'T COMMIT)
│
├── TODO.md          → Complete roadmap
├── README.md        → Project documentation
└── package.json     → Root scripts
```

---

## 🎯 Common Tasks

### Add New Component

```bash
cd frontend/src/components
# Create YourComponent.tsx

# Import in App.tsx or other component:
import { YourComponent } from './components/YourComponent';
```

### Update Product Data

Products are managed in Shopify Admin. App fetches automatically.

### Send Test Notification

1. Start app: `npm run dev`
2. Go to: http://localhost:5173
3. Login as admin
4. Navigate to NotificationAdmin page
5. Send test notification

### Check Order in Shopify

1. Login to Shopify Admin
2. Orders → All orders
3. Find order by order ID

---

## 🚨 Emergency Contacts

### If Something Breaks

1. **Check console** for error messages
2. **Read error** carefully
3. **Try quick fixes** above
4. **Check TODO.md** for known issues
5. **Review recent changes** in git
6. **Contact team** if stuck

### Before Asking for Help

Please provide:
- Error message (full text)
- What you were trying to do
- Steps to reproduce
- Browser/device info
- Screenshots if relevant

---

## 📚 Learning Resources

### Essential Reading

- [TODO.md](TODO.md) - Complete development roadmap
- [README.md](README.md) - Project documentation
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Setup guide

### External Documentation

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shopify API](https://shopify.dev/docs/api)
- [Firebase Docs](https://firebase.google.com/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)

---

## ✅ Pre-Deployment Checklist

### Before Going Live

- [ ] All features tested
- [ ] Mobile testing complete
- [ ] Notifications work
- [ ] Shopify integration verified
- [ ] Production environment variables set
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] SSL certificates configured
- [ ] Custom domain configured (if any)
- [ ] Analytics set up
- [ ] Error tracking configured
- [ ] Backup strategy in place

### Before Play Store Submission

- [ ] App icon created (512x512)
- [ ] Screenshots prepared
- [ ] Privacy policy published
- [ ] Store listing written
- [ ] Signed APK/AAB created
- [ ] Testing on multiple devices
- [ ] All features work offline (if applicable)
- [ ] Performance acceptable
- [ ] No crashes or ANRs

---

## 💡 Tips & Best Practices

### Development

- Commit often with clear messages
- Test on mobile regularly
- Keep dependencies updated
- Use TypeScript properly (avoid `any`)
- Write clean, readable code
- Comment complex logic

### Performance

- Lazy load components where possible
- Optimize images before using
- Minimize bundle size
- Use React DevTools to profile
- Test on slower devices

### Security

- Never commit `.env` files
- Keep API keys secret
- Validate user input
- Use HTTPS in production
- Update dependencies regularly
- Follow security best practices

---

**Need more details? Check TODO.md for the complete roadmap!**

*Last Updated: December 16, 2024*
