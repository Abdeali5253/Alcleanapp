import { X, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Product } from "../types/shopify";
import { ProductBadge } from "./ProductBadge";
import { PriceDisplay } from "./PriceDisplay";
import { QuantitySelector } from "./QuantitySelector";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function QuickViewModal({
  product,
  onClose,
  quantity,
  onQuantityChange,
  onAddToCart,
}: QuickViewModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10">
          <h2 className="text-gray-900 text-xl font-bold">Product Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden sticky top-0">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <h3 className="text-gray-900 text-3xl font-bold mb-2 leading-tight">
                  {product.title}
                </h3>
                
                {/* Badges */}
                <div className="flex gap-2 mt-3">
                  {product.isNew && <ProductBadge type="new" />}
                  {product.lowStock && <ProductBadge type="limited" />}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 font-medium">Weight:</span>
                  <span className="text-gray-900 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg">
                    {product.weight}
                  </span>
                </div>
                {product.brand && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 font-medium">Brand:</span>
                    <span className="text-gray-900 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg">
                      {product.brand}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 font-medium">Availability:</span>
                  <span className={`font-semibold px-3 py-1.5 rounded-lg ${
                    product.inStock 
                      ? "text-green-700 bg-green-50" 
                      : "text-red-700 bg-red-50"
                  }`}>
                    {product.inStock 
                      ? `In Stock ${product.quantityAvailable > 0 ? `(${product.quantityAvailable} available)` : ""}` 
                      : "Out of Stock"}
                  </span>
                </div>
                {product.sku && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 font-medium">SKU:</span>
                    <span className="text-gray-700 font-mono text-xs bg-gray-100 px-3 py-1.5 rounded-lg">
                      {product.sku}
                    </span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="pt-4 border-t border-gray-100 mb-8">
                <PriceDisplay 
                  price={product.price} 
                  originalPrice={product.originalPrice} 
                  size="xl"
                />
              </div>

              {/* Add to Cart Section */}
              {product.inStock && (
                <div className="space-y-4 mt-auto">
                  <div>
                    <Label className="mb-3 block text-gray-900 font-semibold">Quantity</Label>
                    <QuantitySelector
                      quantity={quantity}
                      onQuantityChange={onQuantityChange}
                      max={Math.min(10, product.quantityAvailable)}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                    onClick={() => {
                      onAddToCart(product, quantity);
                      onClose();
                    }}
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    Add to Cart
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}