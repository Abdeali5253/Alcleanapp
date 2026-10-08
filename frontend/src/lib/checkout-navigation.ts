import { Capacitor, registerPlugin } from "@capacitor/core";

const CheckoutNavigation = registerPlugin<{ returnToApp(): Promise<void> }>(
  "CheckoutNavigation",
);

// Dismiss checkout to expose the app; order verification is handled separately.
export async function returnFromCheckout(
  browser: { close?: () => unknown } | null,
): Promise<void> {
  try {
    await browser?.close?.();
  } catch (error) {
    console.warn("[Checkout] Could not close payment browser:", error);
  }
  if (Capacitor.getPlatform() === "android") {
    try {
      await CheckoutNavigation.returnToApp();
    } catch (error) {
      console.warn("[Checkout] Could not foreground app:", error);
    }
  }
}
