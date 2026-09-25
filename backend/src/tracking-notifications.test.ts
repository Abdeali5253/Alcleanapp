import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let stateFile = "";
  let snapshot: any = {
    trackingNumber: "KI7544684050",
    courier: "Leopard",
    status: "processing" as const,
    city: "Gujranwala",
    trackingStatusText: "Tracking assigned",
    trackingLastUpdated: "2026-09-22T16:40:00.000Z",
    latestCheckpoint: {
      status: "processing",
      label: "Tracking assigned",
      details: "Leopard tracking number KI7544684050",
      timestamp: "2026-09-22T16:40:00.000Z",
      completed: true,
      source: "system" as const,
    },
  };

  return {
    get stateFile() {
      return stateFile;
    },
    set stateFile(value: string) {
      stateFile = value;
    },
    get snapshot() {
      return snapshot;
    },
    set snapshot(value: typeof snapshot) {
      snapshot = value;
    },
    sendNotificationToUser: vi.fn(async () => ({ success: 1, failure: 0 })),
    cronValidate: vi.fn(() => true),
    cronSchedule: vi.fn(),
    getTrackingOrders: vi.fn(async () => [
      {
        id: "gid://shopify/Order/1",
        orderNumber: "#1001",
        createdAt: "2026-09-22T16:40:00.000Z",
        city: "Gujranwala",
        customerId: "gid://shopify/Customer/1",
      },
    ]),
    getSnapshot: vi.fn(async () => snapshot),
  };
});

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => Boolean(mocks.stateFile)),
    readFileSync: vi.fn(() => mocks.stateFile),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn((_path: string, value: string) => {
      mocks.stateFile = value;
    }),
    renameSync: vi.fn(),
  },
}));

vi.mock("node-cron", () => ({
  default: {
    validate: mocks.cronValidate,
    schedule: mocks.cronSchedule,
  },
}));

vi.mock("./routes/notifications.js", () => ({
  sendNotificationToUser: mocks.sendNotificationToUser,
}));

vi.mock("./routes/orders.js", () => ({
  getTrackingOrdersFromFinac: mocks.getTrackingOrders,
  getTrackingNotificationSnapshot: mocks.getSnapshot,
}));

import {
  runTrackingNotificationCheck,
  startTrackingNotificationScheduler,
} from "./services/tracking-notifications.js";

describe("tracking status notifications", () => {
  beforeEach(() => {
    mocks.stateFile = "";
    mocks.sendNotificationToUser.mockClear();
    mocks.getTrackingOrders.mockClear();
    mocks.getSnapshot.mockClear();
    mocks.cronValidate.mockClear();
    mocks.cronSchedule.mockClear();
    delete process.env.TRACKING_NOTIFICATION_CRON;
    delete process.env.TRACKING_NOTIFICATION_TIME_ZONE;
    delete process.env.TRACKING_NOTIFICATIONS_ENABLED;
    mocks.snapshot = {
      trackingNumber: "KI7544684050",
      courier: "Leopard",
      status: "processing",
      city: "Gujranwala",
      trackingStatusText: "Tracking assigned",
      trackingLastUpdated: "2026-09-22T16:40:00.000Z",
      latestCheckpoint: {
        status: "processing",
        label: "Tracking assigned",
        details: "Leopard tracking number KI7544684050",
        timestamp: "2026-09-22T16:40:00.000Z",
        completed: true,
        source: "system",
      },
    };
  });

  it("registers the noon and 5 PM Pakistan cron schedule", () => {
    startTrackingNotificationScheduler();

    expect(mocks.cronValidate).toHaveBeenCalledWith("0 12,17 * * *");
    expect(mocks.cronSchedule).toHaveBeenCalledWith(
      "0 12,17 * * *",
      expect.any(Function),
      { timezone: "Asia/Karachi" },
    );
  });

  it("sends once per status fingerprint and sends again after a status update", async () => {
    await runTrackingNotificationCheck();
    await runTrackingNotificationCheck();

    expect(mocks.sendNotificationToUser).toHaveBeenCalledTimes(1);
    expect(mocks.sendNotificationToUser).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: "gid://shopify/Customer/1",
        type: "order_update",
        data: expect.objectContaining({
          orderId: "gid://shopify/Order/1",
          status: "processing",
        }),
      }),
    );

    mocks.snapshot = {
      ...mocks.snapshot,
      status: "delivered",
      trackingStatusText: "Delivered",
      trackingLastUpdated: "2026-09-24T10:00:00.000Z",
      latestCheckpoint: {
        status: "delivered",
        label: "Delivered",
        details: "Shipment delivered successfully",
        timestamp: "2026-09-24T10:00:00.000Z",
        completed: true,
        source: "courier",
      },
    };

    await runTrackingNotificationCheck();

    expect(mocks.sendNotificationToUser).toHaveBeenCalledTimes(2);
    expect(mocks.sendNotificationToUser).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Tracking update for #1001",
        body: "Delivered: Shipment delivered successfully",
        data: expect.objectContaining({ status: "delivered" }),
      }),
    );
  });
});
