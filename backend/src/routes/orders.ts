import { Router, Request, Response } from "express";
import fetch from "node-fetch";

const router = Router();

type AppOrderStatus = "pending" | "processing" | "in-transit" | "delivered";

interface TrackingAssignment {
  order_id?: string;
  courier?: string;
  tracking_number?: string;
  company_type?: string;
  customer_name?: string;
  phone?: string;
  city?: string;
}

interface TrackingTimelineEvent {
  status: string;
  label: string;
  details?: string;
  location?: string;
  timestamp?: string;
  completed: boolean;
  source: "system" | "courier";
}

interface CourierTrackingResult {
  timeline: TrackingTimelineEvent[];
  error?: string;
}

interface LocalDeliveryContact {
  city: string;
  managerName: string;
  phone: string;
  estimatedWindow: string;
  note: string;
}

const LOCAL_DELIVERY_CONTACTS: Record<string, LocalDeliveryContact> = {
  karachi: {
    city: "Karachi",
    managerName: "Mr Ahsan",
    phone: "+923312709542",
    estimatedWindow: "2-3 days",
    note: "Karachi orders are delivered directly by the local team in 2-3 days.",
  },
  lahore: {
    city: "Lahore",
    managerName: "Mr Aftab",
    phone: "+923235555702",
    estimatedWindow: "2-3 days",
    note: "Lahore orders are handled by the local delivery manager in 2-3 days.",
  },
  islamabad: {
    city: "Islamabad",
    managerName: "Mr Muhammad",
    phone: "+923345245651",
    estimatedWindow: "2-3 days",
    note: "Islamabad orders are handled by the local delivery manager in 2-3 days.",
  },
  rawalpindi: {
    city: "Rawalpindi",
    managerName: "Mr Muhammad",
    phone: "+923345245651",
    estimatedWindow: "2-3 days",
    note: "Rawalpindi orders are handled by the local delivery manager in 2-3 days.",
  },
};

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN || "";
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
  const url = domain ? `https://${domain}/api/${apiVersion}/graphql.json` : "";

  return { domain, token, apiVersion, url };
}

function getTrackingConfig() {
  return {
    assignmentsUrl:
      process.env.TRACKING_ASSIGNMENTS_URL ||
      "https://app.albizco.com/end_points/get_tracking.php?comapny_type=Alclean",
    leopardUrl: process.env.LEOPARD_TRACKING_URL || "",
    leopardApiKey: process.env.LEOPARD_TRACKING_API_KEY || "",
    leopardApiPassword: process.env.LEOPARD_TRACKING_API_PASSWORD || "",
    leopardApiHeader:
      process.env.LEOPARD_TRACKING_API_HEADER || "Authorization",
    daewooUrl:
      process.env.DAEWOO_TRACKING_URL ||
      "https://codapi.daewoo.net.pk/api/booking/quickTrack",
    daewooApiKey: process.env.DAEWOO_API_KEY || "",
  };
}

