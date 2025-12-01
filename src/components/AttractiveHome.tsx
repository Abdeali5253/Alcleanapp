import { HeroCarousel } from "./HeroCarousel";
import {
  Sparkles,
  Droplets,
  Wind,
  Home as HomeIcon,
  Shirt,
  Car,
  Truck,
  Shield,
  Award,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";
import { Product } from "../types/shopify";
import { useState } from "react";
import { mockProducts } from "../lib/mockData";

const topCategories = [
  {
    icon: Droplets,
    title: "Bathroom",
    link: "/products?category=cleaning-chemicals&subcategory=bathroom-cleaning",
    color: "#00A3E0",
  },
  {
    icon: Car,
    title: "Car Wash",
    link: "/products?category=cleaning-chemicals&subcategory=car-cleaning",
    color: "#6DB33F",
  },
  {
    icon: Sparkles,
    title: "Cleaning Chemicals",
    link: "/products?category=cleaning-chemicals",
    color: "#9B59B6",
  },
  {
    icon: Droplets,
    title: "Multi Purpose",
    link: "/products?category=cleaning-chemicals&subcategory=multi-purpose-cleaner",
    color: "#FFA500",
  },
  {
    icon: HomeIcon,
    title: "Dish Washer",
    link: "/products?category=cleaning-chemicals&subcategory=kitchen-cleaning",
    color: "#FF6B6B",
  },
  {
    icon: Shirt,
    title: "Fabric",
    link: "/products?category=cleaning-chemicals&subcategory=fabric-washing",
    color: "#6DB33F",
  },
  {
    icon: Wind,
    title: "Floor Cleaning",
    link: "/products?category=cleaning-equipment&subcategory=floor-cleaning-vipers",
    color: "#00A3E0",
  },
];

const trustFeatures = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick delivery across Pakistan",
  },
  {
    icon: Shield,
    title: "Quality Products",
    description: "100% authentic products",
  },
  {
    icon: Award,
    title: "Best Prices",
    description: "Competitive pricing guaranteed",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Always here to help",
  },
];

export function AttractiveHome() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Get products from mockData
  const featuredProducts = mockProducts.filter(p => p.isNew || p.onSale).slice(0, 4);
  const fabricProducts = mockProducts.filter(p => p.subcategory === "fabric-washing").slice(0, 4);
  const floorProducts = mockProducts.filter(p => p.subcategory === "floor-cleaner").slice(0, 4);
  const equipmentProducts = mockProducts.filter(p => p.subcategory === "mop-buckets").slice(0, 4);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    toast.success(`${quantity}x ${product.name} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
      toast.success("Removed from wishlist", {
        duration: 1500,
        position: "top-center",
      });
    } else {
      setWishlist([...wishlist, productId]);
      toast.success("Added to wishlist", {
        duration: 1500,
        position: "top-center",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <UnifiedHeader />

      <main className="max-w-7xl mx-auto px-[14px] py-[15px] space-y-12 pt-[21px] pr-[14px] pb-[15px] pl-[14px]">
        {/* Hero Carousel */}
        <section>
          <HeroCarousel />
        </section>

        {/* Category Icons */}
        <section>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-[5px] scrollbar-hide pt-[0px] pr-[0px] pl-[0px] p-[0px]">
            {topCategories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="flex flex-col items-center min-w-[90px] group"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                  style={{
                    backgroundColor: `${category.color}20`,
                  }}
                >
                  <category.icon
                    size={28}
                    style={{ color: category.color }}
                    strokeWidth={2}
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-700 text-center font-medium">
                  {category.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust Features */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl md:p-6 text-center border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-[#6DB33F]/20 px-[14px] py-[10px] pt-[5px] pr-[14px] pb-[10px] pl-[14px]"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6DB33F]/10 flex items-center justify-center">
                  <feature.icon size={24} className="text-[#6DB33F]" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1 text-sm md:text-base">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-white via-[#6DB33F]/5 to-white rounded-3xl p-6 md:p-12 text-center border border-gray-100">
          <h1 className="text-gray-900 text-2xl md:text-4xl font-bold mb-4">
            Welcome to AlClean
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for premium cleaning chemicals and
            professional janitorial equipment. We bring effective solutions
            to make your cleaning tasks easy and efficient.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/products">
              <Button className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                Shop All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600">
                New arrivals and special offers
              </p>
            </div>
            <Link
              to="/products"
              className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          <div className="mt-4 md:hidden">
            <Link to="/products">
              <Button
                variant="outline"
                className="w-full border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white font-semibold py-6 rounded-xl"
              >
                View All Products →
              </Button>
            </Link>
          </div>
        </section>

        {/* Fabric Cleaning */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">
                Fabric Washing
              </h2>
              <p className="text-gray-600">
                Professional fabric care products
              </p>
            </div>
            <Link
              to="/products?category=cleaning-chemicals&subcategory=fabric-washing"
              className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {fabricProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>

        {/* Industrial Cleaning Section */}
        <section>
          <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-16 mb-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6bTAtNWg3djFoLTd6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
            <div className="relative z-10">
              <h3 className="text-[#00A3E0] text-3xl md:text-5xl font-bold mb-3">
                INDUSTRIAL CLEANING
              </h3>
              <h4 className="text-white text-4xl md:text-6xl font-bold mb-4">
                CHEMICALS
              </h4>
              <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                Powerful. Fast. Clean. Professional-grade solutions for
                industrial applications.
              </p>
              <Link to="/products?category=cleaning-chemicals">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-10 py-7 rounded-xl shadow-2xl text-lg">
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {floorProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>

        {/* Mop Buckets & Equipment */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">
                Mop Buckets & Equipment
              </h2>
              <p className="text-gray-600">
                Professional floor cleaning solutions
              </p>
            </div>
            <Link
              to="/products?category=cleaning-equipment&subcategory=mop-buckets"
              className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {equipmentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          <div className="mt-4 md:hidden">
            <Link to="/products?category=cleaning-equipment&subcategory=mop-buckets">
              <Button
                variant="outline"
                className="w-full border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white font-semibold py-6 rounded-xl"
              >
                View All Equipment →
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTM0aDd2MWgtN3ptMC01aDd2MWgtN3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Browse our complete catalog of premium cleaning products and
              equipment. Fast delivery across Pakistan!
            </p>
            <Link to="/products">
              <Button className="bg-white text-[#6DB33F] hover:bg-gray-100 font-bold px-12 py-7 rounded-xl shadow-2xl text-lg">
                Shop Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          quantity={quantities[quickViewProduct.id] || 1}
          onQuantityChange={(qty) => {
            setQuantities({ ...quantities, [quickViewProduct.id]: qty });
          }}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
