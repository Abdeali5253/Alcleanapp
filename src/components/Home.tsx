// // src/components/Home.tsx
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { HeroCarousel } from "./HeroCarousel";
// import { Button } from "./ui/button";
// import { toast } from "sonner";
// import { UnifiedHeader } from "./UnifiedHeader";
// import { ProductCard } from "./ProductCard";
// import { QuickViewModal } from "./QuickViewModal";
// import { Product } from "../types/shopify";
// import { getAllProducts } from "../lib/shopify";
// import {
//   Sparkles,
//   Droplets,
//   Wind,
//   Home as HomeIcon,
//   Shirt,
//   Car,
//   Truck,
//   Shield,
//   Award,
//   Clock,
// } from "lucide-react";

// const topCategories = [
//   {
//     icon: Droplets,
//     title: "Bathroom",
//     link: "/products?category=cleaning-chemicals&subcategory=bathroom-cleaning",
//     color: "#00A3E0",
//   },
//   {
//     icon: Car,
//     title: "Car Wash",
//     link: "/products?category=cleaning-chemicals&subcategory=car-cleaning",
//     color: "#6DB33F",
//   },
//   {
//     icon: Sparkles,
//     title: "Cleaning Chemicals",
//     link: "/products?category=cleaning-chemicals",
//     color: "#9B59B6",
//   },
//   {
//     icon: Droplets,
//     title: "Multi Purpose",
//     link: "/products?category=cleaning-chemicals&subcategory=multi-purpose-cleaner",
//     color: "#FFA500",
//   },
//   {
//     icon: HomeIcon,
//     title: "Dish Washer",
//     link: "/products?category=cleaning-chemicals&subcategory=kitchen-cleaning",
//     color: "#FF6B6B",
//   },
//   {
//     icon: Shirt,
//     title: "Fabric",
//     link: "/products?category=cleaning-chemicals&subcategory=fabric-washing",
//     color: "#6DB33F",
//   },
//   {
//     icon: Wind,
//     title: "Floor Cleaning",
//     link: "/products?category=cleaning-equipment&subcategory=floor-cleaning-vipers",
//     color: "#00A3E0",
//   },
// ];

// const trustFeatures = [
//   {
//     icon: Truck,
//     title: "Fast Delivery",
//     description: "Quick delivery across Pakistan",
//   },
//   {
//     icon: Shield,
//     title: "Quality Products",
//     description: "100% authentic products",
//   },
//   {
//     icon: Award,
//     title: "Best Prices",
//     description: "Competitive pricing guaranteed",
//   },
//   {
//     icon: Clock,
//     title: "24/7 Support",
//     description: "Always here to help",
//   },
// ];

// export function AttractiveHome() {
//   const [allProducts, setAllProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [wishlist, setWishlist] = useState<string[]>([]);
//   const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
//   const [quantities, setQuantities] = useState<Record<string, number>>({});

//   // Fetch products on mount
//   useEffect(() => {
//     getAllProducts()
//       .then((products) => {
//         setAllProducts(products);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, []);

//   // Derive featured lists
//   const featuredProducts = allProducts.filter((p) => p.isNew || p.onSale).slice(0, 4);
//   const fabricProducts = allProducts.filter((p) => p.subcategory === "fabric-washing").slice(0, 4);
//   const floorProducts = allProducts.filter((p) => p.subcategory === "floor-cleaner").slice(0, 4);
//   const equipmentProducts = allProducts.filter((p) => p.subcategory === "mop-buckets").slice(0, 4);

//   // Handlers
//   const handleAddToCart = (product: Product, quantity: number = 1) => {
//     toast.success(`${quantity}x ${product.name} added to cart!`, {
//       duration: 2000,
//       position: "top-center",
//     });
//   };
//   const toggleWishlist = (productId: string) => {
//     if (wishlist.includes(productId)) {
//       setWishlist(wishlist.filter((id) => id !== productId));
//       toast.success("Removed from wishlist", { duration: 1500, position: "top-center" });
//     } else {
//       setWishlist([...wishlist, productId]);
//       toast.success("Added to wishlist", { duration: 1500, position: "top-center" });
//     }
//   };

//   // Loading placeholder
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading products…
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
//       <UnifiedHeader />

