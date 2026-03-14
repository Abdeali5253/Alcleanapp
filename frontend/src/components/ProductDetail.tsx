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
      position: "top-center",
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    const newState = wishlistService.toggleWishlist(product.id);
    if (newState === true) {
      toast.success("Added to wishlist!", {
        duration: 1500,
        position: "top-center",
      });
    } else if (newState === false) {
      toast.success("Removed from wishlist", {
        duration: 1500,
        position: "top-center",
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

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#6DB33F] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="md:max-w-[500px] lg:max-w-[460px] mx-auto">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="aspect-[4/4.3] md:aspect-[4/4.6] relative bg-gradient-to-br from-gray-50 to-white">
                <ImageWithFallback
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.title}
                  className="w-full h-full object-contain p-4 md:p-6"
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

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
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

          <div className="space-y-3">
            <div className="rounded-3xl border border-[#6DB33F]/15 bg-white p-6 shadow-[0_18px_45px_rgba(109,179,63,0.08)]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {product.brand && (
                      <span className="inline-flex items-center rounded-full bg-[#6DB33F]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6DB33F]">
                        {product.brand}
                      </span>
                    )}
                    {product.inStock ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Ready to ship
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        Currently unavailable
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                    {product.title}
                  </h1>
                </div>

                <button
                  onClick={handleToggleWishlist}
                  className="shrink-0 p-3 bg-white border-2 border-gray-200 rounded-full hover:border-[#6DB33F] hover:shadow-md transition-all"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[#6DB33F]/15 bg-white p-6 shadow-[0_18px_45px_rgba(109,179,63,0.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6DB33F] via-[#88c45b] to-[#5da035]" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Price
                  </p>
                  <div className="flex items-baseline gap-3 mt-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      Rs.{product.price.toLocaleString()}
                    </span>
                    {product.onSale && product.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        Rs.{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.onSale && discount > 0 ? (
                    <p className="text-[#6DB33F] font-semibold">
                      You save Rs.
                      {(
                        (product.originalPrice || 0) - product.price
                      ).toLocaleString()}{" "}
                      ({discount}% off)
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Premium pricing with dependable supply.
                    </p>
                  )}
                </div>

                {product.onSale && discount > 0 && (
                  <div className="rounded-2xl bg-[#6DB33F]/10 px-4 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6DB33F]">
                      Offer
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#5da035]">
                      -{discount}%
                    </p>
                  </div>
                )}
              </div>
            </div>

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
                  ? `${product.quantityAvailable} left in stock!`
                  : "Out of Stock"}
              </span>
            </div>

            {(product.description || product.descriptionHtml) && (
              <div className="bg-gray-50 p-6 rounded-2xl">
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
                  className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ShoppingCart size={20} className="mr-2" />
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
              className="w-full bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ShoppingCart size={20} className="mr-2" />
              Add to Cart Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
