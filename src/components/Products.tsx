import { useState, useEffect } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";
import { FilterDrawer } from "./FilterDrawer";
import { QuickViewModal } from "./QuickViewModal";
import { Product } from "../types/shopify";
import { categories } from "../lib/categories";
import { getAllProducts, getProductsByCollection } from "../lib/shopify";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useLocation } from "react-router-dom";
import { cartService } from "../lib/cart";

export function Products() {
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 70000]);
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "outofstock">("all");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<"all" | "cleaning-chemicals" | "cleaning-equipment" | "car-washing" | "bathroom-cleaning" | "fabric-cleaning" | "dishwashing">("all");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Parse URL parameters and set filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");

    // Reset filters first
    setCategoryFilter("all");
    setSelectedSubcategories([]);

    if (category) {
      const validCategories = ["cleaning-chemicals", "cleaning-equipment", "car-washing", "bathroom-cleaning", "fabric-cleaning", "dishwashing"];
      if (validCategories.includes(category)) {
        setCategoryFilter(category as any);
      }
    }

    if (subcategory) {
      setSelectedSubcategories([subcategory]);
      // Also expand the parent category for this subcategory
      const parentCategory = categories.find(cat =>
        cat.subcategories.some(sub => sub.id === subcategory)
      );
      if (parentCategory && !expandedCategories.includes(parentCategory.id)) {
        setExpandedCategories([...expandedCategories, parentCategory.id]);
      }
    }
  }, [location.search]);

  // Fetch products from Shopify
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch all products and let tag-based categorization handle it
        const products = await getAllProducts(250);
        
        console.log('[Products] Loaded products:', {
          total: products.length,
          byCategory: {
            chemicals: products.filter(p => p.category === 'cleaning-chemicals').length,
            equipment: products.filter(p => p.category === 'cleaning-equipment').length,
            carWashing: products.filter(p => p.category === 'car-washing').length,
            bathroom: products.filter(p => p.category === 'bathroom-cleaning').length,
            fabric: products.filter(p => p.category === 'fabric-cleaning').length,
            dishwashing: products.filter(p => p.category === 'dishwashing').length,
          },
          bySubcategory: products.reduce((acc, p) => {
            acc[p.subcategory] = (acc[p.subcategory] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
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
    setPriceRange([0, 70000]);
    setStockFilter("all");
    setCategoryFilter("all");
  };

  // Filter products
  let filteredProducts = allProducts;

  if (searchQuery) {
    const beforeSearch = filteredProducts.length;
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log(`[Filter] Search "${searchQuery}": ${beforeSearch} → ${filteredProducts.length} products`);
  }

  if (selectedSubcategories.length > 0) {
    const beforeSubcat = filteredProducts.length;
    filteredProducts = filteredProducts.filter(p => selectedSubcategories.includes(p.subcategory));
    console.log(`[Filter] Subcategories ${selectedSubcategories.join(', ')}: ${beforeSubcat} → ${filteredProducts.length} products`);
  }

  filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

  if (stockFilter === "instock") {
    filteredProducts = filteredProducts.filter(p => p.inStock);
  } else if (stockFilter === "outofstock") {
    filteredProducts = filteredProducts.filter(p => !p.inStock);
  }

  if (categoryFilter !== "all") {
    const beforeCat = filteredProducts.length;
    filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    console.log(`[Filter] Category "${categoryFilter}": ${beforeCat} → ${filteredProducts.length} products`);
  }

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Category Filter Buttons */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "all"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setCategoryFilter("cleaning-chemicals")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "cleaning-chemicals"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Cleaning Chemicals
          </button>
          <button
            onClick={() => setCategoryFilter("cleaning-equipment")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "cleaning-equipment"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Cleaning Equipment
          </button>
          <button
            onClick={() => setCategoryFilter("dishwashing")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "dishwashing"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Dishwashing
          </button>
          <button
            onClick={() => setCategoryFilter("car-washing")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "car-washing"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Car Washing
          </button>
          <button
            onClick={() => setCategoryFilter("fabric-cleaning")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "fabric-cleaning"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Fabric Cleaning
          </button>
          <button
            onClick={() => setCategoryFilter("bathroom-cleaning")}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              categoryFilter === "bathroom-cleaning"
                ? "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]/30 hover:shadow-md"
            }`}
          >
            Bathroom Cleaning
          </button>
        </div>

        {/* Subcategory Dropdowns for Cleaning Chemicals and Equipment */}
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

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-[#6DB33F]/30 transition-all duration-200"
            >
              <Filter size={18} className="text-gray-600" />
              <span className="text-gray-700 font-medium">Filters</span>
              {selectedSubcategories.length > 0 && (
                <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {selectedSubcategories.length}
                </span>
              )}
            </button>
            <span className="text-gray-500 text-sm hidden sm:inline">
              {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6DB33F]/20 transition-all"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>

            {/* Stock Filter Dropdown */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "all" | "instock" | "outofstock")}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6DB33F]/20 transition-all"
            >
              <option value="all">All Products</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedSubcategories.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:bg-blue-100 rounded-full p-0.5 transition-colors">
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
              className="px-3 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <ProductGrid>
            {Array.from({ length: 12 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </ProductGrid>
        ) : (
          <ProductGrid>
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
          </ProductGrid>
        )}

        {/* No Results */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <Filter size={32} className="text-gray-400" />
              </div>
            </div>
            <p className="text-gray-600 text-lg mb-6 font-medium">No products found</p>
            <Button 
              onClick={clearFilters} 
              className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Clear All Filters
            </Button>
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
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        onClearFilters={clearFilters}
        productsCount={sortedProducts.length}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
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