import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types/shopify';
import { cartService } from '../lib/cart';
import { wishlistService } from '../lib/wishlist';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductRecommendationsProps {
  title: string;
  subtitle?: string;
  products: Product[];
  loading: boolean;
}

export function ProductRecommendations({
  title,
  subtitle,
  products,
  loading,
}: ProductRecommendationsProps) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => wishlistService.subscribe(setWishlistIds), []);

  if (!loading && products.length === 0) return null;

  const handleAddToCart = (product: Product, quantity: number) => {
    try {
      cartService.addToCart(product, quantity);
      toast.success(quantity + 'x ' + product.title + ' added to cart!', {
        duration: 2000,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add product to cart',
      );
    }
  };

  const handleToggleWishlist = (productId: string) => {
    const isAdded = wishlistService.toggleWishlist(productId);
    if (isAdded === true) {
      toast.success('Added to wishlist!', { duration: 1500 });
    } else if (isAdded === false) {
      toast.success('Removed from wishlist', { duration: 1500 });
    }
  };

  return (
    <section className='mt-10' aria-labelledby='product-recommendations-heading'>
      <div className='mb-5 flex items-center gap-3 rounded-2xl border border-[#6DB33F]/15 bg-gradient-to-r from-[#f4faef] to-white p-4'>
        <div className='rounded-full bg-[#6DB33F]/10 p-2 text-[#6DB33F]'>
          <Sparkles size={22} aria-hidden='true' />
        </div>
        <div>
          <h2
            id='product-recommendations-heading'
            className='text-xl font-bold text-gray-900 md:text-2xl'
          >
            {title}
          </h2>
          {subtitle && <p className='text-sm text-gray-600'>{subtitle}</p>}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6'>
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={() => {}}
                isInWishlist={wishlistIds.includes(product.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
      </div>
    </section>
  );
}
