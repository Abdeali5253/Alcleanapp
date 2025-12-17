// src/lib/shopify.ts
import { Product } from "../types/shopify";

// Get configuration from environment variables
const SHOPIFY_DOMAIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN) || '';
const SHOPIFY_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN) || '';
const SHOPIFY_API_VERSION = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHOPIFY_API_VERSION) || "2025-07";

const SHOPIFY_URL = SHOPIFY_DOMAIN ? `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json` : '';

// Collection handles from your Shopify store (extracted from your screenshots)
export const COLLECTION_HANDLES = {
  // Main Categories
  "cleaning-chemicals": "cleaning-chemicals",
  "cleaning-equipment": "cleaning-equipment",
  "dishwashing": "dish-wash",
  "car-washing": "car-wash-shampoo",
  "fabric-cleaning": "fabric-washing",
  "bathroom-cleaning": "bathroom-cleaner",
  
  // Subcategories - Chemicals
  "floor-cleaner": "floor-cleaner",
  "glass-cleaner": "glass-cleaner",
  "surface-cleaner": "surface-cleaner",
  "toilet-bowl-cleaner": "toilet-bowl-cleaner",
  "multi-purpose-chemicals": "multi-purpose-chemicals",
  "industrial-cleaning-chemicals": "industrial-cleaning-chemicals",
  "fabric-detergent": "fabric-detergent",
  "fabric-softener": "fabric-softener-enhancer",
  "kitchen-degreaser": "kitchen-degreaser",
  "car-cleaning-solution": "car-cleaning-solution",
  "bathroom-cleaning-solution": "bathroom-cleaning-solution",
  "kitchen-cleaning-solution": "kitchen-cleaning-solution",
  
  // Subcategories - Equipment
  "cleaning-tools": "cleaning-tools",
  "mop-bucket-trolley": "mop-buckets-wringers-cleaning-janitorial-trolleys",
  "floor-cleaning-equipment": "floor-cleaning-vipers-brushes-wet-mops-dry-mops",
  "industrial-wet-mop": "industrial-wet-mop",
  "industrial-floor-brush": "industrial-floor-brush",
  "bathroom-cleaning-equipment": "bathroom-cleaning-equipment",
  "solar-panel-equipment": "solar-panel-glass-window-cleaning-equipments",
  
  // Special
  "top-cleaning-equipment": "top-cleaning-equipments",
  "top-cleaning-chemicals": "top-cleaning-chemicals",
  "supreme-offer": "supreme-offer",
};

