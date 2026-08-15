import { Product } from "../types/shopify";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;
const DATABASE_NAME = "alclean-public-cache";
const STORE_NAME = "products";

interface CacheData {
  key: string;
  products: Product[];
  timestamp: number;
  version: string;
}

class ProductCacheService {
  private readonly CACHE_VERSION = "2.0.0";
  private readonly memoryCache = new Map<string, CacheData>();
  private databasePromise: Promise<IDBDatabase | null> | null = null;
  private midnightRefreshScheduled = false;

  constructor() {
    this.scheduleMidnightRefresh();
  }

  private getLegacyCacheKey(key: string): string {
    return `alclean_products_cache_${key}`;
  }

  private getLegacyTimestampKey(key: string): string {
    return `alclean_products_cache_timestamp_${key}`;
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (this.databasePromise) return this.databasePromise;
    if (typeof indexedDB === "undefined") return Promise.resolve(null);

    this.databasePromise = new Promise((resolve) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error("[ProductCache] IndexedDB unavailable:", request.error);
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    });
    return this.databasePromise;
  }

  private async readFromDatabase(key: string): Promise<CacheData | null> {
    const database = await this.openDatabase();
    if (!database) return null;
    return new Promise((resolve) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => resolve((request.result as CacheData) || null);
      request.onerror = () => resolve(null);
    });
  }

  private async writeToDatabase(data: CacheData): Promise<boolean> {
    const database = await this.openDatabase();
    if (!database) return false;
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(data);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => {
        console.error("[ProductCache] IndexedDB write failed:", transaction.error);
        resolve(false);
      };
      transaction.onabort = () => resolve(false);
    });
  }

  private async readCacheData(key: string): Promise<CacheData | null> {
    const memoryData = this.memoryCache.get(key);
    if (memoryData) return memoryData;

    const databaseData = await this.readFromDatabase(key);
    if (databaseData) {
      this.memoryCache.set(key, databaseData);
      return databaseData;
    }

    // Migrate a valid legacy localStorage entry once, then remove the large
    // payload so it no longer competes with app preferences for quota.
    try {
      const serialized = localStorage.getItem(this.getLegacyCacheKey(key));
      if (!serialized) return null;
      const legacy = JSON.parse(serialized) as Omit<CacheData, "key">;
      const data: CacheData = { ...legacy, key };
      this.memoryCache.set(key, data);
      await this.writeToDatabase(data);
      localStorage.removeItem(this.getLegacyCacheKey(key));
      localStorage.removeItem(this.getLegacyTimestampKey(key));
      return data;
    } catch {
      localStorage.removeItem(this.getLegacyCacheKey(key));
      localStorage.removeItem(this.getLegacyTimestampKey(key));
      return null;
    }
  }

  async getCachedProducts(key = "all"): Promise<Product[]> {
    const data = await this.readCacheData(key);
    if (!data) return [];
    const cacheAge = Date.now() - data.timestamp;
    if (
      data.version !== this.CACHE_VERSION ||
      !Array.isArray(data.products) ||
      cacheAge < 0 ||
      cacheAge > CACHE_DURATION_MS
    ) {
      await this.clearCache(key);
      return [];
    }
    return data.products;
  }

  async setCachedProducts(products: Product[], key = "all"): Promise<void> {
    const data: CacheData = {
      key,
      products,
      timestamp: Date.now(),
      version: this.CACHE_VERSION,
    };
    this.memoryCache.set(key, data);
    await this.writeToDatabase(data);
    localStorage.removeItem(this.getLegacyCacheKey(key));
    localStorage.removeItem(this.getLegacyTimestampKey(key));
  }

  async shouldRefresh(key = "all"): Promise<boolean> {
    const data = await this.readCacheData(key);
    return !data || Date.now() - data.timestamp > REFRESH_AFTER_MS;
  }

  async clearCache(key?: string): Promise<void> {
    if (key) this.memoryCache.delete(key);
    else this.memoryCache.clear();

    const database = await this.openDatabase();
    if (database) {
      await new Promise<void>((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        if (key) store.delete(key);
        else store.clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
        transaction.onabort = () => resolve();
      });
    }

    if (key) {
      localStorage.removeItem(this.getLegacyCacheKey(key));
      localStorage.removeItem(this.getLegacyTimestampKey(key));
    } else {
      Object.keys(localStorage)
        .filter((entry) => entry.startsWith("alclean_products_cache"))
        .forEach((entry) => localStorage.removeItem(entry));
    }
  }

  async getCacheInfo(key = "all"): Promise<{
    hasCache: boolean;
    productCount: number;
    ageMinutes: number;
    lastRefresh: string;
  }> {
    const data = await this.readCacheData(key);
    if (!data) {
      return { hasCache: false, productCount: 0, ageMinutes: 0, lastRefresh: "Never" };
    }
    const age = Date.now() - data.timestamp;
    return {
      hasCache: true,
      productCount: data.products.length,
      ageMinutes: Math.round(age / 60_000),
      lastRefresh: new Date(data.timestamp).toLocaleString(),
    };
  }

  private scheduleMidnightRefresh(): void {
    if (this.midnightRefreshScheduled || typeof window === "undefined") return;
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    this.midnightRefreshScheduled = true;
    window.setTimeout(() => {
      void this.clearCache().then(() => {
        window.dispatchEvent(new CustomEvent("alclean-cache-cleared"));
        this.midnightRefreshScheduled = false;
        this.scheduleMidnightRefresh();
      });
    }, midnight.getTime() - Date.now());
  }

  forceRefresh(): void {
    void this.clearCache().then(() => {
      window.dispatchEvent(new CustomEvent("alclean-cache-cleared"));
    });
  }
}

export const productCacheService = new ProductCacheService();
