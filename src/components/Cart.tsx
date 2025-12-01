import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, Link } from "react-router-dom";
import { UnifiedHeader } from "./UnifiedHeader";
import { authService } from "../lib/auth";
import { toast } from "sonner";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: number; // Weight in kg for Shopify integration
}

export function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "All-Purpose Cleaner Spray",
      price: 1299,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
      weight: 0.5
    },
    {
      id: 2,
      name: "Floor Cleaning Solution",
      price: 1899,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1758273705792-a2887e079e83?w=400",
      weight: 1.0
    }
  ]);

  const updateQuantity = (id: number, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    // Check if user is logged in
    if (!authService.isLoggedIn()) {
      // Save intended destination
      authService.setRedirectAfterLogin("/checkout");
      // Show toast notification
      toast.error("Please login to continue with checkout");
      // Redirect to account/login page
      navigate("/account");
      return;
    }
    
    // User is logged in, proceed to checkout
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader cartCount={totalItems} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <h1 className="text-gray-900 text-2xl mb-6">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-gray-900 text-xl mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <Button 
              onClick={() => navigate("/products")}
              className="bg-[#6DB33F] hover:bg-[#5da035]"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-[#6DB33F] mb-3">Rs.{item.price.toLocaleString()}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 p-0 border-gray-300"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 p-0 border-gray-300"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-24">
                <h2 className="text-gray-900 text-lg mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Items</span>
                    <span className="text-gray-900">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-gray-900">Rs.{subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-xs text-blue-800">
                    Delivery charges will be calculated at checkout based on your city
                  </p>
                </div>

                <Button 
                  className="w-full bg-[#6DB33F] hover:bg-[#5da035] h-12"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  className="w-full mt-3 border-gray-300"
                  onClick={() => navigate("/products")}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}