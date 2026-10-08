import { Capacitor, registerPlugin } from "@capacitor/core";

const CheckoutNavigation = registerPlugin<{ returnToApp(): Promise<void> }>(
  "CheckoutNavigation",
);

// Called only after the backend verifies the completed order.
export async function returnFromVerifiedCheckout(
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