//       <main className="max-w-7xl mx-auto px-[14px] py-[15px] space-y-12">
//         {/* Hero Carousel */}
//         <section>
//           <HeroCarousel />
//         </section>

//         {/* Category Icons */}
//         <section>
//           <div className="flex gap-4 md:gap-6 overflow-x-auto pb-[5px] scrollbar-hide">
//             {topCategories.map((category, index) => (
//               <Link
//                 key={index}
//                 to={category.link}
//                 className="flex flex-col items-center min-w-[90px] group"
//               >
//                 <div
//                   className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
//                   style={{ backgroundColor: `${category.color}20` }}
//                 >
//                   <category.icon size={28} style={{ color: category.color }} strokeWidth={2} />
//                 </div>
//                 <span className="text-xs md:text-sm text-gray-700 text-center font-medium">
//                   {category.title}
//                 </span>
//               </Link>
//             ))}
//           </div>
//         </section>

//         {/* Trust Features */}
//         <section>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {trustFeatures.map((feature, index) => (
//               <div
//                 key={index}
//                 className="bg-white rounded-2xl md:p-6 text-center border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-[#6DB33F]/20 px-[14px] py-[10px]"
//               >
//                 <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6DB33F]/10 flex items-center justify-center">
//                   <feature.icon size={24} className="text-[#6DB33F]" />
//                 </div>
//                 <h3 className="text-gray-900 font-semibold mb-1 text-sm md:text-base">
//                   {feature.title}
//                 </h3>
//                 <p className="text-gray-500 text-xs">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Welcome Section */}
//         <section className="bg-gradient-to-r from-white via-[#6DB33F]/5 to-white rounded-3xl p-6 md:p-12 text-center border border-gray-100">
//           <h1 className="text-gray-900 text-2xl md:text-4xl font-bold mb-4">Welcome to AlClean</h1>
//           <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
//             Your trusted partner for premium cleaning chemicals and professional janitorial equipment.
//             We bring effective solutions to make your cleaning tasks easy and efficient.
//           </p>
//           <div className="mt-6 flex justify-center gap-4">
//             <Link to="/products">
//               <Button className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
//                 Shop All Products
//               </Button>
//             </Link>
//           </div>
//         </section>

//         {/* Featured Products */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">Featured Products</h2>
//               <p className="text-gray-600">New arrivals and special offers</p>
//             </div>
//             <Link
//               to="/products"
//               className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
//             >
//               View All →
//             </Link>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
//             {featuredProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={wishlist.includes(product.id)}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//           <div className="mt-4 md:hidden">
//             <Link to="/products">
//               <Button
//                 variant="outline"
//                 className="w-full border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white font-semibold py-6 rounded-xl"
//               >
//                 View All Products →
//               </Button>
//             </Link>
//           </div>
//         </section>

//         {/* Fabric Cleaning */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">Fabric Washing</h2>
//               <p className="text-gray-600">Professional fabric care products</p>
//             </div>
//             <Link
//               to="/products?category=cleaning-chemicals&subcategory=fabric-washing"
//               className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
//             >
//               View All →
//             </Link>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
//             {fabricProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={wishlist.includes(product.id)}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//         {/* Industrial Cleaning Section */}
//         <section>
//           <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-16 mb-6 text-center relative overflow-hidden">
//             <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6bTAtNWg3djFoLTd6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
//             <div className="relative z-10">
//               <h3 className="text-[#00A3E0] text-3xl md:text-5xl font-bold mb-3">INDUSTRIAL CLEANING</h3>
//               <h4 className="text-white text-4xl md:text-6xl font-bold mb-4">CHEMICALS</h4>
//               <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
//                 Powerful. Fast. Clean. Professional-grade solutions for industrial applications.
//               </p>
//               <Link to="/products?category=cleaning-chemicals">
//                 <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-10 py-7 rounded-xl shadow-2xl text-lg">
//                   Explore Products
//                 </Button>
//               </Link>
//             </div>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
//             {floorProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={wishlist.includes(product.id)}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//         {/* Mop Buckets & Equipment */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-2">Mop Buckets & Equipment</h2>
//               <p className="text-gray-600">Professional floor cleaning solutions</p>
//             </div>
//             <Link
//               to="/products?category=cleaning-equipment&subcategory=mop-buckets"
//               className="text-[#6DB33F] hover:text-[#5da035] font-semibold hidden md:flex items-center gap-2"
//             >
//               View All →
//             </Link>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
//             {equipmentProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={wishlist.includes(product.id)}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//           <div className="mt-4 md:hidden">
//             <Link to="/products?category=cleaning-equipment&subcategory=mop-buckets">
//               <Button
//                 variant="outline"
//                 className="w-full border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white font-semibold py-6 rounded-xl"
//               >
//                 View All Equipment →
//               </Button>
//             </Link>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
//           <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTM0aDd2MWgtN3ptMC01aDd2MWgtN3oiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
//           <div className="relative z-10">
//             <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Get Started?</h2>
//             <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
//               Browse our complete catalog of premium cleaning products and equipment. Fast delivery across Pakistan!
//             </p>
//             <Link to="/products">
//               <Button className="bg-white text-[#6DB33F] hover:bg-gray-100 font-bold px-12 py-7 rounded-xl shadow-2xl text-lg">
//                 Shop Now
//               </Button>
//             </Link>
//           </div>
//         </section>
//       </main>

