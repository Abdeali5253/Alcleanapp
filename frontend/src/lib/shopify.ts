// Shopify Storefront API Service
// Uses ONLY Storefront API - No Admin API needed!

import { Product } from "../types/shopify";

// Configuration from environment
const SHOPIFY_DOMAIN = import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_TOKEN = import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN || '';
const SHOPIFY_API_VERSION = import.meta.env?.VITE_SHOPIFY_API_VERSION || '2025-01';

const SHOPIFY_URL = SHOPIFY_DOMAIN 
  ? `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`
  : '';

// Check if configured
export function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);
}

// GraphQL fetch helper
async function shopifyFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify not configured");
  }

  const response = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

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
  
  // Check for equipment keywords
  const isEquipment = EQUIPMENT_KEYWORDS.some(kw => titleLower.includes(kw));
  
  if (isEquipment) {
    if (titleLower.includes("mop") || titleLower.includes("bucket")) {
      return { category: "cleaning-equipment", subcategory: "mop-bucket-trolley" };
    }
    if (titleLower.includes("broom") || titleLower.includes("brush")) {
      return { category: "cleaning-equipment", subcategory: "brooms-brushes" };
    }
    if (titleLower.includes("window") || titleLower.includes("squeegee")) {
      return { category: "cleaning-equipment", subcategory: "window-cleaning" };
    }
    return { category: "cleaning-equipment", subcategory: "cleaning-tools" };
  }
  
  // Check for chemical keywords
  if (titleLower.includes("floor")) return { category: "cleaning-chemicals", subcategory: "floor-cleaner" };
  if (titleLower.includes("glass")) return { category: "cleaning-chemicals", subcategory: "glass-cleaner" };
  if (titleLower.includes("bathroom") || titleLower.includes("toilet")) return { category: "bathroom-cleaning", subcategory: "bathroom-cleaner" };
  if (titleLower.includes("car") || titleLower.includes("shampoo")) return { category: "car-washing", subcategory: "car-shampoo" };
  if (titleLower.includes("dish") || titleLower.includes("kitchen")) return { category: "dishwashing", subcategory: "dish-wash" };
  if (titleLower.includes("fabric") || titleLower.includes("softener")) return { category: "fabric-cleaning", subcategory: "fabric-washing" };
  
  return { category: "cleaning-chemicals", subcategory: "multi-purpose" };
}

// Transform Shopify product to our Product type
function transformProduct(node: any): Product {
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

// ==================== PRODUCT QUERIES ====================

export async function getAllProducts(first: number = 250): Promise<Product[]> {
  const query = `
    query GetProducts($first: Int!) {
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

  const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(query, { first });
  return data.products.edges.map(edge => transformProduct(edge.node));
}

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

  try {
    const data = await shopifyFetch<{ product: any }>(query, { id: productId });
    return data.product ? transformProduct(data.product) : null;
  } catch (error) {
    console.error("[Shopify] Error fetching product:", error);
    return null;
  }
}

// Get products by collection handle
export async function getProductsByCollection(collectionHandle: string, first: number = 20): Promise<Product[]> {
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

  try {
    const data = await shopifyFetch<{ collectionByHandle: { products: { edges: { node: any }[] } } | null }>(
      query, 
      { handle: collectionHandle, first }
    );
    
    if (!data.collectionByHandle) {
      console.warn(`[Shopify] Collection "${collectionHandle}" not found`);
      return [];
    }
    
    return data.collectionByHandle.products.edges.map(edge => transformProduct(edge.node));
  } catch (error) {
    console.error("[Shopify] Error fetching collection products:", error);
    return [];
  }
}

// ==================== CUSTOMER AUTH ====================

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  accessToken: string;
}

// Create new customer (Sign Up)
export async function customerCreate(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  phone?: string
): Promise<ShopifyCustomer> {
  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          phone
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, {
    input: { email, password, firstName, lastName, phone, acceptsMarketing: true }
  });

  if (data.customerCreate.customerUserErrors?.length > 0) {
    throw new Error(data.customerCreate.customerUserErrors.map((e: any) => e.message).join(", "));
  }

  // Now log in to get access token
  const accessToken = await customerAccessTokenCreate(email, password);
  
  return {
    ...data.customerCreate.customer,
    accessToken
  };
}

// Create access token (Login)
export async function customerAccessTokenCreate(email: string, password: string): Promise<string> {
  const mutation = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { input: { email, password } });

  if (data.customerAccessTokenCreate.customerUserErrors?.length > 0) {
    throw new Error(data.customerAccessTokenCreate.customerUserErrors.map((e: any) => e.message).join(", "));
  }

  return data.customerAccessTokenCreate.customerAccessToken.accessToken;
}

// Get customer info
export async function getCustomer(accessToken: string): Promise<any> {
  const query = `
    query getCustomer($accessToken: String!) {
      customer(customerAccessToken: $accessToken) {
        id
        email
        firstName
        lastName
        phone
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice { amount currencyCode }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      price { amount }
                      image { url }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { accessToken });
  return data.customer;
}

// Password recovery
export async function customerRecover(email: string): Promise<void> {
  const mutation = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { email });

  if (data.customerRecover.customerUserErrors?.length > 0) {
    throw new Error(data.customerRecover.customerUserErrors.map((e: any) => e.message).join(", "));
  }
}

// ==================== CHECKOUT (Storefront API) ====================

export interface CheckoutLineItem {
  variantId: string;
  quantity: number;
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: {
    edges: {
      node: {
        id: string;
        title: string;
        quantity: number;
        variant: {
          id: string;
          title: string;
          price: { amount: string };
          image: { url: string } | null;
        };
      };
    }[];
  };
}

// Create checkout
export async function checkoutCreate(lineItems: CheckoutLineItem[], email?: string): Promise<ShopifyCheckout> {
  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  price { amount }
                  image { url }
                }
              }
            }
          }
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const input: any = { lineItems };
  if (email) input.email = email;

  const data = await shopifyFetch<any>(mutation, { input });

  if (data.checkoutCreate.checkoutUserErrors?.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors.map((e: any) => e.message).join(", "));
  }

  return data.checkoutCreate.checkout;
}

