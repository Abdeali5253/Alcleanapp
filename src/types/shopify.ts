// Shopify Product Types
export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  images: ShopifyImage[];
  featuredImage: ShopifyImage | null;
  variants: ShopifyVariant[];
  priceRange: ShopifyPriceRange;
  compareAtPriceRange: ShopifyPriceRange;
  collections: ShopifyCollection[];
  metafields: ShopifyMetafield[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: string;
  compareAtPrice: string | null;
  sku: string;
  weight: number;
  weightUnit: string;
  image: ShopifyImage | null;
  selectedOptions: ShopifySelectedOption[];
  quantityAvailable: number;
}

export interface ShopifyImage {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyMoney;
  maxVariantPrice: ShopifyMoney;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

// Cart Types
export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopifyCartLine[];
  cost: ShopifyCartCost;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: ShopifyVariant;
  cost: ShopifyCartLineCost;
}

export interface ShopifyCartCost {
  subtotalAmount: ShopifyMoney;
  totalAmount: ShopifyMoney;
  totalTaxAmount: ShopifyMoney | null;
}

export interface ShopifyCartLineCost {
  totalAmount: ShopifyMoney;
}

// Frontend Product Type (normalized from Shopify)
export interface Product {
  id: string;
  handle: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  inStock: boolean;
  weight: string;
  weightValue: number;
  weightUnit: string;
  isNew?: boolean;
  onSale?: boolean;
  lowStock?: boolean;
  brand?: string;
  tags: string[];
  variantId: string;
  quantityAvailable: number;
  sku: string;
}

// Filter Types
export interface ProductFilters {
  subcategories: string[];
  priceRange: [number, number];
  stockFilter: "all" | "instock" | "outofstock";
  searchQuery: string;
  sortBy: "featured" | "price-low" | "price-high" | "name";
}

// API Response Types
export interface ShopifyProductsResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface ShopifyCollectionsResponse {
  collections: {
    edges: Array<{
      node: ShopifyCollection;
    }>;
  };
}