function isShopifyConfigured(): boolean {
  const { domain, token } = getShopifyConfig();
  return !!(domain && token);
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const { url, token } = getShopifyConfig();

  if (!isShopifyConfigured()) {
    throw new Error("Shopify not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("[Shopify] GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }

  return json.data;
}

function normalizeOrderNumber(value?: string | number | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeTrackingOrderId(value?: string | number | null): string {
  return String(value ?? "")
    .trim()
    .replace(/^#/, "");
}

function normalizePhone(value?: string | null): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

function normalizeCity(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getLocalDeliveryContact(
  city?: string | null,
): LocalDeliveryContact | null {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return null;

  if (normalizedCity.includes("karachi")) {
    return LOCAL_DELIVERY_CONTACTS.karachi;
  }

  if (normalizedCity.includes("lahore")) {
    return LOCAL_DELIVERY_CONTACTS.lahore;
  }

  if (normalizedCity.includes("islamabad")) {
    return LOCAL_DELIVERY_CONTACTS.islamabad;
  }
  if (normalizedCity.includes("rawalpindi")) {
    return LOCAL_DELIVERY_CONTACTS.rawalpindi;
  }
  return null;
}

function buildTimestamp(value: any): string | undefined {
  if (!value) return undefined;

  const direct = new Date(String(value));
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  if (typeof value === "object") {
    const datePart = value.date || value.status_date || value.created_at;
    const timePart = value.time || value.status_time;
    if (datePart || timePart) {
      const combined = [datePart, timePart].filter(Boolean).join(" ");
      const parsed = new Date(combined);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  return undefined;
}

function getTextValue(
  entry: Record<string, any>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = entry[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return undefined;
}

function inferStatusFromText(text: string): TrackingTimelineEvent["status"] {
  const lower = text.toLowerCase();
  if (lower.includes("deliver")) return "delivered";
  if (
    lower.includes("transit") ||
    lower.includes("dispatch") ||
    lower.includes("shipment") ||
    lower.includes("out for delivery") ||
    lower.includes("arrival") ||
    lower.includes("received at facility")
  ) {
    return "in-transit";
  }
  if (
    lower.includes("book") ||
    lower.includes("pickup") ||
    lower.includes("manifest") ||
    lower.includes("confirm") ||
    lower.includes("process")
  ) {
    return "processing";
  }
  return "pending";
}

function findTimelineArrays(input: any, path = "root", depth = 0): any[] {
  if (depth > 4 || input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    const looksLikeTimeline = input.some((item) => {
      if (!item || typeof item !== "object") return false;
      const keys = Object.keys(item).join(" ").toLowerCase();
      return (
        keys.includes("status") ||
        keys.includes("activity") ||
        keys.includes("detail") ||
        keys.includes("date") ||
        keys.includes("time") ||
        keys.includes("location")
      );
    });

    const current = looksLikeTimeline ? [{ path, value: input }] : [];
    const nested = input.flatMap((item, index) =>
      findTimelineArrays(item, `${path}[${index}]`, depth + 1),
    );
    return [...current, ...nested];
  }

  if (typeof input === "object") {
    return Object.entries(input).flatMap(([key, value]) =>
      findTimelineArrays(value, `${path}.${key}`, depth + 1),
    );
  }

  return [];
}

function mapCourierEvents(payload: any): TrackingTimelineEvent[] {
  const candidates = findTimelineArrays(payload);
  const bestMatch = candidates.sort(
    (a, b) => b.value.length - a.value.length,
  )[0];

  if (!bestMatch) {
    return [];
  }

  const events = bestMatch.value
    .map((entry: Record<string, any>) => {
      const label =
        getTextValue(entry, ["status", "activity", "description", "detail"]) ||
        getTextValue(entry, ["reason", "remarks", "message"]);
      if (!label) {
        return null;
      }

      return {
        status: inferStatusFromText(label),
        label,
        details: getTextValue(entry, ["remarks", "detail", "message"]),
        location: getTextValue(entry, ["location", "city", "branch"]),
        timestamp:
          buildTimestamp(getTextValue(entry, ["timestamp", "datetime"])) ||
          buildTimestamp(entry),
        completed: true,
        source: "courier" as const,
      };
    })
    .filter(Boolean) as TrackingTimelineEvent[];

  return events.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return -1;
    if (!b.timestamp) return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

function stringifyCourierError(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => stringifyCourierError(item))
      .filter(Boolean)
      .join(", ");
    return joined || undefined;
  }
  if (typeof value === "object") {
    return (
      stringifyCourierError(value.message) ||
      stringifyCourierError(value.error) ||
      stringifyCourierError(value.detail) ||
      stringifyCourierError(value.reason)
    );
  }
  return String(value);
}

function collectCourierMessages(input: any, depth = 0): string[] {
  if (depth > 4 || input == null) {
    return [];
  }

  if (typeof input === "string") {
    return [input.trim()].filter(Boolean);
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectCourierMessages(item, depth + 1));
  }

  if (typeof input === "object") {
    return Object.entries(input).flatMap(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes("message") ||
        normalizedKey.includes("error") ||
        normalizedKey.includes("reason") ||
        normalizedKey.includes("detail") ||
        normalizedKey.includes("remark")
      ) {
        return collectCourierMessages(value, depth + 1);
      }
      return [];
    });
  }

  return [];
}

function extractCourierError(payload: any): string | undefined {
  if (payload == null) {
    return "Courier API returned an empty response.";
  }

  const directError =
    stringifyCourierError(payload.error) ||
    stringifyCourierError(payload.errors) ||
    stringifyCourierError(payload.error_message);

  if (directError) {
    return directError;
  }

  const messages = collectCourierMessages(payload);
  const errorHints = [
    "not found",
    "no record",
    "invalid",
    "error",
    "failed",
    "unable",
    "does not exist",
    "incorrect",
  ];

  const hintedMessage = messages.find((message) =>
    errorHints.some((hint) => message.toLowerCase().includes(hint)),
  );

  if (hintedMessage) {
    return hintedMessage;
  }

  if (Array.isArray(payload?.packet_list) && payload.packet_list.length === 0) {
    return (
      stringifyCourierError(payload.message) ||
      "Order not found in courier system."
    );
  }

  if (payload?.status === false || payload?.status === 0) {
    return (
      stringifyCourierError(payload.message) ||
      stringifyCourierError(payload.status_message) ||
      "Courier API returned an unsuccessful status."
    );
  }

  return undefined;
}

function buildTrackingAssignmentsUrl(orderId?: string): string {
  const { assignmentsUrl } = getTrackingConfig();
  const url = new URL(assignmentsUrl);

  if (orderId) {
    url.searchParams.set("order_id", orderId);
  }

  return url.toString();
}

async function fetchTrackingAssignments(
  orderId?: string,
): Promise<TrackingAssignment[]> {
  const { assignmentsUrl } = getTrackingConfig();
  if (!assignmentsUrl) {
    return [];
  }

  try {
    const response = await fetch(buildTrackingAssignmentsUrl(orderId));
    if (!response.ok) {
      throw new Error(
        `Tracking assignments request failed: ${response.status}`,
      );
    }

    const data: any = await response.json();
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (data && typeof data === "object") {
      return [data];
    }

    return [];
  } catch (error) {
    console.error("[Orders] Failed to fetch tracking assignments:", error);
    return [];
  }
}

function buildCourierRequest(
  courier: string,
  trackingNumber: string,
): {
  url: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: string;
} | null {
  const {
    leopardUrl,
    leopardApiKey,
    leopardApiPassword,
    leopardApiHeader,
    daewooUrl,
    daewooApiKey,
  } = getTrackingConfig();
  const normalizedCourier = courier.trim().toLowerCase();

  if (normalizedCourier.includes("daewoo")) {
    if (!daewooUrl || !daewooApiKey) {
      return null;
    }

    const url = new URL(daewooUrl);
    url.searchParams.set("trackingNo", trackingNumber);

    return {
      url: url.toString(),
      method: "GET",
      headers: {
        Authorization: `Bearer ${daewooApiKey}`,
      },
    };
  }

  if (!normalizedCourier.includes("leopard") || !leopardUrl) {
    return null;
  }

  if (leopardApiPassword) {
    return {
      url: leopardUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: leopardApiKey,
        api_password: leopardApiPassword,
        track_numbers: trackingNumber,
      }),
    };
  }

  const url = leopardUrl.includes("{trackingNumber}")
    ? leopardUrl.replace("{trackingNumber}", encodeURIComponent(trackingNumber))
    : `${leopardUrl}${leopardUrl.includes("?") ? "&" : "?"}trackingNumber=${encodeURIComponent(trackingNumber)}`;

  const headers: Record<string, string> = {};

  if (leopardApiKey) {
    headers[leopardApiHeader] =
      leopardApiHeader.toLowerCase() === "authorization"
        ? `Bearer ${leopardApiKey}`
        : leopardApiKey;
  }

  return { url, method: "GET", headers };
}

async function fetchCourierTimeline(
  courier?: string,
  trackingNumber?: string,
): Promise<CourierTrackingResult> {
  if (!courier || !trackingNumber) {
    return { timeline: [] };
  }

  const request = buildCourierRequest(courier, trackingNumber);
  if (!request) {
    return { timeline: [] };
  }

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    if (!response.ok) {
      return {
        timeline: [],
        error: `Courier tracking request failed: ${response.status} ${response.statusText}`,
      };
    }

    const payload = await response.json();
    const error = extractCourierError(payload);
    const timeline = mapCourierEvents(payload);

    if (error) {
      return { timeline, error };
    }

    if (!timeline.length) {
      return {
        timeline: [],
        error: "Courier API returned no tracking scans for this shipment.",
      };
    }

    return { timeline };
  } catch (error) {
    console.error("[Orders] Failed to fetch courier timeline:", error);
    return {
      timeline: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch courier tracking details.",
    };
  }
}

