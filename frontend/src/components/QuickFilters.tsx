import { useState, useRef } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";

interface QuickFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
  productCount: number;
}

export interface FilterState {
  priceRange: "all" | "under500" | "500to1000" | "1000to5000" | "over5000";
  stockStatus: "all" | "instock" | "outofstock";
  sortBy: "featured" | "price-low" | "price-high" | "name" | "discount";
}

export const defaultFilters: FilterState = {
  priceRange: "all",
  stockStatus: "all",
  sortBy: "featured",
};

export function QuickFilters({
  onFilterChange,
  currentFilters,
  productCount,
}: QuickFiltersProps) {
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const priceButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
    setShowPriceDropdown(false);
    setShowSortDropdown(false);
  };

  const clearFilters = () => {
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters =
    currentFilters.priceRange !== "all" || currentFilters.stockStatus !== "all";

  const activeFilterCount = [
    currentFilters.priceRange !== "all",
    currentFilters.stockStatus === "instock",
  ].filter(Boolean).length;

  const priceOptions = [
    { value: "all", label: "Price" },
    { value: "under500", label: "<Rs.500" },
    { value: "500to1000", label: "500-1K" },
    { value: "1000to5000", label: "1K-5K" },
    { value: "over5000", label: ">Rs.5K" },
  ];

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price ↑" },
    { value: "price-high", label: "Price ↓" },
    { value: "name", label: "A-Z" },
    { value: "discount", label: "Discount" },
  ];

  return (
    <div className="mb-4">
      {/* Compact Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Product Count */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">
          <SlidersHorizontal size={12} />
          <span>{productCount}</span>
        </div>

        {/* In Stock Toggle */}
        <button
          onClick={() =>
            handleFilterChange(
              "stockStatus",
              currentFilters.stockStatus === "instock" ? "all" : "instock"
            )
          }
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentFilters.stockStatus === "instock"
              ? "bg-green-500 text-white"
              : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          ✓ Stock
        </button>

        {/* Price Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            ref={priceButtonRef}
            onClick={() => {
              setShowPriceDropdown(!showPriceDropdown);
              setShowSortDropdown(false);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentFilters.priceRange !== "all"
                ? "bg-[#6DB33F] text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {
              priceOptions.find((o) => o.value === currentFilters.priceRange)
                ?.label
            }
            <ChevronDown
              size={12}
              className={showPriceDropdown ? "rotate-180" : ""}
            />
          </button>

          {showPriceDropdown &&
            priceButtonRef.current &&
            (() => {
              const rect = priceButtonRef.current!.getBoundingClientRect();
              return createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[999]"
                    onClick={() => setShowPriceDropdown(false)}
                  />
                  <div
                    className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]"
                    style={{
                      position: "fixed",
                      top: rect.bottom + 4,
                      left: rect.left,
                      zIndex: 1000,
                    }}
                  >
                    {priceOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleFilterChange(
                            "priceRange",
                            option.value as FilterState["priceRange"]
                          )
                        }
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {option.label}
                        {currentFilters.priceRange === option.value && (
                          <Check size={12} className="text-[#6DB33F]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              );
            })()}
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-shrink-0 ml-auto">
          <button
            ref={sortButtonRef}
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowPriceDropdown(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600"
          >
            {sortOptions.find((o) => o.value === currentFilters.sortBy)?.label}
            <ChevronDown
              size={12}
              className={showSortDropdown ? "rotate-180" : ""}
            />
          </button>

          {showSortDropdown &&
            sortButtonRef.current &&
            (() => {
              const rect = sortButtonRef.current!.getBoundingClientRect();
              return createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[999]"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div
                    className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]"
                    style={{
                      position: "fixed",
                      top: rect.bottom + 4,
                      left: rect.left + rect.width - 100,
                      zIndex: 1000,
                    }}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleFilterChange(
                            "sortBy",
                            option.value as FilterState["sortBy"]
                          )
                        }
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        {option.label}
                        {currentFilters.sortBy === option.value && (
                          <Check size={12} className="text-[#6DB33F]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              );
            })()}
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Active Filter Tags - Compact */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 mt-2">
          {currentFilters.stockStatus === "instock" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-[10px] font-medium">
              In Stock
              <button onClick={() => handleFilterChange("stockStatus", "all")}>
                <X size={10} />
              </button>
            </span>
          )}
          {currentFilters.priceRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#6DB33F]/10 text-[#6DB33F] rounded-full text-[10px] font-medium">
              {
                priceOptions.find((o) => o.value === currentFilters.priceRange)
                  ?.label
              }
              <button onClick={() => handleFilterChange("priceRange", "all")}>
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
