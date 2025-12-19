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
    return { category: "cleaning-equipment", subcategory: "mop-bucket-trolley" };
  }
  if (titleLower.includes("broom") || titleLower.includes("brush") || titleLower.includes("scrubber")) {
    return { category: "cleaning-equipment", subcategory: "brooms-brushes" };
  }
  if (titleLower.includes("window") || titleLower.includes("squeegee") || titleLower.includes("viper")) {
    return { category: "cleaning-equipment", subcategory: "window-cleaning" };
  }
  if (titleLower.includes("vacuum") || titleLower.includes("sweeper") || titleLower.includes("machine")) {
    return { category: "cleaning-equipment", subcategory: "machines" };
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
    return { category: "cleaning-chemicals", subcategory: "floor-cleaner" };
  }
  // Glass
  if (titleLower.includes("glass") || titleLower.includes("mirror") || titleLower.includes("window cleaner")) {
    return { category: "cleaning-chemicals", subcategory: "glass-cleaner" };
  }
  // Default to multi-purpose
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

// Get products by collection handle (only active products)
export async function getProductsByCollection(collectionHandle: string, first: number = 250): Promise<Product[]> {
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
    
    // Transform products (don't filter by inStock to show all products in collection)
    const products = data.collectionByHandle.products.edges
      .map(edge => transformProduct(edge.node));
    
    console.log(`[Shopify] Collection "${collectionHandle}": ${products.length} products fetched`);
    
    return products;
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

// Create cart (Shopify 2023+ uses Cart API instead of Checkout API)
export async function checkoutCreate(lineItems: CheckoutLineItem[], email?: string): Promise<ShopifyCheckout> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
            subtotalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount }
                    image { url }
                    product { title }
                  }
                }
              }
            }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const input: any = { 
    lines: lineItems.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity
    }))
  };
  if (email) {
    input.buyerIdentity = { email };
  }

  const data = await shopifyFetch<any>(mutation, { input });

  if (data.cartCreate.userErrors?.length > 0) {
    throw new Error(data.cartCreate.userErrors.map((e: any) => e.message).join(", "));
  }

  const cart = data.cartCreate.cart;
  
  // Transform cart response to match ShopifyCheckout interface
  return {
    id: cart.id,
    webUrl: cart.checkoutUrl,
    totalPrice: cart.cost.totalAmount,
    lineItems: {
      edges: cart.lines.edges.map((edge: any) => ({
        node: {
          id: edge.node.id,
          title: edge.node.merchandise.product?.title || edge.node.merchandise.title,
          quantity: edge.node.quantity,
          variant: {
            id: edge.node.merchandise.id,
            title: edge.node.merchandise.title,
            price: edge.node.merchandise.price,
            image: edge.node.merchandise.image
          }
        }
      }))
    }
  };
}

// Add line items to cart (Cart API)
export async function checkoutLineItemsAdd(
  cartId: string, 
  lineItems: CheckoutLineItem[]
): Promise<ShopifyCheckout> {
  const mutation = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount }
                    image { url }
                    product { title }
                  }
                }
              }
            }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const lines = lineItems.map(item => ({
    merchandiseId: item.variantId,
    quantity: item.quantity
  }));

  const data = await shopifyFetch<any>(mutation, { cartId, lines });

  if (data.cartLinesAdd.userErrors?.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors.map((e: any) => e.message).join(", "));
  }

  const cart = data.cartLinesAdd.cart;
  return {
    id: cart.id,
    webUrl: cart.checkoutUrl,
    totalPrice: cart.cost.totalAmount,
    lineItems: { edges: cart.lines.edges }
  };
}

