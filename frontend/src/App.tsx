import { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
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
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";
import { toast } from "sonner";
import { getRedirectResult } from "firebase/auth";
import { getFirebaseAuth } from "./lib/firebase-config";
import { BACKEND_URL } from "./lib/base-url";
import { authService } from "./lib/auth";

function AppContent() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [showBackendStatus, setShowBackendStatus] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Initialize notification service
      await notificationService.initialize();

      if (Capacitor.isNativePlatform()) {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Light });

        // Request push notification permission (shows Android system dialog)
        // This will get FCM token if user allows
        setTimeout(async () => {
          console.log("[App] Requesting push notification permission...");
          try {
            const granted = await notificationService.requestPermission();
            console.log("[App] Push permission result:", granted);

            if (granted) {
              // Wait for FCM token
              setTimeout(() => {
                const token = notificationService.getFCMToken();
                console.log(
                  "[App] FCM Token:",
                  token ? token.substring(0, 30) + "..." : "null",
                );
              }, 1000);
            }
          } catch (e) {
            console.error("[App] Push permission error:", e);
          }
        }, 2000);
      }

      // Handle Firebase redirect result for Google auth
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            console.log("[App] Firebase redirect result:", result);
            const user = result.user;
            const idToken = await user.getIdToken();

            // Send to backend
            const response = await fetch(
              `${BACKEND_URL}/api/auth/google-login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  idToken,
                }),
              },
            );

            const data = await response.json();
            if (data.success) {
              // Login successful
              authService.updateUser(data.user);
              toast.success("Logged in with Google successfully!");
              // Close the browser after successful auth
              try {
                await Browser.close();
              } catch {}
              navigate("/account");
            } else {
              toast.error(data.error || "Failed to login with Google");
            }
          }
        } catch (error: any) {
          console.error("[App] Firebase redirect error:", error);
        }
      }
    };

    initApp();

    const timer = setTimeout(() => setShowBackendStatus(false), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Deep-link handler: alclean://checkout/success OR https://alclean.pk/checkout/success
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = CapApp.addListener("appUrlOpen", async ({ url }) => {
      try {
        if (!url) return;

        // Normalize: handle both custom scheme and https links
        const u = new URL(url);
        const path = u.pathname || "/";
        const query = u.search || "";

        if (path.startsWith("/checkout/success")) {
          try {
            await Browser.close();
          } catch {}

          navigate(path + query);
          return;
        }

        // Handle Google auth redirect for mobile
        if (
          (u.protocol === "https" &&
            (u.hostname === "capacitor.com.alclean.app" ||
              u.hostname === "app-notification-5e56b.firebaseapp.com" ||
              u.hostname === "localhost") &&
            u.pathname === "/__/auth/handler") ||
          (u.protocol === "http" &&
            u.hostname === "localhost" &&
            u.hash === "#/account") ||
          u.protocol === "com.alclean.app"
        ) {
          // Auth redirect handled by getRedirectResult in useEffect
          return;
        }

        // Handle custom scheme redirect after auth
        if (u.protocol === "com.alclean.app" && u.pathname === "/account") {
          navigate("/account");
          return;
        }

        // Handle web redirect to /accounts (if misconfigured)
        if (
          u.protocol === "http" &&
          u.hostname === "localhost" &&
          u.hash === "#/accounts"
        ) {
          // Auth redirect handled by getRedirectResult
          return;
        }
      } catch (e) {
        console.log("[DeepLink] Failed to parse url:", url, e);
      }
    });

    return () => {
      // @ts-ignore
      sub?.remove?.();
    };
  }, []);

  // Native & Global Notification Toast Handler
  useEffect(() => {
    const handleNotification = (event: any) => {
      const data = event.detail;
      console.log("[App] 🔔 New Notification for Toast:", data);

      if (data && data.title) {
        // Skip toast if we are already on the notification inbox page
        if (window.location.hash.includes("/notifications")) {
          console.log("[App] On notifications page, skipping toast visual");
          return;
        }

        console.log("[App] Triggering Sonner Toast for:", data.title);
        toast(data.title, {
          description: data.body,
          duration: 6000,
          action: {
            label: "View",
            onClick: () => {
              navigate("/notifications");
            },
          },
        });
      }
    };

    window.addEventListener("alclean-notification-toast", handleNotification);
    return () =>
      window.removeEventListener(
        "alclean-notification-toast",
        handleNotification,
      );
  }, [navigate]);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
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
        <Route path="/accounts" element={<Navigate to="/account" replace />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/notifications" element={<NotificationInbox />} />
        <Route
          path="/notification-settings"
          element={<NotificationSettings />}
        />
        <Route
          path="/notifications/settings"
          element={<NotificationSettings />}
        />
        <Route path="/notifications/admin" element={<NotificationAdmin />} />
        <Route path="/supreme-offers" element={<SupremeOffers />} />
        <Route path="/backend-test" element={<BackendTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      {/* Removed NotificationPrompt - using only Android system dialog */}
      <Toaster />
      {showBackendStatus && <BackendStatus />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