//       {/* Quick View Modal */}
//       {quickViewProduct && (
//         <QuickViewModal
//           product={quickViewProduct}
//           onClose={() => setQuickViewProduct(null)}
//           quantity={quantities[quickViewProduct.id] || 1}
//           onQuantityChange={(qty) => {
//             setQuantities({ ...quantities, [quickViewProduct.id]: qty });
//           }}
//           onAddToCart={handleAddToCart}
//         />
//       )}
//     </div>
//   );
// }

// src/pages/Home.tsx

// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   Sparkles,
//   Droplets,
//   Wind,
//   Home as HomeIcon,
//   Shirt,
//   Car,
//   Truck,
//   Shield,
//   Award,
//   Clock,
// } from "lucide-react";

// import { HeroCarousel } from "../components/HeroCarousel";
// import { UnifiedHeader } from "../components/UnifiedHeader";
// import { ProductCard } from "../components/ProductCard";
// import { QuickViewModal } from "../components/QuickViewModal";
// import { Button } from "../components/ui/button";

// import { Product } from "../types/shopify";
// import { getAllProducts } from "../lib/shopify";
// import { toast } from "sonner";

// // -----------------------
// // CATEGORY ICONS
// // -----------------------
// const topCategories = [
//   {
//     icon: Droplets,
//     title: "Bathroom",
//     link: "/products?subcategory=bathroom-cleaning",
//     color: "#00A3E0",
//   },
//   {
//     icon: Car,
//     title: "Car Wash",
//     link: "/products?subcategory=car-cleaning",
//     color: "#6DB33F",
//   },
//   {
//     icon: Sparkles,
//     title: "Cleaning Chemicals",
//     link: "/products?category=cleaning-chemicals",
//     color: "#9B59B6",
//   },
//   {
//     icon: Droplets,
//     title: "Multi Purpose",
//     link: "/products?subcategory=multi-purpose-cleaner",
//     color: "#FFA500",
//   },
//   {
//     icon: HomeIcon,
//     title: "Dish Washer",
//     link: "/products?subcategory=kitchen-cleaning",
//     color: "#FF6B6B",
//   },
//   {
//     icon: Shirt,
//     title: "Fabric",
//     link: "/products?subcategory=fabric-washing",
//     color: "#6DB33F",
//   },
//   {
//     icon: Wind,
//     title: "Floor Cleaning",
//     link: "/products?subcategory=floor-cleaning-vipers",
//     color: "#00A3E0",
//   },
// ];

// // -----------------------
// // TRUST FEATURES
// // -----------------------
// const trustFeatures = [
//   {
//     icon: Truck,
//     title: "Fast Delivery",
//     description: "Quick delivery across Pakistan",
//   },
//   {
//     icon: Shield,
//     title: "Quality Products",
//     description: "100% authentic products",
//   },
//   {
//     icon: Award,
//     title: "Best Prices",
//     description: "Competitive pricing guaranteed",
//   },
//   {
//     icon: Clock,
//     title: "24/7 Support",
//     description: "Always here to help",
//   },
// ];


// // ==========================================================
// //                     HOME PAGE COMPONENT
// // ==========================================================

