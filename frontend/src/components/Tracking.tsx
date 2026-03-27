import {
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../lib/auth";
import { BACKEND_URL } from "../lib/base-url";
import { Order } from "../lib/order-service";
import { OrderRating, orderRatingService } from "../lib/order-rating";
import { UnifiedHeader } from "./UnifiedHeader";
import { Button } from "./ui/button";

type RatingsMap = Record<string, OrderRating>;

const EMPTY_REVIEW_DRAFT = { stars: 0, review: "" };

function normalizeTimeline(order: Order) {
  if (order.trackingTimeline?.length) {
    return order.trackingTimeline;
  }

  return [
    {
      status: order.status,
      label:
        order.status === "delivered"
          ? "Delivered"
          : order.status === "in-transit"
            ? "Parcel in transit"
            : order.status === "processing"
              ? "Order processing"
              : "Order placed",
      details: order.trackingStatusText,
      completed: true,
      source: "system" as const,
      timestamp: order.trackingLastUpdated || order.createdAt,
    },
  ];
}

export function Tracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<RatingsMap>({});
  const [drafts, setDrafts] = useState<Record<string, { stars: number; review: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRatings(orderRatingService.getAll());
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!authService.isLoggedIn()) {
      setIsLoading(false);
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (!user?.accessToken) {
        console.error("[Tracking] No access token");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        console.error("[Tracking] Backend error:", data.error);
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("[Tracking] Error loading orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Pending update";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Pending update";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in-transit":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "processing":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDraft = (orderId: string) => drafts[orderId] || EMPTY_REVIEW_DRAFT;

  const updateDraft = (
    orderId: string,
    patch: Partial<{ stars: number; review: string }>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || EMPTY_REVIEW_DRAFT),
        ...patch,
      },
    }));
  };

  const submitRating = (order: Order) => {
    const draft = getDraft(order.id);
    if (!draft.stars) {
      toast.error("Please choose a star rating first.");
      return;
    }

    const saved = orderRatingService.save(order.id, draft.stars, draft.review);
    setRatings((current) => ({ ...current, [order.id]: saved }));
    toast.success("Thanks for rating your delivery.");
  };

  const enrichedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        timeline: normalizeTimeline(order),
        rating: ratings[order.id] || null,
      })),
    [orders, ratings],
  );

  if (!authService.isLoggedIn()) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="flex items-center justify-center px-4 pt-20">
          <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please login to track your orders
            </p>
            <Button
              onClick={() => navigate("/account")}
              className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6DB33F] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-gray-900 text-2xl">Track Your Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live parcel updates appear here as soon as the courier assigns a
            tracking number.
          </p>
        </div>

        {enrichedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t placed any orders. Start shopping to see your
              orders here.
            </p>
            <Button
              onClick={() => navigate("/products")}
              className="bg-[#6DB33F] hover:bg-[#5da035]"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {enrichedOrders.map((order) => {
              const draft = getDraft(order.id);
              const latestTimelineItem = order.timeline[order.timeline.length - 1];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900 font-mono font-semibold">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status === "in-transit"
                            ? "In Transit"
                            : order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Ordered on {formatDate(order.createdAt)}
                      </p>
                      {order.trackingStatusText && (
                        <p className="text-sm text-[#6DB33F] mt-2">
                          {order.trackingStatusText}
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-gray-900 font-bold">
                        Rs.{order.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.length} items
                      </p>
                      {order.trackingLastUpdated && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated {formatDateTime(order.trackingLastUpdated)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {item.product.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm text-gray-900">
                            Rs.
                            {(
                              item.product.price * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-gray-500 pl-15">
                          +{order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 mt-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {order.localDelivery ? "Local Delivery" : "Shipment Details"}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-gray-700">
                            <p>
                              <span className="font-medium">
                                {order.localDelivery ? "Handled by:" : "Courier:"}
                              </span>{" "}
                              {order.courier || "Pending assignment"}
                            </p>
                            {order.localDelivery ? (
                              <>
                                <p>
                                  <span className="font-medium">Delivery manager:</span>{" "}
                                  {order.localDelivery.managerName}
                                </p>
                                <p>
                                  <span className="font-medium">Phone:</span>{" "}
                                  <a
                                    href={`tel:${order.localDelivery.phone}`}
                                    className="text-[#6DB33F] underline-offset-2 hover:underline"
                                  >
                                    {order.localDelivery.phone}
                                  </a>
                                </p>
                                <p>
                                  <span className="font-medium">Expected time:</span>{" "}
                                  {order.localDelivery.estimatedWindow}
                                </p>
                                <p className="text-xs text-gray-500 pt-1">
                                  {order.localDelivery.note}
                                </p>
                              </>
                            ) : (
                              <p>
                                <span className="font-medium">Tracking #:</span>{" "}
                                {order.trackingNumber || "Will appear once shipped"}
                              </p>
                            )}
                            {latestTimelineItem?.label && (
                              <p>
                                <span className="font-medium">Latest:</span>{" "}
                                {latestTimelineItem.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Delivery Address
                          </p>
                          <p className="text-sm text-gray-900">
                            {order.customerName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customerAddress || "Address will be confirmed at dispatch"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.city || "City pending"}
                          </p>
                          <p className="text-xs text-gray-500 mt-3">
                            Payment:{" "}
                            {order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : "Bank Transfer"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-[#6DB33F]" />
                      <h3 className="text-gray-900 font-medium">
                        Parcel Timeline
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {order.timeline.map((event, index) => {
                        const isLast = index === order.timeline.length - 1;
                        return (
                          <div key={`${order.id}-${index}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                                  event.status === "delivered"
                                    ? "border-green-200 bg-green-100 text-green-600"
                                    : event.status === "in-transit"
                                      ? "border-blue-200 bg-blue-100 text-blue-600"
                                      : "border-amber-200 bg-amber-100 text-amber-600"
                                }`}
                              >
                                {getStatusIcon(event.status)}
                              </div>
                              {!isLast && (
                                <div className="mt-2 h-full min-h-8 w-px bg-gray-200" />
                              )}
                            </div>

                            <div className="flex-1 pb-2">
                              <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.label}
                                  </p>
                                  {event.details && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {event.details}
                                    </p>
                                  )}
                                  {event.location && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(event.timestamp) || "Awaiting scan"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {order.ratingEligible && (
                    <div className="mt-4 rounded-2xl border border-[#6DB33F]/20 bg-[#6DB33F]/5 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-gray-900 font-medium">
                            Rate This Delivery
                          </h3>
                          <p className="text-sm text-gray-600">
                            Share how the parcel delivery experience went.
                          </p>
                        </div>
                        {order.rating && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-200">
                            Submitted {formatDate(order.rating.submittedAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (order.rating?.stars || draft.stars) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => !order.rating && updateDraft(order.id, { stars: star })}
                              disabled={!!order.rating}
                              className="disabled:cursor-default"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  active
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={order.rating?.review || draft.review}
                        onChange={(event) =>
                          updateDraft(order.id, { review: event.target.value })
                        }
                        disabled={!!order.rating}
                        rows={3}
                        placeholder="Optional: tell us about delivery speed, packaging, or courier behavior."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#6DB33F] resize-none disabled:bg-gray-50 disabled:text-gray-500"
                      />

                      {!order.rating && (
                        <Button
                          onClick={() => submitRating(order)}
                          className="mt-3 bg-[#6DB33F] hover:bg-[#5da035]"
                        >
                          Submit Rating
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 bg-gradient-to-r from-[#6DB33F]/10 to-blue-50 rounded-xl p-6 border border-[#6DB33F]/20">
          <h3 className="text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#6DB33F]" />
            Tracking Updates
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">•</span>
              <span>Shopify orders are matched with courier assignments automatically.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">•</span>
              <span>Timeline updates refresh whenever the courier provides a new scan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6DB33F] mt-0.5">•</span>
              <span>Delivered orders unlock a quick delivery rating form.</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
