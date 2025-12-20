import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Product } from "../types/shopify";
import { wishlistService } from "../lib/wishlist";
import { cartService } from "../lib/cart";
import { authService } from "../lib/auth";
import { getAllProducts } from "../lib/shopify";
import { Link, useNavigate } from "react-router-dom";

export function Wishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!authService.isLoggedIn()) {
      navigate('/account');
      return;
    }

    // Subscribe to wishlist changes
    const unsubscribe = wishlistService.subscribe((ids) => {
      setWishlistIds(ids);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistIds.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allProducts = await getAllProducts(700);
        const filtered = allProducts.filter(p => wishlistIds.includes(p.id));
        setWishlistProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch wishlist products:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [wishlistIds]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    cartService.addToCart(product, quantity);
    toast.success(`${quantity}x ${product.title} added to cart!`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    wishlistService.removeFromWishlist(productId);
    toast.success("Removed from wishlist");
  };

  const handleClearWishlist = () => {
    if (confirm("Are you sure you want to clear your entire wishlist?")) {
      wishlistService.clearWishlist();
      toast.success("Wishlist cleared");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 text-sm">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {wishlistProducts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWishlist}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Empty State */}
        {!loading && wishlistProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start adding products you love to your wishlist by clicking the heart icon on products
            </p>
            <Link to="/products">
              <Button className="bg-gradient-to-r from-[#6DB33F] to-[#5da035]">
                <ShoppingCart size={18} className="mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80" />
            ))}
          </div>
        )}

        {/* Wishlist Products */}
        {!loading && wishlistProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={(product) => navigate(`/product/${product.handle}`)}
                isInWishlist={true}
                onToggleWishlist={() => handleRemoveFromWishlist(product.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
