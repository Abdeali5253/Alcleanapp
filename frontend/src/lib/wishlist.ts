/**
 * Wishlist Service
 * Manages user's favorite products with localStorage persistence
 */

import { authService } from './auth';

const WISHLIST_STORAGE_KEY = 'alclean_wishlist';

type WishlistSubscriber = (productIds: string[]) => void;

class WishlistService {
  private wishlist: string[] = [];
  private subscribers: WishlistSubscriber[] = [];

  constructor() {
    this.loadWishlist();
    
    // Listen to auth changes
    authService.subscribe((user) => {
      if (!user) {
        // User logged out, clear wishlist
        this.wishlist = [];
        this.saveWishlist();
      } else {
        // User logged in, reload wishlist
        this.loadWishlist();
      }
    });
  }

  /**
   * Load wishlist from localStorage
   */
  private loadWishlist(): void {
    const user = authService.getCurrentUser();
    if (!user) {
      this.wishlist = [];
      return;
    }

    try {
      const key = `${WISHLIST_STORAGE_KEY}_${user.email}`;
      const stored = localStorage.getItem(key);
      this.wishlist = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Wishlist] Failed to load:', error);
      this.wishlist = [];
    }
    
    this.notifySubscribers();
  }

  /**
   * Save wishlist to localStorage
   */
  private saveWishlist(): void {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      const key = `${WISHLIST_STORAGE_KEY}_${user.email}`;
      localStorage.setItem(key, JSON.stringify(this.wishlist));
    } catch (error) {
      console.error('[Wishlist] Failed to save:', error);
    }
  }

  /**
   * Add product to wishlist
   */
  addToWishlist(productId: string): void {
    if (!authService.isLoggedIn()) {
      return;
    }

    if (!this.wishlist.includes(productId)) {
      this.wishlist.push(productId);
      this.saveWishlist();
      this.notifySubscribers();
    }
  }

  /**
   * Remove product from wishlist
   */
  removeFromWishlist(productId: string): void {
    const index = this.wishlist.indexOf(productId);
    if (index > -1) {
      this.wishlist.splice(index, 1);
      this.saveWishlist();
      this.notifySubscribers();
    }
  }

  /**
   * Toggle product in wishlist
   */
  toggleWishlist(productId: string): boolean {
    if (!authService.isLoggedIn()) {
      return false;
    }

    const isInWishlist = this.isInWishlist(productId);
    if (isInWishlist) {
      this.removeFromWishlist(productId);
    } else {
      this.addToWishlist(productId);
    }
    return !isInWishlist;
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId: string): boolean {
    return this.wishlist.includes(productId);
  }

  /**
   * Get all wishlist product IDs
   */
  getWishlist(): string[] {
    return [...this.wishlist];
  }

  /**
   * Get wishlist count
   */
  getCount(): number {
    return this.wishlist.length;
  }

  /**
   * Clear entire wishlist
   */
  clearWishlist(): void {
    this.wishlist = [];
    this.saveWishlist();
    this.notifySubscribers();
  }

  /**
   * Subscribe to wishlist changes
   */
  subscribe(callback: WishlistSubscriber): () => void {
    this.subscribers.push(callback);
    callback(this.wishlist);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.wishlist));
  }
}

export const wishlistService = new WishlistService();
