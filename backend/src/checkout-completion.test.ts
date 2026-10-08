import { describe, expect, it } from "vitest";
import { isCompletedCartOrder } from "./checkout-completion.js";
const since = Date.parse("2026-10-08T10:00:00Z");
const order = { cartToken: "cart-1", createdAt: "2026-10-08T10:01:00Z", totalPriceSet: { shopMoney: { amount: "680.00" } } };
describe("cart checkout completion", () => {
  it("confirms the exact cart regardless of estimated delivery charges", () => {
    expect(isCompletedCartOrder(order, "cart-1", since)).toBe(true);
  });
  it("rejects another cart, missing identity, old orders and invalid dates", () => {
    expect(isCompletedCartOrder(order, "other-cart", since)).toBe(false);
    expect(isCompletedCartOrder(order, "", since)).toBe(false);
    expect(isCompletedCartOrder({ ...order, createdAt: "2026-10-08T09:59:00Z" }, "cart-1", since)).toBe(false);
    expect(isCompletedCartOrder({ ...order, createdAt: "invalid" }, "cart-1", since)).toBe(false);
  });
  it("accepts the exact checkout token when Shopify exposes that identity", () => {
    expect(isCompletedCartOrder({ ...order, cartToken: null, checkoutToken: "cart-1" }, "different-cart-id", since, "cart-1")).toBe(true);
    expect(isCompletedCartOrder({ ...order, cartToken: null, checkoutToken: "other-checkout" }, "different-cart-id", since, "cart-1")).toBe(false);
  });
});
