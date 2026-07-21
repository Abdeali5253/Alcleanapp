import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../types/shopify';
import { cartService } from '../lib/cart';
import { wishlistService } from '../lib/wishlist';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductRecommendationsProps {
  title: string;
  subtitle?: string;
  products: Product[];
  loading: boolean;
  variant?: 'standard' | 'compact';
  limit?: number;
}

export function ProductRecommendations({
  title,
  subtitle,
  products,
  loading,
  variant = 'standard',
  limit = 4,
}: ProductRecommendationsProps) {
  const navigate = useNavigate();
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

  const displayedProducts = products.slice(0, limit);

  if (variant === 'compact') {
    return (
      <section className='mt-8' aria-labelledby='compact-recommendations-heading'>
        <div className='mb-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-white px-4 py-3 ring-1 ring-amber-100'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-amber-100 p-2 text-amber-600'>
              <TrendingUp size={20} aria-hidden='true' />
            </div>
            <div>
              <h2
                id='compact-recommendations-heading'
                className='text-lg font-bold text-gray-900 md:text-xl'
              >
                {title}
              </h2>
              {subtitle && <p className='text-xs text-gray-600'>{subtitle}</p>}
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 shadow-sm'>
            Popular
          </span>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {loading
            ? Array.from({ length: limit }, (_, index) => (
                <div
                  key={index}
                  className='animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white'
                >
                  <div className='aspect-[4/3] bg-gray-200' />
                  <div className='space-y-2 p-3'>
                    <div className='h-3 rounded bg-gray-200' />
                    <div className='h-3 w-2/3 rounded bg-gray-200' />
                    <div className='h-8 rounded bg-gray-200' />
                  </div>
                </div>
              ))
            : displayedProducts.map((product) => (
                <article
                  key={product.id}
                  className='group flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#6DB33F]/30 hover:shadow-md'
                >
                  <div className='relative aspect-[4/3] overflow-hidden bg-gray-50'>
                    <button
                      type='button'
                      onClick={() =>
                        navigate('/product/' + encodeURIComponent(product.id))
                      }
                      className='h-full w-full'
                      aria-label={'View ' + product.title}
                    >
                      <ImageWithFallback
                        src={product.image}
                        alt={product.title}
                        className='h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105'
                      />
                    </button>
                    <span className='absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm'>
                      Best seller
                    </span>
                    <button
                      type='button'
                      onClick={() => handleToggleWishlist(product.id)}
                      className='absolute right-2 top-2 rounded-full bg-white/95 p-1.5 shadow-sm'
                      aria-label='Toggle wishlist'
                    >
                      <Heart
                        size={14}
                        className={
                          wishlistIds.includes(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400'
                        }
                      />
                    </button>
                  </div>

                  <div className='flex flex-1 flex-col p-3'>
                    <button
                      type='button'
                      onClick={() =>
                        navigate('/product/' + encodeURIComponent(product.id))
                      }
                      className='line-clamp-2 min-h-9 text-left text-xs font-semibold leading-snug text-gray-900 hover:text-[#6DB33F] sm:text-sm'
                    >
                      {product.title}
                    </button>
                    <div className='mt-2 flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-bold text-[#5da035] sm:text-base'>
                        Rs.{product.price.toLocaleString()}
                      </span>
                      <button
                        type='button'
                        onClick={() => handleAddToCart(product, 1)}
                        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6DB33F] text-white shadow-sm transition-colors hover:bg-[#5da035]'
                        aria-label={'Add ' + product.title + ' to cart'}
                      >
                        <ShoppingCart size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>
    );
  }

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
          ? Array.from({ length: limit }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : displayedProducts.map((product) => (
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
