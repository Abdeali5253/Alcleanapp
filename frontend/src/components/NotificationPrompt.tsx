import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { Capacitor } from "@capacitor/core";
import { canUseNotification } from "../lib/notification-guard";


export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if we should show the prompt
    const hasAsked = localStorage.getItem("notification_prompt_shown");
    const isAndroid = Capacitor.getPlatform() === "android";
    if (isAndroid || !canUseNotification()) {
      localStorage.setItem("notification_prompt_shown", "true");
      return;
    }
    const currentPermission = Notification.permission;
    
    setPermission(currentPermission);

    // Show prompt if haven't asked yet and permission is default
    if (!hasAsked && currentPermission === "default") {
      // Show after 5 seconds of app usage
      setTimeout(() => {
        setShow(true);
      }, 5000);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission("granted");
      setShow(false);
      localStorage.setItem("notification_prompt_shown", "true");
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
            <h3 className="font-bold text-gray-900 mb-1">
              Stay Updated! 🔔
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant notifications about exclusive discounts, order updates, and new products!
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                className="flex-1 bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
              >
                Enable Notifications
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="px-3"
              >
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
