import { useState, useEffect } from "react";
import { ArrowLeft, Bell, BellOff, Package, Tag, Sparkles, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { NotificationSettings as Settings } from "../types/notifications";
import { toast } from "sonner@2.0.3";

export function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    deliveryAlerts: true,
  });

  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Load current settings
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);

    // Check browser permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggleMaster = async () => {
    if (!settings.enabled) {
      // User wants to enable notifications
      const granted = await notificationService.requestPermission();
      if (granted) {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        notificationService.updateSettings(newSettings);
        setPermission("granted");
        toast.success("Notifications enabled! 🔔");
      } else {
        toast.error("Permission denied. Please enable in browser settings.");
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
          <h1 className="text-xl font-bold text-gray-900">
            Notification Settings
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Master Toggle */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              settings.enabled ? "bg-gradient-to-br from-[#6DB33F] to-[#5da035]" : "bg-gray-200"
            }`}>
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
                    ⚠️ Notifications are blocked in your browser. Please enable them in browser settings.
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
          <div className="bg-white rounded-2xl border border-gray-200 divide-y overflow-hidden">
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

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Why enable notifications?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Stay updated on your order status in real-time</li>
            <li>• Never miss exclusive discounts and flash sales</li>
            <li>• Be first to know about new product launches</li>
            <li>• Get delivery updates directly to your device</li>
            <li>• Receive personalized offers based on your interests</li>
          </ul>
        </div>

        {/* Browser Permission Info */}
        {permission !== "granted" && permission !== "denied" && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> After enabling, your browser will ask for permission to send notifications. Click "Allow" to start receiving updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
