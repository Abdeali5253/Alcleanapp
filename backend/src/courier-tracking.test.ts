import { beforeEach, describe, expect, it } from "vitest";

import { buildCourierRequest, mapCourierEvents } from "./routes/orders.js";

describe("courier tracking requests", () => {
  beforeEach(() => {
    process.env.LEOPARD_TRACKING_URL = "https://leopard.example/track";
    process.env.LEOPARD_TRACKING_API_KEY = "leopard-key";
    process.env.LEOPARD_TRACKING_API_PASSWORD = "leopard-password";
    process.env.DAEWOO_TRACKING_URL = "https://daewoo.example/quickTrack";
    process.env.DAEWOO_API_KEY = "daewoo-key";
    process.env.POSTEX_TRACKING_URL =
      "https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}";
    process.env.POSTEX_API_TOKEN = "postex-token";
  });

  it("builds the Leopard request selected by Finac", () => {
    expect(buildCourierRequest("Leopard", "LP-123")).toEqual({
      url: "https://leopard.example/track",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: "leopard-key",
        api_password: "leopard-password",
        track_numbers: "LP-123",
      }),
    });
  });

  it("normalizes Leopard's live tracking field names and removes duplicate scans", () => {
    expect(
      mapCourierEvents({
        status: 1,
        packet_list: [
          {
            booked_packet_status: "Dispatched",
            "Tracking Detail": [
              {
                Status: "Shipment picked in TCP HUB",
                Status_With_City: "Shipment picked in KARACHI",
                Activity_Date: "2026-09-24",
                Activity_Time: "21:19:11",
                Activity_datetime: "2026-09-24 21:19:11",
              },
              {
                Status: "Dispatched to GUJRANWALA",
                Status_With_City: "Dispatched to GUJRANWALA",
                Activity_Date: "2026-09-25",
                Activity_Time: "00:11:44",
                Activity_datetime: "2026-09-25 00:11:44",
              },
              {
                Status: "Dispatched to GUJRANWALA",
                Status_With_City: "Dispatched to GUJRANWALA",
                Activity_Date: "2026-09-25",
                Activity_Time: "00:11:44",
                Activity_datetime: "2026-09-25 00:11:44",
              },
            ],
          },
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        status: "processing",
        label: "Shipment picked in KARACHI",
        timestamp: "2026-09-24T16:19:11.000Z",
      }),
      expect.objectContaining({
        status: "in-transit",
        label: "Dispatched to GUJRANWALA",
        timestamp: "2026-09-24T19:11:44.000Z",
      }),
    ]);
  });

  it("builds the Daewoo request selected by Finac", () => {
    expect(buildCourierRequest("Daewoo", "DW-123")).toEqual({
      url: "https://daewoo.example/quickTrack?trackingNo=DW-123",
      method: "GET",
      headers: { Authorization: "Bearer daewoo-key" },
    });
  });

  it("builds the PostEx request selected by Finac", () => {
    expect(buildCourierRequest("PostEx", "PX/123")).toEqual({
      url: "https://api.postex.pk/services/integration/api/order/v1/track-order/PX%2F123",
      method: "GET",
      headers: { token: "postex-token" },
    });
  });

  it("normalizes a scalar PostEx status response", () => {
    expect(
      mapCourierEvents({
        statusCode: "200",
        dist: {
          transactionStatus: "Delivered",
          transactionDate: "2026-09-24T17:00:00+05:00",
        },
      }),
    ).toEqual([
      expect.objectContaining({
        status: "delivered",
        label: "Delivered",
        timestamp: "2026-09-24T12:00:00.000Z",
      }),
    ]);
  });

  it("also treats Call Courier assignments as PostEx", () => {
    expect(buildCourierRequest("Call Courier", "CC-123")).toEqual(
      expect.objectContaining({
        url: expect.stringContaining("/CC-123"),
        headers: { token: "postex-token" },
      }),
    );
  });
});
