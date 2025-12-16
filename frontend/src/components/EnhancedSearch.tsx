import { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Clock, Mic, MicOff, Tag } from "lucide-react";
import { Product } from "../types/shopify";
import { getAllProducts } from "../lib/shopify";
import { Link, useNavigate } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface EnhancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = [
  "Floor Cleaner",
  "Mop Bucket",
  "Car Shampoo",
  "Dishwash Liquid",
  "Bathroom Cleaner",
  "Fabric Softener",
];

const recentSearchesKey = "alclean_recent_searches";

export function EnhancedSearch({ isOpen, onClose }: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(recentSearchesKey);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent searches");
    }
  }, []);

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

  // Auto-focus input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.productType.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      )
      .slice(0, 12);

    setFilteredProducts(results);
  }, [searchQuery, allProducts]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    saveRecentSearch(query);
    onClose();
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleProductClick = (product: Product) => {
    saveRecentSearch(product.title);
    onClose();
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  // Voice search (Web Speech API)
  const toggleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Search Modal */}
      <div className="fixed inset-x-0 top-0 z-50 p-4 pt-[env(safe-area-inset-top)]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto max-h-[85vh] flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Search products, categories..."
                  className="w-full pl-12 pr-24 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#6DB33F] focus:bg-white focus:outline-none transition-all text-base"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={toggleVoiceSearch}
                    className={`p-2 rounded-xl transition-colors ${
                      isListening ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-2 hover:bg-gray-200 rounded-xl text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-[#6DB33F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : !searchQuery.trim() ? (
              <div className="p-4 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Clock size={16} />
                      <span className="font-medium">Recent Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchQuery(search);
                            handleSearch(search);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <TrendingUp size={16} />
                    <span className="font-medium">Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(search);
                          handleSearch(search);
                        }}
                        className="px-4 py-2 bg-[#6DB33F]/10 hover:bg-[#6DB33F]/20 rounded-full text-sm text-[#6DB33F] font-medium transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Tag size={16} />
                    <span className="font-medium">Shop by Category</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Cleaning Chemicals', link: '/products?category=cleaning-chemicals' },
                      { name: 'Cleaning Equipment', link: '/products?category=cleaning-equipment' },
                      { name: 'Car Washing', link: '/products?category=car-washing' },
                      { name: 'Dishwashing', link: '/products?category=dishwashing' },
                    ].map((cat, i) => (
                      <Link
                        key={i}
                        to={cat.link}
                        onClick={onClose}
                        className="px-4 py-3 bg-white border border-gray-200 hover:border-[#6DB33F] rounded-xl text-sm text-gray-700 text-center transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">No products found for "{searchQuery}"</p>
                <p className="text-gray-400 text-sm mt-2">Try different keywords or browse categories</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <div className="relative w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-[10px] font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-medium line-clamp-1">{product.title}</h3>
                      <p className="text-gray-400 text-xs mb-1">{product.category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[#6DB33F] font-bold">Rs.{product.price.toLocaleString()}</span>
                        {product.onSale && product.originalPrice && (
                          <span className="text-gray-300 line-through text-sm">
                            Rs.{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                        {product.onSale && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            -{product.discountPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Search All Results Button */}
                <div className="p-4">
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="w-full py-3 bg-[#6DB33F] text-white rounded-xl font-medium hover:bg-[#5da035] transition-colors"
                  >
                    View all results for "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