function buildFallbackTimeline(
  order: any,
  localDelivery: LocalDeliveryContact | null,
): TrackingTimelineEvent[] {
  const timeline: TrackingTimelineEvent[] = [
    {
      status: "processing",
      label: "Order placed",
      details: "Your order was received and is being prepared.",
      timestamp: order.createdAt,
      completed: true,
      source: "system",
    },
  ];

  if (localDelivery) {
    timeline.push({
      status: "processing",
      label: `Assigned to ${localDelivery.city} delivery team`,
      details: `${localDelivery.managerName} will coordinate the local delivery. ${localDelivery.note}`,
      completed: true,
      source: "system",
    });

    if (order.status === "in-transit" || order.status === "delivered") {
      timeline.push({
        status: "in-transit",
        label: "Out for local delivery",
        details: `Estimated delivery window: ${localDelivery.estimatedWindow}`,
        completed: true,
        source: "system",
      });
    }

    if (order.status === "delivered") {
      timeline.push({
        status: "delivered",
        label: "Delivered by local team",
        details: `Completed by the ${localDelivery.city} team.`,
        completed: true,
        source: "system",
      });
    }

    return timeline;
  }

  if (order.trackingNumber) {
    timeline.push({
      status: "processing",
      label: "Tracking assigned",
      details: `${order.courier || "Courier"} tracking number ${order.trackingNumber}`,
      completed: true,
      source: "system",
    });
  }

  if (order.status === "in-transit" || order.status === "delivered") {
    timeline.push({
      status: "in-transit",
      label: "Parcel in transit",
      details: "Your shipment is moving through the courier network.",
      completed: true,
      source: "system",
    });
  }

  if (order.status === "delivered") {
    timeline.push({
      status: "delivered",
      label: "Delivered",
      details: "The parcel has been delivered successfully.",
      completed: true,
      source: "system",
    });
  }

  return timeline;
}