// Tag-based category mapping from Shopify
const TAG_TO_CATEGORY: Record<string, string> = {
  // Chemicals
  "cleaning-chemicals": "cleaning-chemicals",
  "floor-cleaner": "cleaning-chemicals",
  "glass-cleaner": "cleaning-chemicals",
  "surface-cleaner": "cleaning-chemicals",
  "toilet-bowl-cleaner": "cleaning-chemicals",
  "bathroom-cleaner": "cleaning-chemicals",
  "multi-purpose-chemicals": "cleaning-chemicals",
  "industrial-cleaning-chemicals": "cleaning-chemicals",
  "car-wash-shampoo": "car-washing",
  "car-cleaning-solution": "car-washing",
  "fabric-detergent": "fabric-cleaning",
  "fabric-softener": "fabric-cleaning",
  "fabric-washing": "fabric-cleaning",
  "fabric-cleaner": "fabric-cleaning",
  "fabric-cleaning-chemical": "fabric-cleaning",
  "dish-wash": "dishwashing",
  "kitchen-degreaser": "dishwashing",
  "bathroom-cleaning-chemical": "bathroom-cleaning",
  "bathroom-cleaning-solution": "bathroom-cleaning",
  "kitchen-cleaning-solution": "dishwashing",
  
  // Equipment - these tags mean EQUIPMENT
  "cleaning-equipment": "cleaning-equipment",
  "cleaning-tools": "cleaning-equipment",
  "mop-buckets": "cleaning-equipment",
  "floor-cleaning": "cleaning-equipment",
  "industrial-wet-mop": "cleaning-equipment",
  "industrial-floor-brush": "cleaning-equipment",
  "bathroom-cleaning-equipment": "cleaning-equipment",
  "solar-panel": "cleaning-equipment",
  "window-cleaning": "cleaning-equipment",
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

// Categorize product based on Shopify TAGS (not keywords)
function categorizeProduct(title: string, productType: string, tags: string[]): { category: string; subcategory: string } {
  const tagsLower = tags.map(t => t.toLowerCase().trim().replace(/\s+/g, '-'));
  const productTypeLower = productType.toLowerCase().trim().replace(/\s+/g, '-');
  
  // First, check tags for category
  for (const tag of tagsLower) {
    // Check if tag directly maps to a category
    if (TAG_TO_CATEGORY[tag]) {
      const category = TAG_TO_CATEGORY[tag];
      return { category, subcategory: tag };
    }
  }
  
  // Check product type
  if (productTypeLower) {
    if (productTypeLower.includes('equipment') || productTypeLower.includes('tool')) {
      return { category: "cleaning-equipment", subcategory: productTypeLower };
    }
    if (productTypeLower.includes('chemical') || productTypeLower.includes('cleaner') || productTypeLower.includes('detergent')) {
      return { category: "cleaning-chemicals", subcategory: productTypeLower };
    }
  }
  
  // Fallback: check title for equipment keywords
  const titleLower = title.toLowerCase();
  const equipmentKeywords = [
    "mop", "bucket", "broom", "brush", "squeegee", "glove", "cloth",
    "wiper", "sponge", "scrubber", "duster", "picker", "trolley",
    "handle", "stick", "pole", "holder", "dispenser", "bin", "dustbin",
    "microfiber", "towel", "dustpan", "scoop", "mat", "cart", "caddy"
  ];
  
  const isEquipment = equipmentKeywords.some(kw => titleLower.includes(kw));
  
  if (isEquipment) {
    return { category: "cleaning-equipment", subcategory: "cleaning-tools" };
  }
  
  // Default to chemicals
  return { category: "cleaning-chemicals", subcategory: "multi-purpose-chemicals" };
}

// Transform Shopify product node to our Product type
function transformProduct(node: any): Product {
  const variant = node.variants?.edges?.[0]?.node;
  const priceAmount = parseFloat(variant?.price?.amount || "0");
  const compareAtPrice = variant?.compareAtPrice?.amount ? parseFloat(variant.compareAtPrice.amount) : null;
  const quantityAvailable = variant?.quantityAvailable ?? 0;
  
  const tags = node.tags || [];
  const { category, subcategory } = categorizeProduct(
    node.title || '',
    node.productType || '',
    tags
  );

  const onSale = compareAtPrice !== null && compareAtPrice > priceAmount;
  const discountPercent = onSale && compareAtPrice 
    ? Math.round(((compareAtPrice - priceAmount) / compareAtPrice) * 100)
    : 0;

  return {
    id: node.id,
    title: node.title || '',
    description: node.description || '',
    image: node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '',
    images: node.images?.edges?.map((img: any) => img.node.url) || [],
    price: priceAmount,
    originalPrice: compareAtPrice,
    onSale,
    discountPercent,
    inStock: variant?.availableForSale ?? false,
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
  };
}

// Get all products from Shopify
export async function getAllProducts(first: number = 250): Promise<Product[]> {
  const query = `
    query GetAllProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            handle
            productType
            vendor
            tags
            featuredImage {
              url
            }
            images(first: 5) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  sku
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                  }
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

  const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(query, { first });
  return data.products.edges.map(edge => transformProduct(edge.node));
}

// Get products by collection handle
export async function getProductsByCollection(collectionHandle: string, first: number = 50): Promise<Product[]> {
  const query = `
    query GetCollectionProducts($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        id
        title
        products(first: $first) {
          edges {
            node {
              id
              title
              description
              handle
              productType
              vendor
              tags
              featuredImage {
                url
              }
              images(first: 5) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                    sku
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                    }
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

  try {
    const data = await shopifyFetch<{ collection: { products: { edges: { node: any }[] } } | null }>(
      query, 
      { handle: collectionHandle, first }
    );
    
    if (!data.collection) {
      console.warn(`[Shopify] Collection "${collectionHandle}" not found`);
      return [];
    }
    
    return data.collection.products.edges.map(edge => transformProduct(edge.node));
  } catch (error) {
    console.error(`[Shopify] Error fetching collection "${collectionHandle}":`, error);
    return [];
  }
}

// Get products by tag
export async function getProductsByTag(tag: string, first: number = 50): Promise<Product[]> {
  const query = `
    query GetProductsByTag($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            description
            handle
            productType
            vendor
            tags
            featuredImage {
              url
            }
            images(first: 5) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  sku
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                  }
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

  try {
    const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(
      query, 
      { query: `tag:${tag}`, first }
    );
    
    return data.products.edges.map(edge => transformProduct(edge.node));
  } catch (error) {
    console.error(`[Shopify] Error fetching products by tag "${tag}":`, error);
    return [];
  }
}

// Get single product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        handle
        productType
        vendor
        tags
        featuredImage {
          url
        }
        images(first: 10) {
          edges {
            node {
              url
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              sku
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
              }
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

  try {
    const data = await shopifyFetch<{ product: any | null }>(query, { id: productId });
    return data.product ? transformProduct(data.product) : null;
  } catch (error) {
    console.error(`[Shopify] Error fetching product "${productId}":`, error);
    return null;
  }
}

// Export configuration check
export { isShopifyConfigured };
