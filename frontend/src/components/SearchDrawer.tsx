import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Product } from "../types/shopify";
import { getAllProducts } from "../lib/shopify";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const [searchQuery, setSearchQuery] = useState(");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all products once
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getAllProducts(250);
        setAllProducts(products);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && allProducts.length === 0) {
      loadProducts();
    }
  }, [isOpen]);

  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allProducts.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.productType.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    ).slice(0, 20); // Limit to 20 results

    setFilteredProducts(results);
  }, [searchQuery, allProducts]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6DB33F] focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (searchQuery) {
                      // Perform search and close
                      onClose();
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#6DB33F] text-white px-6 py-2 rounded-lg hover:bg-[#5da035] transition-colors"
                >
                  Search
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading products...
              </div>
            ) : !searchQuery.trim() ? (
              <div className="p-8 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Start typing to search products</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No products found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.handle}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {!product.inStock && (
                        <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-medium mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      {product.weight && (
                        <p className="text-gray-500 text-sm mb-2">
                          {product.weight}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[#6DB33F] font-bold">
                          Rs.{product.price.toLocaleString()}
                        </span>
                        {product.onSale && product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            Rs.{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
