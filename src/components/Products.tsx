// import { useEffect,useState } from "react";
// import { Filter, X } from "lucide-react";
// import { Button } from "./ui/button";
// import { toast } from "sonner";
// import { UnifiedHeader } from "./UnifiedHeader";
// import { ProductCard } from "./ProductCard";
// import { ProductGrid } from "./ProductGrid";
// import { FilterDrawer } from "./FilterDrawer";
// import { QuickViewModal } from "./QuickViewModal";
// import { Product } from "../types/shopify";
// import { categories } from "../lib/categories";
// import { getAllProducts } from "../lib/shopify";  // add this import

// const [allProducts, setAllProducts] = useState<Product[]>([]);
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState<string | null>(null);

// export function Products() {
//   const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
//   const [sortBy, setSortBy] = useState("featured");
//   const [showFilters, setShowFilters] = useState(false);
//   const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [priceRange, setPriceRange] = useState<[number, number]>([0, 70000]);
//   const [stockFilter, setStockFilter] = useState<"all" | "instock" | "outofstock">("all");
//   const [wishlist, setWishlist] = useState<string[]>([]);
//   const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
//   const [quantities, setQuantities] = useState<Record<string, number>>({});

//   useEffect(() => {
//   async function fetchProducts() {
//     try {
//       const products = await getAllProducts(); // fetch from Shopify
//       setAllProducts(products);
//     } catch (err) {
//       setError("Failed to load products");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }
//   fetchProducts();
// }, []);

// if (loading) return <div className="text-center py-20">Loading products…</div>;
// if (error) return <div className="text-center py-20 text-red-500">{error}</div>;


//   const handleAddToCart = (product: Product, quantity: number = 1) => {
//     toast.success(`${quantity}x ${product.name} added to cart!`, {
//       duration: 2000,
//       position: "top-center",
//     });
//   };

//   const toggleWishlist = (productId: string) => {
//     if (wishlist.includes(productId)) {
//       setWishlist(wishlist.filter(id => id !== productId));
//       toast.success("Removed from wishlist", { duration: 1500, position: "top-center" });
//     } else {
//       setWishlist([...wishlist, productId]);
//       toast.success("Added to wishlist", { duration: 1500, position: "top-center" });
//     }
//   };

//   const toggleCategory = (categoryId: string) => {
//     if (expandedCategories.includes(categoryId)) {
//       setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
//     } else {
//       setExpandedCategories([...expandedCategories, categoryId]);
//     }
//   };

//   const toggleSubcategory = (subcategoryId: string) => {
//     if (selectedSubcategories.includes(subcategoryId)) {
//       setSelectedSubcategories(selectedSubcategories.filter(id => id !== subcategoryId));
//     } else {
//       setSelectedSubcategories([...selectedSubcategories, subcategoryId]);
//     }
//   };

//   const clearFilters = () => {
//     setSelectedSubcategories([]);
//     setSearchQuery("");
//     setPriceRange([0, 70000]);
//     setStockFilter("all");
//   };

//   // Filter products
//   let filteredProducts = allProducts;

//   if (searchQuery) {
//     filteredProducts = filteredProducts.filter(p => 
//       p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       p.description?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }

//   if (selectedSubcategories.length > 0) {
//     filteredProducts = filteredProducts.filter(p => selectedSubcategories.includes(p.subcategory));
//   }

//   filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

//   if (stockFilter === "instock") {
//     filteredProducts = filteredProducts.filter(p => p.inStock);
//   } else if (stockFilter === "outofstock") {
//     filteredProducts = filteredProducts.filter(p => !p.inStock);
//   }

//   // Sort products
//   const sortedProducts = [...filteredProducts].sort((a, b) => {
//     if (sortBy === "price-low") return a.price - b.price;
//     if (sortBy === "price-high") return b.price - a.price;
//     if (sortBy === "name") return a.name.localeCompare(b.name);
//     return 0;
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
//       <UnifiedHeader cartCount={0} />

//       <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
//         {/* Toolbar */}
//         <div className="flex items-center justify-between mb-6 md:mb-8">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => setShowFilters(true)}
//               className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-[#6DB33F]/30 transition-all duration-200"
//             >
//               <Filter size={18} className="text-gray-600" />
//               <span className="text-gray-700 font-medium">Filters</span>
//               {selectedSubcategories.length > 0 && (
//                 <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-xs px-2 py-0.5 rounded-full font-medium">
//                   {selectedSubcategories.length}
//                 </span>
//               )}
//             </button>
//             <span className="text-gray-500 text-sm hidden sm:inline">
//               {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
//             </span>
//           </div>

//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value)}
//             className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6DB33F]/20 transition-all"
//           >
//             <option value="featured">Featured</option>
//             <option value="price-low">Price: Low to High</option>
//             <option value="price-high">Price: High to Low</option>
//             <option value="name">Name: A-Z</option>
//           </select>
//         </div>