function mapShopifyStatus(
  financialStatus: string,
  fulfillmentStatus: string,
): AppOrderStatus {
  if (fulfillmentStatus === "FULFILLED") return "delivered";
  if (
    fulfillmentStatus === "PARTIALLY_FULFILLED" ||
    fulfillmentStatus === "IN_PROGRESS"
  ) {
    return "in-transit";
  }
  if (financialStatus === "PAID" || financialStatus === "PARTIALLY_PAID") {
    return "processing";
  }
  return "pending";
}

function transformShopifyOrder(order: any): any {
  const lineItems = order.lineItems.edges.map((itemEdge: any) => {
    const item = itemEdge.node;
    return {
      product: {
        id: item.variant?.id || "",
        title: item.title,
        image: item.variant?.image?.url || "",
        price: parseFloat(item.variant?.price?.amount || "0"),
        variantId: item.variant?.id || "",
      },
      quantity: item.quantity,
    };
  });

  return {
    id: order.id,
    orderNumber: `#${order.orderNumber}`,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    city: "",
    items: lineItems,
    subtotal: parseFloat(order.totalPrice.amount),
    deliveryCharge: 0,
    total: parseFloat(order.totalPrice.amount),
    paymentMethod: "cod",
    status: mapShopifyStatus(order.financialStatus, order.fulfillmentStatus),
    createdAt: order.processedAt,
    shopifyOrderId: order.id,
  };
}

