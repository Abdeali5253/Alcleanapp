// src/lib/shopify.ts
import { Product } from "../types/shopify";

// Get configuration from environment variables
const SHOPIFY_DOMAIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN) || '';
const SHOPIFY_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN) || '';
const SHOPIFY_API_VERSION = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_API_VERSION) || "2025-07";

const SHOPIFY_URL = SHOPIFY_DOMAIN ? `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json` : '';

// Collection mapping based on user's Shopify store
export const COLLECTION_MAPPING = {
  "car-cleaning": "car-cleaning-solution",
  "bathroom-cleaning": "bathroom-cleaning-solution",
  "multi-purpose-cleaner": "multi-purpose-cleaning",
  "top-cleaning-equipment": "top-cleaning-equipment",
  "top-cleaning-chemical": "top-cleaning-chemical",
  "cleaning-equipment": "cleaning-equipment",
  "fabric-washing": "fabric-washing",
  "kitchen-cleaning": "kitchen-cleaning-solution",
  "dishwashing": "kitchen-cleaning-solution",
  "all-products": "all-products",
  "supreme-offer": "supreme-offer",
};

interface ShopifyResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

// Check if Shopify is configured
function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);
}

async function shopifyFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify is not configured. Please add VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN to your .env file.");
  }

  const res = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as ShopifyResponse<T>;

  if (json.errors?.length) {
    console.error("[Shopify] GraphQL errors:", json.errors);
    throw new Error(json.errors.map(e => e.message).join(", "));
  }

  return json.data!;
}

