import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Configuration from environment - read lazily to ensure dotenv has loaded
function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || '';
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN || '';
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';
  const url = domain ? `https://${domain}/api/${apiVersion}/graphql.json` : '';
  
  return { domain, token, apiVersion, url };
}

// Check if configured
function isShopifyConfigured(): boolean {
  const { domain, token } = getShopifyConfig();
  return !!(domain && token);
}

// GraphQL fetch helper
async function shopifyFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const { url, token } = getShopifyConfig();

  if (!isShopifyConfigured()) {
    throw new Error("Shopify not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[Shopify] HTTP error ${response.status}: ${text}`);
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("[Shopify] GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }

  return json.data;
}

// Equipment detection keywords
const EQUIPMENT_KEYWORDS = [
  "mop", "bucket", "broom", "brush", "squeegee", "glove", "cloth",
  "wiper", "sponge", "scrubber", "duster", "picker", "trolley",
  "handle", "stick", "pole", "holder", "dispenser", "bin", "dustbin",
  "microfiber", "towel", "dustpan", "scoop", "mat", "cart", "caddy",
  "dryer", "hand dryer", "tissue", "roll", "basket", "janitor",
  "scraper", "spray bottle", "container", "window cleaning", "viper",
  "grinding", "grinder", "machine", "polisher", "vacuum", "sweeper",
  "rubber strip", "strip", "pad", "refill", "head", "attachment",
  "hose", "nozzle", "connector", "wheel", "caster", "frame"
];

// Categorize product
function categorizeProduct(title: string, productType: string, tags: string[]): { category: string; subcategory: string } {
  const titleLower = title.toLowerCase();
  const productTypeLower = productType.toLowerCase();
  const tagsLower = tags.map(t => t.toLowerCase());

  // Priority 1: Check productType from Shopify (most reliable)
  if (productTypeLower.includes('equipment') || productTypeLower.includes('tool')) {
    return categorizeEquipment(titleLower);
  }
  if (productTypeLower.includes('chemical') || productTypeLower.includes('cleaner') || productTypeLower.includes('detergent')) {
    return categorizeChemical(titleLower);
  }

  // Priority 2: Check specific chemical indicators (liquids, acids, etc.)
  const chemicalIndicators = ['liter', 'litre', 'ml', 'gallon', 'acid', 'liquid', 'gel', 'solution', 'cleaner', 'detergent', 'soap', 'wash'];
  const isChemical = chemicalIndicators.some(kw => titleLower.includes(kw));

  // Priority 3: Check equipment keywords (physical tools)
  const isEquipment = EQUIPMENT_KEYWORDS.some(kw => titleLower.includes(kw));

  // Chemicals take priority over equipment if both match
  if (isChemical && !isEquipment) {
    return categorizeChemical(titleLower);
  }

  if (isEquipment && !isChemical) {
    return categorizeEquipment(titleLower);
  }

  // If both match, decide based on more specific context
  if (isChemical && isEquipment) {
    // If it has volume measurements, it's likely a chemical
    if (/\d+\s*(ml|liter|litre|gallon)/i.test(title)) {
      return categorizeChemical(titleLower);
    }
    return categorizeEquipment(titleLower);
  }

  // Default to chemicals
  return categorizeChemical(titleLower);
}

function categorizeEquipment(titleLower: string): { category: string; subcategory: string } {
  if (titleLower.includes("mop") || titleLower.includes("bucket") || titleLower.includes("trolley")) {
    return { category: "cleaning-equipment", subcategory: "mop-buckets" };
  }
  if (titleLower.includes("broom") || titleLower.includes("brush") || titleLower.includes("scrubber")) {
    return { category: "cleaning-equipment", subcategory: "brooms-brushes" };
  }
  if (titleLower.includes("window") || titleLower.includes("squeegee") || titleLower.includes("viper")) {
    return { category: "cleaning-equipment", subcategory: "cleaning-tools" };
  }
  if (titleLower.includes("vacuum") || titleLower.includes("sweeper") || titleLower.includes("machine")) {
    return { category: "cleaning-equipment", subcategory: "cleaning-machines" };
  }
  if (titleLower.includes("garbage") || titleLower.includes("bin") || titleLower.includes("waste") || titleLower.includes("picker")) {
    return { category: "cleaning-equipment", subcategory: "waste-management" };
  }
  return { category: "cleaning-equipment", subcategory: "cleaning-tools" };
}

function categorizeChemical(titleLower: string): { category: string; subcategory: string } {
  // Bathroom
  if (titleLower.includes("bathroom") || titleLower.includes("toilet") || titleLower.includes("wc")) {
    return { category: "bathroom-cleaning", subcategory: "bathroom-cleaner" };
  }
  // Car
  if (titleLower.includes("car") || titleLower.includes("vehicle") || titleLower.includes("automotive")) {
    return { category: "car-washing", subcategory: "car-shampoo" };
  }
  // Dish
  if (titleLower.includes("dish") || titleLower.includes("kitchen") || titleLower.includes("utensil")) {
    return { category: "dishwashing", subcategory: "dish-wash" };
  }
  // Fabric
  if (titleLower.includes("fabric") || titleLower.includes("softener") || titleLower.includes("laundry") || titleLower.includes("cloth")) {
    return { category: "fabric-cleaning", subcategory: "fabric-washing" };
  }
  // Floor
  if (titleLower.includes("floor") || titleLower.includes("tile") || titleLower.includes("marble")) {
    return { category: "cleaning-chemicals", subcategory: "floor-cleaning-chemical" };
  }
  // Glass
  if (titleLower.includes("glass") || titleLower.includes("mirror") || titleLower.includes("window cleaner")) {
    return { category: "cleaning-chemicals", subcategory: "glass-cleaner" };
  }
  // Industrial
  if (titleLower.includes("industrial")) {
    return { category: "cleaning-chemicals", subcategory: "industrial-cleaning-chemicals" };
  }
  // Top
  if (titleLower.includes("top")) {
    return { category: "cleaning-chemicals", subcategory: "top-cleaning-chemicals" };
  }
  // Kitchen
  if (titleLower.includes("kitchen") && !titleLower.includes("dish")) {
    return { category: "cleaning-chemicals", subcategory: "kitchen-cleaning-solution" };
  }
  // Bathroom chemical
  if (titleLower.includes("bathroom") && titleLower.includes("chemical")) {
    return { category: "cleaning-chemicals", subcategory: "bathroom-cleaning-chemical" };
  }
  // Solar
  if (titleLower.includes("solar")) {
    return { category: "cleaning-chemicals", subcategory: "solar-panel-cleaner-solution" };
  }
  // Degreaser
  if (titleLower.includes("degreaser")) {
    return { category: "cleaning-chemicals", subcategory: "degreaser-multi-clean" };
  }
  // Food grade
  if (titleLower.includes("food") || titleLower.includes("grade")) {
    return { category: "cleaning-chemicals", subcategory: "food-grade-cleaning-solution" };
  }
  // Default to multi-purpose
  return { category: "cleaning-chemicals", subcategory: "multi-purpose-chemicals" };
}

// Transform Shopify product to our Product type
function transformProduct(node: any): any {
  const variant = node.variants?.edges?.[0]?.node;
  const priceAmount = parseFloat(variant?.price?.amount || "0");
  const compareAtPrice = variant?.compareAtPrice?.amount ? parseFloat(variant.compareAtPrice.amount) : null;
  const quantityAvailable = variant?.quantityAvailable ?? 0;

  const tags = node.tags || [];
  const { category, subcategory } = categorizeProduct(node.title || '', node.productType || '', tags);

  const onSale = compareAtPrice !== null && compareAtPrice > priceAmount;
  const discountPercent = onSale && compareAtPrice
    ? Math.round(((compareAtPrice - priceAmount) / compareAtPrice) * 100)
    : 0;

  return {
    id: node.id,
    title: node.title || '',
    handle: node.handle || '',
    description: node.description || '',
    descriptionHtml: node.descriptionHtml || '',
    image: node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '',
    images: node.images?.edges?.map((img: any) => img.node.url) || [],
    price: priceAmount,
    originalPrice: compareAtPrice,
    onSale,
    discountPercent,
    inStock: quantityAvailable > 0,
    lowStock: quantityAvailable > 0 && quantityAvailable <= 5,
    quantityAvailable,
    isNew: tags.some((t: string) => t.toLowerCase().includes('new')),
    productType: node.productType || '',
    category,
    subcategory,
    tags,
    variantId: variant?.id || '',
    sku: variant?.sku || '',
    weight: variant?.weight ? `${variant.weight} ${variant.weightUnit || 'KILOGRAMS'}` : '',
    vendor: node.vendor || '',
    brand: node.vendor || '',
    collections: node.collections?.edges?.map((c: any) => ({
      id: c.node.id,
      title: c.node.title,
      handle: c.node.handle,
    })) || [],
  };
}

// In-memory cache for products
let productCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const RECOMMENDATION_LIMIT = 10;
const BEST_SELLER_CACHE_LIMIT = 50;

type TimedProductCache = {
  products: any[];
  timestamp: number;
};

const relatedProductsCache = new Map<string, TimedProductCache>();
let bestSellerCache: TimedProductCache | null = null;

const PRODUCT_RECOMMENDATION_FIELDS = `
  id
  title
  description
  descriptionHtml
  handle
  productType
  vendor
  tags
  collections(first: 10) {
    edges {
      node {
        id
        title
        handle
      }
    }
  }
  featuredImage { url }
  images(first: 5) {
    edges { node { url } }
  }
  variants(first: 1) {
    edges {
      node {
        id
        title
        sku
        price { amount currencyCode }
        compareAtPrice { amount }
        availableForSale
        quantityAvailable
        weight
        weightUnit
      }
    }
  }
`;

function parseRecommendationLimit(value: unknown, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function uniqueInStockProducts(products: any[], excludedIds: Set<string> = new Set()): any[] {
  const seen = new Set(excludedIds);

  return products.filter((product) => {
    if (!product?.id || !product.inStock || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function isFreshCache(cache: TimedProductCache | null | undefined): cache is TimedProductCache {
  return !!cache && Date.now() - cache.timestamp <= CACHE_DURATION;
}

/**
 * Check if cache should be refreshed
 */
function shouldRefreshCache(): boolean {
  return !productCache || (Date.now() - cacheTimestamp) > CACHE_DURATION;
}

/**
 * Get cached products or fetch fresh ones
 */
async function getCachedProducts(maxProducts: number = 2000): Promise<any[]> {
  if (!shouldRefreshCache() && productCache) {
    console.log('[Backend] Using cached products:', productCache.length);
    return productCache;
  }

  console.log('[Backend] Fetching fresh products from Shopify...');
  const products = await fetchAllProducts(maxProducts);

  // Update cache
  productCache = products;
  cacheTimestamp = Date.now();

  console.log('[Backend] Cached products:', products.length);
  return products;
}

/**
 * Fetch all products from Shopify with pagination
 */
async function fetchAllProducts(maxProducts: number = 700): Promise<any[]> {
  const query = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            description
            descriptionHtml
            handle
            productType
            vendor
            tags
            collections(first: 10) {
              edges {
                node {
                  id
                  title
                  handle
                }
              }
            }
            featuredImage { url }
            images(first: 5) {
              edges { node { url } }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  sku
                  price { amount currencyCode }
                  compareAtPrice { amount }
                  availableForSale
                  quantityAvailable
                  weight
                  weightUnit
                }
              }
            }
          }
        }
      }
    }
  `;

  const allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  try {
    while (hasNextPage && allProducts.length < maxProducts) {
      const data: { products: { edges: { node: any }[]; pageInfo: { hasNextPage: boolean; endCursor: string } } } = await shopifyFetch(
        query,
        { first: Math.min(250, maxProducts - allProducts.length), after: cursor }
      );

      const products = data.products.edges.map((edge: { node: any }) => transformProduct(edge.node));
      allProducts.push(...products);

      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;

      console.log(`[Backend] Fetched ${allProducts.length} products so far...`);
    }

    console.log(`[Backend] Total products fetched: ${allProducts.length}`);
    return allProducts;
  } catch (error) {
    console.error("[Backend] Error fetching products:", error);
    throw error;
  }
}

/**
 * GET /api/products
 * Get all products with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, limit = '2000' } = req.query;
    const maxProducts = parseInt(limit as string) || 2000;

    // Check if Shopify is configured
    if (!isShopifyConfigured()) {
      console.log('[Backend] Shopify not configured, returning empty products');
      return res.json({
        success: true,
        products: [],
        total: 0,
        cached: false,
        message: 'Shopify not configured'
      });
    }

    let products = await getCachedProducts(maxProducts);

    // Apply filters
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    if (subcategory) {
      products = products.filter(p => p.subcategory === subcategory);
    }

    if (search) {
      const query = (search as string).toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some((t: string) => t.toLowerCase().includes(query))
      );
    }

    console.log(`[Backend] Returning ${products.length} products`);
    res.json({
      success: true,
      products,
      total: products.length,
      cached: !shouldRefreshCache()
    });
  } catch (error: any) {
    console.error('[Backend] Error getting products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/best-sellers
 * Get products ordered by Shopify's sales-based BEST_SELLING ranking.
 */
router.get('/best-sellers', async (req: Request, res: Response) => {
  const limit = parseRecommendationLimit(req.query.limit, 12, BEST_SELLER_CACHE_LIMIT);

  if (!isShopifyConfigured()) {
    return res.json({ success: true, products: [] });
  }

  try {
    if (!isFreshCache(bestSellerCache)) {
      const query = `
        query GetBestSellingProducts($first: Int!) {
          products(first: $first, sortKey: BEST_SELLING) {
            edges {
              node {
                ${PRODUCT_RECOMMENDATION_FIELDS}
              }
            }
          }
        }
      `;

      const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(query, {
        first: BEST_SELLER_CACHE_LIMIT,
      });

      bestSellerCache = {
        products: uniqueInStockProducts(
          data.products.edges.map((edge) => transformProduct(edge.node)),
        ),
        timestamp: Date.now(),
      };
    }

    res.json({
      success: true,
      products: bestSellerCache.products.slice(0, limit),
    });
  } catch (error: any) {
    console.error('[Backend] Error getting best sellers:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch best sellers',
    });
  }
});

/**
 * GET /api/products/recommendations/:productId
 * Get Shopify RELATED recommendations, supplemented by catalog categories.
 */
router.get('/recommendations/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const limit = parseRecommendationLimit(req.query.limit, 4, RECOMMENDATION_LIMIT);

  if (!isShopifyConfigured()) {
    return res.json({ success: true, products: [] });
  }

  try {
    let recommendations: any[];
    const cachedRecommendations = relatedProductsCache.get(productId);

    if (isFreshCache(cachedRecommendations)) {
      recommendations = cachedRecommendations.products;
    } else {
      const query = `
        query GetRelatedProducts($productId: ID!) {
          productRecommendations(productId: $productId, intent: RELATED) {
            ${PRODUCT_RECOMMENDATION_FIELDS}
          }
        }
      `;

      const data = await shopifyFetch<{ productRecommendations: any[] | null }>(query, {
        productId,
      });

      recommendations = uniqueInStockProducts(
        (data.productRecommendations || []).map((node) => transformProduct(node)),
        new Set([productId]),
      );
      relatedProductsCache.set(productId, {
        products: recommendations,
        timestamp: Date.now(),
      });
    }

    if (recommendations.length < limit) {
      const catalog = await getCachedProducts();
      const currentProduct = catalog.find((product) => product.id === productId);

      if (currentProduct) {
        const excludedIds = new Set([productId, ...recommendations.map((product) => product.id)]);
        const sameSubcategory = catalog.filter(
          (product) => product.subcategory === currentProduct.subcategory,
        );
        const sameCategory = catalog.filter(
          (product) => product.category === currentProduct.category,
        );

        recommendations = [
          ...recommendations,
          ...uniqueInStockProducts(
            [...sameSubcategory, ...sameCategory],
            excludedIds,
          ),
        ];
      }
    }

    res.json({
      success: true,
      products: recommendations.slice(0, limit),
    });
  } catch (error: any) {
    console.error('[Backend] Error getting related products:', error);

    try {
      const catalog = await getCachedProducts();
      const currentProduct = catalog.find((product) => product.id === productId);
      const candidates = currentProduct
        ? catalog.filter(
            (product) =>
              product.subcategory === currentProduct.subcategory ||
              product.category === currentProduct.category,
          )
        : [];
      const fallbackProducts = uniqueInStockProducts(candidates, new Set([productId]));

      return res.json({
        success: true,
        products: fallbackProducts.slice(0, limit),
        fallback: true,
      });
    } catch (fallbackError) {
      console.error('[Backend] Related products fallback failed:', fallbackError);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch related products',
      });
    }
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          descriptionHtml
          handle
          productType
          vendor
          tags
          featuredImage { url }
          images(first: 10) {
            edges { node { url } }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                sku
                price { amount currencyCode }
                compareAtPrice { amount }
                availableForSale
                quantityAvailable
                weight
                weightUnit
              }
            }
          }
        }
      }
    `;

    const data = await shopifyFetch<{ product: any }>(query, { id });
    const product = data.product ? transformProduct(data.product) : null;

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('[Backend] Error getting product:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product'
    });
  }
});

/**
 * GET /api/products/collection/:handle
 * Get products by collection handle
 */
router.get('/collection/:handle', async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;
    const { first = '250' } = req.query;

    const query = `
      query GetCollectionProducts($handle: String!, $first: Int!) {
        collectionByHandle(handle: $handle) {
          id
          title
          products(first: $first) {
            edges {
              node {
                id
                title
                description
                descriptionHtml
                handle
                productType
                vendor
                tags
                featuredImage { url }
                images(first: 5) {
                  edges { node { url } }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price { amount currencyCode }
                      compareAtPrice { amount }
                      availableForSale
                      quantityAvailable
                      weight
                      weightUnit
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data: { collectionByHandle: { id: string; title: string; products: { edges: { node: any }[] } } | null } = await shopifyFetch(
      query,
      { handle, first: parseInt(first as string) }
    );

    if (!data.collectionByHandle) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    const products = data.collectionByHandle.products.edges.map((edge: { node: any }) => transformProduct(edge.node));

    res.json({
      success: true,
      products,
      collection: {
        id: data.collectionByHandle.id,
        title: data.collectionByHandle.title,
        handle
      }
    });
  } catch (error: any) {
    console.error('[Backend] Error getting collection products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch collection products'
    });
  }
});

export default router;
