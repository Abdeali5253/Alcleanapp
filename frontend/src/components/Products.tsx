import { useState, useEffect, useRef } from "react";
import {
  Filter,
  X,
  Search,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";

import { QuickViewModal } from "./QuickViewModal";
import { QuickFilters, FilterState, defaultFilters } from "./QuickFilters";
import { Product } from "../types/shopify";
import { categories } from "../lib/categories";

import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cartService } from "../lib/cart";
import { wishlistService } from "../lib/wishlist";

type CategoryFilter =
  | "all"
  | "cleaning-chemicals"
  | "cleaning-equipment"
  | "car-washing"
  | "bathroom-cleaning"
  | "fabric-cleaning"
  | "dishwashing";

const collectionToSubcategory: Record<string, string> = {
  // Cleaning Equipment mappings from collection name to subcategory id
  "Mop Buckets / Wringers / Cleaning Janitorial Trolleys": "mop-buckets",
  "Soap Dispenser": "soap-dispenser",
  "Tissue Rolls & Dispensers": "tissue-rolls-dispensers",
  "Top Cleaning Equipments": "top-cleaning-equipments",
  "Cleaning Tools": "cleaning-tools",
  "Cleaning Equipment": "cleaning-equipment",
  "Plastic Dustbin Industrial / Home Use": "plastic-dustbin",
  "Floor Cleaning : Vipers / Brushes / Wet Mops / Dry Mops":
    "floor-cleaning-vipers",
  "Safety Equipments": "safety-equipments",
  "Cleaning Robots": "cleaning-robots",
  "Vacuum / Floor / Carpet Cleaning Machines": "cleaning-machines",
  "Home Use Floor Cleaning Equipments": "floor-cleaning-equipments",
};

const categoryInfo: Record<
  CategoryFilter,
  {
    name: string;
    emoji: string;
    color: string;
    collections?: string[];
    tags?: string[];
  }
> = {
  all: { name: "All Products", emoji: "📦", color: "#6DB33F" },
  "cleaning-chemicals": {
    name: "Cleaning Chemicals",
    emoji: "🧪",
    color: "#9B59B6",
    collections: [
      "floor-cleaning-chemical",
      "multi-purpose-chemicals",
      "industrial-cleaning-chemicals",
      "top-cleaning-chemicals",
      "fabric-cleaning-chemical",
      "bathroom-cleaning-solution",
      "hand-washing-cleaning",
      "kitchen-cleaning-solution",
      "solar-panel-cleaner-solution",
      "dish-wash",
      "car-cleaning-solution",
    ],
    tags: [
      "cleaning chemicals",
      "cleaning-chemicals",
      "chemical",
      "cleaner",
      "industrial cleaning solutions",
      "floor cleaning chemical",
      "activated phenyl",
      "super phenyl",
      "floor shiner",
      "toilet bowl cleaner",
      "bathroom cleaner",
      "bathroom cleaning chemical",
      "kitchen cleaning solution",
      "powerful degreaser",
      "fruits and veggi cleaner",
      "solar cleaner",
      "floor degreaser",
      "cip cleaner",
      "food grade cleaning solution",
    ],
  },
  "cleaning-equipment": {
    name: "Cleaning Equipment",
    emoji: "🧹",
    color: "#E74C3C",
    collections: [
      "mop-buckets",
      "soap-dispenser",
      "tissue-rolls-dispensers",
      "top-cleaning-equipments",
      "cleaning-tools",
      "cleaning-equipment",
      "plastic-dustbin-industrial-home-use",
      "floor-cleaning-vipers-brushes-wet-mops-dry-mops",
      "safety-equipments",
      "cleaning-robots",
      "vacuum-floor-carpet-cleaning-machines",
      "home-use-floor-cleaning-equipments",
    ],
    tags: [
      "cleaning equipment",
      "cleaning tools",
      "solar panel / glass / window cleaning equipments",
      "home use floor cleaning equipments",
      "floor cleaning : vipers / brushes / wet mops / dry mops",
      "mop buckets / wringers / cleaning janitorial trolleys",
      "industrial wet mop",
      "industrial floor brush",
      "industrial floor vipers",
      "industrial dry mop",
      "industrial floor broom",
      "bathroom cleaning equipment",
      "folding ladder",
      "safety equipments",
      "cleaning robots",
      "tissue rolls & dispensers",
      "soap dispenser",
      "plastic dustbin industrial / home use",
      "stainless steel dustbin industrial & home use",
      "garbage / snake collector",
    ],
  },
  dishwashing: {
    name: "Dishwashing",
    emoji: "🍽️",
    color: "#FF6B6B",
    collections: ["dish-wash", "dish-wash-powder"],
    tags: ["dish washer", "dish wash powder"],
  },
  "car-washing": {
    name: "Car Washing",
    emoji: "🚗",
    color: "#6DB33F",
    collections: ["car-cleaning-solution"],
    tags: ["car wash shampoo"],
  },
  "bathroom-cleaning": {
    name: "Bathroom Cleaning",
    emoji: "🚿",
    color: "#00A3E0",
    collections: [
      "bathroom-cleaning-solution",
      "toilet-bowl-cleaner",
      "bathroom-cleaner",
    ],
    tags: [
      "toilet bowl cleaner",
      "bathroom cleaner",
      "bathroom cleaning chemical",
    ],
  },
  "fabric-cleaning": {
    name: "Fabric Cleaning",
    emoji: "👕",
    color: "#00A3E0",
    collections: [
      "fabric-washing",
      "fabric-detergent",
      "fabric-color-bleach",
      "fabric-cleaner",
      "fabric-softener-enhancer",
      "white-cloth-bleach",
      "fabric-starch",
    ],
    tags: [
      "fabric detergent",
      "fabric color bleach",
      "fabric cleaner",
      "fabric cleaning chemical",
      "fabric softener and enhancer",
      "white cloth bleach",
    ],
  },
};

