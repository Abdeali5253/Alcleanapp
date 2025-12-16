import { useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface QuickFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
  productCount: number;
}

export interface FilterState {
  priceRange: 'all' | 'under500' | '500to1000' | '1000to5000' | 'over5000';
  stockStatus: 'all' | 'instock' | 'outofstock';
  sortBy: 'featured' | 'price-low' | 'price-high' | 'name' | 'discount';
  onSale: boolean;
}

export const defaultFilters: FilterState = {
  priceRange: 'all',
  stockStatus: 'all',
  sortBy: 'featured',
  onSale: false,
};

export function QuickFilters({ onFilterChange, currentFilters, productCount }: QuickFiltersProps) {
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    currentFilters.priceRange !== 'all' ||
    currentFilters.stockStatus !== 'all' ||
    currentFilters.onSale;

  const priceOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'under500', label: 'Under Rs.500' },
    { value: '500to1000', label: 'Rs.500 - Rs.1,000' },
    { value: '1000to5000', label: 'Rs.1,000 - Rs.5,000' },
    { value: 'over5000', label: 'Over Rs.5,000' },
  ];

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: 'discount', label: 'Biggest Discount' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Product Count */}
        <div className="flex items-center gap-2 text-gray-600">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">{productCount} products</span>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 flex-1">
          {/* On Sale Toggle */}
          <button
            onClick={() => handleFilterChange('onSale', !currentFilters.onSale)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentFilters.onSale
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔥 On Sale
          </button>

          {/* In Stock Toggle */}
          <button
            onClick={() => handleFilterChange('stockStatus', 
              currentFilters.stockStatus === 'instock' ? 'all' : 'instock'
            )}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentFilters.stockStatus === 'instock'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ In Stock
          </button>

          {/* Price Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPriceDropdown(!showPriceDropdown);
                setShowSortDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentFilters.priceRange !== 'all'
                  ? 'bg-[#6DB33F] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Price
              <ChevronDown size={16} className={showPriceDropdown ? 'rotate-180' : ''} />
            </button>
            
            {showPriceDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 min-w-[180px]">
                {priceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFilterChange('priceRange', option.value as FilterState['priceRange']);
                      setShowPriceDropdown(false);
                    }}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {option.label}
                    {currentFilters.priceRange === option.value && (
                      <Check size={16} className="text-[#6DB33F]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowPriceDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              Sort: {sortOptions.find(o => o.value === currentFilters.sortBy)?.label}
              <ChevronDown size={16} className={showSortDropdown ? 'rotate-180' : ''} />
            </button>
            
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 min-w-[180px]">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFilterChange('sortBy', option.value as FilterState['sortBy']);
                      setShowSortDropdown(false);
                    }}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {option.label}
                    {currentFilters.sortBy === option.value && (
                      <Check size={16} className="text-[#6DB33F]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {currentFilters.onSale && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              On Sale
              <button onClick={() => handleFilterChange('onSale', false)}>
                <X size={12} />
              </button>
            </span>
          )}
          {currentFilters.stockStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
              {currentFilters.stockStatus === 'instock' ? 'In Stock' : 'Out of Stock'}
              <button onClick={() => handleFilterChange('stockStatus', 'all')}>
                <X size={12} />
              </button>
            </span>
          )}
          {currentFilters.priceRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#6DB33F]/10 text-[#6DB33F] rounded-full text-xs font-medium">
              {priceOptions.find(o => o.value === currentFilters.priceRange)?.label}
              <button onClick={() => handleFilterChange('priceRange', 'all')}>
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
