import image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357 from 'figma:asset/8f03d5c7f7a5ad0420573e04e40e094b85ac1357.png';
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Upload, X, Loader2 } from "lucide-react";
import { authService } from "../lib/auth";
import { toast } from "sonner@2.0.3";
import { cartService } from "../lib/cart";
import { orderService } from "../lib/order-service";

type PaymentMethod = "cod" | "bank-transfer";

export function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Karachi");

  // Get cart data
  const cartItems = cartService.getCart();
  const subtotal = cartService.getCartTotal();
  
  // Calculate total weight
  const totalWeight = cartItems.reduce((sum, item) => {
    const weight = parseFloat(item.product.weight?.split(' ')[0] || '0');
    return sum + (weight * item.quantity);
  }, 0);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isLoggedIn()) {
        toast.error("Please login to access checkout");
        authService.setRedirectAfterLogin("/checkout");
        navigate("/account", { replace: true });
      } else {
        // Pre-fill form with user data
        const user = authService.getCurrentUser();
        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
          setPhone(user.phone || "");
        }
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6DB33F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate delivery charges
  const majorCities = ["karachi", "islamabad", "rawalpindi", "lahore"];
  const deliveryCharge = majorCities.includes(city.toLowerCase()) 
    ? 200 
    : totalWeight * 50;

  const total = subtotal + deliveryCharge;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !email || !phone || !address || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate bank transfer screenshot
    if (paymentMethod === "bank-transfer" && !screenshot) {
      toast.error("Please upload transaction screenshot for bank transfer");
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const order = await orderService.createOrder(
        cartItems,
        { name, email, phone, address, city },
        deliveryCharge,
        paymentMethod
      );

      setOrderNumber(order.orderNumber);
      
      // Clear cart
      cartService.clearCart();
      
      // Show success
      setStep("success");
      
      // Redirect to tracking after 3 seconds
      setTimeout(() => {
        navigate("/tracking");
      }, 3000);
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pb-20">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-gray-900 text-2xl mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your order. Your order number is:
          </p>
          <div className="bg-gray-100 rounded-lg p-3 mb-6">
            <p className="text-gray-900 font-mono">{orderNumber}</p>
          </div>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-900 font-medium mb-1">
                  Order Created in Shopify
                </p>
                <p className="text-xs text-green-700">
                  Your order has been sent to our system and will be processed shortly.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            You will receive tracking updates via push notifications. We'll notify you when your order is shipped and delivered.
          </p>
          <p className="text-sm text-gray-500">Redirecting to tracking page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357} alt="AlClean" className="h-12 cursor-pointer" />
            </Link>
            <nav className="flex items-center gap-8">
              <Link to="/about" className="text-gray-700 hover:text-[#6DB33F] transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-[#6DB33F] transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-gray-900 text-2xl mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DB33F]"
                  required
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Quetta">Quetta</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4">Payment Method</h2>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#6DB33F] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when you receive your order</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#6DB33F] transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="bank-transfer"
                  checked={paymentMethod === "bank-transfer"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-gray-900">Bank Transfer</p>
                  <p className="text-sm text-gray-500">Upload transaction screenshot</p>
                </div>
              </label>
            </div>

            {paymentMethod === "bank-transfer" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-3">
                  Please transfer to:<br />
                  <span className="font-mono">Account: 1234567890</span><br />
                  <span className="font-mono">Bank: Allied Bank</span>
                </p>
                
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Transaction screenshot"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#6DB33F] transition-colors">
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Upload Screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="text-gray-900">Rs.{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="text-gray-900">Rs.{deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">Rs.{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                {majorCities.includes(city.toLowerCase())
                  ? `Fixed delivery charge of Rs.200 for ${city}`
                  : `Delivery charge: Rs.50 per kg (Total weight: ${totalWeight}kg)`
                }
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-[#6DB33F] hover:bg-[#5da035] h-12"
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Processing...</>
            ) : (
              `Place Order - Rs.${total.toLocaleString()}`
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}