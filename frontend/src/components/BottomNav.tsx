import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  Package,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cartService } from "../lib/cart";

export function BottomNav() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Subscribe to cart changes
    const unsubscribe = cartService.subscribe((items) => {
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/products", icon: ShoppingBag, label: "Products" },
    { path: "/cart", icon: ShoppingCart, label: "Cart", badge: cartCount },
    { path: "/tracking", icon: Package, label: "Tracking" },
    { path: "/account", icon: User, label: "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                  isActive
                    ? "text-[#6DB33F]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}