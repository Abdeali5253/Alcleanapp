import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Package,
  Tag,
  Sparkles,
  Truck,
  TestTube,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { NotificationSettings as Settings } from "../types/notifications";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

export function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    deliveryAlerts: true,
  });

  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // Load current settings
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);

    // Check permission
    const checkPermission = async () => {
      try {
        const perm = await notificationService.checkPermission();
        setPermission(perm);
        setFcmToken(notificationService.getFCMToken());
      } catch (e) {
        console.error("[NotificationSettings] Error checking permission:", e);
      }
    };

    checkPermission();
  }, []);

  const handleToggleMaster = async () => {
    if (isEnabling) return;
    
    if (!settings.enabled) {
      // User wants to enable notifications
      setIsEnabling(true);
      console.log("[NotificationSettings] Enabling notifications...");
      
      try {
        const granted = await notificationService.requestPermission();
        console.log("[NotificationSettings] Permission result:", granted);
        
        if (granted) {
          const newSettings = { ...settings, enabled: true };
          setSettings(newSettings);
          notificationService.updateSettings(newSettings);
          setPermission("granted");
          
          // Wait a bit for token
          setTimeout(() => {
            setFcmToken(notificationService.getFCMToken());
          }, 1500);
          
          toast.success("Notifications enabled! 🔔");
        } else {
          toast.error(
            isNative
              ? "Permission denied. Please enable in app settings."
              : "Permission denied. Please enable in browser settings."
          );
        }
      } catch (error) {
        console.error("[NotificationSettings] Error enabling notifications:", error);
        toast.error("Failed to enable notifications. Please try again.");
      } finally {
        setIsEnabling(false);
      }
    } else {
      // User wants to disable notifications
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

  const handleTestNotification = async () => {
    await notificationService.sendTestNotification();
    toast.success("Test notification sent!");
  };

  const handleScheduledTest = async () => {
    if (isNative) {
      const id = await notificationService.scheduleLocalNotification({
        title: "⏰ Scheduled Reminder",
        body: "This notification was scheduled 10 seconds ago!",
        delayMinutes: 0.17, // ~10 seconds
        data: { type: "general" },
      });
      if (id) {
        toast.success("Notification scheduled for 10 seconds!");
      }
    } else {
      toast.info("Scheduled notifications only work on mobile app");
    }
  };

  const handleRegisterPush = async () => {
    try {
      console.log("[NotificationSettings] Manually registering for push...");
      const granted = await notificationService.requestPermission();
      if (granted) {
        // Wait a bit for token to be received
        setTimeout(() => {
          const token = notificationService.getFCMToken();
          setFcmToken(token);
          if (token) {
            toast.success("Push notifications registered!");
            console.log("[NotificationSettings] FCM Token:", token.substring(0, 50) + "...");
          } else {
            toast.info("Waiting for FCM token...");
          }
        }, 2000);
      } else {
        toast.error("Permission denied");
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notification Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Master Toggle */}
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
              <h2 className="font-bold text-gray-900 mb-1">Push Notifications</h2>
              <p className="text-sm text-gray-600 mb-4">
                {settings.enabled
                  ? "Notifications are enabled. You'll receive updates about orders, discounts, and more."
                  : "Notifications are disabled. Enable to stay updated with your orders and exclusive offers."}
              </p>

              {permission === "denied" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    ⚠️ Notifications are blocked.{" "}
                    {isNative
                      ? "Please enable them in your device settings."
                      : "Please enable them in browser settings."}
                  </p>
                </div>
              )}

              <Button
                onClick={handleToggleMaster}
                className={`w-full ${
                  settings.enabled
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
                }`}
              >
                {settings.enabled ? "Disable All Notifications" : "Enable Notifications"}
              </Button>
            </div>
          </div>
        </div>

        {/* Individual Settings */}
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
                      <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
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

        {/* Test Notifications */}
        {settings.enabled && permission === "granted" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Test Notifications</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <TestTube size={18} />
                  Local Test
                </Button>
                {isNative && (
                  <Button
                    onClick={handleScheduledTest}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Clock size={18} />
                    Schedule (10s)
                  </Button>
                )}
              </div>
              {isNative && !fcmToken && (
                <Button
                  onClick={handleRegisterPush}
                  className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
                >
                  🔔 Register for Push Notifications
                </Button>
              )}
              {isNative && fcmToken && (
                <div className="text-center text-sm text-green-600 font-medium">
                  ✅ Push notifications registered!
                </div>
              )}
            </div>
          </div>
        )}

        {/* FCM Token Info (Debug) */}
        {fcmToken && (
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Device Token</h4>
            <p className="text-xs text-gray-500 font-mono break-all">
              {fcmToken.substring(0, 50)}...
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Why enable notifications?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Stay updated on your order status in real-time</li>
            <li>• Never miss exclusive discounts and flash sales</li>
            <li>• Be first to know about new product launches</li>
            <li>• Get delivery updates directly to your device</li>
            <li>• Receive personalized offers based on your interests</li>
          </ul>
        </div>

        {/* Platform Info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Platform: {Capacitor.getPlatform()} | Native: {isNative ? "Yes" : "No"}
        </div>
      </div>
    </div>
  );
}
