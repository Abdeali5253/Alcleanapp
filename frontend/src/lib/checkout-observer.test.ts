// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKOUT_RETURN_PROBE, observeHostedCheckoutConfirmation } from "./checkout-observer";
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });
function probe(url: string) {
  return new Function("document", "location", `return ${CHECKOUT_RETURN_PROBE}`)(document, { href: url });
}
describe("hosted checkout confirmation observer", () => {
  it("detects the screenshot confirmation rendered without a URL change", async () => {
    vi.useFakeTimers();
    const url = "https://alclean.pk/cart/c/checkout-session";
    document.body.textContent = "Contact Delivery Complete order";
    const onReturn = vi.fn();
    const browser = { executeScript: vi.fn((_options, callback) => callback([probe(url)])) };
    const stop = observeHostedCheckoutConfirmation(browser, url, onReturn);
    expect(onReturn).not.toHaveBeenCalled();
    document.body.textContent = "Thank you, Abdeali! Your order is confirmed Payment method Cash on Delivery";
    await vi.advanceTimersByTimeAsync(1000);
    expect(onReturn).toHaveBeenCalledExactlyOnceWith(url);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onReturn).toHaveBeenCalledOnce();
    stop();
  });
  it("rejects confirmation content on a foreign host", async () => {
    vi.useFakeTimers();
    document.body.textContent = "Thank you, Abdeali! Your order is confirmed";
    const onReturn = vi.fn();
    const stop = observeHostedCheckoutConfirmation({ executeScript: (_options, callback) => callback([probe("https://evil.com/confirmation")]) }, "https://alclean.pk/cart/c/session", onReturn);
    await vi.advanceTimersByTimeAsync(2000);
    expect(onReturn).not.toHaveBeenCalled();
    stop();
  });
  it("stops inspecting when the browser is dismissed", async () => {
    vi.useFakeTimers();
    const browser = { executeScript: vi.fn() };
    const stop = observeHostedCheckoutConfirmation(browser, "https://alclean.pk/cart/c/session", vi.fn());
    stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(browser.executeScript).toHaveBeenCalledOnce();
  });
});
