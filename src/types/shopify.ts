// src/types/shopify.ts

export interface Product {
  id: string;
  handle: string;

  name: string;
  description?: string;

  image: string;
  images: string[];

  price: number;
  originalPrice?: number;

  sku?: string;
  weight?: string;
  brand?: string;

  inStock: boolean;
  quantityAvailable: number;
  lowStock: boolean;

  isNew: boolean;
  onSale: boolean;

  subcategory: string; // we’ll map from productType or a tag
  tags: string[];
}
