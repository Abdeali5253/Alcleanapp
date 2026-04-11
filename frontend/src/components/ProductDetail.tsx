import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { UnifiedHeader } from "./UnifiedHeader";
import { toast } from "sonner";
import { getAllProducts } from "../lib/api";
import { Product } from "../types/shopify";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cartService } from "../lib/cart";
import { wishlistService } from "../lib/wishlist";
import { ProductDescription } from "./ProductDescription";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = wishlistService.subscribe((ids) => {
      if (product) {
        setIsInWishlist(ids.includes(product.id));
      }
    });

    return unsubscribe;
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const decodedParam = decodeURIComponent(id);
        console.log("[ProductDetail] Looking for product:", decodedParam);

        const response = await getAllProducts();
        if (!response.success || !response.products) {
          throw new Error(response.error || "Failed to fetch products");
        }

        const allProducts = response.products;
        const productData = decodedParam.startsWith("gid://")
          ? allProducts.find((p: Product) => p.id === decodedParam)
          : allProducts.find((p: Product) => p.handle === decodedParam);

        console.log("[ProductDetail] Found product:", productData?.title);
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

    cartService.addToCart(product, quantity);
    toast.success(`${quantity}x ${product.title} added to cart!`, {
      duration: 2000,
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    const newState = wishlistService.toggleWishlist(product.id);
    if (newState === true) {
      toast.success("Added to wishlist!", {
        duration: 1500,
      });
    } else if (newState === false) {
      toast.success("Removed from wishlist", {
        duration: 1500,
      });
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.quantityAvailable) {
      setQuantity(quantity + 1);
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6DB33F] mx-auto" />
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
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-40 md:pb-8">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#6DB33F] hover:border-[#6DB33F]/30 mb-4 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="grid md:grid-cols-2 gap-5 md:gap-10 items-start">
          <div className="space-y-4 md:max-w-[500px] lg:max-w-[460px] mx-auto w-full">
            <div className="overflow-hidden rounded-[28px] border border-[#6DB33F]/15 bg-white shadow-[0_18px_45px_rgba(109,179,63,0.08)]">
              <div className="aspect-[4/3.15] sm:aspect-[4/3.35] md:aspect-[4/4.4] relative bg-gradient-to-br from-gray-50 via-white to-[#f5f9ef]">
                <ImageWithFallback
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.title}
                  className="w-full h-full object-contain p-2 sm:p-3 md:p-5"
                />

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                  {product.onSale && discount > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
                      -{discount}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
                      NEW
                    </span>
                  )}
                  {product.lowStock && product.inStock && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
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
              <div className="border-t border-[#6DB33F]/10 bg-white px-4 py-4 sm:px-5 sm:py-5 md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {product.brand && (
                        <span className="inline-flex items-center rounded-full bg-[#6DB33F]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6DB33F]">
                          {product.brand}
                        </span>
                      )}
                      {product.inStock ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Ready to ship
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                          Currently unavailable
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {product.title}
                    </h1>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          product.inStock ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          product.inStock ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.inStock
                          ? `${product.quantityAvailable} left in stock`
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleWishlist}
                    className="shrink-0 p-2.5 bg-white border-2 border-gray-200 rounded-full hover:border-[#6DB33F] hover:shadow-md transition-all"
                  >
                    <Heart
                      size={20}
                      className={
                        isInWishlist
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Price
                    </p>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-2xl sm:text-[28px] font-bold text-gray-900">
                        Rs.{product.price.toLocaleString()}
                      </span>
                      {product.onSale && product.originalPrice && (
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                          Rs.{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {product.onSale && discount > 0 ? (
                      <p className="mt-1 text-sm font-semibold text-[#6DB33F]">
                        Save Rs.
                        {(
                          (product.originalPrice || 0) - product.price
                        ).toLocaleString()}{" "}
                        ({discount}% off)
                      </p>
                    ) : (
                      <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        Premium pricing with dependable supply.
                      </p>
                    )}
                  </div>

                  {product.onSale && discount > 0 && (
                    <div className="rounded-2xl bg-[#6DB33F]/10 px-3 py-2 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6DB33F]">
                        Offer
                      </p>
                      <p className="mt-1 text-lg sm:text-xl font-bold text-[#5da035]">
                        -{discount}%
                      </p>
                    </div>
                  )}
                </div>

                {(product.sku || product.weight) && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.sku && (
                      <div className="rounded-2xl bg-gray-50 px-4 py-3 border border-gray-100">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          SKU
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-700 break-all">
                          {product.sku}
                        </p>
                      </div>
                    )}
                    {product.weight && (
                      <div className="rounded-2xl bg-gray-50 px-4 py-3 border border-gray-100">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Weight
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {product.weight}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {product.images && product.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
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
            </div>

          </div>

          <div className="space-y-3">
            {(product.description || product.descriptionHtml) && (
              <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-3">
                  Product Description
                </h3>
                <ProductDescription product={product} />
              </div>
            )}

            {product.inStock && (
              <div className="space-y-4 hidden md:block">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
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
                  className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Add to Cart - Rs.
                  {(product.price * quantity).toLocaleString()}
                </Button>
              </div>
            )}

            {(product.category || product.subcategory) && (
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {product.category
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                )}
                {product.subcategory && (
                  <span className="bg-[#6DB33F]/10 text-[#6DB33F] px-4 py-2 rounded-lg text-sm font-medium">
                    {product.subcategory
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {product.inStock && (
        <div className="md:hidden fixed left-0 right-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 px-4">
          <div className="mx-auto max-w-md rounded-3xl border border-[#6DB33F]/20 bg-white/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.14)] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Total
                </p>
                <p className="text-xl font-bold text-gray-900">
                  Rs.{(product.price * quantity).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
                <button
                  onClick={decrementQuantity}
                  className="px-3 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-3 font-semibold text-gray-900 min-w-[48px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="px-3 py-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
            >
              <ShoppingCart size={18} className="mr-2" />
              Add to Cart Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
