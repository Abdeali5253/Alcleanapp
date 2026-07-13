import fs from "fs";
import path from "path";
import { sendNotificationToUser } from "../routes/notifications.js";
import {
  getOpenOrdersForTrackingNotifications,
  getTrackingNotificationSnapshot,
  isTrackingNotificationExcludedCity,
} from "../routes/orders.js";

interface TrackingNotificationState {
  [orderId: string]: { fingerprint: string; notifiedAt: string };
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "tracking-notification-state.json");
const DEFAULT_INTERVAL_HOURS = 24;
let checkInProgress = false;

function loadState(): TrackingNotificationState {
  try {
    if (!fs.existsSync(STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (error) {
    console.error("[Tracking Notifications] Failed to load state:", error);
    return {};
  }
}

function saveState(state: TrackingNotificationState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
  fs.renameSync(temporaryFile, STATE_FILE);
}

function getFingerprint(snapshot: {
  trackingNumber?: string;
  status: string;
  trackingStatusText: string;
  trackingLastUpdated?: string;
}): string {
  return [
    snapshot.trackingNumber || "",
    snapshot.status,
    snapshot.trackingStatusText,
    snapshot.trackingLastUpdated || "",
  ].join("|");
}

export async function runTrackingNotificationCheck(): Promise<void> {
  if (checkInProgress) {
    console.log("[Tracking Notifications] Previous check is still running");
    return;
  }

  checkInProgress = true;
  const state = loadState();
  let checked = 0;
  let sent = 0;
  let skippedCity = 0;

  try {
    const orders = await getOpenOrdersForTrackingNotifications();
    console.log(
      `[Tracking Notifications] Checking ${orders.length} open order(s)`,
    );

    for (const order of orders) {
      try {
        if (!order.customerId || !order.city) continue;
        if (isTrackingNotificationExcludedCity(order.city)) {
          skippedCity++;
          continue;
        }

        checked++;
        const snapshot = await getTrackingNotificationSnapshot(order);
        if (!snapshot.trackingNumber) continue;
        if (isTrackingNotificationExcludedCity(snapshot.city)) {
          skippedCity++;
          continue;
        }

        const fingerprint = getFingerprint(snapshot);
        if (state[order.id]?.fingerprint === fingerprint) continue;

        const result = await sendNotificationToUser({
          userId: order.customerId,
          title: `Tracking update for ${order.orderNumber}`,
          body: snapshot.latestCheckpoint?.details
            ? `${snapshot.trackingStatusText}: ${snapshot.latestCheckpoint.details}`
            : snapshot.trackingStatusText || `Your order is ${snapshot.status}.`,
          type: "order_update",
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingNumber: snapshot.trackingNumber,
            status: snapshot.status,
            deepLink: "/tracking",
          },
        });

        if (result.success > 0) {
          state[order.id] = {
            fingerprint,
            notifiedAt: new Date().toISOString(),
          };
          saveState(state);
          sent++;
        }
      } catch (error) {
        console.error(
          `[Tracking Notifications] Failed order ${order.orderNumber}:`,
          error,
        );
      }
    }

    console.log(
      `[Tracking Notifications] Complete: ${checked} checked, ${sent} notified, ${skippedCity} local-city skipped`,
    );
  } catch (error) {
    console.error("[Tracking Notifications] Check failed:", error);
  } finally {
    checkInProgress = false;
  }
}

export function startTrackingNotificationScheduler(): void {
  if (process.env.TRACKING_NOTIFICATIONS_ENABLED === "false") {
    console.log("[Tracking Notifications] Scheduler disabled");
    return;
  }

  const configuredHours = Number(
    process.env.TRACKING_NOTIFICATION_INTERVAL_HOURS || DEFAULT_INTERVAL_HOURS,
  );
  const intervalHours =
    Number.isFinite(configuredHours) && configuredHours > 0
      ? configuredHours
      : DEFAULT_INTERVAL_HOURS;
  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(
    `[Tracking Notifications] Scheduled every ${intervalHours} hour(s)`,
  );

  const startupTimer = setTimeout(() => {
    void runTrackingNotificationCheck();
  }, 15_000);
  startupTimer.unref();

  const intervalTimer = setInterval(() => {
    void runTrackingNotificationCheck();
  }, intervalMs);
  intervalTimer.unref();
}
