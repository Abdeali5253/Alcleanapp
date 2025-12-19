import { useState, useEffect } from "react";
import { Tag, TrendingDown } from "lucide-react";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { Product } from "../types/shopify";
import { getProductsByCollection } from "../lib/shopify";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { toast } from "sonner";
import { cartService } from "../lib/cart";

export function SupremeOffers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        
        // Fetch from supreme-offer collection
        let offerProducts = await getProductsByCollection("supreme-offer", 250);
        
        console.log(`[SupremeOffers] Loaded ${offerProducts.length} products from supreme-offer collection`);
        
        // If no products in supreme-offer, show all products on sale
        if (offerProducts.length === 0) {
          const { getAllProducts } = await import("../lib/shopify");
          const allProducts = await getAllProducts(250);
          offerProducts = allProducts.filter(p => p.onSale);
          console.log(`[SupremeOffers] No supreme-offer collection, showing ${offerProducts.length} products on sale`);
        }
        
        // Sort by discount percentage
        offerProducts.sort((a, b) => b.discountPercent - a.discountPercent);
        
        setProducts(offerProducts);
      } catch (error) {
        console.error("Failed to fetch supreme offers:", error);
        toast.error("Failed to load offers. Please refresh the page.", {
          duration: 4000,
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
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
      setWishlist(wishlist.filter(id => id !== productId));
      toast.success("Removed from wishlist", { duration: 1500, position: "top-center" });
    } else {
      setWishlist([...wishlist, productId]);
      toast.success("Added to wishlist", { duration: 1500, position: "top-center" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-white pb-24 md:pb-8">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Tag className="text-white animate-pulse" size={32} />
            <h1 className="text-white text-center">Supreme Offers</h1>
            <TrendingDown className="text-white animate-pulse" size={32} />
          </div>
          <p className="text-white text-center opacity-90 max-w-2xl mx-auto">
            Incredible deals and massive discounts on premium cleaning products! Limited time offers you don't want to miss.
          </p>
          {products.length > 0 && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-lg">
                {products.length} Amazing Offers Available! 🎉
              </span>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(quantity) => handleAddToCart(product, quantity)}
                onToggleWishlist={() => toggleWishlist(product.id)}
                isWishlisted={wishlist.includes(product.id)}
                showQuickView={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Tag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-600 mb-2">No offers available right now</h3>
            <p className="text-gray-500">Check back soon for amazing deals!</p>
          </div>
        )}
      </div>
    </div>
  );
}