// Update cart with customer info (Cart API)
export async function checkoutCustomerAssociateV2(
  cartId: string, 
  customerAccessToken: string
): Promise<ShopifyCheckout> {
  const mutation = `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(mutation, { 
    cartId, 
    buyerIdentity: { customerAccessToken } 
  });

  if (data.cartBuyerIdentityUpdate.userErrors?.length > 0) {
    throw new Error(data.cartBuyerIdentityUpdate.userErrors.map((e: any) => e.message).join(", "));
  }

  const cart = data.cartBuyerIdentityUpdate.cart;
  return {
    id: cart.id,
    webUrl: cart.checkoutUrl,
    totalPrice: cart.cost.totalAmount,
    lineItems: { edges: [] }
  };
}

// Update cart with delivery address (Cart API)
// Note: Cart API doesn't directly support shipping address before checkout
// The address is collected on the Shopify checkout page
// This function updates buyer identity with delivery address preferences
export async function checkoutShippingAddressUpdateV2(
  cartId: string,
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
  // Cart API doesn't support shipping address update directly
  // Instead, we update the delivery address preferences in buyer identity
  // The actual address is entered on Shopify's checkout page
  
  const mutation = `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  // Build delivery address preferences
  const buyerIdentity = {
    deliveryAddressPreferences: [{
      deliveryAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address1: shippingAddress.address1,
        city: shippingAddress.city,
        province: shippingAddress.province,
        country: shippingAddress.country,
        zip: shippingAddress.zip,
        phone: shippingAddress.phone,
      }
    }]
  };

  try {
    const data = await shopifyFetch<any>(mutation, { cartId, buyerIdentity });

    if (data.cartBuyerIdentityUpdate?.userErrors?.length > 0) {
      console.warn("[Shopify] Shipping address update warning:", data.cartBuyerIdentityUpdate.userErrors);
    }

    const cart = data.cartBuyerIdentityUpdate?.cart;
    if (!cart) {
      // If update fails, return a minimal checkout object
      // The user will still be able to enter address on Shopify checkout page
      return {
        id: cartId,
        webUrl: '',
        totalPrice: { amount: '0', currencyCode: 'PKR' },
        lineItems: { edges: [] }
      };
    }

    return {
      id: cart.id,
      webUrl: cart.checkoutUrl,
      totalPrice: cart.cost.totalAmount,
      lineItems: { edges: [] }
    };
  } catch (error) {
    console.warn("[Shopify] Shipping address update failed, user can enter on checkout page:", error);
    // Return minimal object - address will be entered on Shopify checkout
    return {
      id: cartId,
      webUrl: '',
      totalPrice: { amount: '0', currencyCode: 'PKR' },
      lineItems: { edges: [] }
    };
  }
}

// Get checkout URL (opens in WebView for payment)
export function getCheckoutWebUrl(checkout: ShopifyCheckout): string {
  return checkout.webUrl;
}

export function getCheckoutUrl(checkout: ShopifyCheckout): string {
  return checkout.webUrl;
}

/**
 * Update customer information in Shopify
 */