// CRITICAL: Categorize product based on title keywords
// Equipment takes ABSOLUTE PRIORITY
function categorizeProduct(title: string, productType: string, tags: string[]): { category: string; subcategory: string } {
  const titleLower = title.toLowerCase();
  const productTypeLower = productType.toLowerCase();
  const tagsLower = tags.map(t => t.toLowerCase());

  console.log(`[Categorize] "${title}":`, { productType, tags });

  // ========== EQUIPMENT DETECTION (HIGHEST PRIORITY) ==========
  // These keywords ALWAYS mean equipment, no matter what
  const equipmentKeywords = [
    "mop", "bucket", "broom", "brush", "squeegee", "glove", "cloth",
    "wiper", "sponge", "scrubber", "pad", "duster", "picker", "tong",
    "trolley", "refill", "handle", "stick", "pole", "holder", "dispenser",
    "bin", "dustbin", "garbage", "waste", "trash", "microfiber", "towel", "rag",
    "dustpan", "scoop", "shovel", "lint remover", "magic lint",
    "silicone", "hand dryer", "dryer", "flat mop", "window cleaning",
    "steel wool", "scotch brite", "cleaning machine", "tissue", "roll",
    "door mat", "mat", "spill kit", "squeegee", "rubber",
    "plastic basket", "basket", "janitor", "cart", "caddy",
    "scraper", "spray bottle", "bottle", "container"
  ];

  const hasEquipmentKeyword = equipmentKeywords.some(kw => titleLower.includes(kw));
  
  // Also check tags for equipment indicators
  const hasEquipmentTag = tagsLower.some(t => 
    t.includes("equipment") || t.includes("tool") || t.includes("dustbin") || 
    t.includes("bin") || t.includes("mop") || t.includes("bucket")
  );
  
  if (hasEquipmentKeyword || hasEquipmentTag || productTypeLower.includes("equipment") || productTypeLower.includes("tool")) {
    console.log(`  → EQUIPMENT (keyword match)`);
    
    // Specific equipment subcategories
    if (titleLower.includes("mop") || titleLower.includes("bucket") || titleLower.includes("trolley"))
      return { category: "cleaning-equipment", subcategory: "mop-bucket-trolley" };
    
    if (titleLower.includes("broom") || titleLower.includes("brush") || titleLower.includes("scrubber"))
      return { category: "cleaning-equipment", subcategory: "brooms-brushes" };
    
    if (titleLower.includes("glove") || titleLower.includes("protective"))
      return { category: "cleaning-equipment", subcategory: "gloves-protective-gear" };
    
    if (titleLower.includes("cloth") || titleLower.includes("microfiber") || titleLower.includes("wipe") ||
        titleLower.includes("sponge") || titleLower.includes("towel") || titleLower.includes("pad") ||
        titleLower.includes("scotch"))
      return { category: "cleaning-equipment", subcategory: "cleaning-cloths" };
    
    if (titleLower.includes("garbage") || titleLower.includes("waste") || titleLower.includes("bin") ||
        titleLower.includes("trash") || titleLower.includes("picker") || titleLower.includes("dustbin")) {
      // Check if it's stainless steel or plastic
      if (titleLower.includes("stainless") || titleLower.includes("steel"))
        return { category: "cleaning-equipment", subcategory: "stainless-dustbin" };
      if (titleLower.includes("plastic"))
        return { category: "cleaning-equipment", subcategory: "plastic-dustbin" };
      return { category: "cleaning-equipment", subcategory: "waste-management" };
    }
    
    if (titleLower.includes("squeegee") || titleLower.includes("wiper"))
      return { category: "cleaning-equipment", subcategory: "squeegees-wipers" };
    
    return { category: "cleaning-equipment", subcategory: "general-equipment" };
  }

  // ========== CHEMICALS DETECTION (ONLY IF NOT EQUIPMENT) ==========
  
  // Car Washing
  if (titleLower.includes("car wash") || titleLower.includes("car shampoo") ||
      titleLower.includes("vehicle wash") || titleLower.includes("auto wash") ||
      tagsLower.some(t => t.includes("car") || t.includes("vehicle"))) {
    console.log(`  → CAR WASHING`);
    return { category: "car-washing", subcategory: "car-wash" };
  }

  // Bathroom Cleaning
  if (titleLower.includes("bathroom") || titleLower.includes("toilet") ||
      titleLower.includes("washroom") || titleLower.includes("bowl cleaner") ||
      tagsLower.some(t => t.includes("bathroom") || t.includes("toilet"))) {
    console.log(`  → BATHROOM CLEANING`);
    return { category: "bathroom-cleaning", subcategory: "bathroom" };
  }

  // Fabric Cleaning
  if (titleLower.includes("fabric") || titleLower.includes("starch") ||
      titleLower.includes("softener") || titleLower.includes("laundry") ||
      tagsLower.some(t => t.includes("fabric") || t.includes("laundry"))) {
    console.log(`  → FABRIC CLEANING`);
    return { category: "fabric-cleaning", subcategory: "fabric" };
  }

  // Dishwashing / Kitchen Cleaning
  if (titleLower.includes("dish wash") || titleLower.includes("dishwash") ||
      titleLower.includes("dish soap") || titleLower.includes("dish liquid") ||
      titleLower.includes("kitchen") ||
      tagsLower.some(t => t.includes("dish") || t.includes("kitchen"))) {
    console.log(`  → DISHWASHING`);
    return { category: "dishwashing", subcategory: "dishwash" };
  }

  // Multi-Purpose / Floor Cleaners
  if (titleLower.includes("multi") || titleLower.includes("all purpose") ||
      titleLower.includes("floor cleaner") || titleLower.includes("degreaser") ||
      titleLower.includes("surface cleaner")) {
    console.log(`  → MULTI-PURPOSE`);
    return { category: "cleaning-chemicals", subcategory: "multi-purpose-cleaner" };
  }

  // Hand Washing
  if (titleLower.includes("hand wash") || titleLower.includes("hand soap") ||
      titleLower.includes("hand sanitizer")) {
    console.log(`  → HAND WASH`);
    return { category: "cleaning-chemicals", subcategory: "hand-washing" };
  }

  // Check for liquid/chemical indicators
  if (titleLower.includes("liquid") || titleLower.includes("solution") ||
      titleLower.includes("cleaner") || titleLower.includes("detergent") ||
      titleLower.includes("soap") || titleLower.includes("gel") ||
      titleLower.includes("chemical")) {
    console.log(`  → GENERAL CHEMICALS`);
    return { category: "cleaning-chemicals", subcategory: "general-chemicals" };
  }

  // Default: if contains numbers/sizes, likely equipment
  if (/\d{4,}/.test(title) || titleLower.includes("pack") || titleLower.includes("set")) {
    console.log(`  → EQUIPMENT (default: pack/set/number)`);
    return { category: "cleaning-equipment", subcategory: "general-equipment" };
  }

  // Final fallback
  console.log(`  → CHEMICALS (default fallback)`);
  return { category: "cleaning-chemicals", subcategory: "general-chemicals" };
}

