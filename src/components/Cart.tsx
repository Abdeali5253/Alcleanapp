import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, Link } from "react-router-dom";
import { UnifiedHeader } from "./UnifiedHeader";
import { authService } from "../lib/auth";
import { toast } from "sonner@2.0.3";
import { cartService, CartItem } from "../lib/cart";

export function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart on mount and subscribe to changes
  useEffect(() => {
    setCartItems(cartService.getCart());
    
    const unsubscribe = cartService.subscribe(() => {
      setCartItems(cartService.getCart());
    });

    return unsubscribe;
  }, []);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    cartService.updateQuantity(productId, newQuantity);
    toast.success("Quantity updated", {
      duration: 1500,
      position: "top-center",
    });
  };

  const removeItem = (productId: string) => {
    cartService.removeFromCart(productId);
    toast.success("Item removed from cart", {
      duration: 1500,
      position: "top-center",
    });
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    // Check if user is logged in
    if (!authService.isLoggedIn()) {
      // Save that they wanted to checkout
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
      <UnifiedHeader />

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
                  key={item.product.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.product.image || ""}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1 font-semibold">{item.product.title}</h3>
                      <p className="text-[#6DB33F] font-bold mb-1">Rs.{item.product.price.toLocaleString()}</p>
                      {item.product.weight && (
                        <p className="text-xs text-gray-500 mb-3">{item.product.weight}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-8 w-8 p-0 border-gray-300"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center text-gray-900 font-semibold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-8 w-8 p-0 border-gray-300"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.product.id)}
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