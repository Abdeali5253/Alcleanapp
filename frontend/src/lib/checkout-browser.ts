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

// Navigation supplies an identity hint, never proof that an order completed.
export function getCheckoutToken(rawUrl: string, initialUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const initial = new URL(initialUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const allowedHosts = new Set([initial.hostname, "alclean.pk", "checkout.shopify.com"]);
    if (!allowedHosts.has(url.hostname)) return null;
    return url.pathname.match(/\/checkouts\/(?:cn\/)?([A-Za-z0-9_-]+)(?:\/|$)/)?.[1] || null;
  } catch {
    return null;
  }
}

export function isCheckoutThankYouPage(rawUrl: string, initialUrl: string): boolean {
  if (!getCheckoutToken(rawUrl, initialUrl)) return false;
  try {
    return /\/checkouts\/(?:cn\/)?[A-Za-z0-9_-]+\/(?:thank_you|thank-you)\/?$/.test(new URL(rawUrl).pathname);
  } catch { return false; }
}
