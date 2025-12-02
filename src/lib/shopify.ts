// import type { 
//   ShopifyProduct, 
//   ShopifyProductsResponse, 
//   ShopifyCollectionsResponse,
//   Product 
// } from "../types/shopify";


// // Shopify API Configuration
// const SHOPIFY_STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "";
// const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "";
// const SHOPIFY_API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION || "2025-07";

// const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

// // Shopify Fetch Function
// export async function shopifyFetch<T = any>({ 
//   query, 
//   variables = {} 
// }: { 
//   query: string; 
//   variables?: Record<string, any>;
// }): Promise<T> {
//   if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
//     console.warn("Shopify credentials not configured, using mock data");
//     throw new Error("Shopify not configured");
//   }

//   const res = await fetch(endpoint, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
//     },
//     body: JSON.stringify({ query, variables }),
//   });

//   const json = await res.json();

//   if (!res.ok || json.errors) {
//     const msg = json.errors?.map((e: any) => e.message).join("; ") || res.statusText;
//     throw new Error(`Shopify error: ${msg}`);
//   }

//   return json.data;
// }

// // GraphQL Queries
// export const GET_ALL_PRODUCTS = `
//   query GetAllProducts($first: Int!, $after: String) {
//     products(first: $first, after: $after) {
//       edges {
//         node {
//           id
//           handle
//           title
//           description
//           descriptionHtml
//           productType
//           vendor
//           tags
//           availableForSale
//           createdAt
//           updatedAt
//           publishedAt
//           featuredImage {
//             id
//             url
//             altText
//             width
//             height
//           }
//           images(first: 10) {
//             edges {
//               node {
//                 id
//                 url
//                 altText
//                 width
//                 height
//               }
//             }
//           }
//           variants(first: 1) {
//             edges {
//               node {
//                 id
//                 title
//                 availableForSale
//                 price {
//                   amount
//                   currencyCode
//                 }
//                 compareAtPrice {
//                   amount
//                   currencyCode
//                 }
//                 weight
//                 weightUnit
//                 sku
//                 quantityAvailable
//               }
//             }
//           }
//           priceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//             maxVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//           compareAtPriceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//             maxVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//           collections(first: 5) {
//             edges {
//               node {
//                 id
//                 handle
//                 title
//               }
//             }
//           }
//           metafields(
//             identifiers: [
//               { namespace: "custom", key: "subcategory" }
//               { namespace: "custom", key: "is_new" }
//               { namespace: "custom", key: "low_stock" }
//             ]
//           ) {
//             id
//             namespace
//             key
//             value
//             type
//           }
//         }
//       }
//       pageInfo {
//         hasNextPage
//         hasPreviousPage
//       }
//     }
//   }
// `;

// export const GET_PRODUCT_BY_HANDLE = `
//   query GetProductByHandle($handle: String!) {
//     product(handle: $handle) {
//       id
//       handle
//       title
//       description
//       descriptionHtml
//       productType
//       vendor
//       tags
//       availableForSale
//       createdAt
//       featuredImage {
//         id
//         url
//         altText
//         width
//         height
//       }
//       images(first: 10) {
//         edges {
//           node {
//             id
//             url
//             altText
//             width
//             height
//           }
//         }
//       }
//       variants(first: 10) {
//         edges {
//           node {
//             id
//             title
//             availableForSale
//             price {
//               amount
//               currencyCode
//             }
//             compareAtPrice {
//               amount
//               currencyCode
//             }
//             weight
//             weightUnit
//             sku
//             quantityAvailable
//             selectedOptions {
//               name
//               value
//             }
//           }
//         }
//       }
//       priceRange {
//         minVariantPrice {
//           amount
//           currencyCode
//         }
//         maxVariantPrice {
//           amount
//           currencyCode
//         }
//       }
//       collections(first: 5) {
//         edges {
//           node {
//             id
//             handle
//             title
//           }
//         }
//       }
//       metafields(
//         identifiers: [
//           { namespace: "custom", key: "subcategory" }
//           { namespace: "custom", key: "is_new" }
//           { namespace: "custom", key: "low_stock" }
//         ]
//       ) {
//         id
//         namespace
//         key
//         value
//         type
//       }
//     }
//   }
// `;

// export const GET_COLLECTIONS = `
//   query GetCollections($first: Int!) {
//     collections(first: $first) {
//       edges {
//         node {
//           id
//           handle
//           title
//           description
//           image {
//             id
//             url
//             altText
//             width
//             height
//           }
//         }
//       }
//     }
//   }
// `;

// // Utility Functions
// // export function normalizeShopifyProduct(shopifyProduct: ShopifyProduct): Product {
// //   const variant = shopifyProduct.variants[0];
// //   const price = parseFloat(variant.price);
// //   const compareAtPrice = variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null;
  
