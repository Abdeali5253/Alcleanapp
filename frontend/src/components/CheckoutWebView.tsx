import { useEffect, useState } from "react";
import { cartService } from "../lib/cart";
import { authService } from "../lib/auth";
import { BACKEND_URL } from "../lib/base-url";
import { CheckCircle } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

// Hosted checkout returns here immediately; cart clearing still requires backend verification.
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    verified?: boolean;
    checkoutReturn?: { since: number; total: number; cartId: string; checkoutToken: string | null };
  } | null;
  const verified = state?.verified;
  const checkoutReturn = state?.checkoutReturn;
  const [confirmed, setConfirmed] = useState(!!verified);

  useEffect(() => {
    if (verified || !checkoutReturn) return;
    let stopped = false;
    const verify = async () => {
      for (let attempt = 0; attempt < 600 && !stopped; attempt += 1) {
        try {
          const params = new URLSearchParams({
            since: String(checkoutReturn.since), total: String(checkoutReturn.total),
            cartId: checkoutReturn.cartId,
          });
          if (checkoutReturn.checkoutToken) params.set("checkoutToken", checkoutReturn.checkoutToken);
          const accessToken = authService.getUser()?.accessToken;
          const response = await fetch(`${BACKEND_URL}/api/orders/completion-check?${params}`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          });
          if (response.ok) {
            const result = await response.json();
            if (result.completed && !stopped) {
              cartService.clearCart();
              setConfirmed(true);
              navigate("/checkout/success", { replace: true, state: { verified: true } });
              return;
            }
          }
        } catch {}
        if (!stopped) await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
    };
    void verify();
    return () => { stopped = true; };
  }, [verified, checkoutReturn, navigate]);

  if (!verified && !checkoutReturn) {
    return <Navigate to="/checkout" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 safe-area">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {confirmed ? "Order Placed Successfully!" : "Thank you for your order!"}
        </h1>
        <p className="text-gray-600 mb-6">
          {confirmed
            ? "Thank you for your order. You will receive an email confirmation shortly with your order details and tracking information."
            : "Shopify has shown its thank-you page. We're confirming your order details. Your cart will clear once confirmation is received."}
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">
            Track your order status in the "My Orders" section
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/tracking")}
            className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
          >
            Track My Order
          </Button>
          <Button
            onClick={() => navigate("/products")}
            variant="outline"
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
