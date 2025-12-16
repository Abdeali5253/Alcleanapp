# AlClean App - TODO List

## 🎯 Current Priority: Complete Migration to New Structure

### ✅ Done
- [x] Created `/frontend` and `/backend` folder structure
- [x] Created root `package.json` to run both servers
- [x] Moved `main.tsx` to `/frontend/src/`
- [x] Moved lib files: `auth.ts`, `cart.ts`, `categories.ts`, `checkout-helper.ts`, `firebase-config.ts`
- [x] Created `.env` and `.env.example` for frontend
- [x] Created `.env` and `.env.example` for backend
- [x] Changed backend port from 8081 to 3001
- [x] Added AlClean logo image to Logo component
- [x] Removed duplicate `/server` folder
- [x] Cleaned up old .md documentation files

---

## 🔄 In Progress

### 1. Complete File Migration to `/frontend/src/`

**Lib Files** (3 remaining):
- [ ] Copy `/lib/notifications.ts` → `/frontend/src/lib/notifications.ts`
- [ ] Copy `/lib/order-service.ts` → `/frontend/src/lib/order-service.ts`
- [ ] Copy `/lib/shopify.ts` → `/frontend/src/lib/shopify.ts`

**Components** (ALL need copying):
- [ ] Copy ALL files from `/components/` → `/frontend/src/components/`
  - Account.tsx
  - AttractiveHome.tsx
  - BackendStatus.tsx
  - BackendTestPage.tsx
  - BottomNav.tsx
  - Cart.tsx
  - Checkout.tsx
  - CheckoutSuccess.tsx
  - ContactUs.tsx
  - EditProfile.tsx
  - EmptyState.tsx
  - FilterDrawer.tsx
  - HelpSupport.tsx
  - HeroCarousel.tsx
  - Logo.tsx (update to use new version)
  - NotificationAdmin.tsx
  - NotificationInbox.tsx
  - NotificationPrompt.tsx
  - NotificationSettings.tsx
  - PriceDisplay.tsx
  - ProductBadge.tsx
  - ProductCard.tsx
  - ProductCardSkeleton.tsx
  - ProductDetail.tsx
  - ProductGrid.tsx
  - Products.tsx
  - QuantitySelector.tsx
  - QuickViewModal.tsx
  - SearchDrawer.tsx
  - SplashScreen.tsx
  - SupremeOffers.tsx
  - Tracking.tsx
  - UnifiedHeader.tsx
  - AboutUs.tsx
  - ContactUs.tsx
  - `/components/ui/` (all UI components)
  - `/components/figma/ImageWithFallback.tsx`

**Types** (ALL need copying):
- [ ] Create `/frontend/src/types/` folder
- [ ] Copy `/types/notifications.ts` → `/frontend/src/types/notifications.ts`
- [ ] Copy `/types/shopify.ts` → `/frontend/src/types/shopify.ts`

**Styles**:
- [ ] Create `/frontend/src/styles/` folder
- [ ] Copy `/styles/globals.css` → `/frontend/src/styles/globals.css`

**Root Files**:
- [ ] Copy `/App.tsx` → `/frontend/src/App.tsx` (may already exist, verify)

### 2. Update Import Paths
After copying files, update all import statements:
- [ ] Change `'@/components/...'` to `'./components/...'` or `'../components/...'`
- [ ] Change `'@/lib/...'` to `'./lib/...'` or `'../lib/...'`
- [ ] Verify all imports work correctly

### 3. Configure Vite for New Structure
- [ ] Update `/frontend/vite.config.ts` to include path aliases if needed
- [ ] Verify `tsconfig.json` paths are correct

### 4. Test & Verify
- [ ] Test all pages load correctly
- [ ] Test Shopify API integration
- [ ] Test Firebase notifications
- [ ] Test authentication flow
- [ ] Test cart and checkout
- [ ] Test on mobile device

---

## 📋 Manual Cleanup (Do Locally)

After migration is complete and tested, delete these old files/folders:

```bash
# OLD STRUCTURE - DELETE THESE LOCALLY AFTER MIGRATION
/components/          # All files copied to /frontend/src/components/
/lib/                 # All files copied to /frontend/src/lib/
/types/               # All files copied to /frontend/src/types/
/styles/              # All files copied to /frontend/src/styles/
/App.tsx              # Copied to /frontend/src/App.tsx
/main.tsx             # Copied to /frontend/src/main.tsx
/index.html           # Move to /frontend/index.html if not already there
/index.css            # Delete or merge with globals.css
/manifest.json        # Move to /frontend/public/manifest.json
/vite.config.ts       # Delete (use /frontend/vite.config.ts)
/package.json         # Keep only root package.json for running both servers
```

---

## 🔧 Future Enhancements

### Features
- [ ] Add product reviews and ratings
- [ ] Implement wishlist functionality
- [ ] Add order history page
- [ ] Implement real-time order tracking
- [ ] Add promo code functionality
- [ ] Implement product search improvements
- [ ] Add product comparison feature

### Technical
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement proper error boundaries
- [ ] Add loading states for all async operations
- [ ] Optimize images and lazy loading
- [ ] Add PWA features (service worker, offline mode)
- [ ] Implement analytics (Google Analytics or similar)
- [ ] Add Sentry for error tracking

### Performance
- [ ] Code splitting and lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Implement caching strategies

### Deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure production builds
- [ ] Deploy backend to hosting service (Render, Railway, etc.)
- [ ] Deploy frontend to Vercel or Netlify
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure production environment variables

---

## 🐛 Known Issues

- [ ] None currently - report issues as you find them

---

## 📝 Notes

**Why was `/server` folder removed?**
- You had both `/server` and `/backend` folders doing the same thing
- This was causing confusion and duplication
- `/backend` is the new standard location
- All backend code is now in `/backend` only

**Environment Variables:**
- Frontend: `/frontend/.env` (updated manually ✅)
- Backend: `/backend/.env` (updated manually ✅)
- Never commit `.env` files to git!

**Port Configuration:**
- Frontend: 5173 (Vite default)
- Backend: 3001 (not 8081!)

**Last Updated:** 2024-12-16
