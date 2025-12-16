import { useState } from "react";
import { Send, Users, Tag, Package, Sparkles, Truck, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UnifiedHeader } from "./UnifiedHeader";
import { notificationService } from "../lib/notifications";
import { NotificationType, NotificationSegment } from "../types/notifications";
import { toast } from "sonner";

export function NotificationAdmin() {
  const [title, setTitle] = useState(");
  const [body, setBody] = useState(");
  const [type, setType] = useState<NotificationType>("general");
  const [segment, setSegment] = useState<NotificationSegment>("all_users");
  const [discountCode, setDiscountCode] = useState(");
  const [isSending, setIsSending] = useState(false);

  const notificationTypes: { value: NotificationType; label: string; icon: any }[] = [
    { value: "general", label: "General", icon: Bell },
    { value: "discount", label: "Discount", icon: Tag },
    { value: "sale", label: "Sale", icon: Tag },
    { value: "new_product", label: "New Product", icon: Sparkles },
    { value: "order_update", label: "Order Update", icon: Package },
    { value: "delivery", label: "Delivery", icon: Truck },
  ];

  const segments: { value: NotificationSegment; label: string }[] = [
    { value: "all_users", label: "All Users" },
    { value: "active_customers", label: "Active Customers" },
    { value: "inactive_customers", label: "Inactive Customers" },
    { value: "karachi", label: "Karachi" },
    { value: "lahore", label: "Lahore" },
    { value: "islamabad", label: "Islamabad" },
    { value: "rawalpindi", label: "Rawalpindi" },
  ];

  const quickTemplates = [
    {
      label: "Weekend Sale",
      title: "Weekend Special! 🎉",
      body: "Get 20% off on all cleaning products this weekend only!",
      type: "sale" as NotificationType,
    },
    {
      label: "New Product",
      title: "New Arrival! ✨",
      body: "Check out our latest eco-friendly cleaning solution!",
      type: "new_product" as NotificationType,
    },
    {
      label: "Flash Discount",
      title: "Flash Discount! ⚡",
      body: "Limited time: Extra 15% off with code FLASH15",
      type: "discount" as NotificationType,
    },
    {
      label: "Order Update",
      title: "Order Dispatched 📦",
      body: "Your order has been dispatched and is on the way!",
      type: "order_update" as NotificationType,
    },
  ];

  const handleUseTemplate = (template: typeof quickTemplates[0]) => {
    setTitle(template.title);
    setBody(template.body);
    setType(template.type);
  };

  const handleSendNotification = async () => {
    if (!title || !body) {
      toast.error("Please enter title and message");
      return;
    }

    setIsSending(true);

    try {
      const data: any = {};
      if (discountCode) {
        data.discountCode = discountCode;
      }

      await notificationService.sendNotification({
        title,
        body,
        type,
        targetAudience: "all",
        segment,
        data,
      });

      toast.success("Notification sent successfully! 🎉");
      
      // Clear form
      setTitle(");
      setBody(");
      setDiscountCode(");
    } catch (error) {
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Send Notification
          </h1>
          <p className="text-gray-600">
            Notify customers about discounts, sales, and order updates
          </p>
        </div>

        {/* Quick Templates */}
        <div className="mb-6">
          <Label className="mb-3 block">Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleUseTemplate(template)}
                className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#6DB33F] transition-colors text-left"
              >
                <span className="font-semibold text-sm">{template.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* Notification Type */}
          <div>
            <Label className="mb-3 block">Notification Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {notificationTypes.map((typeOption) => {
                const Icon = typeOption.icon;
                return (
                  <button
                    key={typeOption.value}
                    onClick={() => setType(typeOption.value)}
                    className={`p-3 border-2 rounded-xl transition-all ${
                      type === typeOption.value
                        ? "border-[#6DB33F] bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={type === typeOption.value ? "text-[#6DB33F] mx-auto mb-1" : "text-gray-400 mx-auto mb-1"}
                    />
                    <span className="text-xs font-semibold block text-center">
                      {typeOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <Label htmlFor="segment" className="mb-2 block">
              Target Audience
            </Label>
            <select
              id="segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value as NotificationSegment)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6DB33F] focus:border-transparent"
            >
              {segments.map((seg) => (
                <option key={seg.value} value={seg.value}>
                  {seg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="mb-2 block">
              Notification Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekend Sale! 🎉"
              className="border-gray-200 focus:border-[#6DB33F] focus:ring-[#6DB33F]"
              maxLength={50}
            />
            <span className="text-xs text-gray-500 mt-1 block">
              {title.length}/50 characters
            </span>
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="body" className="mb-2 block">
              Message
            </Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message here..."
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6DB33F] focus:border-transparent resize-none"
              maxLength={200}
            />
            <span className="text-xs text-gray-500 mt-1 block">
              {body.length}/200 characters
            </span>
          </div>

          {/* Discount Code (conditional) */}
          {(type === "discount" || type === "sale") && (
            <div>
              <Label htmlFor="discountCode" className="mb-2 block">
                Discount Code (Optional)
              </Label>
              <Input
                id="discountCode"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="e.g., SAVE20"
                className="border-gray-200 focus:border-[#6DB33F] focus:ring-[#6DB33F]"
              />
            </div>
          )}

          {/* Preview */}
          {title && body && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <Label className="mb-3 block text-gray-600">Preview</Label>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#6DB33F] to-[#5da035] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-gray-600">{body}</p>
                    {discountCode && (
                      <div className="mt-2">
                        <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Code: {discountCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendNotification}
            disabled={!title || !body || isSending}
            className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-bold py-6 rounded-xl shadow-lg disabled:opacity-50"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send size={20} className="mr-2" />
                Send Notification to {segment.replace("_", " ")}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            ⚠️ This will send a notification to all selected users immediately
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Users size={18} />
            Best Practices
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep titles short and attention-grabbing</li>
            <li>• Include emojis to make notifications stand out</li>
            <li>• Send discounts during peak shopping hours (6-9 PM)</li>
            <li>• Don't send more than 2-3 notifications per day</li>
            <li>• Personalize messages for better engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