function matchTrackingAssignment(
  order: any,
  assignments: TrackingAssignment[],
  customerPhone: string,
): TrackingAssignment | undefined {
  const orderNumber = normalizeOrderNumber(order.orderNumber);
  const phone = normalizePhone(customerPhone);

  return assignments.find((assignment) => {
    const assignmentOrderNumber = normalizeOrderNumber(assignment.order_id);
    const assignmentPhone = normalizePhone(assignment.phone);
    const orderMatches = orderNumber && assignmentOrderNumber === orderNumber;
    const phoneMatches = phone && assignmentPhone === phone;

    if (orderMatches && phoneMatches) return true;
    if (orderMatches) return true;
    return !!phoneMatches && !assignmentOrderNumber;
  });
}

async function enrichOrderTracking(
  order: any,
  assignment?: TrackingAssignment,
): Promise<any> {
  const trackingNumber = assignment?.tracking_number || order.trackingNumber;
  const courier = assignment?.courier || order.courier;
  const city = order.city || assignment?.city || "";
  const localDelivery = getLocalDeliveryContact(city);
  const courierResult = localDelivery
    ? { timeline: [] }
    : await fetchCourierTimeline(courier, trackingNumber);
  const courierTimeline = courierResult.timeline;
  const fallbackTimeline = buildFallbackTimeline(
    {
      ...order,
      trackingNumber,
      courier,
    },
    localDelivery,
  );
  const trackingTimeline =
    courierTimeline.length > 0 ? courierTimeline : fallbackTimeline;

  const deliveredFromTimeline = trackingTimeline.some(
    (event) => event.status === "delivered",
  );
  const status: AppOrderStatus =
    deliveredFromTimeline || order.status === "delivered"
      ? "delivered"
      : trackingTimeline.some((event) => event.status === "in-transit")
        ? "in-transit"
        : order.status;

  const latestCheckpoint =
    trackingTimeline[trackingTimeline.length - 1] || fallbackTimeline[0];

  return {
    ...order,
    status,
    trackingNumber,
    courier: localDelivery ? "Alclean Local Delivery" : courier,
    companyType: assignment?.company_type || order.companyType,
    city,
    trackingTimeline,
    trackingStatusText: latestCheckpoint?.label || "",
    trackingLastUpdated: latestCheckpoint?.timestamp,
    ratingEligible: status === "delivered",
    localDelivery,
    courierTrackingError: courierResult.error,
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const query = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
          orders(first: 50) {
            edges {
              node {
                id
                orderNumber
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        id
                        price {
                          amount
                          currencyCode
                        }
                        image {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyFetch<{ customer: any }>(query, {
      customerAccessToken: accessToken,
    });
    const customer = data.customer;

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const orders = await Promise.all(
      (customer.orders?.edges || []).map(async (edge: any) => {
        const order = transformShopifyOrder(edge.node);
        order.customerEmail = customer.email;
        order.customerName =
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          customer.email;
        order.customerPhone = customer.phone || "";

        const assignments = await fetchTrackingAssignments(
          normalizeTrackingOrderId(order.orderNumber),
        );
        const assignment = matchTrackingAssignment(
          order,
          assignments,
          customer.phone,
        );

        return enrichOrderTracking(order, assignment);
      }),
    );

    orders.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    console.log(
      `[Orders] Fetched ${orders.length} orders for ${customer.email}`,
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("[Orders] Get orders error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get orders",
    });
  }
});

export default router;
