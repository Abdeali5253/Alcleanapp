import fs from "fs";
import path from "path";
import cron from "node-cron";
import { sendNotificationToUser } from "../routes/notifications.js";
import {
  getTrackingOrdersFromFinac,
  getTrackingNotificationSnapshot,
} from "../routes/orders.js";

interface TrackingNotificationState {
  [orderId: string]: { fingerprint: string; notifiedAt: string };
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "tracking-notification-state.json");
const DEFAULT_CRON_SCHEDULE = "0 12,17 * * *";
const DEFAULT_TIME_ZONE = "Asia/Karachi";
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

  try {
    // Finac supplies the courier and tracking number. Shopify is used only to
    // resolve the order to the authenticated customer who owns the FCM token.
    const orders = await getTrackingOrdersFromFinac();
    console.log(
      `[Tracking Notifications] Checking ${orders.length} Finac assignment(s)`,
    );

    for (const order of orders) {
      try {
        if (!order.customerId) continue;

        checked++;
        const snapshot = await getTrackingNotificationSnapshot(order);
        if (!snapshot.trackingNumber) continue;

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
        } else if (result.failure > 0) {
          console.warn(
            `[Tracking Notifications] Delivery failed for ${order.orderNumber} on ${result.failure} device(s)`,
          );
        } else {
          console.log(
            `[Tracking Notifications] No registered device for customer on ${order.orderNumber}`,
          );
        }
      } catch (error) {
        console.error(
          `[Tracking Notifications] Failed order ${order.orderNumber}:`,
          error,
        );
      }
    }

    console.log(
      `[Tracking Notifications] Complete: ${checked} checked, ${sent} notified`,
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

  const configuredSchedule =
    process.env.TRACKING_NOTIFICATION_CRON || DEFAULT_CRON_SCHEDULE;
  const timeZone =
    process.env.TRACKING_NOTIFICATION_TIME_ZONE || DEFAULT_TIME_ZONE;
  const schedule = cron.validate(configuredSchedule)
    ? configuredSchedule
    : DEFAULT_CRON_SCHEDULE;

  if (schedule !== configuredSchedule) {
    console.warn(
      `[Tracking Notifications] Invalid cron "${configuredSchedule}"; using "${DEFAULT_CRON_SCHEDULE}"`,
    );
  }

  cron.schedule(
    schedule,
    () => {
      void runTrackingNotificationCheck();
    },
    { timezone: timeZone },
  );

  console.log(
    `[Tracking Notifications] Scheduled with cron "${schedule}" in ${timeZone}`,
  );
}
