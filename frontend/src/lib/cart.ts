// Cart Service with Shopify Checkout Integration
import { Product } from "../types/shopify";
import { 
  checkoutCreate, 
  checkoutLineItemsAdd, 
  checkoutCustomerAssociateV2,
  checkoutShippingAddressUpdateV2,
  ShopifyCheckout,
  CheckoutLineItem
} from "./shopify";
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
    const existingIndex = this.items.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({ product, quantity });
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

  // Create Shopify Checkout and get WebView URL
  async createCheckout(): Promise<{ checkoutUrl: string; checkout: ShopifyCheckout }> {
    if (this.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Convert cart items to checkout line items
    const lineItems: CheckoutLineItem[] = this.items.map(item => ({
      variantId: item.product.variantId,
      quantity: item.quantity,
    }));

    const user = authService.getUser();
    
    // Create checkout
    const checkout = await checkoutCreate(lineItems, user?.email);
    this.saveCheckoutId(checkout.id);

    // Associate customer if logged in
    if (user?.accessToken) {
      try {
        await checkoutCustomerAssociateV2(checkout.id, user.accessToken);
      } catch (error) {
        console.warn("[Cart] Failed to associate customer:", error);
      }
    }

    return {
      checkoutUrl: checkout.webUrl,
      checkout,
    };
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
  }): Promise<ShopifyCheckout | null> {
    if (!this.checkoutId) {
      console.warn("[Cart] No checkout to update");
      return null;
    }

    try {
      return await checkoutShippingAddressUpdateV2(this.checkoutId, address);
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