// ---------- Normalizer ----------
function normalizeProduct(item: any): Product {
  const v = item.variants?.edges?.[0]?.node;

  // Debug: Log the raw variant data
  if (!v || !v.id) {
    console.warn('[Shopify] Product missing variant data:', {
      productId: item.id,
      productTitle: item.title,
      variantData: v,
      rawVariants: item.variants
    });
  }

  const price = Number(v?.price?.amount ?? 0);
  const originalPrice = Number(v?.compareAtPrice?.amount ?? price);
  const onSale = originalPrice > price;
  const discountPercent = onSale ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Categorize based on product data
  const categoryData = categorizeProduct(
    item.title || "",
    item.productType || "",
    item.tags || []
  );

  const quantityAvailable = v?.quantityAvailable ?? 999;
  const lowStock = quantityAvailable > 0 && quantityAvailable <= 10;

  // Get variant ID - this is crucial for cart/checkout
  const variantId = v?.id || '';
  
  if (!variantId) {
    console.error(`[Shopify] ⚠️ Product "${item.title}" has NO variant ID! This product cannot be added to checkout.`);
    console.error('[Shopify] Raw product data:', JSON.stringify(item, null, 2));
  } else {
    console.log(`[Shopify] ✓ Product "${item.title}" has variant ID: ${variantId}`);
  }

  return {
    id: item.id,
    title: item.title,
    handle: item.handle,
    description: item.description || null,
    price,
    originalPrice,
    onSale,
    discountPercent,
    image: item.featuredImage?.url || (item.images?.edges?.[0]?.node?.url ?? null),
    images: item.images?.edges?.map((e: any) => e.node.url) || [],
    inStock: v?.availableForSale ?? false,
    quantityAvailable,
    lowStock,
    productType: item.productType || "",
    tags: item.tags || [],

    category: categoryData.category,
    subcategory: categoryData.subcategory,

    sku: v?.sku ?? null,
    brand: item.vendor || null,
    weight: v?.weight ? `${v.weight} ${v.weightUnit || 'kg'}` : null,
    isNew: item.tags?.some((t: string) => t.toLowerCase().includes("new")) ?? false,
    
    // Store variant ID for cart/checkout
    variantId: variantId,
  };
}

// ---------- GraphQL Queries ----------