// //   // Extract metafield values
// //   const getMetafield = (key: string) => {
// //     return shopifyProduct.metafields?.find(m => m.key === key)?.value;
// //   };
  
// //   const subcategory = getMetafield("subcategory") || shopifyProduct.productType || "other";
// //   const isNew = getMetafield("is_new") === "true";
// //   const lowStock = getMetafield("low_stock") === "true";
  
// //   // Determine category from collections or product type
// //   const category = shopifyProduct.collections?.[0]?.handle || 
// //                    (shopifyProduct.productType?.toLowerCase().includes("chemical") ? "cleaning-chemicals" : "cleaning-equipment");
  
// //   return {
// //     id: shopifyProduct.id,
// //     handle: shopifyProduct.handle,
// //     name: shopifyProduct.title,
// //     description: shopifyProduct.description,
// //     price: price,
// //     originalPrice: compareAtPrice || undefined,
// //     category: category,
// //     subcategory: subcategory,
// //     image: shopifyProduct.featuredImage?.url || shopifyProduct.images[0]?.url || "",
// //     images: shopifyProduct.images.map(img => img.url),
// //     inStock: variant.availableForSale && variant.quantityAvailable > 0,
// //     weight: `${variant.weight}${variant.weightUnit.toLowerCase()}`,
// //     weightValue: variant.weight,
// //     weightUnit: variant.weightUnit,
// //     isNew: isNew,
// //     onSale: compareAtPrice ? compareAtPrice > price : false,
// //     lowStock: lowStock || variant.quantityAvailable < 5,
// //     brand: shopifyProduct.vendor,
// //     tags: shopifyProduct.tags,
// //     variantId: variant.id,
// //     quantityAvailable: variant.quantityAvailable,
// //     sku: variant.sku,
// //   };
// // }
// export function normalizeShopifyProduct(shopifyProduct: ShopifyProduct): Product {
//   let variant: any | undefined;
//   if (Array.isArray(shopifyProduct.variants) && shopifyProduct.variants.length > 0) {
//     variant = shopifyProduct.variants[0];
//   } else if ((shopifyProduct as any).variants?.edges?.length > 0) {
//     variant = (shopifyProduct as any).variants.edges[0].node;
//   }
//   // Helper to get numeric price from variant.price or variant.price.amount.
//   const getPriceValue = (value: any): number => {
//     if (!value) return 0;
//     if (typeof value === "string") return parseFloat(value);
//     if (typeof value === "object" && "amount" in value) return parseFloat(value.amount);
//     return 0;
//   };
//   const price = variant ? getPriceValue(variant.price) : 0;
//   const compareAtPrice = variant && variant.compareAtPrice ? getPriceValue(variant.compareAtPrice) : null;

//   // Extract metafield values
//   const getMetafield = (key: string) => {
//     return shopifyProduct.metafields?.find(m => m.key === key)?.value;
//   };

//   const subcategory = getMetafield("subcategory") || shopifyProduct.productType || "other";
//   const isNew = getMetafield("is_new") === "true";
//   const lowStock = getMetafield("low_stock") === "true";

//   // Determine category from collections or product type
//   const category = shopifyProduct.collections?.[0]?.handle || 
//                    (shopifyProduct.productType?.toLowerCase().includes("chemical") ? "cleaning-chemicals" : "cleaning-equipment");

//   return {
//     id: shopifyProduct.id,
//     handle: shopifyProduct.handle,
//     name: shopifyProduct.title,
//     description: shopifyProduct.description,
//     price: price,
//     originalPrice: compareAtPrice || undefined,
//     category: category,
//     subcategory: subcategory,
//     image: shopifyProduct.featuredImage?.url || shopifyProduct.images[0]?.url || "",
//     images: shopifyProduct.images.map(img => img.url),
//     inStock: variant?.availableForSale && variant?.quantityAvailable > 0,
//     weight: `${variant?.weight}${variant?.weightUnit.toLowerCase()}`,
//     weightValue: variant?.weight,
//     weightUnit: variant?.weightUnit,
//     isNew: isNew,
//     onSale: compareAtPrice ? compareAtPrice > price : false,
//     lowStock: lowStock || variant?.quantityAvailable < 5,
//     brand: shopifyProduct.vendor,
//     tags: shopifyProduct.tags,
//     variantId: variant?.id,
//     quantityAvailable: variant?.quantityAvailable,
//     sku: variant?.sku,
//   };
// }


// export async function getAllProducts(): Promise<Product[]> {
//   try {
//     const data = await shopifyFetch<ShopifyProductsResponse>({
//       query: GET_ALL_PRODUCTS,
//       variables: { first: 100 },
//     });
    