// export default function Home() {
//   const [allProducts, setAllProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [wishlist, setWishlist] = useState<string[]>([]);
//   const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
//   const [quantities, setQuantities] = useState<Record<string, number>>({});

//   // ----------------------
//   // FETCH SHOPIFY PRODUCTS
//   // ----------------------
//   useEffect(() => {
//     async function load() {
//       try {
//         setLoading(true);
//         const data = await getAllProducts();
//         setAllProducts(data);
//       } catch (err) {
//         console.error("Home fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, []);

//   // ----------------------
//   // PRODUCT GROUPS
//   // ----------------------
//   const featuredProducts = allProducts.filter(
//     (p) => p.isNew || p.onSale
//   ).slice(0, 4);

//   const fabricProducts = allProducts
//     .filter((p) => p.subcategory === "fabric-washing")
//     .slice(0, 4);

//   const industrialProducts = allProducts
//     .filter((p) => p.subcategory === "floor-cleaner")
//     .slice(0, 4);

//   const equipmentProducts = allProducts
//     .filter((p) => p.subcategory === "mop-buckets")
//     .slice(0, 4);

//   // ----------------------
//   // CART & WISHLIST
//   // ----------------------
//   const handleAddToCart = (product: Product, qty: number = 1) => {
//     toast.success(`${qty}x ${product.name} added to cart!`, {
//       duration: 2000,
//       position: "top-center",
//     });
//   };

//   const toggleWishlist = (id: string) => {
//     setWishlist((prev) => {
//       if (prev.includes(id)) {
//         toast.success("Removed from wishlist");
//         return prev.filter((x) => x !== id);
//       }
//       toast.success("Added to wishlist");
//       return [...prev, id];
//     });
//   };


//   // ==========================================================
//   //                          RENDER
//   // ==========================================================

//   return (
//     <div className="min-h-screen bg-linear-to-b from-gray-50 to-white pb-20">

//       {/* HEADER */}
//       <UnifiedHeader />

//       <main className="max-w-7xl mx-auto px-3.5 py-5 space-y-12">
        
//         {/* HERO CAROUSEL */}
//         <section>
//           <HeroCarousel />
//         </section>

//         {/* CATEGORY ICONS */}
//         <section>
//           <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
//             {topCategories.map((cat, i) => (
//               <Link
//                 key={i}
//                 to={cat.link}
//                 className="flex flex-col items-center min-w-[90px] group"
//               >
//                 <div
//                   className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
//                   style={{ backgroundColor: `${cat.color}20` }}
//                 >
//                   <cat.icon size={28} style={{ color: cat.color }} />
//                 </div>
//                 <span className="text-xs md:text-sm text-gray-700 font-medium text-center">
//                   {cat.title}
//                 </span>
//               </Link>
//             ))}
//           </div>
//         </section>

//         {/* TRUST CARDS */}
//         <section>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {trustFeatures.map((f, i) => (
//               <div
//                 key={i}
//                 className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 text-center hover:shadow-lg transition duration-300"
//               >
//                 <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6DB33F]/10 flex items-center justify-center">
//                   <f.icon size={24} className="text-[#6DB33F]" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">{f.title}</h3>
//                 <p className="text-xs text-gray-500 mt-1">{f.description}</p>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* WELCOME SECTION */}
//         <section className="bg-linear-to-r from-white via-[#6DB33F]/5 to-white border border-gray-100 p-6 md:p-12 rounded-3xl text-center">
//           <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
//             Welcome to AlClean
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto mt-3">
//             Your trusted partner for premium cleaning chemicals and janitorial equipment.
//           </p>

//           <div className="mt-6">
//             <Link to="/products">
//               <Button className="px-8 py-6 rounded-xl bg-linear-to-r from-[#6DB33F] to-[#5da035] text-white">
//                 Shop All Products
//               </Button>
//             </Link>
//           </div>
//         </section>

