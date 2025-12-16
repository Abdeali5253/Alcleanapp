import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { UnifiedHeader } from "./UnifiedHeader";
import { toast } from "sonner"";
import { getAllProducts } from "../lib/shopify";
import { Product } from "../types/shopify";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cartService } from "../lib/cart";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Decode the parameter from URL
        const decodedParam = decodeURIComponent(id);
        console.log('[ProductDetail] Looking for product:', decodedParam);
        
        // Get all products and find the matching one
        const allProducts = await getAllProducts(250);
        
        // Check if the parameter is a Shopify GID (ID) or a handle
        let productData: Product | undefined;
        if (decodedParam.startsWith('gid://')) {
          // Search by ID
          productData = allProducts.find(p => p.id === decodedParam);
          console.log('[ProductDetail] Searching by ID');
        } else {
          // Search by handle
          productData = allProducts.find(p => p.handle === decodedParam);
          console.log('[ProductDetail] Searching by handle');
        }
        
        console.log('[ProductDetail] Found product:', productData?.title);
        setProduct(productData || null);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Add to cart using cart service
    cartService.addToCart(product, quantity);
    
    toast.success(`${quantity}x ${product.title} added to cart!`, {
      duration: 2000,
      position: "top-center",
    });
  };

  const handleToggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    toast.success(
      isInWishlist ? "Removed from wishlist" : "Added to wishlist",
      {
        duration: 1500,
        position: "top-center",
      }
    );
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6DB33F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
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

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

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

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
              <div className="aspect-square relative">
                <ImageWithFallback
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />

                {/* Badges */}
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

                {/* Out of Stock Overlay */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-white/90 text-gray-800 px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
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
                    <ImageWithFallback
                      src={img}
                      alt={`${product.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Wishlist */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {product.title}
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

              <div className="flex items-center gap-3 mb-4">
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
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-[#6DB33F]/10 to-[#5da035]/10 p-6 rounded-2xl border-2 border-[#6DB33F]/20">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  Rs.{product.price.toLocaleString()}
                </span>
                {product.onSale && product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    Rs.{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {product.onSale && discount > 0 && (
                <p className="text-[#6DB33F] font-semibold">
                  You save Rs.
                  {(
                    (product.originalPrice || 0) - product.price
                  ).toLocaleString()}{" "}
                  ({discount}% off)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  product.inStock ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`font-medium ${
                  product.inStock ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.inStock
                  ? product.lowStock
                    ? `Only ${product.quantityAvailable} left in stock!`
                    : "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-3">
                  Product Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            {product.inStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={decrementQuantity}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="px-6 py-3 font-semibold text-gray-900 border-x-2 border-gray-200 min-w-[80px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Add to Cart - Rs.
                  {(product.price * quantity).toLocaleString()}
                </Button>
              </div>
            )}

            {/* Categories */}
            {(product.category || product.subcategory) && (
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {product.category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                )}
                {product.subcategory && (
                  <span className="bg-[#6DB33F]/10 text-[#6DB33F] px-4 py-2 rounded-lg text-sm font-medium">
                    {product.subcategory.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}