import { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Package,
  Tag,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { NotificationSettings as Settings } from "../types/notifications";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { UnifiedHeader } from "./UnifiedHeader";

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    deliveryAlerts: true,
  });
  const [permission, setPermission] = useState<
    "granted" | "denied" | "default"
  >("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    setSettings(notificationService.getSettings());

    const checkPermission = async () => {
      try {
        const perm = await notificationService.checkPermission();
        setPermission(perm);

        const token = notificationService.getFCMToken();
        setFcmToken(token);

        if (perm === "granted" && !token && isNative) {
          await notificationService.tryRegisterIfPermitted();
          setTimeout(() => {
            setFcmToken(notificationService.getFCMToken());
          }, 2000);
        }
      } catch (e) {
        console.error("[NotificationSettings] Error checking permission:", e);
      }
    };

    checkPermission();
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, [isNative]);

  const handleToggleMaster = async () => {
    if (isEnabling) return;

    if (!settings.enabled) {
      setIsEnabling(true);
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      notificationService.updateSettings(newSettings);

      try {
        const currentPermission = await notificationService.checkPermission();
        setPermission(currentPermission);

        if (currentPermission === "granted") {
          await notificationService.tryRegisterIfPermitted();
          setPermission("granted");

          setTimeout(() => {
            setFcmToken(notificationService.getFCMToken());
          }, 1500);

          toast.success("Notifications enabled!");
        } else if (currentPermission === "default") {
          const granted = await notificationService.requestPermission();
          const updatedPermission = await notificationService.checkPermission();
          setPermission(updatedPermission);

          if (granted) {
            setTimeout(() => {
              setFcmToken(notificationService.getFCMToken());
            }, 1500);
            toast.success("Notifications enabled!");
          } else {
            toast.info(
              isNative
                ? "Notifications are enabled in the app. Allow system permission to receive alerts."
                : "Notifications are enabled in the app. Allow browser permission to receive alerts.",
            );
          }
        } else {
          toast.info(
            isNative
              ? "Notifications are enabled in the app. Allow them in device settings to receive alerts."
              : "Notifications are enabled in the app. Allow them in browser settings to receive alerts.",
          );
        }
      } catch (error) {
        console.error("[NotificationSettings] Error enabling notifications:", error);
        toast.error("Failed to update notification settings. Please try again.");
      } finally {
        setIsEnabling(false);
      }
    } else {
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      notificationService.updateSettings(newSettings);
      toast.success("Notifications disabled");
    }
  };

  const handleToggleSetting = (key: keyof Settings) => {
    if (key === "enabled") {
      handleToggleMaster();
      return;
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
    toast.success("Settings updated");
  };

  const handleRegisterPush = async () => {
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setTimeout(() => {
          const token = notificationService.getFCMToken();
          setFcmToken(token);
          if (token) {
            toast.success("Push notifications registered!");
          } else {
            toast.info("Waiting for FCM token...");
          }
        }, 2000);
      } else {
        toast.info(
          isNative
            ? "System notification permission is still off. Enable it in device settings to receive alerts."
            : "System notification permission is still off. Enable it in browser settings to receive alerts.",
        );
      }
    } catch (e) {
      console.error("[NotificationSettings] Register error:", e);
      toast.error("Registration failed");
    }
  };

  const notificationOptions = [
    {
      key: "orderUpdates" as keyof Settings,
      icon: Package,
      label: "Order Updates",
      description: "Get notified about your order status and delivery",
    },
    {
      key: "promotions" as keyof Settings,
      icon: Tag,
      label: "Promotions & Discounts",
      description: "Receive exclusive offers and discount codes",
    },
    {
      key: "newProducts" as keyof Settings,
      icon: Sparkles,
      label: "New Products",
      description: "Be the first to know about new arrivals",
    },
    {
      key: "deliveryAlerts" as keyof Settings,
      icon: Truck,
      label: "Delivery Alerts",
      description: "Track your delivery in real-time",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                settings.enabled
                  ? "bg-gradient-to-br from-[#6DB33F] to-[#5da035]"
                  : "bg-gray-200"
              }`}
            >
              {settings.enabled ? (
                <Bell size={24} className="text-white" />
              ) : (
                <BellOff size={24} className="text-gray-500" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-bold text-gray-900 mb-1">
                Push Notifications
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {settings.enabled
                  ? "Notifications are enabled. You'll receive updates about orders, discounts, and more."
                  : "Notifications are disabled. Enable to stay updated with your orders and exclusive offers."}
              </p>

              {permission === "denied" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    Notifications are blocked.{" "}
                    {isNative
                      ? "Please enable them in your device settings."
                      : "Please enable them in browser settings."}
                  </p>
                </div>
              )}

              <Button
                onClick={handleToggleMaster}
                disabled={isEnabling}
                className={`w-full ${
                  settings.enabled
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
                }`}
              >
                {isEnabling
                  ? "Enabling..."
                  : settings.enabled
                    ? "Disable All Notifications"
                    : "Enable Notifications"}
              </Button>
            </div>
          </div>
        </div>

        {settings.enabled && (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y overflow-hidden mb-6">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              const isEnabled = settings[option.key];

              return (
                <div key={option.key} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon size={20} className="text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSetting(option.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isEnabled ? "bg-[#6DB33F]" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          isEnabled ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {settings.enabled && isNative && permission !== "granted" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
            Push notifications are not enabled yet.
            <br />
            <span className="text-xs text-yellow-600">
              Allow notification permission in your device settings, or tap below to retry registration.
            </span>
            <div className="mt-3">
              <Button variant="outline" onClick={handleRegisterPush}>
                Retry Push Registration
              </Button>
            </div>
          </div>
        )}

        {settings.enabled && isNative && fcmToken && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-700">
            Push notifications are registered on this device.
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Why enable notifications?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>Stay updated on your order status in real-time</li>
            <li>Never miss exclusive discounts and flash sales</li>
            <li>Be first to know about new product launches</li>
            <li>Get delivery updates directly to your device</li>
            <li>Receive personalized offers based on your interests</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
