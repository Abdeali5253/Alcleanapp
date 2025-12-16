# AlClean - Commands Cheatsheet
## Copy & Paste Ready Commands

Quick reference for all common commands. Just copy and paste!

---

## 🚀 Initial Setup (First Time Only)

### 1. Complete Migration
```bash
# Make scripts executable
chmod +x migrate-components.sh cleanup-old-files.sh

# Run migration
./migrate-components.sh

# Expected output: "✅ Migration complete!"
```

### 2. Install All Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Return to root
cd ..
```

### 3. Set Up Environment Files
```bash
# Frontend - Copy example and edit
cp frontend/.env.example frontend/.env
nano frontend/.env  # or use your favorite editor

# Backend - Copy example and edit
cp backend/.env.example backend/.env
nano backend/.env  # or use your favorite editor
```

### 4. Test Everything Works
```bash
# Run both servers
npm run dev

# Open in browser: http://localhost:5173
# Backend runs on: http://localhost:3001
```

### 5. Clean Up (Only if Step 4 works!)
```bash
# Delete old duplicate files
./cleanup-old-files.sh

# Expected output: "✅ Cleanup complete!"
```

---

## 💻 Daily Development

### Start Development Servers

**Both Together (Recommended):**
```bash
npm run dev
```

**Frontend Only:**
```bash
cd frontend
npm run dev
# Access: http://localhost:5173
```

**Backend Only:**
```bash
cd backend
npm run dev
# Runs on: http://localhost:3001
```

### Stop Servers
```
Press: Ctrl + C
```

---

## 🔍 Testing & Debugging

### Open in Browser
```bash
# Local
open http://localhost:5173

# Mobile (update IP)
open http://192.168.20.107:5173
```

### Find Your Local IP
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep "inet "
# or
ip addr show
```

### Check for Errors
```bash
# Browser console
Press F12 → Console tab

# Terminal
# Errors show where you ran `npm run dev`
```

### Clear Cache & Rebuild
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 📦 Building for Production

### Build Frontend
```bash
cd frontend
npm run build
# Output: /frontend/dist/
```

### Preview Production Build
```bash
cd frontend
npm run build
npm run preview
# Access: http://localhost:4173
```

### Check Build Size
```bash
cd frontend
npm run build
ls -lh dist/
```

---

## 🔧 Troubleshooting Commands

### Complete Clean Install
```bash
# Remove all node_modules
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules

# Remove lock files
rm -f package-lock.json
rm -f frontend/package-lock.json
rm -f backend/package-lock.json

# Fresh install
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### Kill Port 3001 (Backend)
```bash
# Find process
lsof -i :3001

# Kill it (replace PID with number from above)
kill -9 PID
```

### Kill Port 5173 (Frontend)
```bash
# Find process
lsof -i :5173

# Kill it (replace PID with number from above)
kill -9 PID
```

### Check Running Processes
```bash
# All Node processes
ps aux | grep node

# Processes on port 3001
lsof -i :3001

# Processes on port 5173
lsof -i :5173
```

### Git Status & Changes
```bash
# See what changed
git status

# See differences
git diff

# Discard all changes (⚠️ CAREFUL!)
git reset --hard HEAD

# Discard specific file
git checkout -- filename
```

---

## 📱 Mobile Testing

### Test on Mobile Device
```bash
# 1. Find your IP
ifconfig | grep "inet "
# Look for: 192.168.x.x

# 2. Start server
npm run dev

# 3. On mobile, open browser and go to:
# http://YOUR_IP:5173
# Example: http://192.168.20.107:5173
```

### Check if Reachable from Mobile
```bash
# From your computer (replace with your IP)
ping 192.168.20.107

# Should see responses if network is working
```

---

## 🤖 Capacitor / Android

### First Time Setup
```bash
cd frontend

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications

# Initialize
npx cap init
# App name: AlClean
# App ID: com.alclean.app
# Web directory: dist

# Add Android platform
npx cap add android
```

### Build & Sync
```bash
cd frontend

# Build web app
npm run build

# Sync to Android
npx cap sync

# Or copy only (no plugin updates)
npx cap copy
```

### Open in Android Studio
```bash
cd frontend
npx cap open android
```

### Update Capacitor Plugins
```bash
cd frontend
npx cap sync
```

### Run on Android Device
```bash
# In Android Studio:
# 1. Select your device
# 2. Click Run button (green play icon)
# Or press: Shift + F10
```

---

## 🧪 Testing Commands

### Run Tests (when added)
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# All tests
npm test
```

### Type Check
```bash
# Frontend
cd frontend
npx tsc --noEmit

# Backend
cd backend
npx tsc --noEmit
```

### Lint Code (if configured)
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

---

## 🚀 Deployment