export function Products() {
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<"3cols" | "2cols">("2cols");
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subcategoryButtonRef = useRef<HTMLDivElement>(null);

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
      const validCategories = [
        "cleaning-chemicals",
        "cleaning-equipment",
        "car-washing",
        "bathroom-cleaning",
        "fabric-cleaning",
        "dishwashing",
      ];
      if (validCategories.includes(category)) {
        setCategoryFilter(category as CategoryFilter);
      }
    }

    if (subcategory) {
      setSelectedSubcategories([subcategory]);
      const parentCategory = categories.find((cat) =>
        cat.subcategories.some((sub) => sub.id === subcategory),
      );
      if (parentCategory && !expandedCategories.includes(parentCategory.id)) {
        setExpandedCategories([...expandedCategories, parentCategory.id]);
      }
    }

    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subcategoryButtonRef.current &&
        !subcategoryButtonRef.current.contains(event.target as Node)
      ) {
        setShowSubcategoryDropdown(false);
      }
    };

    if (showSubcategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSubcategoryDropdown]);

  // Fetch products based on category and selected subcategories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const { getAllProducts, getProductsByCollection } = await import(
          "../lib/shopify"
        );

        let allProducts: Product[] = [];

        const { productCacheService } = await import("../lib/product-cache");

        let cacheKey: string;
        let collectionHandles: string[] = [];

        if (categoryFilter === "all") {
          cacheKey = "all";
        } else {
          const catInfo = categoryInfo[categoryFilter];
          collectionHandles = catInfo.collections || [];
          if (selectedSubcategories.length > 0) {
            collectionHandles = collectionHandles.filter((h) =>
              selectedSubcategories.includes(h),
            );
          }
          cacheKey = `${categoryFilter}-${collectionHandles.sort().join(",")}`;
        }

        // Try to get cached products first
        allProducts = productCacheService.getCachedProducts(cacheKey);

        if (allProducts.length === 0) {
          console.log(`[Products] No cache found for ${cacheKey}, fetching...`);

          if (categoryFilter === "all") {
            allProducts = await getAllProducts(2000);
          } else {
            // Fetch from collections
            const promises = collectionHandles.map((handle) =>
              getProductsByCollection(handle, 250),
            );
            const results = await Promise.all(promises);
            allProducts = results.flat();
            // Remove duplicates if any
            const seen = new Set();
            allProducts = allProducts.filter((p) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          }

          // Cache the results
          productCacheService.setCachedProducts(allProducts, cacheKey);

          // Background refresh if needed
          if (productCacheService.shouldRefresh(cacheKey)) {
            console.log(
              `[Products] Cache is stale for ${cacheKey}, refreshing in background...`,
            );
            (async () => {
              try {
                let freshProducts: Product[];
                if (categoryFilter === "all") {
                  freshProducts = await getAllProducts(2000);
                } else {
                  const promises = collectionHandles.map((handle) =>
                    getProductsByCollection(handle, 250),
                  );
                  const results = await Promise.all(promises);
                  freshProducts = results.flat();
                  const seen = new Set();
                  freshProducts = freshProducts.filter((p) => {
                    if (seen.has(p.id)) return false;
                    seen.add(p.id);
                    return true;
                  });
                }
                productCacheService.setCachedProducts(freshProducts, cacheKey);
                console.log("[Products] Background refresh complete");
              } catch (err) {
                console.error("[Products] Background refresh failed:", err);
              }
            })();
          }

          console.log(
            `[Products] Loaded and cached ${allProducts.length} products for ${cacheKey}`,
          );
        } else {
          console.log(
            `[Products] Using cached products for ${cacheKey}:`,
            allProducts.length,
          );
        }

        setAllProducts(allProducts);
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
  }, [categoryFilter, selectedSubcategories]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    cartService.addToCart(product, quantity);
    toast.success(`${quantity}x ${product.title} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };

  const toggleWishlist = (productId: string) => {
    const newState = wishlistService.toggleWishlist(productId);
    if (newState) {
      toast.success("Added to wishlist!", {
        duration: 1500,
        position: "top-center",
      });
    } else {
      toast.success("Removed from wishlist", {
        duration: 1500,
        position: "top-center",
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(
        expandedCategories.filter((id) => id !== categoryId),
      );
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (selectedSubcategories.includes(subcategoryId)) {
      setSelectedSubcategories(
        selectedSubcategories.filter((id) => id !== subcategoryId),
      );
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategoryId]);
    }
  };

  const clearFilters = () => {
    setSelectedSubcategories([]);
    setSearchQuery("");
    setCategoryFilter("all");
    setFilters(defaultFilters);
    navigate("/products");
  };

  // Filter products
  let filteredProducts = allProducts;

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)),
    );
  }

  // Price range filter
  if (filters.priceRange !== "all") {
    filteredProducts = filteredProducts.filter((p) => {
      switch (filters.priceRange) {
        case "under500":
          return p.price < 500;
        case "500to1000":
          return p.price >= 500 && p.price <= 1000;
        case "1000to5000":
          return p.price >= 1000 && p.price <= 5000;
        case "over5000":
          return p.price > 5000;
        default:
          return true;
      }
    });
  }

  // Stock filter
  if (filters.stockStatus === "instock") {
    filteredProducts = filteredProducts.filter((p) => p.inStock);
  } else if (filters.stockStatus === "outofstock") {
    filteredProducts = filteredProducts.filter((p) => !p.inStock);
  }

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.title.localeCompare(b.title);
      case "discount":
        return b.discountPercent - a.discountPercent;
      default:
        return 0;
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
              Showing results for "
              <span className="font-medium text-[#6DB33F]">{searchQuery}</span>"
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

        {/* Subcategory Dropdown for categories with subcategories */}
        {(() => {
          const currentCategory = categories.find(
            (cat) => cat.id === categoryFilter,
          );
          if (
            !currentCategory ||
            !currentCategory.subcategories ||
            currentCategory.subcategories.length === 0
          )
            return null;
          return (
            <div className="mb-6">
              <div
                ref={subcategoryButtonRef}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Subcategory
                </label>
                <button
                  onClick={() =>
                    setShowSubcategoryDropdown(!showSubcategoryDropdown)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6DB33F]/20 transition-all flex items-center justify-between"
                >
                  <span>
                    {selectedSubcategories.length === 0
                      ? "All Subcategories"
                      : `${selectedSubcategories.length} selected`}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showSubcategoryDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showSubcategoryDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {currentCategory.subcategories.map((sub) => {
                      const isSelected = selectedSubcategories.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubcategory(sub.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <div
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              isSelected
                                ? "bg-[#6DB33F] border-[#6DB33F]"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {sub.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Quick Filters */}
        <QuickFilters
          currentFilters={filters}
          onFilterChange={setFilters}
          productCount={sortedProducts.length}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("3cols")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "3cols"
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-200"
              }`}
            >
              <Grid3X3
                size={21}
                className={
                  viewMode === "3cols" ? "text-[#6DB33F]" : "text-gray-500"
                }
              />
            </button>
            <button
              onClick={() => setViewMode("2cols")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "2cols"
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-200"
              }`}
            >
              <LayoutGrid
                size={18}
                className={
                  viewMode === "2cols" ? "text-[#6DB33F]" : "text-gray-500"
                }
              />
            </button>
          </div>
        </div>

        {/* Active Filters Tags */}
        {(selectedSubcategories.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <Search size={14} />"{searchQuery}"
                <button
                  onClick={() => {
                    setSearchQuery("");
                    navigate("/products");
                  }}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {selectedSubcategories.map((subId) => {
              const subcat = categories
                .flatMap((cat) => cat.subcategories)
                .find((sub) => sub.id === subId);
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
          <div
            className={`grid ${
              viewMode === "2cols"
                ? "grid-cols-3 gap-4 sm:gap-4 md:gap-6"
                : "grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            }`}
          >
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
            <p className="text-gray-600 text-xl mb-2 font-semibold">
              No products found
            </p>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button
              onClick={clearFilters}
              className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div
            className={`grid ${
              viewMode === "2cols"
                ? "grid-cols-2 gap-3 sm:gap-4 md:gap-6"
                : "grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            }`}
          >
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

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        quantity={quickViewProduct ? quantities[quickViewProduct.id] || 1 : 1}
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