//         {/* FEATURED PRODUCTS */}
//         <section>
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h3 className="text-2xl md:text-3xl font-bold">Featured Products</h3>
//               <p className="text-gray-500 text-sm">New arrivals & special offers</p>
//             </div>
//             <Link to="/products" className="hidden md:block text-[#6DB33F]">
//               View All →
//             </Link>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {(loading ? [...Array(4)] : featuredProducts).map((p, i) => (
//               <ProductCard
//                 key={p?.id || i}
//                 product={p}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={p ? wishlist.includes(p.id) : false}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//         {/* FABRIC WASHING */}
//         <section>
//           <h3 className="text-2xl font-bold mb-2">Fabric Washing</h3>
//           <p className="text-gray-500 mb-4">Professional fabric care</p>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {(loading ? [...Array(4)] : fabricProducts).map((p, i) => (
//               <ProductCard
//                 key={p?.id || i}
//                 product={p}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={p ? wishlist.includes(p.id) : false}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//         {/* INDUSTRIAL CLEANING SECTION */}
//         <section>
//           <div className="bg-linear-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-10 text-center text-white relative overflow-hidden">
//             <h3 className="text-[#00A3E0] text-3xl font-bold">
//               INDUSTRIAL CLEANING
//             </h3>
//             <h4 className="text-5xl font-bold">CHEMICALS</h4>
//             <p className="text-white/80 mt-4 max-w-xl mx-auto">
//               Powerful, fast, and professional-grade solutions for industrial cleaning.
//             </p>

//             <Link to="/products">
//               <Button className="mt-6 bg-white text-gray-900 px-10 py-5 rounded-xl">
//                 Explore Products
//               </Button>
//             </Link>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
//             {(loading ? [...Array(4)] : industrialProducts).map((p, i) => (
//               <ProductCard
//                 key={p?.id || i}
//                 product={p}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={p ? wishlist.includes(p.id) : false}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//         {/* EQUIPMENT */}
//         <section>
//           <h3 className="text-2xl font-bold mb-2">Mop Buckets & Equipment</h3>
//           <p className="text-gray-500 mb-4">Professional floor solutions</p>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {(loading ? [...Array(4)] : equipmentProducts).map((p, i) => (
//               <ProductCard
//                 key={p?.id || i}
//                 product={p}
//                 onAddToCart={handleAddToCart}
//                 onQuickView={setQuickViewProduct}
//                 isInWishlist={p ? wishlist.includes(p.id) : false}
//                 onToggleWishlist={toggleWishlist}
//               />
//             ))}
//           </div>
//         </section>

//       </main>

//       {/* Quick View Modal */}
//       {quickViewProduct && (
//         <QuickViewModal
//           product={quickViewProduct}
//           onClose={() => setQuickViewProduct(null)}
//           quantity={quantities[quickViewProduct.id] || 1}
//           onQuantityChange={(qty) =>
//             setQuantities({ ...quantities, [quickViewProduct.id]: qty })
//           }
//           onAddToCart={handleAddToCart}
//         />
//       )}

//     </div>
//   );
// }


// src/components/Home.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { HeroCarousel } from "./HeroCarousel";
import { UnifiedHeader } from "./UnifiedHeader";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";

import { Droplets, Sparkles, Home as HomeIcon, Shirt, Car, Wind, Truck, Shield, Award, Clock } from "lucide-react";
import { Product } from "../types/shopify";
import { getAllProducts } from "../lib/shopify";
import { Button } from "./ui/button";

// ------------------
// Category Buttons
// ------------------
const topCategories = [
  { icon: Droplets, title: "Bathroom", link: "/products?subcategory=bathroom-cleaning", color: "#00A3E0" },
  { icon: Car, title: "Car Wash", link: "/products?subcategory=car-cleaning", color: "#6DB33F" },
  { icon: Sparkles, title: "Cleaning Chemicals", link: "/products?category=cleaning-chemicals", color: "#9B59B6" },
  { icon: Droplets, title: "Multi Purpose", link: "/products?subcategory=multi-purpose-cleaner", color: "#FFA500" },
  { icon: HomeIcon, title: "Dish Washer", link: "/products?subcategory=kitchen-cleaning", color: "#FF6B6B" },
  { icon: Shirt, title: "Fabric", link: "/products?subcategory=fabric-washing", color: "#6DB33F" },
  { icon: Wind, title: "Floor Cleaning", link: "/products?subcategory=floor-cleaning", color: "#00A3E0" },
];