// Query to get ALL products
const ALL_PRODUCTS_QUERY = `
  query GetAllProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          tags
          vendor
          
          featuredImage { url }
          
          images(first: 10) {
            edges { node { url } }
          }
          
          variants(first: 10) {
            edges {
              node {
                id
                price { amount }
                compareAtPrice { amount }
                quantityAvailable
                availableForSale
                sku
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

// Query to get products from a specific collection
const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      handle
      title
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
            description
            productType
            tags
            vendor
            
            featuredImage { url }
            
            images(first: 10) {
              edges { node { url } }
            }
            
            variants(first: 10) {
              edges {
                node {
                  id
                  price { amount }
                  compareAtPrice { amount }
                  quantityAvailable
                  availableForSale
                  sku
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

// Get all products
export async function getAllProducts(limit = 250): Promise<Product[]> {
  try {
    if (!isShopifyConfigured()) {
      console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  SHOPIFY NOT CONFIGURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing required environment variables:
  - VITE_SHOPIFY_STORE_DOMAIN
  - VITE_SHOPIFY_STOREFRONT_TOKEN

Quick Fix:
  1. Copy .env.example to .env
  2. Add your Shopify Storefront API token
  3. Restart the dev server

📖 See QUICK_FIX_SHOPIFY_ERROR.md for detailed instructions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
      return [];
    }

    const data = await shopifyFetch<{ products: any }>(ALL_PRODUCTS_QUERY, { first: limit });

    const items = data?.products?.edges?.map((e: any) => e.node) || [];
    const products = items.map((item: any) => normalizeProduct(item));

    console.log(`[Shopify] Loaded ${products.length} total products`);
    console.log('[Shopify] Sample products:', products.slice(0, 5).map(p => ({
      title: p.title,
      category: p.category,
      subcategory: p.subcategory
    })));
    console.log('[Shopify] Product distribution:', {
      chemicals: products.filter(p => p.category === 'cleaning-chemicals').length,
      equipment: products.filter(p => p.category === 'cleaning-equipment').length,
      carWashing: products.filter(p => p.category === 'car-washing').length,
      bathroom: products.filter(p => p.category === 'bathroom-cleaning').length,
      fabric: products.filter(p => p.category === 'fabric-cleaning').length,
      dishwashing: products.filter(p => p.category === 'dishwashing').length,
    });

    return products;
  } catch (error) {
    console.error("[Shopify] Error fetching all products:", error);
    return [];
  }
}

// Get products from a specific collection
export async function getProductsByCollection(collectionHandle: string, limit = 100): Promise<Product[]> {
  try {
    if (!isShopifyConfigured()) {
      console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  SHOPIFY NOT CONFIGURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cannot fetch collection "${collectionHandle}"

Missing required environment variables:
  - VITE_SHOPIFY_STORE_DOMAIN
  - VITE_SHOPIFY_STOREFRONT_TOKEN

Quick Fix:
  1. Copy .env.example to .env
  2. Add your Shopify Storefront API token
  3. Restart the dev server

📖 See QUICK_FIX_SHOPIFY_ERROR.md for detailed instructions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
      return [];
    }

    const mappedHandle = COLLECTION_MAPPING[collectionHandle as keyof typeof COLLECTION_MAPPING] || collectionHandle;
    
    console.log(`[Shopify] Fetching collection \"${mappedHandle}\"...`);
    const data = await shopifyFetch<{ collection: any }>(COLLECTION_PRODUCTS_QUERY, {
      handle: mappedHandle,
      first: limit,
    });

    if (!data?.collection) {
      console.warn(`[Shopify] Collection "${mappedHandle}" not found`);
      return [];
    }

    const items = data.collection.products.edges.map((e: any) => e.node);
    const products = items.map((item: any) => normalizeProduct(item));

    console.log(`[Shopify] Collection "${mappedHandle}": ${products.length} products`);
    return products;
  } catch (error) {
    console.error(`[Shopify] Error fetching collection "${collectionHandle}":`, error);
    return [];
  }
}

// Get single product by handle
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const PRODUCT_QUERY = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        productType
        tags
        vendor
        featuredImage { url }
        images(first: 10) {
          edges { node { url } }
        }
        variants(first: 10) {
          edges {
            node {
              id
              price { amount }
              compareAtPrice { amount }
              quantityAvailable
              availableForSale
              sku
              weight
              weightUnit
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch<{ product: any }>(PRODUCT_QUERY, { handle });
    
    if (!data?.product) return null;
    
    return normalizeProduct(data.product);
  } catch (error) {
    console.error(`[Shopify] Error fetching product "${handle}":`, error);
    return null;
  }
}

// Create Shopify checkout with line items
export interface CheckoutLineItem {
  variantId: string;
  quantity: number;
}

export interface CheckoutInput {
  lineItems: CheckoutLineItem[];
  email?: string;
  note?: string;
}

export async function createCheckout(input: CheckoutInput): Promise<{ checkoutUrl: string; checkoutId: string } | null> {
  const CREATE_CART_MUTATION = `
    mutation CreateCart($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    // Convert line items to cart lines format
    const lines = input.lineItems.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity,
    }));

    const data = await shopifyFetch<{ cartCreate: any }>(CREATE_CART_MUTATION, {
      lines,
    });

    if (data?.cartCreate?.userErrors?.length > 0) {
      console.error('[Shopify] Cart errors:', data.cartCreate.userErrors);
      return null;
    }

    if (!data?.cartCreate?.cart) {
      console.error('[Shopify] No cart created');
      return null;
    }

    return {
      checkoutUrl: data.cartCreate.cart.checkoutUrl,
      checkoutId: data.cartCreate.cart.id,
    };
  } catch (error) {
    console.error('[Shopify] Error creating cart:', error);
    return null;
  }
}