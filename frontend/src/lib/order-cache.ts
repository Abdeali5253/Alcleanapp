// Order Caching Service for AlClean App
// Caches user orders locally with automatic midnight refresh

import { Order } from "./order-service";

const ORDERS_CACHE_KEY = "alclean_orders_cache";
const ORDERS_CACHE_TIMESTAMP_KEY = "alclean_orders_cache_timestamp";
const CACHE_DURATION_HOURS = 24; // Cache validity duration

interface OrderCacheData {
  orders: Order[];
  userEmail: string;
  timestamp: number;
  version: string;
}

class OrderCacheService {
  private readonly CACHE_VERSION = "1.0.0";
  private midnightRefreshScheduled = false;

  constructor() {
    // Schedule midnight refresh when service is initialized
    this.scheduleMidnightRefresh();
  }

  /**
   * Get cached orders for a specific user if available and not expired
   */
  getCachedOrders(userEmail: string): Order[] {
    try {
      const cachedData = localStorage.getItem(ORDERS_CACHE_KEY);
      if (!cachedData) {
        console.log("[OrderCache] No cache found");
        return [];
      }

      const data: OrderCacheData = JSON.parse(cachedData);

      // Check if cache is for the correct user
      if (data.userEmail !== userEmail) {
        console.log("[OrderCache] Cache is for different user, clearing");
        this.clearCache();
        return [];
      }

      // Check version compatibility
      if (data.version !== this.CACHE_VERSION) {
        console.log("[OrderCache] Cache version mismatch, clearing cache");
        this.clearCache();
        return [];
      }

      // Check if cache is expired (older than CACHE_DURATION_HOURS)
      const cacheAge = Date.now() - data.timestamp;
      const maxAge = CACHE_DURATION_HOURS * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        console.log("[OrderCache] Cache expired, clearing");
        this.clearCache();
        return [];
      }

      console.log(`[OrderCache] Returning ${data.orders.length} cached orders (age: ${Math.round(cacheAge / 60000)} minutes)`);
      return data.orders;
    } catch (error) {
      console.error("[OrderCache] Error reading cache:", error);
      this.clearCache();
      return [];
    }
  }

  /**
   * Save orders to cache for a specific user
   */
  setCachedOrders(orders: Order[], userEmail: string): void {
    try {
      const data: OrderCacheData = {
        orders,
        userEmail,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };

      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(ORDERS_CACHE_TIMESTAMP_KEY, data.timestamp.toString());

      console.log(`[OrderCache] Cached ${orders.length} orders for ${userEmail} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error("[OrderCache] Error saving cache:", error);
      // If storage is full, clear old cache and try again
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.log("[OrderCache] Storage full, clearing and retrying...");
        this.clearCache();
        try {
          const data: OrderCacheData = {
            orders,
            userEmail,
            timestamp: Date.now(),
            version: this.CACHE_VERSION,
          };
          localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(data));
        } catch (retryError) {
          console.error("[OrderCache] Retry failed:", retryError);
        }
      }
    }
  }

  /**
   * Check if cache should be refreshed (for background refresh)
   */
  shouldRefresh(): boolean {
    const timestamp = localStorage.getItem(ORDERS_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    // Refresh if cache is older than 6 hours
    const refreshThreshold = 6 * 60 * 60 * 1000;
    return cacheAge > refreshThreshold;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(ORDERS_CACHE_KEY);
      localStorage.removeItem(ORDERS_CACHE_TIMESTAMP_KEY);
      console.log("[OrderCache] Cache cleared");
    } catch (error) {
      console.error("[OrderCache] Error clearing cache:", error);
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { hasCache: boolean; orderCount: number; userEmail: string; ageMinutes: number; lastRefresh: string } {
    try {
      const cachedData = localStorage.getItem(ORDERS_CACHE_KEY);
      const timestamp = localStorage.getItem(ORDERS_CACHE_TIMESTAMP_KEY);

      if (!cachedData || !timestamp) {
        return { hasCache: false, orderCount: 0, userEmail: "", ageMinutes: 0, lastRefresh: "Never" };
      }

      const data: OrderCacheData = JSON.parse(cachedData);
      const cacheAge = Date.now() - parseInt(timestamp, 10);

      return {
        hasCache: true,
        orderCount: data.orders.length,
        userEmail: data.userEmail,
        ageMinutes: Math.round(cacheAge / 60000),
        lastRefresh: new Date(parseInt(timestamp, 10)).toLocaleString(),
      };
    } catch {
      return { hasCache: false, orderCount: 0, userEmail: "", ageMinutes: 0, lastRefresh: "Error" };
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

    console.log(`[OrderCache] Scheduling midnight refresh in ${Math.round(msUntilMidnight / 60000)} minutes`);

    // Schedule the midnight refresh
    setTimeout(() => {
      console.log("[OrderCache] Midnight refresh triggered");
      this.clearCache();

      // Emit event for UI to know cache was cleared
      window.dispatchEvent(new CustomEvent("alclean-order-cache-cleared"));

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
    console.log("[OrderCache] Force refresh requested");
    this.clearCache();
    window.dispatchEvent(new CustomEvent("alclean-order-cache-cleared"));
  }

  /**
   * Update cache when new order is placed
   */
  addOrderToCache(order: Order, userEmail: string): void {
    const cachedOrders = this.getCachedOrders(userEmail);
    // Add new order at the beginning (newest first)
    const updatedOrders = [order, ...cachedOrders];
    this.setCachedOrders(updatedOrders, userEmail);
    console.log("[OrderCache] Added new order to cache:", order.orderNumber);
  }

  /**
   * Update existing order in cache
   */
  updateOrderInCache(updatedOrder: Order, userEmail: string): void {
    const cachedOrders = this.getCachedOrders(userEmail);
    const orderIndex = cachedOrders.findIndex(order => order.id === updatedOrder.id);

    if (orderIndex !== -1) {
      cachedOrders[orderIndex] = updatedOrder;
      this.setCachedOrders(cachedOrders, userEmail);
      console.log("[OrderCache] Updated order in cache:", updatedOrder.orderNumber);
    }
  }
}

// Export singleton instance
export const orderCacheService = new OrderCacheService();