// ------------------
// Features
// ------------------
const trustFeatures = [
  { icon: Truck, title: "Fast Delivery", description: "Quick delivery across Pakistan" },
  { icon: Shield, title: "Quality Products", description: "100% authentic products" },
  { icon: Award, title: "Best Prices", description: "Competitive pricing guaranteed" },
  { icon: Clock, title: "24/7 Support", description: "Always here to help" },
];

export function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Fetch Shopify products
  useEffect(() => {
    async function load() {
      try {
        const products = await getAllProducts();
        setAllProducts(products);
      } catch (e) {
        console.error("Home load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddToCart = (product: Product, qty = 1) => {
    toast.success(`${qty}x ${product.name} added to cart`);
  };

  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((w) => w !== id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist([...wishlist, id]);
      toast.success("Added to wishlist");
    }
  };

  // Filters for different sections
  const featuredProducts = allProducts.filter((p) => p.isNew || p.onSale).slice(0, 4);
  const fabricProducts = allProducts.filter((p) => p.subcategory === "fabric-washing").slice(0, 4);
  const floorProducts = allProducts.filter((p) => p.subcategory === "floor-cleaning").slice(0, 4);
  const equipmentProducts = allProducts.filter((p) => p.subcategory === "mop-buckets").slice(0, 4);

  // Skeleton array
  const skeletons = Array(4).fill(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">

      <UnifiedHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-12">

        {/* Carousel */}
        <HeroCarousel />

        {/* Categories */}
        <section>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {topCategories.map((cat, i) => (
              <Link key={i} to={cat.link} className="flex flex-col items-center min-w-[90px] group">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <cat.icon size={28} style={{ color: cat.color }} />
                </div>
                <span className="text-xs text-gray-700">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6DB33F]/10 flex items-center justify-center">
                  <f.icon size={24} className="text-[#6DB33F]" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-gray-500 text-xs">{f.description}</p>
              </div>
            ))}
          </div>
        </section>


        {/* Featured Products */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Featured Products</h2>
          <p className="text-gray-600 mb-4">New arrivals and special offers</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(loading ? skeletons : featuredProducts).map((p, i) => (
              <ProductCard
                key={p?.id || `fsk-${i}`}
                product={p}
                skeleton={loading}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={p ? wishlist.includes(p.id) : false}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>


        {/* Fabric Washing */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Fabric Washing</h2>
          <p className="text-gray-600 mb-4">Professional fabric care products</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(loading ? skeletons : fabricProducts).map((p, i) => (
              <ProductCard
                key={p?.id || `fbsk-${i}`}
                product={p}
                skeleton={loading}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={p ? wishlist.includes(p.id) : false}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>

        {/* Industrial Cleaning */}
        <section>
          <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-12 text-center text-white">
            <h3 className="text-[#00A3E0] text-3xl font-bold">INDUSTRIAL CLEANING</h3>
            <h4 className="text-5xl font-bold mb-4">CHEMICALS</h4>
            <p className="text-white/80 max-w-2xl mx-auto mb-8">
              Powerful professional-grade solutions for industrial applications.
            </p>
            <Link to="/products">
              <Button className="bg-white text-gray-900 px-10 py-6 rounded-xl font-bold shadow-xl">
                Explore Products
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {(loading ? skeletons : floorProducts).map((p, i) => (
              <ProductCard
                key={p?.id || `flsk-${i}`}
                product={p}
                skeleton={loading}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={p ? wishlist.includes(p.id) : false}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>


        {/* Mop Buckets */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Mop Buckets & Equipment</h2>
          <p className="text-gray-600 mb-4">Professional floor cleaning solutions</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(loading ? skeletons : equipmentProducts).map((p, i) => (
              <ProductCard
                key={p?.id || `eqsk-${i}`}
                product={p}
                skeleton={loading}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
                isInWishlist={p ? wishlist.includes(p.id) : false}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] p-12 text-center text-white rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6">
            Browse our complete catalog of cleaning products and equipment.
          </p>
          <Link to="/products">
            <Button className="bg-white text-[#6DB33F] px-12 py-6 font-bold rounded-xl shadow-xl">
              Shop Now
            </Button>
          </Link>
        </section>
      </main>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          quantity={quantities[quickViewProduct.id] || 1}
          onQuantityChange={(qty) =>
            setQuantities({ ...quantities, [quickViewProduct.id]: qty })
          }
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
