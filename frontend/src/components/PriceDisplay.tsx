interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PriceDisplay({ 
  price, 
  originalPrice, 
  size = "md",
  className = " 
}: PriceDisplayProps) {
  const sizes = {
    sm: {
      price: "text-base",
      original: "text-xs",
      savings: "text-[10px]",
    },
    md: {
      price: "text-lg",
      original: "text-sm",
      savings: "text-xs",
    },
    lg: {
      price: "text-2xl",
      original: "text-base",
      savings: "text-sm",
    },
    xl: {
      price: "text-4xl",
      original: "text-lg",
      savings: "text-sm",
    },
  };

  const sizeClasses = sizes[size];

  if (!originalPrice || originalPrice <= price) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className={`text-[#6DB33F] font-bold ${sizeClasses.price}`}>
          Rs.{price.toLocaleString()}
        </span>
      </div>
    );
  }

  const savings = originalPrice - price;

  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <span className={`text-[#6DB33F] font-bold ${sizeClasses.price}`}>
          Rs.{price.toLocaleString()}
        </span>
        <span className={`text-gray-400 line-through font-medium ${sizeClasses.original}`}>
          Rs.{originalPrice.toLocaleString()}
        </span>
      </div>
      {size === "xl" && (
        <span className={`text-red-600 font-semibold block mt-1 ${sizeClasses.savings}`}>
          Save Rs.{savings.toLocaleString()}
        </span>
      )}
    </div>
  );
}
