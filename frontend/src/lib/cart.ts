// Cart management service with localStorage persistence
import { Product } from "../types/shopify";

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = "alclean_cart";

class CartService {
  private listeners: Set<() => void> = new Set();

  // Validate and migrate cart items to ensure they have variant IDs
  private validateAndMigrateCart(cart: CartItem[]): CartItem[] {
    const validCart = cart.filter(item => {
      if (!item.product.variantId || item.product.variantId === '') {
        console.warn('[Cart] ⚠️ Removing item without variant ID:', item.product.title);
        console.warn('[Cart] → Please re-add this product to your cart');
        return false;
      }
      return true;
    });
    
    if (validCart.length !== cart.length) {
      const removedCount = cart.length - validCart.length;
      console.log(`[Cart] 🔄 Cart migration complete: removed ${removedCount} item${removedCount > 1 ? 's' : ''} without variant IDs`);
      console.log('[Cart] ℹ️ These items were added before the checkout system was updated.');
      console.log('[Cart] ℹ️ Please browse the products again and re-add them to your cart.');
    }
    
    return validCart;
  }

  // Get all cart items
  getCart(): CartItem[] {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const cart = stored ? JSON.parse(stored) : [];
      
      // Validate and migrate cart
      const validCart = this.validateAndMigrateCart(cart);
      
      // Save cleaned cart if items were removed
      if (validCart.length !== cart.length) {
        this.saveCart(validCart);
      }
      
      return validCart;
    } catch (error) {
      console.error("Error reading cart:", error);
      return [];
    }
  }

  // Save cart to localStorage
  private saveCart(cart: CartItem[]) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  }

  // Add item to cart
  addToCart(product: Product, quantity: number = 1): void {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      // Update quantity if item exists
      cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({ product, quantity });
    }

    this.saveCart(cart);
  }

  // Update item quantity
  updateQuantity(productId: string, quantity: number): void {
    const cart = this.getCart();
    const index = cart.findIndex(item => item.product.id === productId);

    if (index > -1) {
      if (quantity <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = quantity;
      }
      this.saveCart(cart);
    }
  }

  // Remove item from cart
  removeFromCart(productId: string): void {
    const cart = this.getCart();
    const filtered = cart.filter(item => item.product.id !== productId);
    this.saveCart(filtered);
  }

  // Clear entire cart
  clearCart(): void {
    this.saveCart([]);
  }

  // Get cart count
  getCartCount(): number {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get cart total
  getCartTotal(): number {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  // Subscribe to cart changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // Check if product is in cart
  isInCart(productId: string): boolean {
    const cart = this.getCart();
    return cart.some(item => item.product.id === productId);
  }

  // Get quantity of specific product in cart
  getProductQuantity(productId: string): number {
    const cart = this.getCart();
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }
}

export const cartService = new CartService();