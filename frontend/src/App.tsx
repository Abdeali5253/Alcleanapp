import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Wishlist } from "./components/Wishlist";
import { Products } from "./components/Products";
import { ProductDetail } from "./components/ProductDetail";
import { Cart } from "./components/Cart";
import { Tracking } from "./components/Tracking";
import { Account } from "./components/Account";
import { EditProfile } from "./components/EditProfile";
import { HelpSupport } from "./components/HelpSupport";
import { Checkout } from "./components/Checkout";
import { CheckoutSuccess } from "./components/CheckoutWebView";
import { ContactUs } from "./components/ContactUs";
import { AboutUs } from "./components/AboutUs";
import { NotificationInbox } from "./components/NotificationInbox";
import { NotificationSettings } from "./components/NotificationSettings";
import { NotificationAdmin } from "./components/NotificationAdmin";
import { NotificationPrompt } from "./components/NotificationPrompt";
import { SplashScreen } from "./components/SplashScreen";
import { BottomNav } from "./components/BottomNav";
import { SupremeOffers } from "./components/SupremeOffers";
import { BackendStatus } from "./components/BackendStatus";
import { BackendTestPage } from "./components/BackendTestPage";
import { Toaster } from "./components/ui/sonner";
import { notificationService } from "./lib/notifications";
import { Home } from "./components/Home";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showBackendStatus, setShowBackendStatus] = useState(true);

  useEffect(() => {
    // Initialize notification service when app starts
    notificationService.initialize();

    // Hide backend status after 10 seconds if user doesn't interact
    const timer = setTimeout(() => {
      setShowBackendStatus(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/preview_page.html"
            element={<Navigate to="/" replace />}
          />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/notifications" element={<NotificationInbox />} />
          <Route path="/notifications/settings" element={<NotificationSettings />} />
          <Route path="/notifications/admin" element={<NotificationAdmin />} />
          <Route path="/supreme-offers" element={<SupremeOffers />} />
          <Route path="/backend-test" element={<BackendTestPage />} />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
        <BottomNav />
        <NotificationPrompt />
        <Toaster />
        {showBackendStatus && <BackendStatus />}
      </div>
    </Router>
  );
}