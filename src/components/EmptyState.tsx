import { ShoppingCart, Package, Search, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  type: "cart" | "products" | "search" | "wishlist";
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ type, message, actionLabel, actionHref }: EmptyStateProps) {
  const config = {
    cart: {
      icon: ShoppingCart,
      title: "Your cart is empty",
      description: message || "Looks like you haven't added any items to your cart yet.",
      action: actionLabel || "Start Shopping",
      href: actionHref || "/products",
      iconColor: "text-[#6DB33F]",
    },
    products: {
      icon: Package,
      title: "No products found",
      description: message || "We couldn't find any products matching your criteria.",
      action: actionLabel || "Clear Filters",
      href: actionHref || "/products",
      iconColor: "text-gray-400",
    },
    search: {
      icon: Search,
      title: "No results found",
      description: message || "Try adjusting your search terms or browse our categories.",
      action: actionLabel || "Browse All Products",
      href: actionHref || "/products",
      iconColor: "text-gray-400",
    },
    wishlist: {
      icon: Heart,
      title: "Your wishlist is empty",
      description: message || "Save your favorite items to your wishlist for later.",
      action: actionLabel || "Explore Products",
      href: actionHref || "/products",
      iconColor: "text-red-400",
    },
  };

  const { icon: Icon, title, description, action, href, iconColor } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 ${iconColor}`}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-gray-900 text-2xl font-bold mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 text-base mb-8 max-w-md">
        {description}
      </p>
      
      <Link to={href}>
        <Button className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          {action}
        </Button>
      </Link>
    </div>
  );
}
