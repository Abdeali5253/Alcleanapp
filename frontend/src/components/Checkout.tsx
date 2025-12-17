import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, Shield, Loader2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { cartService, CartItem } from "../lib/cart";
import { authService, User } from "../lib/auth";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  
  // Shipping form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    const unsubscribeCart = cartService.subscribe(setCartItems);
    const unsubscribeAuth = authService.subscribe(setUser);
    
    return () => {
      unsubscribeCart();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const subtotal = cartService.getTotal();
  const deliveryCharge = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + deliveryCharge;

  const handleCheckout = async () => {
    // Validate form
    if (!firstName || !lastName || !phone || !address || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      // Save current page and redirect to login
      authService.setRedirectAfterLogin("/checkout");
      toast.info("Please login to continue checkout");
      navigate("/account");
      return;
    }

    setIsLoading(true);

    try {
      // Create Shopify checkout
      const { checkoutUrl, checkout } = await cartService.createCheckout();
      
      // Update shipping address
      await cartService.updateShippingAddress({
        firstName,
        lastName,
        address1: address,
        city,
        province: city, // Using city as province for Pakistan
        country: "Pakistan",
        zip: postalCode || "00000",
        phone,
      });

      // Store checkout URL
      setCheckoutUrl(checkoutUrl);
      
      toast.success("Redirecting to payment...");
      
      // Open Shopify checkout in new tab (or WebView in mobile app)
      window.open(checkoutUrl, '_blank');
      
    } catch (error: any) {
      console.error("[Checkout] Error:", error);
      toast.error(error.message || "Failed to create checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
        </header>
        
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Your cart is empty</p>
          <Button onClick={() => navigate("/products")} className="mt-4 bg-[#6DB33F]">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="font-bold text-gray-900 mb-4">Order Summary ({cartItems.length} items)</h2>
          
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
              <span>{deliveryCharge === 0 ? "FREE" : `Rs.${deliveryCharge}`}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
              <span>Total</span>
              <span className="text-[#6DB33F]">Rs.{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={20} className="text-[#6DB33F]" />
            <h2 className="font-bold text-gray-900">Shipping Information</h2>
          </div>
          
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
                placeholder="+92 300 1234567"
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
                  placeholder="Karachi"
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="75300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 py-4">
          <div className="flex flex-col items-center text-center">
            <Shield size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">Secure Checkout</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <CreditCard size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">Multiple Payment Options</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Truck size={24} className="text-[#6DB33F] mb-1" />
            <span className="text-xs text-gray-500">Fast Delivery</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white py-6 text-lg font-bold rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={20} className="mr-2" />
              Proceed to Payment - Rs.{total.toLocaleString()}
            </>
          )}
        </Button>

        {/* Checkout URL (if created) */}
        {checkoutUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700 mb-2">
              Payment page opened in new tab. If it didn't open, click below:
            </p>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#6DB33F] font-medium"
            >
              <ExternalLink size={16} />
              Open Payment Page
            </a>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          By proceeding, you agree to our terms and conditions. 
          Payment is processed securely by Shopify.
        </p>
      </main>
    </div>
  );
}
