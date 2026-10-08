import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("node-fetch", () => ({ default: mocks.fetch }));
import ordersRouter from "./routes/orders.js";
const app = express();
app.use("/api/orders", ordersRouter);
const since = Date.parse("2026-10-08T10:00:00Z");
beforeEach(() => {
  vi.clearAllMocks();
  process.env.SHOPIFY_STORE_DOMAIN = "test.myshopify.com";
  process.env.SHOPIFY_ADMIN_API_TOKEN = "test-token";
});
function respond(order: Record<string, unknown>) {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { orders: { nodes: [order] } } }) });
}
describe("checkout completion route", () => {
  it("verifies the observed checkout when its token differs from the Storefront cart ID", async () => {
    respond({ id: "order-1", name: "#1001", cartToken: "different-cart", checkoutToken: "checkout-1", createdAt: "2026-10-08T10:01:00Z" });
    const response = await request(app).get("/api/orders/completion-check").query({ since, total: 880, cartId: "gid://shopify/Cart/cart-1?key=secret", checkoutToken: "checkout-1" });
    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.variables.query).toBe("cart_token:cart-1 OR checkout_token:checkout-1");
    expect(response.body.order.id).toBe("order-1");
  });
  it("does not confirm an unrelated order even if Shopify returns it", async () => {
    respond({ id: "other-order", cartToken: "other-cart", checkoutToken: "other-checkout", createdAt: "2026-10-08T10:01:00Z" });
    const response = await request(app).get("/api/orders/completion-check").query({ since, cartId: "gid://shopify/Cart/cart-1", checkoutToken: "checkout-1" });
    expect(response.body.completed).toBe(false);
  });
  it("rejects token values that could inject extra search conditions", async () => {
    const response = await request(app).get("/api/orders/completion-check").query({ since, checkoutToken: "token OR status:any" });
    expect(response.body.completed).toBe(false);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
