// // src/components/ProductDetail.tsx
// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
// import { Button } from "./ui/button";
// import { UnifiedHeader } from "./UnifiedHeader";
// import { toast } from "sonner";
// import { Product } from "../types/shopify";
// import { getProductByHandle } from "../lib/shopify";

// export function ProductDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [quantity, setQuantity] = useState(1);
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [isInWishlist, setIsInWishlist] = useState(false);
//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchProduct() {
//       try {
//         const data = await getProductByHandle(id || "");
//         if (!data) {
//           setError("Product not found");
//         }
//         setProduct(data || null);
//       } catch (err) {
//         setError("Failed to load product");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchProduct();
//   }, [id]);

//   // Loading / error states
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading product…
//       </div>
//     );
//   }

//   if (!product || error) {
//     return (
//       <div className="min-h-screen bg-gray-50 pb-20">
//         <UnifiedHeader />
//         <div className="max-w-7xl mx-auto px-4 py-12 text-center">
//           <h1 className="text-2xl font-bold text-gray-900 mb-4">
//             {error || "Product Not Found"}
//           </h1>
//           <Button
//             onClick={() => navigate("/products")}
//             className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
//           >
//             Browse Products
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   const handleAddToCart = () => {
//     toast.success(`${quantity}x ${product.name} added to cart!`, {
//       duration: 2000,
//       position: "top-center",
//     });
//   };
//   const handleToggleWishlist = () => {
//     setIsInWishlist(!isInWishlist);
//     toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist", {
//       duration: 1500,
//       position: "top-center",
//     });
//   };
//   const incrementQuantity = () => {
//     if (quantity < product.quantityAvailable) {
//       setQuantity(quantity + 1);
//     }
//   };
//   const decrementQuantity = () => {
//     if (quantity > 1) {
//       setQuantity(quantity - 1);
//     }
//   };

//   const discount = product.originalPrice
//     ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
//     : 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
//       <UnifiedHeader />

//       <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
//         {/* Breadcrumb */}
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center gap-2 text-gray-600 hover:text-[#6DB33F] mb-6 transition-colors"
//         >
//           <ArrowLeft size={20} />
//           <span className="font-medium">Back</span>
//         </button>

//         {/* Product Grid */}
//         <div className="grid md:grid-cols-2 gap-8 md:gap-12">
//           {/* Product Images */}
//           <div>
//             {/* Main Image */}
//             <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
//               <div className="aspect-square relative">
//                 <img
//                   src={product.images[selectedImage] || product.image}
//                   alt={product.name}
//                   className="w-full h-full object-cover"
//                 />
//                 {/* Badges */}
//                 <div className="absolute top-4 left-4 flex flex-col gap-2">
//                   {product.onSale && discount > 0 && (
//                     <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
//                       -{discount}%
//                     </span>
//                   )}
//                   {product.isNew && (
//                     <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
//                       NEW
//                     </span>
//                   )}
//                   {product.lowStock && product.inStock && (
//                     <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
//                       Limited Stock
//                     </span>
//                   )}
//                 </div>
//                 {/* Out of Stock Overlay */}
//                 {!product.inStock && (
//                   <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
//                     <span className="bg-white/90 text-gray-800 px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
//                       Out of Stock
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//             {/* Thumbnail Images */}
//             {product.images.length > 1 && (
//               <div className="grid grid-cols-4 gap-3">
//                 {product.images.map((img, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setSelectedImage(index)}
//                     className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
//                       selectedImage === index ? "border-[#6DB33F] shadow-md" : "border-gray-200 hover:border-gray-300"
//                     }`}
//                   >
//                     <img src={img} alt={`${product.name} - ${index + 1}`} className="w-full h-full object-cover" />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Product Info */}
//           <div className="space-y-6">
//             {/* Title and Wishlist */}
//             <div>
//               <div className="flex items-start justify-between gap-4 mb-4">
//                 <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
//                 <button
//                   onClick={handleToggleWishlist}
//                   className="p-3 bg-white border-2 border-gray-200 rounded-full hover:border-[#6DB33F] hover:shadow-md transition-all"
//                 >
//                   <Heart size={24} className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"} />
//                 </button>
//               </div>
//               <div className="flex items-center gap-3 mb-4">
//                 <span className="text-gray-600 font-medium">SKU: {product.sku}</span>
//                 <span className="text-gray-400">•</span>
//                 <span className="text-gray-600 font-medium">Weight: {product.weight}</span>
//               </div>
//               {product.brand && (
//                 <p className="text-gray-500 mb-2">
//                   Brand: <span className="text-gray-700 font-semibold">{product.brand}</span>
//                 </p>
//               )}
//               {/* Stock Status */}
//               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                 <span className="text-green-700 text-sm font-semibold">
//                   {product.inStock ? `${product.quantityAvailable} in stock` : "Out of Stock"}
//                 </span>
//               </div>
//             </div>

//             {/* Price */}
//             <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100">
//               <div className="flex items-baseline gap-3 mb-2">
//                 <span className="text-4xl font-bold text-[#6DB33F]">Rs.{product.price.toLocaleString()}</span>
//                 {product.originalPrice && (
//                   <span className="text-2xl text-gray-400 line-through">
//                     Rs.{product.originalPrice.toLocaleString()}
//                   </span>
//                 )}
//               </div>
//               {product.originalPrice && (
//                 <p className="text-green-600 font-semibold">
//                   You save Rs.{(product.originalPrice - product.price).toLocaleString()} ({discount}%)
//                 </p>
//               )}
//             </div>

//             {/* Description */}
//             <div>
//               <h2 className="text-xl font-bold text-gray-900 mb-3">Product Description</h2>
//               <p className="text-gray-600 leading-relaxed">
//                 {product.description ||
//                   "High-quality cleaning product from AlClean. Effective, safe, and reliable for all your cleaning needs."}
//               </p>
//             </div>

//             {/* Quantity and Add to Cart */}
//             {product.inStock ? (
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
//                   <div className="flex items-center gap-4">
//                     <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
//                       <button
//                         onClick={decrementQuantity}
//                         disabled={quantity <= 1}
//                         className="p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                       >
//                         <Minus size={20} className="text-gray-600" />
//                       </button>
//                       <span className="px-6 py-3 font-bold text-lg min-w-[60px] text-center">{quantity}</span>
//                       <button
//                         onClick={incrementQuantity}
//                         disabled={quantity >= product.quantityAvailable}
//                         className="p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                       >
//                         <Plus size={20} className="text-gray-600" />
//                       </button>
//                     </div>
//                     <span className="text-gray-500 text-sm">Max: {product.quantityAvailable}</span>
//                   </div>
//                 </div>
//                 <Button
//                   onClick={handleAddToCart}
//                   className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-bold py-7 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
//                 >
//                   <ShoppingCart size={24} className="mr-3" />
//                   Add to Cart - Rs.{(product.price * quantity).toLocaleString()}
//                 </Button>
//               </div>
//             ) : (
//               <div className="bg-gray-100 rounded-xl p-6 text-center">
//                 <p className="text-gray-600 font-semibold mb-3">This product is currently out of stock</p>
//                 <Button
//                   variant="outline"
//                   onClick={() => navigate("/products")}
//                   className="border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white"
//                 >
//                   Browse Similar Products
//                 </Button>
//               </div>
//             )}

//             {/* Category Tags */}
//             {product.tags.length > 0 && (
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {product.tags.map((tag, index) => (
//                     <span
//                       key={index}
//                       className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
//                     >
//                       {tag}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// src/components/ProductDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { UnifiedHeader } from "./UnifiedHeader";
import { toast } from "sonner";
import { Product } from "../types/shopify";
import { getProductByHandle } from "../lib/shopify";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getProductByHandle(decodeURIComponent(id));
        if (!data) {
          setError("Product not found");
        }
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    toast.success(`${quantity}x ${product.name} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };

  const handleToggleWishlist = () => {
    setIsInWishlist((prev) => !prev);
    toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist", {
      duration: 1500,
      position: "top-center",
    });
  };

  const incrementQuantity = () => {
    if (!product) return;
    if (quantity < product.quantityAvailable) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const discount =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
        <UnifiedHeader />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600">
          Loading product…
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Product Not Found"}
          </h1>
          <Button
            onClick={() => navigate("/products")}
            className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white"
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#6DB33F] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
              <div className="aspect-square relative">
                <img
                  src={product.images[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.onSale && discount > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                      -{discount}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                      NEW
                    </span>
                  )}
                  {product.lowStock && product.inStock && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                      Limited Stock
                    </span>
                  )}
                </div>

                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-white/90 text-gray-800 px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-[#6DB33F] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                <button
                  onClick={handleToggleWishlist}
                  className="p-3 bg-white border-2 border-gray-200 rounded-full hover:border-[#6DB33F] hover:shadow-md transition-all"
                >
                  <Heart
                    size={24}
                    className={
                      isInWishlist
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400"
                    }
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 text-sm">
                {product.sku && (
                  <>
                    <span className="text-gray-600 font-medium">
                      SKU: {product.sku}
                    </span>
                    <span className="text-gray-400">•</span>
                  </>
                )}
                {product.weight && (
                  <span className="text-gray-600 font-medium">
                    Weight: {product.weight}
                  </span>
                )}
              </div>

              {product.brand && (
                <p className="text-gray-500 mb-2">
                  Brand:{" "}
                  <span className="text-gray-700 font-semibold">
                    {product.brand}
                  </span>
                </p>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-700 text-sm font-semibold">
                  {product.inStock
                    ? `${product.quantityAvailable} in stock`
                    : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-[#6DB33F]">
                  Rs.{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-2xl text-gray-400 line-through">
                    Rs.{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-green-600 font-semibold">
                  You save Rs.
                  {(product.originalPrice! - product.price).toLocaleString()} (
                  {discount}%)
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Product Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {product.description ||
                  "High-quality cleaning product from AlClean. Effective, safe, and reliable for all your cleaning needs."}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            {product.inStock ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus size={20} className="text-gray-600" />
                      </button>
                      <span className="px-6 py-3 font-bold text-lg min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= product.quantityAvailable}
                        className="p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus size={20} className="text-gray-600" />
                      </button>
                    </div>
                    <span className="text-gray-500 text-sm">
                      Max: {product.quantityAvailable}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-bold py-7 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  <ShoppingCart size={24} className="mr-3" />
                  Add to Cart - Rs.
                  {(product.price * quantity).toLocaleString()}
                </Button>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-6 text-center">
                <p className="text-gray-600 font-semibold mb-3">
                  This product is currently out of stock
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/products")}
                  className="border-2 border-[#6DB33F] text-[#6DB33F] hover:bg-[#6DB33F] hover:text-white"
                >
                  Browse Similar Products
                </Button>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