export async function updateCustomer(accessToken: string, updates: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<boolean> {
  const mutation = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer {
          id
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

  try {
    const data = await shopifyFetch<any>(mutation, {
      customerAccessToken: accessToken,
      customer: updates
    });

    if (data.customerUpdate?.customerUserErrors?.length > 0) {
      console.error('[Shopify] Customer update errors:', data.customerUpdate.customerUserErrors);
      return false;
    }

    console.log('[Shopify] Customer updated successfully');
    return true;
  } catch (error) {
    console.error('[Shopify] Failed to update customer:', error);
    return false;
  }
}

/**
 * Categorized products interface
 */
export interface CategorizedProducts {
  supremeOffers: Product[];
  fabricWashing: Product[];
  cleaningChemicals: Product[];
  mopBuckets: Product[];
  cleaningEquipment: Product[];
  dishwashing: Product[];
  carWashing: Product[];
  bathroomCleaning: Product[];
  allProducts: Product[];
}

/**
 * Fetch all products from Shopify with collections
 */
export async function getAllProductsFromShopify(maxProducts: number = 250): Promise<Product[]> {
  const query = `
    query GetAllProducts($first: Int!, $after: String) {
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

  const allProducts: Product[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  try {
    while (hasNextPage && allProducts.length < maxProducts) {
      const data = await shopifyFetch<{ products: { edges: { node: any }[]; pageInfo: { hasNextPage: boolean; endCursor: string } } }>(
        query,
        { first: Math.min(250, maxProducts - allProducts.length), after: cursor }
      );

      const products = data.products.edges.map(edge => {
        const product = transformProduct(edge.node);
        // Add collections info
        const collections = edge.node.collections?.edges?.map((c: any) => ({
          id: c.node.id,
          title: c.node.title,
          handle: c.node.handle,
        })) || [];
        return { ...product, collections };
      });

      allProducts.push(...products);
      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;

      console.log(`[Shopify] Fetched ${allProducts.length} products so far...`);
    }

    console.log(`[Shopify] Total products fetched: ${allProducts.length}`);
    return allProducts;
  } catch (error) {
    console.error('[Shopify] Error fetching all products:', error);
    return [];
  }
}

/**
 * Categorize products based on collections and tags
 */
export function categorizeProducts(products: Product[]): CategorizedProducts {
  const categorized: CategorizedProducts = {
    supremeOffers: [],
    fabricWashing: [],
    cleaningChemicals: [],
    mopBuckets: [],
    cleaningEquipment: [],
    dishwashing: [],
    carWashing: [],
    bathroomCleaning: [],
    allProducts: products,
  };

  products.forEach(product => {
    const collections = (product as any).collections || [];
    const collectionHandles = collections.map((c: any) => c.handle.toLowerCase());
    const tags = product.tags?.map(t => t.toLowerCase()) || [];
    const title = product.title.toLowerCase();
    const productType = product.productType.toLowerCase();

    // Supreme Offers - products on sale or in supreme-offer collection
    if (
      collectionHandles.some(h => h.includes('supreme') || h.includes('offer') || h.includes('deal')) ||
      product.onSale
    ) {
      categorized.supremeOffers.push(product);
    }

    // Fabric Washing - fabric related collections/tags
    if (
      collectionHandles.some(h => 
        h.includes('fabric') || 
        h.includes('washing') || 
        h.includes('detergent') ||
        h.includes('softener')
      ) ||
      tags.some(t => t.includes('fabric') || t.includes('laundry') || t.includes('detergent')) ||
      title.includes('fabric') || 
      title.includes('detergent') ||
      title.includes('softener')
    ) {
      categorized.fabricWashing.push(product);
    }

    // Mop Buckets - mop and bucket equipment
    if (
      collectionHandles.some(h => h.includes('mop') || h.includes('bucket') || h.includes('wringer')) ||
      tags.some(t => t.includes('mop') || t.includes('bucket')) ||
      title.includes('mop') || 
      title.includes('bucket') ||
      title.includes('wringer')
    ) {
      categorized.mopBuckets.push(product);
    }

    // Dishwashing
    if (
      collectionHandles.some(h => h.includes('dish') || h.includes('kitchen')) ||
      tags.some(t => t.includes('dish') || t.includes('kitchen')) ||
      title.includes('dish') || 
      productType.includes('dish')
    ) {
      categorized.dishwashing.push(product);
    }

    // Car Washing
    if (
      collectionHandles.some(h => h.includes('car')) ||
      tags.some(t => t.includes('car') || t.includes('vehicle')) ||
      title.includes('car wash') || 
      title.includes('vehicle')
    ) {
      categorized.carWashing.push(product);
    }

    // Bathroom Cleaning
    if (
      collectionHandles.some(h => h.includes('bathroom') || h.includes('toilet')) ||
      tags.some(t => t.includes('bathroom') || t.includes('toilet')) ||
      title.includes('bathroom') || 
      title.includes('toilet')
    ) {
      categorized.bathroomCleaning.push(product);
    }

    // Cleaning Equipment - tools, not chemicals
    const equipmentKeywords = ['brush', 'broom', 'glove', 'cloth', 'wiper', 'sponge', 'scrubber', 'duster', 'squeegee', 'tool', 'dispenser'];
    if (
      collectionHandles.some(h => h.includes('equipment') || h.includes('tool') || h.includes('cleaning-tools')) ||
      tags.some(t => equipmentKeywords.some(k => t.includes(k))) ||
      equipmentKeywords.some(k => title.includes(k)) ||
      (collections.some((c: any) => c.title.toLowerCase().includes('equipment')) && 
       !title.includes('chemical') && 
       !title.includes('cleaner') && 
       !title.includes('detergent'))
    ) {
      categorized.cleaningEquipment.push(product);
    }
    // Cleaning Chemicals - liquid/powder chemicals (NOT equipment)
    else if (
      collectionHandles.some(h => 
        h.includes('chemical') || 
        h.includes('cleaner') || 
        h.includes('cleaning') ||
        h.includes('industrial') ||
        h.includes('multi-purpose')
      ) ||
      tags.some(t => t.includes('chemical') || t.includes('cleaner')) ||
      title.includes('cleaner') ||
      title.includes('chemical') ||
      productType.includes('chemical')
    ) {
      categorized.cleaningChemicals.push(product);
    }
  });

  // Log categorization results
  console.log('[Shopify] Product categorization:', {
    total: products.length,
    supremeOffers: categorized.supremeOffers.length,
    fabricWashing: categorized.fabricWashing.length,
    cleaningChemicals: categorized.cleaningChemicals.length,
    mopBuckets: categorized.mopBuckets.length,
    cleaningEquipment: categorized.cleaningEquipment.length,
    dishwashing: categorized.dishwashing.length,
    carWashing: categorized.carWashing.length,
    bathroomCleaning: categorized.bathroomCleaning.length,
  });

  return categorized;
}
