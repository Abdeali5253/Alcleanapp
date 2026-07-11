import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  Loader2,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { cartService, CartItem } from "../lib/cart";
import { authService, User } from "../lib/auth";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { BACKEND_URL } from "../lib/base-url";

declare global {
  interface Window {
    cordova?: any;
  }
}

export function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const inAppRef = useRef<any>(null);
  const checkoutCompletionHandledRef = useRef(false);
  const checkoutPollingStoppedRef = useRef(true);
  const guestHintShownRef = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const majorCities = ["karachi", "lahore", "islamabad", "rawalpindi"];

  useEffect(() => {
    const unsubscribeCart = cartService.subscribe(setCartItems);
    const unsubscribeAuth = authService.subscribe(setUser);

    return () => {
      unsubscribeCart();
      unsubscribeAuth();
      try {
        inAppRef.current?.close?.();
      } catch {}
      checkoutPollingStoppedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (user || guestHintShownRef.current) {
      return;
    }

    guestHintShownRef.current = true;
    toast.info(
      "Sign in to your account for easier order tracking, or continue as guest.",
      {
        duration: 8000,
        position: "bottom-center",
      },
    );
  }, [user]);

  const calculateTotalWeight = (): number => {
    let totalWeight = 0;
    cartItems.forEach((item) => {
      const weightStr = item.product.weight || "";
      const weightMatch = weightStr.match(
        /(\d+\.?\d*)\s*(KILOGRAMS|KG|GRAMS|G)/i,
      );

      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2].toUpperCase();
        let weightInKg = 0;

        if (unit.includes("KILOGRAM") || unit === "KG") {
          weightInKg = value;
        } else if (unit.includes("GRAM") || unit === "G") {
          weightInKg = value / 1000;
        }

        totalWeight += weightInKg * item.quantity;
      }
    });

    if (totalWeight === 0) {
      totalWeight = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    return totalWeight;
  };

  const calculateDeliveryCharge = (): number => {
    if (!city) return 0;

    const cityLower = city.toLowerCase().trim();
    const isMajorCity = majorCities.some((majorCity) =>
      cityLower.includes(majorCity),
    );

    if (isMajorCity) return 200;

    const totalWeight = calculateTotalWeight();
    return Math.ceil(totalWeight) * 50;
  };

  const subtotal = cartService.getTotal();
  const deliveryCharge = calculateDeliveryCharge();
  const total = subtotal + deliveryCharge;

  const completeCheckout = () => {
    if (checkoutCompletionHandledRef.current) return;
    checkoutCompletionHandledRef.current = true;
    checkoutPollingStoppedRef.current = true;
    cartService.clearCart();
    setPaymentCompleted(true);
    toast.success("Order placed successfully!");
    navigate("/checkout/success", { replace: true });
  };

  const pollForCompletedShopifyOrder = async (
    startedAt: number,
    expectedTotal: number,
    checkoutId: string,
  ) => {
    const accessToken = authService.getUser()?.accessToken;
    if (Capacitor.getPlatform() !== "ios") return;

    checkoutPollingStoppedRef.current = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (
        checkoutPollingStoppedRef.current ||
        checkoutCompletionHandledRef.current
      ) {
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      try {
        const params = new URLSearchParams({
          since: String(startedAt),
          total: String(expectedTotal),
          cartId: checkoutId,
        });
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const response = await fetch(
          `${BACKEND_URL}/api/orders/completion-check?${params}`,
          { headers },
        );
        if (!response.ok) continue;

        const result = await response.json();
        if (!result?.completed) continue;

        console.log("[iOS Checkout] Shopify order confirmed by backend", result.order);
        completeCheckout();
        try {
          inAppRef.current?.close?.();
        } catch {}
        return;
      } catch (pollError) {
        console.warn("[iOS Checkout] Completion poll failed:", pollError);
      }
    }
  };

  const openPaymentPage = async (
    url: string,
    startedAt: number,
    checkoutId: string,
  ) => {
    setCheckoutUrl(url);
    checkoutCompletionHandledRef.current = false;
    void pollForCompletedShopifyOrder(startedAt, total, checkoutId);

    const isCheckoutCompleteUrl = (targetUrl: string) => {
      const normalizedUrl = (targetUrl || "").toLowerCase();
      return (
        normalizedUrl.includes("/thank-you") ||
        normalizedUrl.includes("thank-you") ||
        normalizedUrl.includes("thank_you") ||
        normalizedUrl.includes("order_status") ||
        normalizedUrl.includes("order-status") ||
        normalizedUrl.includes("/orders/") ||
        normalizedUrl.includes("/order-confirmation") ||
        normalizedUrl.includes("/checkout/success") ||
        normalizedUrl.includes("alclean://checkout/success") ||
        normalizedUrl.includes("com.alclean.app://checkout/success")
      );
    };

    const cordovaAny = (window as any).cordova;
    let inAppBrowser = cordovaAny?.InAppBrowser;

    // Capacitor loads Cordova compatibility plugins asynchronously on iOS.
    // Wait briefly so checkout never falls through to SafariViewController,
    // which cannot expose the final Shopify page to the app.
    if (Capacitor.getPlatform() === "ios" && !inAppBrowser) {
      for (let attempt = 0; attempt < 30 && !inAppBrowser; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        inAppBrowser = (window as any).cordova?.InAppBrowser;
      }
    }

    if (Capacitor.isNativePlatform() && inAppBrowser) {
      try {
        inAppRef.current?.close?.();
      } catch {}

      const ref = inAppBrowser.open(
        url,
        "_blank",
        [
          "location=yes",
          "toolbar=yes",
          "toolbarposition=top",
          "closebuttoncaption=Back to AlClean",
          "hidenavigationbuttons=no",
          "hideurlbar=yes",
          "presentationstyle=fullscreen",
          "transitionstyle=coververtical",
          "hardwareback=yes",
          "clearcache=yes",
          "clearsessioncache=yes",
          "hidden=no",
          "hidespinner=yes",
          "zoom=no",
        ].join(","),
      );

      inAppRef.current = ref;

      const handleBrowserUrl = (event: any, source: string) => {
        const targetUrl = event?.url || "";
        console.log(`[IAB] ${source}:`, targetUrl);

        if (!isCheckoutCompleteUrl(targetUrl)) {
          return;
        }

        console.log(`[IAB] checkout completion detected on ${source} -> closing`);
        completeCheckout();
        try {
          ref.close();
        } catch {}
      };

      ref.addEventListener("loadstart", (event: any) => {
        handleBrowserUrl(event, "loadstart");
      });

      ref.addEventListener("loadstop", (event: any) => {
        handleBrowserUrl(event, "loadstop");

        const currentUrl = event?.url || "";
        if (isCheckoutCompleteUrl(currentUrl)) {
          return;
        }

        try {
          ref.executeScript(
            {
              code: `
                (function() {
                  if (window.__alcleanCheckoutObserverInstalled) {
                    return "observer-already-installed";
                  }
                  window.__alcleanCheckoutObserverInstalled = true;

                  function checkoutIsComplete() {
                    var title = (document.title || "").toLowerCase();
                    var body = ((document.body && document.body.innerText) || "")
                      .toLowerCase()
                      .slice(0, 12000);
                    var text = title + " " + body;
                    return text.includes("thank you") ||
                      text.includes("order confirmed") ||
                      text.includes("order is confirmed") ||
                      text.includes("your order is confirmed") ||
                      text.includes("confirmation email");
                  }

                  function notifyApp() {
                    if (!checkoutIsComplete() || window.__alcleanCompletionSent) {
                      return false;
                    }
                    window.__alcleanCompletionSent = true;
                    var payload = JSON.stringify({ type: "alclean-checkout-complete" });
                    if (window.webkit && window.webkit.messageHandlers &&
                        window.webkit.messageHandlers.cordova_iab) {
                      window.webkit.messageHandlers.cordova_iab.postMessage(payload);
                    }
                    // Independent fallback: this produces an InAppBrowser
                    // loadstart event even when Shopify keeps the same HTTPS URL.
                    window.setTimeout(function() {
                      window.location.href = "alclean://checkout/success";
                    }, 50);
                    return true;
                  }

                  notifyApp();
                  var observer = new MutationObserver(notifyApp);
                  observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                  });
                  var poller = window.setInterval(function() {
                    if (notifyApp()) window.clearInterval(poller);
                  }, 500);
                  window.setTimeout(function() {
                    window.clearInterval(poller);
                    observer.disconnect();
                  }, 10 * 60 * 1000);
                  return "observer-installed";
                })();
              `,
            },
            () => {},
          );
        } catch (scriptInjectError) {
          console.warn("[IAB] executeScript failed:", scriptInjectError);
        }
      });

      ref.addEventListener("message", (event: any) => {
        try {
          const payload =
            typeof event?.data === "string"
              ? JSON.parse(event.data)
              : event?.data;
          if (payload?.type !== "alclean-checkout-complete") return;

          console.log("[IAB] checkout completion detected from page content");
          completeCheckout();
          ref.close();
        } catch (messageError) {
          console.warn("[IAB] Failed to process checkout message:", messageError);
        }
      });

      ref.addEventListener("exit", () => {
        console.log("[IAB] exit");
        inAppRef.current = null;
        checkoutPollingStoppedRef.current = true;

        if (!checkoutCompletionHandledRef.current) {
          toast.info("Checkout closed. Your cart has been kept.");
        }
      });

      return;
    }

    console.log("[Checkout] Falling back to Capacitor Browser (no URL events)");
    await Browser.open({ url, presentationStyle: "fullscreen" });
    toast.info("Complete payment in the secure browser, then return to AlClean.");
  };

  const handleCheckout = async () => {
    if (!firstName || !lastName || !phone || !address || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { checkoutUrl: url, checkout } = await cartService.createCheckout();
      await cartService.updateShippingAddress({
        firstName,
        lastName,
        address1: address,
        city,
        province: city,
        country: "PK",
        zip: postalCode || "00000",
        phone,
      });
      toast.success("Opening secure payment page...");
      await openPaymentPage(url, Date.now() - 10_000, checkout.id);
    } catch (error: any) {
      console.error("[Checkout] Error:", error);
      toast.error(
        error.message || "Failed to create checkout. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Order Confirmed</h1>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Thank You for Your Order!
          </h2>
          <p className="text-gray-600 mb-8">
            Your order has been placed successfully. You will receive an email
            confirmation with your order details and tracking information.
          </p>
          <div className="bg-[#6DB33F]/10 rounded-xl p-4 mb-8">
            <p className="text-sm text-[#6DB33F] font-medium">
              Check your email for order confirmation and tracking details
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/tracking")}
              className="w-full bg-[#6DB33F] hover:bg-[#5da035] py-6"
            >
              Track My Orders
            </Button>
            <Button
              onClick={() => navigate("/products")}
              variant="outline"
              className="w-full py-6"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Your cart is empty</p>
          <Button
            onClick={() => navigate("/products")}
            className="mt-4 bg-[#6DB33F]"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-4">
            Order Summary ({cartItems.length} items)
          </h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageWithFallback
                    src={item.product.image}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 text-sm font-medium line-clamp-1">
                    {item.product.title}
                  </h3>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  <p className="text-[#6DB33F] font-bold text-sm">
                    Rs.{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs.{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>{city ? `Rs.${deliveryCharge}` : "Enter city"}</span>
            </div>
            {!city && (
              <p className="text-xs text-amber-600">
                Please enter your city to calculate delivery charges
              </p>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
              <span>Total</span>
              <span className="text-[#6DB33F]">
                Rs.{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={20} className="text-[#6DB33F]" />
            <h2 className="font-bold text-gray-900">Shipping Information</h2>
          </div>
          {!user && (
            <div className="mb-4 rounded-xl border border-[#6DB33F]/20 bg-[#6DB33F]/5 p-3 text-sm text-gray-700">
              You're checking out as a guest. Create an account later if you want
              order history and tracking inside the app.
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92xxxxxxxxxx (use this format)"
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street, Area"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal Code"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 py-4">
          <div className="flex flex-col items-center text-center">
            <Shield size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">Secure Checkout</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <CreditCard size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">
              Multiple Payment Options
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Truck size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">Fast Delivery</span>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white py-6 text-lg font-bold rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Creating Checkout...
            </>
          ) : (
            <>
              <CreditCard size={20} className="mr-2" />
              Proceed to Payment - Rs.{total.toLocaleString()}
            </>
          )}
        </Button>

        {checkoutUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-sm text-blue-700 mb-2">
                <strong>Payment page opened!</strong> Complete your payment and
                it will auto-return after the Thank You page.
              </p>
              <p className="text-xs text-blue-600">
                If it didn't open, tap below:
              </p>
            </div>
            <button
              onClick={() =>
                openPaymentPage(
                  checkoutUrl,
                  Date.now() - 10_000,
                  cartService.getCheckoutId() || "",
                )
              }
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              <ExternalLink size={18} />
              Open Payment Page
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          By proceeding, you agree to our terms and conditions. Payment is
          processed securely by Shopify.
        </p>
      </main>
    </div>
  );
}
