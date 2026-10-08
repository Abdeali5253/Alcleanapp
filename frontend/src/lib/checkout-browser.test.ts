// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ native: true }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => mocks.native } }));
import { getCheckoutToken, getNativeCheckoutBrowser } from "./checkout-browser";
beforeEach(() => { vi.useFakeTimers(); mocks.native = true; delete (window as any).cordova; });
afterEach(() => { vi.useRealTimers(); delete (window as any).cordova; });
describe("native checkout browser", () => {
  it("waits for asynchronous native plugin registration", async () => {
    const pending = getNativeCheckoutBrowser();
    const browser = { open: vi.fn() };
    window.setTimeout(() => { (window as any).cordova = { InAppBrowser: browser }; }, 250);
    await vi.advanceTimersByTimeAsync(300);
    expect(await pending).toBe(browser);
  });
  it("returns the registered browser immediately", async () => {
    const browser = { open: vi.fn() };
    (window as any).cordova = { InAppBrowser: browser };
    expect(await getNativeCheckoutBrowser()).toBe(browser);
  });
  it("fails visibly when the native plugin is missing instead of falling through to Custom Tabs", async () => {
    const assertion = expect(getNativeCheckoutBrowser()).rejects.toThrow("Payment browser is still starting");
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });
  it("allows the web browser flow outside native apps", async () => {
    mocks.native = false;
    expect(await getNativeCheckoutBrowser()).toBeUndefined();
  });
});

describe("checkout navigation identity", () => {
  const initial = "https://alclean.pk/cart/c/session";
  it("captures modern and legacy Shopify checkout tokens", () => {
    expect(getCheckoutToken("https://alclean.pk/checkouts/cn/checkout-123/thank-you", initial)).toBe("checkout-123");
    expect(getCheckoutToken("https://alclean.pk/123/checkouts/checkout-456/thank_you", initial)).toBe("checkout-456");
  });
  it("rejects foreign hosts, insecure URLs, credentials and noncheckout pages", () => {
    for (const url of ["https://evil.com/checkouts/token", "http://alclean.pk/checkouts/token", "https://evil@alclean.pk/checkouts/token", "https://alclean.pk/account"]) {
      expect(getCheckoutToken(url, initial)).toBeNull();
    }
  });
});
