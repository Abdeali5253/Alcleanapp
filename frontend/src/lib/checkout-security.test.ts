import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../components/Checkout.tsx", import.meta.url),
  "utf8",
);
const successSource = readFileSync(
  new URL("../components/CheckoutWebView.tsx", import.meta.url),
  "utf8",
);

describe("checkout completion trust boundary", () => {
  it("does not inject scripts or trust browser messages and URLs", () => {
    expect(source).not.toContain("executeScript");
    expect(source).not.toContain('addEventListener("message"');
    expect(source).not.toContain("isCheckoutCompleteUrl");
    expect(source).not.toContain("alclean-checkout-complete");
  });

  it("uses the backend completion check before completing checkout", () => {
    expect(source).toContain("/api/orders/completion-check");
    expect(source).toMatch(/if \(!result\?\.completed\) continue;[\s\S]*completeCheckout\(\)/);
  });

  it("does not let the success route clear the cart or trust URL parameters", () => {
    expect(successSource).not.toContain("clearCart");
    expect(successSource).not.toContain("useSearchParams");
    expect(successSource).toContain('state as { verified?: boolean }');
  });
});
