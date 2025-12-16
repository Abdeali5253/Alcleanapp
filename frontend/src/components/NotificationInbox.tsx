import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Package, 
  Tag, 
  Sparkles, 
  Truck, 
  Info,
  Trash2,
  CheckCheck
} from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { PushNotification } from "../types/notifications";
import { UnifiedHeader } from "./UnifiedHeader";

export function NotificationInbox() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();

    // Listen for new notifications
    const handleNewNotification = () => {
      loadNotifications();
    };

    window.addEventListener("alclean-notification", handleNewNotification);

    return () => {
      window.removeEventListener("alclean-notification", handleNewNotification);
    };
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      notificationService.clearAll();
      loadNotifications();
    }
  };

  const handleNotificationClick = (notification: PushNotification) => {
    // Mark as read
    handleMarkAsRead(notification.id);

    // Navigate based on type
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.data?.orderId) {
      navigate("/tracking");
    } else if (notification.data?.productId) {
      navigate(`/product/${notification.data.productId}`);
    }
  };

  const getIcon = (type: PushNotification["type"]) => {
    const iconProps = { size: 20, className: "text-white" };
    
    switch (type) {
      case "order_update":
        return <Package {...iconProps} />;
      case "discount":
      case "sale":
        return <Tag {...iconProps} />;
      case "new_product":
        return <Sparkles {...iconProps} />;
      case "delivery":
        return <Truck {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getIconBgColor = (type: PushNotification["type"]) => {
    switch (type) {
      case "order_update":
        return "bg-blue-500";
      case "discount":
      case "sale":
        return "bg-orange-500";
      case "new_product":
        return "bg-purple-500";
      case "delivery":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Notifications
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : "You're all caught up!"}
          </p>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-[#6DB33F] hover:bg-[#5da035]" : "}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-[#6DB33F] hover:bg-[#5da035]" : "}
            >
              Unread ({unreadCount})
            </Button>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-sm"
                >
                  <CheckCheck size={16} className="mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} className="mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-gray-600">
                {filter === "unread" 
                  ? "You've read all your notifications!"
                  : "We'll notify you about orders, discounts, and new products"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? "bg-blue-50 border-blue-200" : "
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.body}
                    </p>

                    {notification.data?.discountCode && (
                      <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Code: {notification.data.discountCode}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Image if available */}
                {notification.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img
                      src={notification.imageUrl}
                      alt="
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