// Add line items to checkout
export async function checkoutLineItemsAdd(
  checkoutId: string, 
  lineItems: CheckoutLineItem[]
): Promise<ShopifyCheckout> {
  const mutation = `
    mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
      checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
        checkout {
          id
          webUrl
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  price { amount }
                  image { url }
                }
              }
            }
          }
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { checkoutId, lineItems });

  if (data.checkoutLineItemsAdd.checkoutUserErrors?.length > 0) {
    throw new Error(data.checkoutLineItemsAdd.checkoutUserErrors.map((e: any) => e.message).join(", "));
  }

  return data.checkoutLineItemsAdd.checkout;
}

// Update checkout with customer info
export async function checkoutCustomerAssociateV2(
  checkoutId: string, 
  customerAccessToken: string
): Promise<ShopifyCheckout> {
  const mutation = `
    mutation checkoutCustomerAssociateV2($checkoutId: ID!, $customerAccessToken: String!) {
      checkoutCustomerAssociateV2(checkoutId: $checkoutId, customerAccessToken: $customerAccessToken) {
        checkout {
          id
          webUrl
          totalPrice { amount currencyCode }
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { checkoutId, customerAccessToken });

  if (data.checkoutCustomerAssociateV2.checkoutUserErrors?.length > 0) {
    throw new Error(data.checkoutCustomerAssociateV2.checkoutUserErrors.map((e: any) => e.message).join(", "));
  }

  return data.checkoutCustomerAssociateV2.checkout;
}

// Update checkout shipping address
export async function checkoutShippingAddressUpdateV2(
  checkoutId: string,
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  }
): Promise<ShopifyCheckout> {
  const mutation = `
    mutation checkoutShippingAddressUpdateV2($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
      checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, shippingAddress: $shippingAddress) {
        checkout {
          id
          webUrl
          totalPrice { amount currencyCode }
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { checkoutId, shippingAddress });

  if (data.checkoutShippingAddressUpdateV2.checkoutUserErrors?.length > 0) {
    throw new Error(data.checkoutShippingAddressUpdateV2.checkoutUserErrors.map((e: any) => e.message).join(", "));
  }

  return data.checkoutShippingAddressUpdateV2.checkout;
}

// Get checkout URL (opens in WebView for payment)
export function getCheckoutWebUrl(checkout: ShopifyCheckout): string {
  return checkout.webUrl;
}
