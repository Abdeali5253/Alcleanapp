import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect } from "react";

interface CheckoutSuccessProps {
  checkoutUrl: string;
  onClose: () => void;
}

export function CheckoutSuccess({ checkoutUrl, onClose }: CheckoutSuccessProps) {
  // Auto-open checkout in new window
  useEffect(() => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  }, [checkoutUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <h2 className="mb-2">Order Created Successfully!</h2>
        
        <p className="text-gray-600 mb-6">
          Your order has been created. A new window has opened with your Shopify checkout page to complete the payment.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => window.open(checkoutUrl, '_blank')}
            className="w-full"
          >
            Open Checkout Again
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          If the checkout window didn't open, please check your browser's popup blocker settings.
        </p>
      </div>
    </div>
  );
}