//         {/* Active Filters */}
//         {(selectedSubcategories.length > 0 || searchQuery) && (
//           <div className="flex flex-wrap gap-2 mb-6">
//             {searchQuery && (
//               <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
//                 Search: "{searchQuery}"
//                 <button onClick={() => setSearchQuery("")} className="hover:bg-blue-100 rounded-full p-0.5 transition-colors">
//                   <X size={14} />
//                 </button>
//               </div>
//             )}
//             {selectedSubcategories.map((subId) => {
//               const subcat = categories
//                 .flatMap(cat => cat.subcategories)
//                 .find(sub => sub.id === subId);
//               return (
//                 <button
//                   key={subId}
//                   onClick={() => toggleSubcategory(subId)}
//                   className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white rounded-full text-sm font-medium hover:shadow-md transition-all"
//                 >
//                   {subcat?.name}
//                   <X size={14} />
//                 </button>
//               );
//             })}
//             <button
//               onClick={clearFilters}
//               className="px-3 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
//             >
//               Clear all
//             </button>
//           </div>
//         )}

//         {/* Products Grid */}
//         <ProductGrid>
//           {sortedProducts.map((product) => (
//             <ProductCard
//               key={product.id}
//               product={product}
//               onAddToCart={handleAddToCart}
//               onQuickView={setQuickViewProduct}
//               isInWishlist={wishlist.includes(product.id)}
//               onToggleWishlist={toggleWishlist}
//             />
//           ))}
//         </ProductGrid>

//         {/* No Results */}
//         {sortedProducts.length === 0 && (
//           <div className="text-center py-16">
//             <div className="mb-4">
//               <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
//                 <Filter size={32} className="text-gray-400" />
//               </div>
//             </div>
//             <p className="text-gray-600 text-lg mb-6 font-medium">No products found</p>
//             <Button 
//               onClick={clearFilters} 
//               className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
//             >
//               Clear All Filters
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Filter Drawer */}
//       <FilterDrawer
//         isOpen={showFilters}
//         onClose={() => setShowFilters(false)}
//         selectedSubcategories={selectedSubcategories}
//         onToggleSubcategory={toggleSubcategory}
//         expandedCategories={expandedCategories}
//         onToggleCategory={toggleCategory}
//         priceRange={priceRange}
//         onPriceRangeChange={setPriceRange}
//         stockFilter={stockFilter}
//         onStockFilterChange={setStockFilter}
//         onClearFilters={clearFilters}
//         productsCount={sortedProducts.length}
//       />

//       {/* Quick View Modal */}
//       <QuickViewModal
//         product={quickViewProduct}
//         onClose={() => setQuickViewProduct(null)}
//         quantity={quickViewProduct ? (quantities[quickViewProduct.id] || 1) : 1}
//         onQuantityChange={(qty) => {
//           if (quickViewProduct) {
//             setQuantities({ ...quantities, [quickViewProduct.id]: qty });
//           }
//         }}
//         onAddToCart={handleAddToCart}
//       />
//     </div>
//   );
// }

// src/components/Products.tsx
import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";
import { FilterDrawer } from "./FilterDrawer";
import { QuickViewModal } from "./QuickViewModal";
import { Product } from "../types/shopify";
import { categories } from "../lib/categories";
import { getAllProducts } from "../lib/shopify";

export function Products() {
  // Data and state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
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

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const products = await getAllProducts();
        setAllProducts(products);
      } catch (err) {
        setError("Failed to load products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Loading / error states
  if (loading) {
    return <div className="text-center py-20">Loading products…</div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  // Filter products
  let filteredProducts = [...allProducts];
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (selectedSubcategories.length > 0) {
    filteredProducts = filteredProducts.filter((p) => selectedSubcategories.includes(p.subcategory));
  }
  filteredProducts = filteredProducts.filter(
    (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
  );
  if (stockFilter === "instock") {
    filteredProducts = filteredProducts.filter((p) => p.inStock);
  } else if (stockFilter === "outofstock") {
    filteredProducts = filteredProducts.filter((p) => !p.inStock);
  }

  // Sort products
  const sortedProducts = filteredProducts.sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  // Handlers
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    toast.success(`${quantity}x ${product.name} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };
  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
      toast.success("Removed from wishlist", { duration: 1500, position: "top-center" });
    } else {
      setWishlist([...wishlist, productId]);
      toast.success("Added to wishlist", { duration: 1500, position: "top-center" });
    }
  };
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };
  const toggleSubcategory = (subcategoryId: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategoryId) ? prev.filter((id) => id !== subcategoryId) : [...prev, subcategoryId]
    );
  };
  const clearFilters = () => {
    setSelectedSubcategories([]);
    setSearchQuery("");
    setPriceRange([0, 70000]);
    setStockFilter("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
      <UnifiedHeader cartCount={0} />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
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
              {sortedProducts.length} product{sortedProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

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
        </div>

        {/* Active Filters */}
        {(selectedSubcategories.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
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
              className="px-3 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Products Grid */}
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
      />

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
