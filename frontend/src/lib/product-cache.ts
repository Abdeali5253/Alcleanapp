// Product Caching Service for AlClean App
// Caches Shopify products locally with automatic midnight refresh

import { Product } from "../types/shopify";

const CACHE_DURATION_HOURS = 24; // Cache validity duration

interface CacheData {
  products: Product[];
  timestamp: number;
  version: string;
}

class ProductCacheService {
  private readonly CACHE_VERSION = "1.0.0";
  private midnightRefreshScheduled = false;

  constructor() {
    // Schedule midnight refresh when service is initialized
    this.scheduleMidnightRefresh();
  }

  private getCacheKey(key: string): string {
    return `alclean_products_cache_${key}`;
  }

  private getTimestampKey(key: string): string {
    return `alclean_products_cache_timestamp_${key}`;
  }

  /**
   * Get cached products if available and not expired
   */
  getCachedProducts(key: string = "all"): Product[] {
    try {
      const cacheKey = this.getCacheKey(key);
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) {
        console.log(`[ProductCache] No cache found for ${key}`);
        return [];
      }

      const data: CacheData = JSON.parse(cachedData);

      // Check version compatibility
      if (data.version !== this.CACHE_VERSION) {
        console.log(`[ProductCache] Cache version mismatch for ${key}, clearing cache`);
        this.clearCache(key);
        return [];
      }

      // Check if cache is expired (older than CACHE_DURATION_HOURS)
      const cacheAge = Date.now() - data.timestamp;
      const maxAge = CACHE_DURATION_HOURS * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        console.log(`[ProductCache] Cache expired for ${key}, clearing`);
        this.clearCache(key);
        return [];
      }

      console.log(`[ProductCache] Returning ${data.products.length} cached products for ${key} (age: ${Math.round(cacheAge / 60000)} minutes)`);
      return data.products;
    } catch (error) {
      console.error(`[ProductCache] Error reading cache for ${key}:`, error);
      this.clearCache(key);
      return [];
    }
  }

  /**
   * Save products to cache
   */
  setCachedProducts(products: Product[], key: string = "all"): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const timestampKey = this.getTimestampKey(key);
      const data: CacheData = {
        products,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };

      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, data.timestamp.toString());

      console.log(`[ProductCache] Cached ${products.length} products for ${key} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`[ProductCache] Error saving cache for ${key}:`, error);
      // If storage is full, clear old cache and try again
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.log(`[ProductCache] Storage full for ${key}, clearing and retrying...`);
        this.clearCache(key);
        try {
          const cacheKey = this.getCacheKey(key);
          const timestampKey = this.getTimestampKey(key);
          const data: CacheData = {
            products,
            timestamp: Date.now(),
            version: this.CACHE_VERSION,
          };
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(timestampKey, data.timestamp.toString());
        } catch (retryError) {
          console.error(`[ProductCache] Retry failed for ${key}:`, retryError);
        }
      }
    }
  }

  /**
   * Check if cache should be refreshed (for background refresh)
   */
  shouldRefresh(key: string = "all"): boolean {
    const timestampKey = this.getTimestampKey(key);
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return true;

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    // Refresh if cache is older than 6 hours
    const refreshThreshold = 6 * 60 * 60 * 1000;
    return cacheAge > refreshThreshold;
  }

  /**
   * Clear the cache
   */
  clearCache(key?: string): void {
    try {
      if (key) {
        localStorage.removeItem(this.getCacheKey(key));
        localStorage.removeItem(this.getTimestampKey(key));
        console.log(`[ProductCache] Cache cleared for ${key}`);
      } else {
        // Clear all caches
        const keys = Object.keys(localStorage).filter(k => k.startsWith('alclean_products_cache'));
        keys.forEach(k => localStorage.removeItem(k));
        console.log("[ProductCache] All caches cleared");
      }
    } catch (error) {
      console.error("[ProductCache] Error clearing cache:", error);
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(key: string = "all"): { hasCache: boolean; productCount: number; ageMinutes: number; lastRefresh: string } {
    try {
      const cacheKey = this.getCacheKey(key);
      const timestampKey = this.getTimestampKey(key);
      const cachedData = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);

      if (!cachedData || !timestamp) {
        return { hasCache: false, productCount: 0, ageMinutes: 0, lastRefresh: "Never" };
      }

      const data: CacheData = JSON.parse(cachedData);
      const cacheAge = Date.now() - parseInt(timestamp, 10);

      return {
        hasCache: true,
        productCount: data.products.length,
        ageMinutes: Math.round(cacheAge / 60000),
        lastRefresh: new Date(parseInt(timestamp, 10)).toLocaleString(),
      };
    } catch {
      return { hasCache: false, productCount: 0, ageMinutes: 0, lastRefresh: "Error" };
    }
  }

  /**
   * Schedule automatic refresh at midnight
   */
  private scheduleMidnightRefresh(): void {
    if (this.midnightRefreshScheduled) return;

    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight

    const msUntilMidnight = midnight.getTime() - now.getTime();

    console.log(`[ProductCache] Scheduling midnight refresh in ${Math.round(msUntilMidnight / 60000)} minutes`);

    // Schedule the midnight refresh
    setTimeout(() => {
      console.log("[ProductCache] Midnight refresh triggered");
      this.clearCache();

      // Also clear order cache at midnight
      try {
        // Import order cache service dynamically to avoid circular dependency
        import('./order-cache').then(({ orderCacheService }) => {
          orderCacheService.clearCache();
          console.log("[ProductCache] Order cache also cleared at midnight");
        }).catch(err => console.error("[ProductCache] Error clearing order cache:", err));
      } catch (error) {
        console.error("[ProductCache] Error importing order cache:", error);
      }

      // Emit event for UI to know cache was cleared
      window.dispatchEvent(new CustomEvent("alclean-cache-cleared"));

      // Schedule next midnight refresh
      this.midnightRefreshScheduled = false;
      this.scheduleMidnightRefresh();
    }, msUntilMidnight);

    this.midnightRefreshScheduled = true;
  }

  /**
   * Force refresh - clears cache and triggers event
   */
  forceRefresh(): void {
    console.log("[ProductCache] Force refresh requested");
    this.clearCache();

    // Also clear order cache
    try {
      import('./order-cache').then(({ orderCacheService }) => {
        orderCacheService.clearCache();
        console.log("[ProductCache] Order cache also cleared on force refresh");
      }).catch(err => console.error("[ProductCache] Error clearing order cache:", err));
    } catch (error) {
      console.error("[ProductCache] Error importing order cache:", error);
    }

    window.dispatchEvent(new CustomEvent("alclean-cache-cleared"));
  }
}

// Export singleton instance
export const productCacheService = new ProductCacheService();
