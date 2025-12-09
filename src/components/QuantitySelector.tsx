import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
}

export function QuantitySelector({ 
  quantity, 
  onQuantityChange, 
  max = 10, 
  min = 1 
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="h-10 w-10 p-0 rounded-xl border-2 border-gray-200 hover:border-[#6DB33F] hover:bg-[#6DB33F]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Minus size={16} className="text-gray-600" />
      </Button>
      
      <div className="flex items-center justify-center min-w-[60px] h-10 px-4 bg-gray-50 rounded-xl border-2 border-gray-100 font-bold text-gray-900">
        {quantity}
      </div>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="h-10 w-10 p-0 rounded-xl border-2 border-gray-200 hover:border-[#6DB33F] hover:bg-[#6DB33F]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Plus size={16} className="text-gray-600" />
      </Button>
    </div>
  );
}
