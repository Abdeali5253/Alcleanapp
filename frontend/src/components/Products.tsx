import { useState, useEffect } from "react";
import { Filter, X, Search, Grid3X3, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";
import { FilterDrawer } from "./FilterDrawer";
import { QuickViewModal } from "./QuickViewModal";
import { QuickFilters, FilterState, defaultFilters } from "./QuickFilters";
import { Product } from "../types/shopify";
import { categories } from "../lib/categories";
import { getAllProducts } from "../lib/shopify";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cartService } from "../lib/cart";

type CategoryFilter = "all" | "cleaning-chemicals" | "cleaning-equipment" | "car-washing" | "bathroom-cleaning" | "fabric-cleaning" | "dishwashing";

const categoryInfo: Record<CategoryFilter, { name: string; emoji: string; color: string }> = {
  "all": { name: "All Products", emoji: "📦", color: "#6DB33F" },
  "cleaning-chemicals": { name: "Cleaning Chemicals", emoji: "🧪", color: "#9B59B6" },
  "cleaning-equipment": { name: "Cleaning Equipment", emoji: "🧹", color: "#E74C3C" },
  "dishwashing": { name: "Dishwashing", emoji: "🍽️", color: "#FF6B6B" },
  "car-washing": { name: "Car Washing", emoji: "🚗", color: "#6DB33F" },
  "fabric-cleaning": { name: "Fabric Cleaning", emoji: "👕", color: "#00A3E0" },
  "bathroom-cleaning": { name: "Bathroom Cleaning", emoji: "🚿", color: "#00A3E0" },
};

