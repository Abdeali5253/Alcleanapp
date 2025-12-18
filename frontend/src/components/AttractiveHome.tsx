import { HeroCarousel } from "./HeroCarousel";
import {
  Droplets,
  Car,
  FlaskConical,
  Utensils,
  Shirt,
  Truck,
  Shield,
  Award,
  Clock,
  Wrench,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";
import { Product } from "../types/shopify";
import { useState, useEffect } from "react";
import { getAllProducts, getProductsByCollection } from "../lib/shopify";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { cartService } from "../lib/cart";

// Updated categories based on user's actual Shopify collections
const topCategories = [
  {
    icon: FlaskConical,
    title: "Cleaning Chemical",
    link: "/products?category=cleaning-chemicals",
    color: "#9B59B6",
  },
  {
    icon: Wrench,
    title: "Cleaning Equipment",
    link: "/products?category=cleaning-equipment",
    color: "#E74C3C",
  },
  {
    icon: Utensils,
    title: "Dishwashing",
    link: "/products?category=dishwashing",
    color: "#FF6B6B",
  },
  {
    icon: Car,
    title: "Car Washing",
    link: "/products?category=car-washing",
    color: "#6DB33F",
  },
  {
    icon: Shirt,
    title: "Fabric Cleaning",
    link: "/products?category=fabric-cleaning",
    color: "#00A3E0",
  },
  {
    icon: Droplets,
    title: "Bathroom Cleaning",
    link: "/products?category=bathroom-cleaning",
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
  const [supremeOffers, setSupremeOffers] = useState<Product[]>([]);
  const [fabricProducts, setFabricProducts] = useState<Product[]>([]);
  const [mopBucketProducts, setMopBucketProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch from different Shopify collections
        const [offers, fabric, mopBuckets] = await Promise.all([
          // Supreme offers collection
          getProductsByCollection("supreme-offer", 250),
          // Fabric washing collection
          getProductsByCollection("fabric-washing", 50),
          // Mop buckets collection - try multiple collection handles
          getProductsByCollection("home-page-mop-buckets", 50)
            .then(products => products.length > 0 ? products : getProductsByCollection("mop-buckets-wringers-cleaning-janitorial-trolleys", 50)),
        ]);
        
        console.log('[Home] Loaded collections:', {
          supremeOffers: offers.length,
          fabricProducts: fabric.length,
          mopBuckets: mopBuckets.length,
        });
        
        // Sort supreme offers by discount percentage
        offers.sort((a, b) => b.discountPercent - a.discountPercent);
        
        setSupremeOffers(offers);
        setFabricProducts(fabric);
        setMopBucketProducts(mopBuckets);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products. Please refresh the page.", {
          duration: 4000,
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    cartService.addToCart(product, quantity);
    toast.success(`${quantity}x ${product.title} added to cart!`, {
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

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-6">
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

        {/* Supreme Offers */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                Supreme Offers
                <span className="text-2xl">🔥</span>
              </h2>
              <p className="text-gray-600">
                Incredible deals on premium products
              </p>
            </div>
            <Link
              to="/supreme-offers"
              className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
            >
              View All Offers →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : supremeOffers.length === 0
              ? (
                  <div className="col-span-2 md:col-span-4 text-center py-12">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 md:p-12 border-2 border-dashed border-orange-200">
                      <div className="text-6xl md:text-8xl mb-4 animate-pulse">👀</div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                        Watch Out!
                      </h3>
                      <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                        Supreme offers are currently taking a break, but they'll be back soon with even better deals!
                      </p>
                      <div className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm">
                        <span className="animate-pulse">⚡</span>
                        <span>Stay tuned for amazing discounts</span>
                        <span className="animate-pulse">⚡</span>
                      </div>
                    </div>
                  </div>
                )
              : supremeOffers
                  .slice(0, 4)
                  .map((product) => (
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

          {supremeOffers.length > 0 && (
            <div className="mt-4 md:hidden">
              <Link to="/supreme-offers">
                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold py-6 rounded-xl"
                >
                  View All Offers →
                </Button>
              </Link>
            </div>
          )}
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
              to="/products?category=fabric-cleaning"
              className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : fabricProducts.length === 0
              ? (
                  <div className="col-span-2 md:col-span-4 text-center py-8">
                    <p className="text-gray-500">No products available in this category</p>
                  </div>
                )
              : fabricProducts
                  .slice(0, 4)
                  .map((product) => (
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
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : supremeOffers
                  .filter((product) => product.category === "cleaning-chemicals")
                  .slice(0, 4)
                  .map((product) => (
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
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : mopBucketProducts.length === 0
              ? (
                  <div className="col-span-2 md:col-span-4 text-center py-8">
                    <p className="text-gray-500">No products available in this category</p>
                  </div>
                )
              : mopBucketProducts
                  .slice(0, 4)
                  .map((product) => (
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

          {mopBucketProducts.length > 0 && (
            <div className="mt-4 md:hidden">
              <Link to="/products?category=cleaning-equipment">
                <Button
                  variant="outline"
                  className="w-full border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white font-semibold py-6 rounded-xl"
                >
                  View All Equipment →
                </Button>
              </Link>
            </div>
          )}
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