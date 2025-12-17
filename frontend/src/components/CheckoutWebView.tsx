import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { cartService } from "../lib/cart";

interface CheckoutWebViewProps {
  checkoutUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutWebView({ checkoutUrl, onClose, onSuccess }: CheckoutWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openCheckout();
  }, [checkoutUrl]);

  const openCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Web: Open in new window and poll for close
      const checkoutWindow = window.open(checkoutUrl, 'shopify_checkout', 'width=500,height=700');
      
      if (checkoutWindow) {
        // Poll to check if window is closed
        const pollTimer = setInterval(() => {
          if (checkoutWindow.closed) {
            clearInterval(pollTimer);
            checkOrderStatus();
          }
        }, 1000);
      } else {
        // Popup blocked, redirect instead
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error('[Checkout] Error opening checkout:', err);
      setError(err.message || 'Failed to open checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOrderStatus = () => {
    // After checkout window closes, assume order might be complete
    cartService.clearCart();
    onSuccess();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Checkout Error</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline">
            Go Back
          </Button>
          <Button onClick={openCheckout} className="bg-[#6DB33F]">
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <Loader2 size={48} className="text-[#6DB33F] animate-spin mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Opening Secure Checkout</h2>
      <p className="text-gray-600 text-center mb-6">
        You'll be redirected to Shopify's secure payment page.
        <br />
        Complete your payment there and return to the app.
      </p>
      <Button onClick={onClose} variant="outline">
        Cancel
      </Button>
    </div>
  );
}

// Checkout Success Page (for deep link return)
export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Clear cart after successful checkout
    cartService.clearCart();
    
    // Get order details from URL params if available
    const orderId = searchParams.get('order_id');
    if (orderId) {
      console.log('[Checkout] Order ID:', orderId);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
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
            onClick={() => navigate('/tracking')}
            className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
          >
            Track My Order
          </Button>
          
          <Button 
            onClick={() => navigate('/products')}
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
