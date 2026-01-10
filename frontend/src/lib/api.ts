import { Product } from "../types/shopify";
import { BACKEND_URL } from "./base-url";

const API_BASE_URL = BACKEND_URL;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  products?: Product[];
  error?: string;
}

export async function getAllProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      products: data.products || []
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
