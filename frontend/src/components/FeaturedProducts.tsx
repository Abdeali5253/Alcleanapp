import { useState, useEffect } from "react";
import { ChevronRight, Sparkles, Flame, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../types/shopify";
import { getAllProducts, getProductsByCollection } from "../lib/shopify";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { cartService } from "../lib/cart";
import { wishlistService } from "../lib/wishlist";
import { toast } from "sonner";

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  type: 'deals' | 'bestsellers' | 'new' | 'trending';
  category?: string;
  limit?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
}

export function FeaturedProducts({
  title,
  subtitle,
  type,
  category,
  limit = 4,
  showViewAll = true,
  viewAllLink = '/products'
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to wishlist changes
    const unsubscribe = wishlistService.subscribe((ids) => {
      setWishlist(ids);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let fetchedProducts: Product[] = [];

        if (category) {
          // Fetch products from specific category
          const allProducts = await getAllProducts(250);
          fetchedProducts = allProducts.filter(p => p.category === category);
        } else {
          // Fetch all products
          fetchedProducts = await getAllProducts(250);
        }

        // Sort based on type
        switch (type) {
          case 'deals':
            // Products with highest discounts
            fetchedProducts = fetchedProducts
              .filter(p => p.onSale && p.discountPercent > 0)
              .sort((a, b) => b.discountPercent - a.discountPercent);
            break;
          case 'bestsellers':
            // Most in stock (simulating bestsellers)
            fetchedProducts = fetchedProducts
              .filter(p => p.inStock)
              .sort((a, b) => b.quantityAvailable - a.quantityAvailable);
            break;
          case 'new':
            // Products tagged as new
            fetchedProducts = fetchedProducts.filter(p => p.isNew);
            // If no new products, show newest by ID
            if (fetchedProducts.length === 0) {
              fetchedProducts = (await getAllProducts(250)).slice(0, limit * 2);
            }
            break;
          case 'trending':
            // Low stock = high demand (simulating trending)
            fetchedProducts = fetchedProducts
              .filter(p => p.inStock && p.lowStock)
              .sort((a, b) => a.quantityAvailable - b.quantityAvailable);
            // If no low stock items, show random selection
            if (fetchedProducts.length < limit) {
              const all = await getAllProducts(250);
              fetchedProducts = all.filter(p => p.inStock).sort(() => Math.random() - 0.5);
            }
            break;
        }

        setProducts(fetchedProducts.slice(0, limit));
      } catch (error) {
        console.error(`Failed to fetch ${type} products:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [type, category, limit]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    cartService.addToCart(product, quantity);
    toast.success(`${quantity}x ${product.title} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };

  const toggleWishlist = (productId: string) => {
    wishlistService.toggleWishlist(productId);
  };

  const getIcon = () => {
    switch (type) {
      case 'deals': return <Flame className="text-orange-500" size={24} />;
      case 'bestsellers': return <Star className="text-yellow-500" size={24} />;
      case 'new': return <Sparkles className="text-purple-500" size={24} />;
      case 'trending': return <TrendingUp className="text-blue-500" size={24} />;
    }
  };

  const getBgGradient = () => {
    switch (type) {
      case 'deals': return 'from-orange-50 to-red-50';
      case 'bestsellers': return 'from-yellow-50 to-amber-50';
      case 'new': return 'from-purple-50 to-pink-50';
      case 'trending': return 'from-blue-50 to-cyan-50';
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="relative">
      {/* Section Header */}
      <div className={`flex items-center justify-between mb-6 p-4 -mx-4 bg-gradient-to-r ${getBgGradient()} rounded-2xl`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h2 className="text-gray-900 text-xl md:text-2xl font-bold">{title}</h2>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
        </div>
        {showViewAll && products.length > 0 && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-[#6DB33F] hover:text-[#5da035] font-semibold text-sm"
          >
            View All
            <ChevronRight size={18} />
          </Link>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={() => { }}
              isInWishlist={wishlist.includes(product.id)}
              onToggleWishlist={toggleWishlist}
            />
          ))}
      </div>
    </section>
  );
}
