import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("node-fetch", () => ({
  default: fetchMock,
}));

import {
  getOpenOrdersForTrackingNotifications,
  getTrackingOrdersFromFinac,
} from "./routes/orders.js";

describe("orders eligible for tracking notifications", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
    process.env.SHOPIFY_ADMIN_API_TOKEN = "admin-token";
    process.env.SHOPIFY_ADMIN_API_VERSION = "2026-07";
    process.env.TRACKING_NOTIFICATION_LOOKBACK_DAYS = "90";
  });

  it("includes fulfilled or closed orders and excludes cancelled orders", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          orders: {
            nodes: [
              {
                id: "gid://shopify/Order/fulfilled",
                name: "#1001",
                createdAt: "2026-09-20T10:00:00.000Z",
                cancelledAt: null,
                displayFinancialStatus: "PAID",
                displayFulfillmentStatus: "FULFILLED",
                customer: { id: "gid://shopify/Customer/1" },
                shippingAddress: {
                  city: "Gujranwala",
                  phone: "+923001234567",
                },
              },
              {
                id: "gid://shopify/Order/cancelled",
                name: "#1002",
                createdAt: "2026-09-21T10:00:00.000Z",
                cancelledAt: "2026-09-22T10:00:00.000Z",
                displayFinancialStatus: "VOIDED",
                displayFulfillmentStatus: "UNFULFILLED",
                customer: { id: "gid://shopify/Customer/2" },
                shippingAddress: {
                  city: "Gujranwala",
                  phone: "+923007654321",
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    });

    const orders = await getOpenOrdersForTrackingNotifications();

    expect(orders).toEqual([
      expect.objectContaining({
        id: "gid://shopify/Order/fulfilled",
        fulfillmentStatus: "FULFILLED",
      }),
    ]);

    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body.query).not.toContain('query: "status:open"');
    expect(body.variables.query).toMatch(/^created_at:>=\d{4}-\d{2}-\d{2}$/);
  });

  it("fetches Finac once and attaches its courier assignment to the customer order", async () => {
    process.env.TRACKING_ASSIGNMENTS_URL =
      "https://finac.example/get_tracking.php?company_type=Alclean";

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("myshopify.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              orders: {
                nodes: [
                  {
                    id: "gid://shopify/Order/1",
                    name: "#1001",
                    createdAt: "2026-09-20T10:00:00.000Z",
                    cancelledAt: null,
                    displayFinancialStatus: "PAID",
                    displayFulfillmentStatus: "UNFULFILLED",
                    customer: { id: "gid://shopify/Customer/1" },
                    shippingAddress: {
                      city: "Gujranwala",
                      phone: "+923001234567",
                    },
                  },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            order_id: "1001",
            courier: "PostEx",
            tracking_number: "PX-1001",
            phone: "03001234567",
            city: "Gujranwala",
          },
        ],
      };
    });

    await expect(getTrackingOrdersFromFinac()).resolves.toEqual([
      expect.objectContaining({
        id: "gid://shopify/Order/1",
        customerId: "gid://shopify/Customer/1",
        courier: "PostEx",
        trackingNumber: "PX-1001",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("finac.example/get_tracking.php"),
    );
  });
});