export function Products() {
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse URL parameters and set filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");
    const search = params.get("search");

    // Reset filters first
    setCategoryFilter("all");
    setSelectedSubcategories([]);

    if (category) {
      const validCategories = ["cleaning-chemicals", "cleaning-equipment", "car-washing", "bathroom-cleaning", "fabric-cleaning", "dishwashing"];
      if (validCategories.includes(category)) {
        setCategoryFilter(category as CategoryFilter);
      }
    }

    if (subcategory) {
      setSelectedSubcategories([subcategory]);
      const parentCategory = categories.find(cat =>
        cat.subcategories.some(sub => sub.id === subcategory)
      );
      if (parentCategory && !expandedCategories.includes(parentCategory.id)) {
        setExpandedCategories([...expandedCategories, parentCategory.id]);
      }
    }

    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Fetch products from Shopify
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const products = await getAllProducts(250);
        
        console.log('[Products] Loaded products:', {
          total: products.length,
          byCategory: {
            chemicals: products.filter(p => p.category === 'cleaning-chemicals').length,
            equipment: products.filter(p => p.category === 'cleaning-equipment').length,
            carWashing: products.filter(p => p.category === 'car-washing').length,
            bathroom: products.filter(p => p.category === 'bathroom-cleaning-').length,
            fabric: products.filter(p => p.category === 'fabric-cleaning').length,
            dishwashing: products.filter(p => p.category === 'dishwashing').length,
          },
        });
        
        setAllProducts(products);
      } catch (error) {
        console.error("Failed to fetch products from Shopify:", error);
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
      setWishlist(wishlist.filter(id => id !== productId));
      toast.success("Removed from wishlist", { duration: 1500, position: "top-center" });
    } else {
      setWishlist([...wishlist, productId]);
      toast.success("Added to wishlist", { duration: 1500, position: "top-center" });
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (selectedSubcategories.includes(subcategoryId)) {
      setSelectedSubcategories(selectedSubcategories.filter(id => id !== subcategoryId));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategoryId]);
    }
  };

  const clearFilters = () => {
    setSelectedSubcategories([]);
    setSearchQuery("");
    setCategoryFilter("all");
    setFilters(defaultFilters);
    navigate('/products');
  };

  // Filter products
  let filteredProducts = allProducts;

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (categoryFilter !== "all") {
    filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
  }

  // Subcategory filter
  if (selectedSubcategories.length > 0) {
    filteredProducts = filteredProducts.filter(p => selectedSubcategories.includes(p.subcategory));
  }

  // Price range filter
  if (filters.priceRange !== 'all') {
    filteredProducts = filteredProducts.filter(p => {
      switch (filters.priceRange) {
        case 'under500': return p.price < 500;
        case '500to1000': return p.price >= 500 && p.price <= 1000;
        case '1000to5000': return p.price >= 1000 && p.price <= 5000;
        case 'over5000': return p.price > 5000;
        default: return true;
      }
    });
  }

  // Stock filter
  if (filters.stockStatus === "instock") {
    filteredProducts = filteredProducts.filter(p => p.inStock);
  } else if (filters.stockStatus === "outofstock") {
    filteredProducts = filteredProducts.filter(p => !p.inStock);
  }

  // On sale filter
  if (filters.onSale) {
    filteredProducts = filteredProducts.filter(p => p.onSale && p.discountPercent > 0);
  }

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "name": return a.title.localeCompare(b.title);
      case "discount": return b.discountPercent - a.discountPercent;
      default: return 0;
    }
  });

  const currentCategoryInfo = categoryInfo[categoryFilter];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentCategoryInfo.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {currentCategoryInfo.name}
            </h1>
          </div>
          {searchQuery && (
            <p className="text-gray-600">
              Showing results for "<span className="font-medium text-[#6DB33F]">{searchQuery}</span>"
            </p>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {(Object.keys(categoryInfo) as CategoryFilter[]).map((cat) => {
            const info = categoryInfo[cat];
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setSelectedSubcategories([]);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-lg shadow-[#6DB33F]/30"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/50 hover:shadow-md"
                }`}
              >
                <span>{info.emoji}</span>
                <span>{info.name}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Dropdown for specific categories */}
        {(categoryFilter === "cleaning-chemicals" || categoryFilter === "cleaning-equipment") && (
          <div className="mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Subcategory
              </label>
              <select
                value={selectedSubcategories[0] || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedSubcategories([e.target.value]);
                  } else {
                    setSelectedSubcategories([]);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6DB33F]/20 transition-all"
              >
                <option value="">All {categoryFilter === "cleaning-chemicals" ? "Chemicals" : "Equipment"}</option>
                {categories
                  .find(cat => cat.id === categoryFilter)
                  ?.subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <QuickFilters
          currentFilters={filters}
          onFilterChange={setFilters}
          productCount={sortedProducts.length}
        />

        {/* View Mode Toggle & Advanced Filter */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-[#6DB33F]/30 transition-all duration-200"
          >
            <Filter size={18} className="text-gray-600" />
            <span className="text-gray-700 font-medium">Advanced Filters</span>
            {selectedSubcategories.length > 0 && (
              <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {selectedSubcategories.length}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Grid3X3 size={18} className={viewMode === 'grid' ? 'text-[#6DB33F]' : 'text-gray-500'} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <LayoutGrid size={18} className={viewMode === 'compact' ? 'text-[#6DB33F]' : 'text-gray-500'} />
            </button>
          </div>
        </div>

        {/* Active Filters Tags */}
        {(selectedSubcategories.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <Search size={14} />
                "{searchQuery}"
                <button onClick={() => {
                  setSearchQuery("");
                  navigate('/products');
                }} className="hover:bg-blue-100 rounded-full p-0.5 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            {selectedSubcategories.map((subId) => {
              const subcat = categories
                .flatMap(cat => cat.subcategories)
                .find(sub => sub.id === subId);
              return (
                <button
                  key={subId}
                  onClick={() => toggleSubcategory(subId)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white rounded-full text-sm font-medium hover:shadow-md transition-all"
                >
                  {subcat?.name}
                  <X size={14} />
                </button>
              );
            })}
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-gray-500 text-sm font-medium hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className={`grid ${viewMode === 'compact' ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-3'} sm:gap-4 md:gap-6 ${viewMode === 'compact' ? 'md:grid-cols-4 lg:grid-cols-6' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
            {Array.from({ length: 12 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <Sparkles size={40} className="text-gray-300" />
              </div>
            </div>
            <p className="text-gray-600 text-xl mb-2 font-semibold">No products found</p>
            <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
            <Button 
              onClick={clearFilters} 
              className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'compact' ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-3'} sm:gap-4 md:gap-6 ${viewMode === 'compact' ? 'md:grid-cols-4 lg:grid-cols-6' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
            {sortedProducts.map((product) => (
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
        )}

        {/* Results Summary */}
        {!loading && sortedProducts.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            Showing {sortedProducts.length} of {allProducts.length} products
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedSubcategories={selectedSubcategories}
        onToggleSubcategory={toggleSubcategory}
        expandedCategories={expandedCategories}
        onToggleCategory={toggleCategory}
        priceRange={[0, 70000]}
        onPriceRangeChange={() => {}}
        stockFilter={filters.stockStatus as "all" | "instock" | "outofstock"}
        onStockFilterChange={(val) => setFilters({...filters, stockStatus: val})}
        onClearFilters={clearFilters}
        productsCount={sortedProducts.length}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(val) => setCategoryFilter(val as CategoryFilter)}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        quantity={quickViewProduct ? (quantities[quickViewProduct.id] || 1) : 1}
        onQuantityChange={(qty) => {
          if (quickViewProduct) {
            setQuantities({ ...quantities, [quickViewProduct.id]: qty });
          }
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
