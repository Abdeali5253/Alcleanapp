import { X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { categories } from "../lib/categories";

type CategoryFilter =
  | "all"
  | "cleaning-chemicals"
  | "cleaning-equipment"
  | "car-washing"
  | "bathroom-cleaning"
  | "fabric-cleaning"
  | "dishwashing";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubcategories: string[];
  onToggleSubcategory: (id: string) => void;
  expandedCategories: string[];
  onToggleCategory: (id: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  stockFilter: "all" | "instock" | "outofstock";
  onStockFilterChange: (filter: "all" | "instock" | "outofstock") => void;
  onClearFilters: () => void;
  productsCount: number;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  selectedSubcategories,
  onToggleSubcategory,
  expandedCategories,
  onToggleCategory,
  priceRange,
  onPriceRangeChange,
  stockFilter,
  onStockFilterChange,
  onClearFilters,
  productsCount,
  categoryFilter,
  onCategoryFilterChange,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full md:max-w-lg md:rounded-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <h2 className="text-gray-900 text-xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8">
          {/* Price Range */}
          <div>
            <Label className="mb-4 block text-gray-900 font-semibold text-base">
              Price Range
            </Label>
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="70000"
                step="100"
                value={priceRange[1]}
                onChange={(e) =>
                  onPriceRangeChange([0, Number(e.target.value)])
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6DB33F]"
                style={{
                  background: `linear-gradient(to right, #6DB33F 0%, #6DB33F ${
                    (priceRange[1] / 70000) * 100
                  }%, #e5e7eb ${(priceRange[1] / 70000) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                  Rs.0
                </span>
                <span className="text-sm font-semibold text-[#6DB33F] bg-green-50 px-3 py-1.5 rounded-lg">
                  Rs.{priceRange[1].toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Availability */}
          <div>
            <Label className="mb-4 block text-gray-900 font-semibold text-base">
              Availability
            </Label>
            <div className="space-y-3">
              {[
                { value: "all", label: "All Products" },
                { value: "instock", label: "In Stock Only" },
                { value: "outofstock", label: "Out of Stock" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <input
                    type="radio"
                    checked={stockFilter === option.value}
                    onChange={() => onStockFilterChange(option.value as any)}
                    className="w-5 h-5 text-[#6DB33F] border-gray-300 focus:ring-[#6DB33F] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Category Filter */}
          <div>
            <Label className="mb-4 block text-gray-900 font-semibold text-base">
              Category
            </Label>
            <div className="space-y-3">
              {[
                { value: "all", label: "All Categories" },
                { value: "cleaning-chemicals", label: "Cleaning Chemicals" },
                { value: "cleaning-equipment", label: "Cleaning Equipment" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <input
                    type="radio"
                    checked={categoryFilter === option.value}
                    onChange={() => onCategoryFilterChange(option.value as any)}
                    className="w-5 h-5 text-[#6DB33F] border-gray-300 focus:ring-[#6DB33F] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Categories */}
          <div>
            <Label className="mb-4 block text-gray-900 font-semibold text-base">
              Categories
            </Label>
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#6DB33F]/30 transition-colors"
                >
                  <button
                    onClick={() => onToggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-white transition-all"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {category.name}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-500 transition-transform duration-200 ${
                        expandedCategories.includes(category.id)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {expandedCategories.includes(category.id) && (
                    <div className="px-3 py-2 bg-white space-y-1">
                      {category.subcategories.map((subcategory) => (
                        <label
                          key={subcategory.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.includes(
                              subcategory.id
                            )}
                            onChange={() => onToggleSubcategory(subcategory.id)}
                            className="w-4 h-4 text-[#6DB33F] border-gray-300 rounded focus:ring-[#6DB33F] cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            {subcategory.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="flex-1 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold rounded-xl h-12"
          >
            Clear All
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-[#6DB33F] to-[#5da035] hover:from-[#5da035] hover:to-[#4d8f2e] text-white font-semibold rounded-xl h-12 shadow-md hover:shadow-lg transition-all"
          >
            Show {productsCount} Products
          </Button>
        </div>
      </div>
    </div>
  );
}
