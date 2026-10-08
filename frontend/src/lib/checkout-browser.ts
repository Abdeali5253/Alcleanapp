import { Capacitor } from "@capacitor/core";

export async function getNativeCheckoutBrowser(): Promise<any> {
  if (!Capacitor.isNativePlatform()) return undefined;
  // Cordova compatibility plugins register asynchronously on Android and iOS.
  // Native checkout must stay in the browser we can dismiss on confirmation.
  for (let attempt = 0; attempt <= 50; attempt += 1) {
    const browser = (window as any).cordova?.InAppBrowser;
    if (typeof browser?.open === "function") return browser;
    if (attempt < 50) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
  }
  throw new Error("Payment browser is still starting. Please try again.");
}
