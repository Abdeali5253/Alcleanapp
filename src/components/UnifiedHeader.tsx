import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, ShoppingCart, Phone, MessageCircle, Home, Package, User, MapPin, Bell } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { notificationService } from "../lib/notifications";
import { EnhancedSearch } from "./EnhancedSearch";
import { Logo } from "./Logo";
import { cartService } from "../lib/cart";

interface UnifiedHeaderProps {
  cartCount?: number;
}

export function UnifiedHeader({ cartCount }: UnifiedHeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [actualCartCount, setActualCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get initial unread count
    setNotificationCount(notificationService.getUnreadCount());

    // Listen for new notifications
    const handleNewNotification = () => {
      setNotificationCount(notificationService.getUnreadCount());
    };

    window.addEventListener("alclean-notification", handleNewNotification);

    return () => {
      window.removeEventListener("alclean-notification", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    // Get initial cart count
    setActualCartCount(cartService.getCartCount());

    // Subscribe to cart changes
    const unsubscribe = cartService.subscribe(() => {
      setActualCartCount(cartService.getCartCount());
    });

    return unsubscribe;
  }, []);



  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        {/* Top Bar - Contact Info (Desktop Only) */}
        <div className="bg-[#6DB33F] text-white py-2 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <a href="tel:+923001234567" className="flex items-center gap-2 hover:text-gray-200">
                <Phone size={14} />
                <span>+92 300 1234567</span>
              </a>
              <a href="https://wa.me/923001234567" className="flex items-center gap-2 hover:text-gray-200">
                <MessageCircle size={14} />
                <span>WhatsApp Us</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs">Free Delivery on Orders over Rs.5000</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-center"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <Logo className="h-10 md:h-12 cursor-pointer" linkTo="/" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') ? 'text-[#6DB33F] bg-[#6DB33F]/10' : 'text-gray-700 hover:text-[#6DB33F]'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/products"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/products') ? 'text-[#6DB33F] bg-[#6DB33F]/10' : 'text-gray-700 hover:text-[#6DB33F]'
                }`}
              >
                <Package size={18} />
                <span>Products</span>
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive('/about') ? 'text-[#6DB33F] bg-[#6DB33F]/10' : 'text-gray-700 hover:text-[#6DB33F]'
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive('/contact') ? 'text-[#6DB33F] bg-[#6DB33F]/10' : 'text-gray-700 hover:text-[#6DB33F]'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center gap-2">
              {/* Search Icon */}
              <button
                onClick={() => setShowSearchDrawer(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Search size={22} className="text-gray-700" />
              </button>

              {/* WhatsApp Button - Mobile */}
              <a
                href="https://wa.me/923001234567"
                className="md:hidden p-2 text-[#25D366] hover:bg-gray-100 rounded-lg"
              >
                <MessageCircle size={22} />
              </a>

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart size={22} className="text-gray-700" />
                {actualCartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#6DB33F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {actualCartCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Bell size={22} className="text-gray-700" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#6DB33F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Link>
            </div>
          </div>


        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="bg-white w-80 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-gray-900 text-lg">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-2">
                <X size={24} />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link
                to="/products"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/products') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Package size={20} />
                <span>Products</span>
              </Link>
              <Link
                to="/cart"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/cart') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <ShoppingCart size={20} />
                <span>Cart {actualCartCount > 0 && `(${actualCartCount})`}</span>
              </Link>
              <Link
                to="/account"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/account') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <User size={20} />
                <span>Account</span>
              </Link>
              <Link
                to="/tracking"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/tracking') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <MapPin size={20} />
                <span>Track Order</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/about') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <span>About Us</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive('/contact') ? 'bg-[#6DB33F] text-white' : 'hover:bg-gray-100'
                }`}
              >
                <span>Contact Us</span>
              </Link>
            </nav>

            {/* Contact Info in Mobile Menu */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <a
                href="tel:+923001234567"
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg"
              >
                <Phone size={20} className="text-[#6DB33F]" />
                <div>
                  <p className="text-xs text-gray-500">Call Us</p>
                  <p className="text-sm text-gray-900">+92 300 1234567</p>
                </div>
              </a>
              <a
                href="https://wa.me/923001234567"
                className="flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 rounded-lg"
              >
                <MessageCircle size={20} className="text-[#25D366]" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="text-sm text-gray-900">Chat with us</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search */}
      <EnhancedSearch isOpen={showSearchDrawer} onClose={() => setShowSearchDrawer(false)} />
    </>
  );
}