### Backend to Render
```bash
# Push to GitHub first
git add .
git commit -m "Ready for deployment"
git push

# Then in Render dashboard:
# - Connect GitHub repo
# - Build command: cd backend && npm install && npm run build
# - Start command: cd backend && npm start
```

### Frontend to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Ready for deployment"
git push

# Then in Vercel dashboard:
# - Import GitHub repo
# - Framework: Vite
# - Root directory: frontend
# - Build command: npm run build
# - Output directory: dist
```

### Deploy via CLI (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Deploy to production
vercel --prod
```

---

## 📊 Monitoring

### Check App Performance
```bash
# Lighthouse (in Chrome DevTools)
Press F12 → Lighthouse tab → Generate report
```

### Monitor Backend Logs (Render)
```bash
# In Render dashboard:
# - Select your service
# - Click "Logs" tab
```

### Monitor Frontend Logs (Vercel)
```bash
# In Vercel dashboard:
# - Select your project
# - Click "Logs" tab
```

---

## 🗄️ Database / Firebase

### Test Firebase Connection
```bash
cd frontend
npm run dev

# Open: http://localhost:5173
# Open browser console (F12)
# Look for: "Firebase initialized successfully"
```

### Test Notifications
```bash
# Start app
npm run dev

# Navigate to: http://localhost:5173/notification-admin
# Send test notification
```

---

## 📝 Git Commands

### Commit Changes
```bash
# See what changed
git status

# Add all changes
git add .

# Or add specific files
git add filename

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```

### Create Branch
```bash
# Create and switch to new branch
git checkout -b feature-name

# Switch to existing branch
git checkout branch-name

# See all branches
git branch -a
```

### Undo Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) ⚠️
git reset --hard HEAD~1

# Discard all changes ⚠️
git reset --hard HEAD
```

---

## 🔐 Environment Variables

### View Environment Variables
```bash
# Frontend
cat frontend/.env

# Backend
cat backend/.env
```

### Edit Environment Variables
```bash
# Frontend
nano frontend/.env
# or
code frontend/.env

# Backend
nano backend/.env
# or
code backend/.env
```

### Verify Variables Loaded
```bash
# In browser console (frontend)
console.log(import.meta.env)

# In backend code, add:
console.log('Backend URL:', process.env.VITE_BACKEND_URL)
```

---

## 📋 Useful Shortcuts

### VS Code (if using)
```
Ctrl/Cmd + Shift + P  → Command palette
Ctrl/Cmd + P          → Quick file open
Ctrl/Cmd + B          → Toggle sidebar
Ctrl/Cmd + `          → Toggle terminal
Ctrl/Cmd + /          → Toggle comment
Ctrl/Cmd + D          → Select next occurrence
```

### Browser DevTools
```
F12                   → Open DevTools
Ctrl/Cmd + Shift + C  → Inspect element
Ctrl/Cmd + Shift + M  → Toggle mobile view
Ctrl/Cmd + R          → Refresh page
Ctrl/Cmd + Shift + R  → Hard refresh (clear cache)
```

### Terminal
```
Ctrl + C              → Stop running process
Ctrl + L              → Clear terminal
Tab                   → Auto-complete
↑ / ↓                 → Previous/next command
Ctrl + R              → Search command history
```

---

## 🆘 Emergency Commands

### Something Broke - Nuclear Reset
```bash
# ⚠️ SAVE YOUR .env FILES FIRST!
cp frontend/.env ~/frontend-env-backup
cp backend/.env ~/backend-env-backup

# Delete everything
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
rm -rf frontend/.vite
rm -rf frontend/dist

# Fresh start
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# Restore .env files
cp ~/frontend-env-backup frontend/.env
cp ~/backend-env-backup backend/.env

# Run
npm run dev
```

### Can't Access Files - Permission Issues
```bash
# Fix permissions on Mac/Linux
chmod -R 755 .

# Fix ownership
chown -R $USER:$USER .
```

### Disk Space Full
```bash
# Check disk space
df -h

# Clean npm cache
npm cache clean --force

# Remove node_modules (reinstall after)
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
```

---

## 📞 Quick Links

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Mobile:** http://192.168.20.107:5173 (update IP)

---

## ✅ Quick Checklist

### Before Starting Work
- [ ] Git pull latest changes: `git pull`
- [ ] Install any new dependencies: `npm install`
- [ ] Start servers: `npm run dev`
- [ ] Check no errors in console

### Before Committing
- [ ] Test all changes work
- [ ] No console errors
- [ ] Build works: `cd frontend && npm run build`
- [ ] Git status: `git status`
- [ ] Commit: `git commit -m "message"`
- [ ] Push: `git push`

### Before Deploying
- [ ] All features tested
- [ ] Production build works
- [ ] Environment variables updated
- [ ] No sensitive data in code
- [ ] Backup database/data

---

**Print this and keep it handy! 📄**

*Last Updated: December 16, 2024*
