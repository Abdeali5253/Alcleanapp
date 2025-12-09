export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="relative bg-gray-200 h-48 md:h-56" />

      <div className="p-4">
        {/* Category Badge Skeleton */}
        <div className="h-5 bg-gray-200 rounded-full w-24 mb-3" />

        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        
        {/* Price Skeleton */}
        <div className="h-7 bg-gray-200 rounded w-1/2 mb-4" />

        {/* Button Skeleton */}
        <div className="h-11 bg-gray-200 rounded-xl w-full" />
      </div>
    </div>
  );
}