//     return data.products.edges.map(edge => normalizeShopifyProduct(edge.node));
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return [];
//   }
// }

// export async function getProductByHandle(handle: string): Promise<Product | null> {
//   try {
//     const data = await shopifyFetch<{ product: ShopifyProduct }>({
//       query: GET_PRODUCT_BY_HANDLE,
//       variables: { handle },
//     });
    
//     if (!data.product) return null;
    
//     return normalizeShopifyProduct(data.product);
//   } catch (error) {
//     console.error("Error fetching product:", error);
//     return null;
//   }
// }

// export async function getCollections() {
//   try {
//     const data = await shopifyFetch<ShopifyCollectionsResponse>({
//       query: GET_COLLECTIONS,
//       variables: { first: 50 },
//     });
    
//     return data.collections.edges.map(edge => edge.node);
//   } catch (error) {
//     console.error("Error fetching collections:", error);
//     return [];
//   }
// }

// // Convert Pakistani Rupees (used in UI) to USD (for Shopify if needed)
// export function convertPKRtoUSD(pkr: number): number {
//   const exchangeRate = 0.0036; // Approximate rate, update as needed
//   return pkr * exchangeRate;
// }

// // Convert USD to PKR
// export function convertUSDtoPKR(usd: number): number {
//   const exchangeRate = 278; // Approximate rate, update as needed
//   return Math.round(usd * exchangeRate);
// }


// src/lib/shopify.ts
import { Product } from "../types/shopify";
import { extractCategory, extractSubcategory } from "./tags";

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_API_VERSION =
  import.meta.env.VITE_SHOPIFY_API_VERSION ?? "2025-07";

if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
  console.warn(
    "[Shopify] Missing VITE_SHOPIFY_STORE_DOMAIN or VITE_SHOPIFY_STOREFRONT_TOKEN"
  );
}

const SHOPIFY_URL = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

interface ShopifyResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
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
    console.error("[Shopify GraphQL Error]", json.errors);
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  if (!json.data) throw new Error("Shopify returned no data");

  return json.data;
}

// -------------------------------------------------------------
//  PRODUCT NORMALIZER (100% stable + supports Option B fields)
// -------------------------------------------------------------
function normalizeProduct(node: any): Product | null {
  if (!node) return null;

  const variant = node.variants?.edges?.[0]?.node ?? null;

  const price = Number(variant?.price?.amount ?? 0);
  const originalPrice = Number(variant?.compareAtPrice?.amount ?? price);

  const onSale = originalPrice > price;
  const discountPercent = onSale
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const tags: string[] = node.tags ?? [];

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,

    price,
    originalPrice,
    onSale,
    discountPercent,

    image: node.featuredImage?.url ?? node.images?.edges?.[0]?.node?.url ?? "",
    images: node.images?.edges?.map((img: any) => img.node.url) ?? [],

    inStock: variant?.availableForSale ?? true,
    quantityAvailable: variant?.quantityAvailable ?? 0,
    lowStock: (variant?.quantityAvailable ?? 0) < 5,

    description: node.description || "",
    tags,

    productType: node.productType || "",
    category: extractCategory(tags),
    subcategory: extractSubcategory(tags),

    // --- Added fields ---
    sku: variant?.sku ?? null,
    brand: node.vendor ?? null,
    weight: variant?.weight
      ? `${variant.weight} ${variant.weightUnit}`
      : null,

    isNew: tags.includes("new") || tags.includes("New"),
  };
}

// -------------------------------------------------------------
//  GRAPHQL QUERIES
// -------------------------------------------------------------
const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          vendor
          tags
          featuredImage { url }
          images(first: 10) { edges { node { url } } }
          variants(first: 10) {
            edges {
              node {
                id
                sku
                availableForSale
                quantityAvailable
                weight
                weightUnit
                price { amount }
                compareAtPrice { amount }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      productType
      vendor
      tags
      featuredImage { url }
      images(first: 10) { edges { node { url } } }
      variants(first: 10) {
        edges {
          node {
            id
            sku
            availableForSale
            quantityAvailable
            weight
            weightUnit
            price { amount }
            compareAtPrice { amount }
          }
        }
      }
    }
  }
`;

// -------------------------------------------------------------
//  PUBLIC HELPERS
// -------------------------------------------------------------
export async function getAllProducts(limit = 200): Promise<Product[]> {
  const data = await shopifyFetch<{
    products: { edges: { node: any }[] };
  }>(PRODUCTS_QUERY, { first: limit });

  return data.products.edges
    .map((e) => normalizeProduct(e.node))
    .filter((p): p is Product => p !== null);
}

export async function getProductByHandle(
  handle: string
): Promise<Product | null> {
  if (!handle) return null;

  const data = await shopifyFetch<{ product: any }>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });

  return normalizeProduct(data.product);
}
