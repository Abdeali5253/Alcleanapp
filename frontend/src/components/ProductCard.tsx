import { ShoppingCart, Heart, ZoomIn } from "lucide-react";
import { Button } from "./ui/button";
import { Product } from "../types/shopify";
import { ProductBadge } from "./ProductBadge";
import { PriceDisplay } from "./PriceDisplay";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  onToggleWishlist: (productId: string) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  isInWishlist,
  onToggleWishlist
}: ProductCardProps) {
  const navigate = useNavigate();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleCardClick = () => {
    // Encode the product ID for URL safety
    const encodedId = encodeURIComponent(product.id);
    navigate(`/product/${encodedId}`);
  };

  return (
    <div className="w-full max-w-sm flex-shrink-0 bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-[#6DB33F]/20 transition-all duration-300 relative group">
      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
      >
        <Heart
          size={18}
          className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}
        />
      </button>

      {/* Product Image */}
      <div
        className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.onSale && discount > 0 && (
            <ProductBadge type="discount" value={discount} />
          )}
          {product.isNew && <ProductBadge type="new" />}
          {product.lowStock && product.inStock && <ProductBadge type="limited" />}
        </div>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* View Product Overlay (Desktop) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-end justify-center pb-6">
          <div className="text-white text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <ZoomIn size={24} className="mx-auto mb-2" />
            <span className="text-sm font-medium">View Product</span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4" onClick={handleCardClick}>
        <h3 className="text-gray-900 font-semibold text-base mb-2 line-clamp-2 min-h-[3rem] leading-snug cursor-pointer hover:text-[#6DB33F] transition-colors">
          {product.title}
        </h3>

        <p className="text-xs text-gray-500 mb-3 font-medium">
          {product.inStock ? `${product.quantityAvailable} in stock` : 'Out of stock'}
        </p>

        {/* Price */}
        <PriceDisplay
          price={product.price}
          // originalPrice={product.originalPrice} 
          className="mb-4"
        />

        {/* Add to Cart Button */}
        {product.inStock ? (
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold h-10 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
          >
            <ShoppingCart size={16} className="mr-2" />
            Add to Cart
          </Button>
        ) : (
          <Button
            size="sm"
            disabled
            className="w-full bg-gray-200 text-gray-500 h-10 rounded-xl cursor-not-allowed"
          >
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  );
}