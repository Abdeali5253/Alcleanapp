export const canUseNotification = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  typeof (window as any).Notification !== "undefined";
