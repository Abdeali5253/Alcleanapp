import { Product } from "../types/shopify";

export function sortProductsInStockFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    if (a.inStock === b.inStock) {
      return 0;
    }

    return a.inStock ? -1 : 1;
  });
}
