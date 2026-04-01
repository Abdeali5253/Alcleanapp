import { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
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
import { Capacitor, registerPlugin } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { toast } from "sonner";
import { authService } from "./lib/auth";

type StatusBarStyle = "DARK" | "LIGHT" | "DEFAULT";
interface StatusBarPlugin {
  setOverlaysWebView(options: { overlay: boolean }): Promise<void>;
  setStyle(options: { style: StatusBarStyle }): Promise<void>;
  setBackgroundColor(options: { color: string }): Promise<void>;
}

const StatusBar = registerPlugin<StatusBarPlugin>("StatusBar");

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [showBackendStatus, setShowBackendStatus] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Initialize notification service
      await notificationService.initialize();

      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: "DARK" });
          await StatusBar.setBackgroundColor({ color: "#ffffffff" });
        } catch (e) {
          console.log("[App] StatusBar setup skipped:", e);
        }

        // Request push notification permission (shows Android system dialog)
        // This will get FCM token if user allows
        setTimeout(async () => {
          try {
            const granted = await notificationService.requestPermission();

            if (granted) {
              // Wait for FCM token
              setTimeout(() => {
                const token = notificationService.getFCMToken();
                if (!token) {
                  console.warn(
                    "[App] Push permission granted but FCM token is not available yet",
                  );
                }
              }, 1000);
            }
          } catch (e) {
            console.error("[App] Push permission error:", e);
          }
        }, 2000);
      }

    };

    initApp();

    const timer = setTimeout(() => setShowBackendStatus(false), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || showSplash) return;

    const isRootRoute = location.pathname === "/";

    const sub = CapApp.addListener("backButton", async () => {
      const mobileMenuOpen = document.querySelector("[data-mobile-menu='open']");
      if (mobileMenuOpen) {
        const closeButton = mobileMenuOpen.querySelector(
          "[data-mobile-menu-close='true']",
        ) as HTMLButtonElement | null;
        closeButton?.click();
        return;
      }

      if (window.history.length > 1 && !isRootRoute) {
        navigate(-1);
        return;
      }

      try {
        await CapApp.exitApp();
      } catch (error) {
        console.log("[App] exitApp skipped:", error);
      }
    });

    return () => {
      sub.then((listener) => listener.remove());
    };
  }, [location.pathname, navigate, showSplash]);

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

        if (u.protocol === "com.alclean.app:" || path === "/account") {
          navigate("/account", { replace: true });
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
    <div className="min-h-screen bg-gray-50 app-shell">
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
