import { Product } from "../types/shopify";
import { BACKEND_URL } from "./base-url";

const API_BASE_URL = BACKEND_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  products?: Product[];
  product?: Product;
  collection?: any;
  error?: string;
}

export async function getAllProducts(limit: number = 250): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Product[]> = await response.json();

    if (!data.success || !data.products) {
      throw new Error(data.error || "Failed to fetch products");
    }

    return data.products;
  } catch (error) {
    console.error('Failed to fetch all products:', error);
    throw error;
  }
}

export async function getProductsByCollection(handle: string, limit: number = 250): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/collection/${handle}?first=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Product[]> = await response.json();

    if (!data.success || !data.products) {
      throw new Error(data.error || "Failed to fetch collection products");
    }

    return data.products;
  } catch (error) {
    console.error(`Failed to fetch products for collection ${handle}:`, error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{ product: Product }> = await response.json();

    if (!data.success || !data.product) {
      throw new Error(data.error || "Failed to fetch product");
    }

    return data.product;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    throw error;
  }
}

// Additional functions that might be needed
export async function getCustomer(accessToken: string): Promise<any> {
  // This would need backend implementation
  throw new Error("getCustomer not implemented");
}

export async function isShopifyConfigured(): Promise<boolean> {
  // This would need backend implementation
  return true;
}

export async function checkoutCreate(input: any): Promise<any> {
  // This would need backend implementation
  throw new Error("checkoutCreate not implemented");
}

export async function checkoutCustomerAssociateV2(checkoutId: string, customerAccessToken: string): Promise<any> {
  // This would need backend implementation
  throw new Error("checkoutCustomerAssociateV2 not implemented");
}

export async function checkoutLineItemsAdd(checkoutId: string, lineItems: any[]): Promise<any> {
  // This would need backend implementation
  throw new Error("checkoutLineItemsAdd not implemented");
}

export async function checkoutShippingAddressUpdateV2(checkoutId: string, shippingAddress: any): Promise<any> {
  // This would need backend implementation
  throw new Error("checkoutShippingAddressUpdateV2 not implemented");
}

export async function customerAccessTokenCreate(email: string, password: string): Promise<any> {
  // This would need backend implementation
  throw new Error("customerAccessTokenCreate not implemented");
}

export async function customerCreate(input: any): Promise<any> {
  // This would need backend implementation
  throw new Error("customerCreate not implemented");
}

export async function customerRecover(email: string): Promise<any> {
  // This would need backend implementation
  throw new Error("customerRecover not implemented");
}

export async function updateCustomer(customerAccessToken: string, customer: any): Promise<any> {
  // This would need backend implementation
  throw new Error("updateCustomer not implemented");
}

export async function getCheckoutUrl(checkoutId: string): Promise<string> {
  // This would need backend implementation
  throw new Error("getCheckoutUrl not implemented");
}

export async function getCheckoutWebUrl(checkoutId: string): Promise<string> {
  // This would need backend implementation
  throw new Error("getCheckoutWebUrl not implemented");
}
