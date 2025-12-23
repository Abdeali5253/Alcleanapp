import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { Capacitor } from "@capacitor/core";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<"granted" | "denied" | "default">("default");
  const [isLoading, setIsLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkAndShowPrompt = async () => {
      try {
        // Check if we should show the prompt
        const hasAsked = localStorage.getItem("notification_prompt_shown");

        // Check current permission status
        const currentPermission = await notificationService.checkPermission();
        setPermission(currentPermission);

        // Show prompt if haven't asked yet and permission is default/prompt
        if (!hasAsked && currentPermission === "default") {
          // Show after 3 seconds of app usage
          setTimeout(() => {
            setShow(true);
          }, isNative ? 3000 : 5000);
        }
      } catch (e) {
        console.error("[NotificationPrompt] Error checking permission:", e);
      }
    };

    checkAndShowPrompt();
  }, [isNative]);

  const handleEnable = async () => {
    setIsLoading(true);
    console.log("[NotificationPrompt] User clicked Enable Notifications");
    
    try {
      const granted = await notificationService.requestPermission();
      console.log("[NotificationPrompt] Permission result:", granted);
      
      if (granted) {
        setPermission("granted");
        setShow(false);
        localStorage.setItem("notification_prompt_shown", "true");

        // Send a test notification on native platforms (delayed to avoid race conditions)
        if (isNative) {
          setTimeout(async () => {
            try {
              await notificationService.sendTestNotification();
            } catch (e) {
              console.error("[NotificationPrompt] Test notification failed:", e);
            }
          }, 2000);
        }
      } else {
        // Still hide the prompt but mark as shown
        setShow(false);
        localStorage.setItem("notification_prompt_shown", "true");
      }
    } catch (error) {
      console.error("[NotificationPrompt] Error enabling notifications:", error);
      setShow(false);
      localStorage.setItem("notification_prompt_shown", "true");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("notification_prompt_shown", "true");
  };

  if (!show || permission !== "default") {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#6DB33F] to-[#5da035] rounded-full flex items-center justify-center">
            <Bell size={24} className="text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Stay Updated! 🔔</h3>
            <p className="text-sm text-gray-600 mb-4">
              {isNative
                ? "Enable notifications to get instant updates about your orders, exclusive discounts, and new products!"
                : "Get instant notifications about exclusive discounts, order updates, and new products!"}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
              >
                {isLoading ? "Enabling..." : "Enable Notifications"}
              </Button>
              <Button variant="outline" onClick={handleDismiss} className="px-3" disabled={isLoading}>
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
