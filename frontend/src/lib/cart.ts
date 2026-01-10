// Cart Service using Backend API
import { Product } from "../types/shopify";
import { BACKEND_URL } from "./base-url";
import { authService } from "./auth";

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = 'alclean_cart';
const CHECKOUT_STORAGE_KEY = 'alclean_checkout_id';

class CartService {
  private items: CartItem[] = [];
  private checkoutId: string | null = null;
  private listeners: ((items: CartItem[]) => void)[] = [];

  constructor() {
    this.loadCart();
    this.loadCheckoutId();
  }

  private loadCart(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and clean cart data
        this.items = Array.isArray(parsed) ? parsed.filter(item => {
          // Ensure item has product and valid quantity
          if (!item || !item.product || typeof item.product.id !== 'string') {
            return false;
          }
          // Ensure quantity is a number
          item.quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1;
          // Ensure price is a number
          if (item.product.price && typeof item.product.price !== 'number') {
            item.product.price = parseFloat(item.product.price) || 0;
          }
          return item.quantity > 0;
        }) : [];
      }
    } catch (error) {
      console.error("[Cart] Failed to load:", error);
      this.items = [];
    }
  }

  private saveCart(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      this.notifyListeners();
    } catch (error) {
      console.error("[Cart] Failed to save:", error);
    }
  }

  private loadCheckoutId(): void {
    try {
      this.checkoutId = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    } catch (error) {
      console.error("[Cart] Failed to load checkout:", error);
    }
  }

  private saveCheckoutId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(CHECKOUT_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      }
      this.checkoutId = id;
    } catch (error) {
      console.error("[Cart] Failed to save checkout:", error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getItems()));
  }

  subscribe(callback: (items: CartItem[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getItems());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Get cart items
  getItems(): CartItem[] {
    return [...this.items];
  }

  // Get cart count
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get cart total
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  // Add to cart
  addToCart(product: Product, quantity: number = 1): void {
    // Ensure quantity is a valid number
    const qty = typeof quantity === 'number' ? quantity : parseInt(String(quantity)) || 1;
    
    const existingIndex = this.items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity = (this.items[existingIndex].quantity || 0) + qty;
    } else {
      // Ensure product price is a number
      const cleanProduct = {
        ...product,
        price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0
      };
      this.items.push({ product: cleanProduct, quantity: qty });
    }
    
    // Reset checkout when cart changes
    this.saveCheckoutId(null);
    this.saveCart();
  }

  // Update quantity
  updateQuantity(productId: string, quantity: number): void {
    const index = this.items.findIndex(item => item.product.id === productId);
    
    if (index >= 0) {
      if (quantity <= 0) {
        this.items.splice(index, 1);
      } else {
        this.items[index].quantity = quantity;
      }
      this.saveCheckoutId(null);
      this.saveCart();
    }
  }

  // Remove from cart
  removeFromCart(productId: string): void {
    this.items = this.items.filter(item => item.product.id !== productId);
    this.saveCheckoutId(null);
    this.saveCart();
  }

  // Clear cart
  clearCart(): void {
    this.items = [];
    this.saveCheckoutId(null);
    this.saveCart();
  }

  // Create checkout using backend API
  async createCheckout(): Promise<{ checkoutUrl: string; checkout: any }> {
    if (this.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Convert cart items to checkout line items
    // Ensure quantity is always an integer
    const lineItems = this.items.map(item => ({
      variantId: item.product.variantId,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    console.log("[Cart] Creating checkout with line items:", lineItems);

    const user = authService.getUser();

    try {
      // Create checkout via backend
      const response = await fetch(`${BACKEND_URL}/api/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineItems,
          email: user?.email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      const checkout = data.checkout;
      this.saveCheckoutId(checkout.id);

      // Associate customer if logged in
      if (user?.accessToken) {
        try {
          const encodedCheckoutId = encodeURIComponent(checkout.id);
          await fetch(`${BACKEND_URL}/api/cart/checkout/${encodedCheckoutId}/customer`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: user.accessToken,
            }),
          });
        } catch (error) {
          console.warn("[Cart] Failed to associate customer:", error);
        }
      }

      return {
        checkoutUrl: checkout.webUrl,
        checkout,
      };
    } catch (error: any) {
      console.error("[Cart] Checkout creation error:", error);
      throw error;
    }
  }

  // Update shipping address on checkout
  async updateShippingAddress(address: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  }): Promise<any> {
    if (!this.checkoutId) {
      console.warn("[Cart] No checkout to update");
      return null;
    }

    try {
      const encodedCheckoutId = encodeURIComponent(this.checkoutId);
      const response = await fetch(`${BACKEND_URL}/api/cart/checkout/${encodedCheckoutId}/shipping-address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update shipping address');
      }

      return data.checkout;
    } catch (error) {
      console.error("[Cart] Failed to update shipping:", error);
      return null;
    }
  }

  // Get existing checkout URL
  getCheckoutId(): string | null {
    return this.checkoutId;
  }

  // Clear checkout after successful order
  clearCheckout(): void {
    this.clearCart();
    this.saveCheckoutId(null);
  }
}

export const cartService = new CartService();
