// src/types/shopify.ts

export interface Product {
  id: string;
  title: string;
  handle: string;

  price: number;
  originalPrice: number | null;
  onSale: boolean;
  discountPercent: number;

  image: string;
  images: string[];

  inStock: boolean;
  quantityAvailable: number;
  lowStock: boolean;

  description: string;
  tags: string[];

  productType: string;
  category: string;
  subcategory: string;

  // Extended fields
  sku: string | null;
  brand: string | null;
  weight: string | null;
  isNew: boolean;
  
  // Variant ID for cart/checkout
  variantId: string;
}