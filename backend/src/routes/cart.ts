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

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("[Shopify] GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }

  return json.data;
}

// Transform Shopify cart to checkout format (for backward compatibility)
function transformCartToCheckout(cart: any): any {
  return {
    id: cart.id,
    webUrl: cart.checkoutUrl,
    subtotalPrice: cart.cost?.subtotalAmount || { amount: '0', currencyCode: 'PKR' },
    totalPrice: cart.cost?.totalAmount || { amount: '0', currencyCode: 'PKR' },
    totalTax: cart.cost?.totalTaxAmount || { amount: '0', currencyCode: 'PKR' },
    lineItems: {
      edges: cart.lines?.edges?.map((edge: any) => ({
        node: {
          id: edge.node.id,
          title: edge.node.merchandise?.product?.title || edge.node.merchandise?.title || '',
          quantity: edge.node.quantity,
          variant: {
            id: edge.node.merchandise?.id || '',
            title: edge.node.merchandise?.title || '',
            price: edge.node.merchandise?.price || { amount: '0', currencyCode: 'PKR' },
            product: {
              id: edge.node.merchandise?.product?.id || '',
              title: edge.node.merchandise?.product?.title || '',
              handle: edge.node.merchandise?.product?.handle || '',
            }
          }
        }
      })) || []
    },
    shippingAddress: null,
    email: cart.buyerIdentity?.email || null,
    requiresShipping: true,
    availableShippingRates: null,
  };
}

/**
 * POST /api/cart/checkout
 * Create a new cart (using Cart API instead of deprecated Checkout API)
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { lineItems, email, note } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Line items are required'
      });
    }

    // Validate and transform line items for Cart API
    const cartLines = lineItems.map((item: any) => ({
      merchandiseId: item.variantId,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    // Use Cart API (cartCreate) instead of deprecated Checkout API
    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
            buyerIdentity {
              email
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
      lines: cartLines,
    };

    // Add buyer identity if email provided
    if (email) {
      input.buyerIdentity = { email };
    }

    // Add note if provided
    if (note) {
      input.note = note;
    }

    const data = await shopifyFetch<{ cartCreate: { cart: any; userErrors: any[] } }>(mutation, { input });

    if (data.cartCreate.userErrors?.length > 0) {
      const errors = data.cartCreate.userErrors.map((e: any) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errors
      });
    }

    const cart = data.cartCreate.cart;
    const transformedCheckout = transformCartToCheckout(cart);

    console.log(`[Cart] Cart created: ${cart.id}`);
    res.json({
      success: true,
      checkout: transformedCheckout
    });
  } catch (error: any) {
    console.error('[Cart] Cart creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create cart'
    });
  }
});

/**
 * PUT /api/cart/checkout/:checkoutId/customer
 * Associate customer with cart (using Cart API)
 */
router.put('/checkout/:checkoutId/customer', async (req: Request, res: Response) => {
  try {
    const { checkoutId } = req.params;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Use Cart API to update buyer identity
    const mutation = `
      mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
        cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
          cart {
            id
            checkoutUrl
            buyerIdentity {
              email
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

    const variables = {
      cartId: checkoutId,
      buyerIdentity: {
        customerAccessToken: accessToken
      }
    };

    const data = await shopifyFetch<{ cartBuyerIdentityUpdate: { cart: any; userErrors: any[] } }>(mutation, variables);

    if (data.cartBuyerIdentityUpdate.userErrors?.length > 0) {
      const errors = data.cartBuyerIdentityUpdate.userErrors.map((e: any) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errors
      });
    }

    const cart = data.cartBuyerIdentityUpdate.cart;

    console.log(`[Cart] Customer associated with cart: ${checkoutId}`);
    res.json({
      success: true,
      checkout: {
        id: cart.id,
        webUrl: cart.checkoutUrl,
        email: cart.buyerIdentity?.email
      }
    });
  } catch (error: any) {
    console.error('[Cart] Customer association error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to associate customer'
    });
  }
});

/**
 * PUT /api/cart/checkout/:checkoutId/shipping-address
 * Update shipping address on cart (using Cart API delivery address preferences)
 */
router.put('/checkout/:checkoutId/shipping-address', async (req: Request, res: Response) => {
  try {
    const { checkoutId } = req.params;
    const { address } = req.body;

    if (!address || !address.address1 || !address.city || !address.country) {
      return res.status(400).json({
        success: false,
        error: 'Complete address is required'
      });
    }

    // Use Cart API to update buyer identity with delivery address preferences
    const mutation = `
      mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
        cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
          cart {
            id
            checkoutUrl
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
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

    const variables = {
      cartId: checkoutId,
      buyerIdentity: {
        deliveryAddressPreferences: [{
          deliveryAddress: {
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            address1: address.address1,
            address2: address.address2 || '',
            city: address.city,
            province: address.province || '',
            country: address.country,
            zip: address.zip || '',
            phone: address.phone || '',
          }
        }]
      }
    };

    try {
      const data = await shopifyFetch<{ cartBuyerIdentityUpdate: { cart: any; userErrors: any[] } }>(mutation, variables);

      if (data.cartBuyerIdentityUpdate?.userErrors?.length > 0) {
        console.warn('[Cart] Shipping address update warning:', data.cartBuyerIdentityUpdate.userErrors);
        // Don't fail - user can still enter address on Shopify checkout page
      }

      const cart = data.cartBuyerIdentityUpdate?.cart;
      
      if (cart) {
        const transformedCheckout = transformCartToCheckout(cart);
        console.log(`[Cart] Shipping address updated for cart: ${checkoutId}`);
        res.json({
          success: true,
          checkout: transformedCheckout
        });
      } else {
        // Return success anyway - address will be entered on Shopify checkout page
        res.json({
          success: true,
          checkout: {
            id: checkoutId,
            webUrl: '',
            message: 'Address will be entered on checkout page'
          }
        });
      }
    } catch (innerError: any) {
      console.warn('[Cart] Shipping address update failed, user can enter on checkout page:', innerError.message);
      // Return success - address will be entered on Shopify checkout page
      res.json({
        success: true,
        checkout: {
          id: checkoutId,
          webUrl: '',
          message: 'Address will be entered on checkout page'
        }
      });
    }
  } catch (error: any) {
    console.error('[Cart] Shipping address update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update shipping address'
    });
  }
});

/**
 * GET /api/cart/checkout/:checkoutId
 * Get cart details (using Cart API)
 */
router.get('/checkout/:checkoutId', async (req: Request, res: Response) => {
  try {
    const { checkoutId } = req.params;

    const query = `
      query getCart($id: ID!) {
        cart(id: $id) {
          id
          checkoutUrl
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
          lines(first: 250) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      id
                      title
                      handle
                    }
                  }
                }
              }
            }
          }
          buyerIdentity {
            email
          }
        }
      }
    `;

    const data = await shopifyFetch<{ cart: any }>(query, { id: checkoutId });
    const cart = data.cart;

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const transformedCheckout = transformCartToCheckout(cart);

    res.json({
      success: true,
      checkout: transformedCheckout
    });
  } catch (error: any) {
    console.error('[Cart] Get cart error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cart'
    });
  }
});

export default router;
