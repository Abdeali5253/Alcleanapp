import { CheckCircle } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

// This page is presentation-only. The cart is cleared by Checkout only after
// the backend verifies the Shopify order.
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const verified = (location.state as { verified?: boolean } | null)?.verified;

  if (!verified) {
    return <Navigate to="/checkout" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 safe-area">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your order. You will receive an email confirmation shortly
          with your order details and tracking information.
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
