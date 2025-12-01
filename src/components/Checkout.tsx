import image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357 from '../assets/header.png';
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Upload, X } from "lucide-react";
import { authService } from "../lib/auth";
import { toast } from "sonner";

type PaymentMethod = "cod" | "bank-transfer";

export function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("karachi");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isLoggedIn()) {
        toast.error("Please login to access checkout");
        authService.setRedirectAfterLogin("/checkout");
        navigate("/account", { replace: true });
      } else {
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

  // Mock data - this would come from Shopify backend
  const totalWeight = 5; // Total weight in kg from backend
  const subtotal = 4497;

  // Calculate delivery charges
  const majorCities = ["karachi", "islamabad", "rawalpindi", "lahore"];
  const deliveryCharge = majorCities.includes(selectedCity.toLowerCase()) 
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bank transfer screenshot
    if (paymentMethod === "bank-transfer" && !screenshot) {
      alert("Please upload transaction screenshot for bank transfer");
      return;
    }

    setStep("success");
    setTimeout(() => {
      navigate("/tracking");
    }, 3000);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-gray-900 text-2xl mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          <p className="text-gray-500 text-sm">Redirecting to tracking...</p>
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
          {/* Shipping Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 text-xl mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" required className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    className="mt-1"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" required className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" required className="mt-1" />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 text-xl mb-4">Payment Method</h2>
            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === "cod" ? "border-[#6DB33F] bg-[#6DB33F]/5" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-[#6DB33F] focus:ring-[#6DB33F]"
                />
                <div className="flex-1">
                  <div className="text-gray-900">Cash on Delivery (COD)</div>
                  <div className="text-gray-500 text-sm">Pay when you receive your order</div>
                </div>
              </label>

              {/* Bank Transfer */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === "bank-transfer" ? "border-[#6DB33F] bg-[#6DB33F]/5" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank-transfer"
                  checked={paymentMethod === "bank-transfer"}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-5 h-5 text-[#6DB33F] focus:ring-[#6DB33F]"
                />
                <div className="flex-1">
                  <div className="text-gray-900">Bank Transfer</div>
                  <div className="text-gray-500 text-sm">Transfer payment to our bank account</div>
                </div>
              </label>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === "bank-transfer" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-gray-900 mb-3">Bank Account Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="text-gray-900">HBL Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Title:</span>
                    <span className="text-gray-900">AlClean Pakistan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="text-gray-900">1234-5678-9012-3456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IBAN:</span>
                    <span className="text-gray-900">PK12HABB0012345678901234</span>
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6">
                  <Label htmlFor="screenshot" className="flex items-center gap-2">
                    Transaction Screenshot <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Please upload a screenshot of your transaction as proof of payment
                  </p>

                  {!screenshotPreview ? (
                    <div className="mt-2">
                      <label
                        htmlFor="screenshot"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#6DB33F] hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <Upload size={32} className="text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload screenshot
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG or JPEG (MAX. 5MB)
                          </p>
                        </div>
                        <input
                          id="screenshot"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2 relative">
                      <img
                        src={screenshotPreview}
                        alt="Transaction screenshot"
                        className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-gray-900 text-xl mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs.{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Delivery Charges
                  {!majorCities.includes(selectedCity.toLowerCase()) && (
                    <span className="text-xs ml-1">(Rs.50/kg × {totalWeight}kg)</span>
                  )}
                </span>
                <span>Rs.{deliveryCharge}</span>
              </div>
              {!majorCities.includes(selectedCity.toLowerCase()) && (
                <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  Delivery charge: Rs.50 per kg (Total weight: {totalWeight}kg) for cities outside Karachi, Islamabad, Rawalpindi, and Lahore
                </p>
              )}
              {majorCities.includes(selectedCity.toLowerCase()) && (
                <p className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                  Fixed delivery charge of Rs.200 for {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
                </p>
              )}
              <div className="border-t pt-2 flex justify-between text-gray-900 text-lg">
                <span>Total</span>
                <span>Rs.{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#6DB33F] hover:bg-[#5da035] py-6 text-lg"
          >
            Place Order
          </Button>
        </form>
      </main>
    </div>
  );
}