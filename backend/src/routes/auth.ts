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

// Transform Shopify customer to our User type
function transformCustomer(customer: any): any {
  return {
    id: customer.id,
    email: customer.email,
    name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    phone: customer.phone || '',
  };
}

/**
 * POST /api/auth/signup
 * Customer signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, firstName, and lastName are required'
      });
    }

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
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email,
        password,
        firstName,
        lastName,
        phone: phone || null,
      }
    };

    const data = await shopifyFetch<{ customerCreate: { customer: any; customerUserErrors: any[] } }>(mutation, variables);

    if (data.customerCreate.customerUserErrors?.length > 0) {
      const errors = data.customerCreate.customerUserErrors.map((e: any) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errors
      });
    }

    const customer = data.customerCreate.customer;
    const user = transformCustomer(customer);

    console.log(`[Auth] Customer created: ${user.email}`);
    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer'
    });
  }
});

/**
 * POST /api/auth/login
 * Customer login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email,
        password
      }
    };

    const data = await shopifyFetch<{ customerAccessTokenCreate: { customerAccessToken: any; customerUserErrors: any[] } }>(mutation, variables);

    if (data.customerAccessTokenCreate.customerUserErrors?.length > 0) {
      const errors = data.customerAccessTokenCreate.customerUserErrors.map((e: any) => e.message).join(', ');
      return res.status(401).json({
        success: false,
        error: errors
      });
    }

    const accessToken = data.customerAccessTokenCreate.customerAccessToken.accessToken;

    // Get customer details
    const customerQuery = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
        }
      }
    `;

    const customerData = await shopifyFetch<{ customer: any }>(customerQuery, { customerAccessToken: accessToken });
    const customer = customerData.customer;
    const user = transformCustomer(customer);
    user.accessToken = accessToken;

    console.log(`[Auth] Customer logged in: ${user.email}`);
    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to login'
    });
  }
});

/**
 * GET /api/auth/customer
 * Get customer details
 */
router.get('/customer', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const query = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
          orders(first: 10) {
            edges {
              node {
                id
                orderNumber
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        price {
                          amount
                          currencyCode
                        }
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

    const data = await shopifyFetch<{ customer: any }>(query, { customerAccessToken: accessToken });
    const customer = data.customer;

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const user = transformCustomer(customer);

    // Transform orders
    const orders = customer.orders?.edges?.map((edge: any) => ({
      id: edge.node.id,
      orderNumber: edge.node.orderNumber,
      processedAt: edge.node.processedAt,
      financialStatus: edge.node.financialStatus,
      fulfillmentStatus: edge.node.fulfillmentStatus,
      totalPrice: edge.node.totalPrice,
      lineItems: edge.node.lineItems.edges.map((li: any) => ({
        title: li.node.title,
        quantity: li.node.quantity,
        price: li.node.variant?.price || { amount: '0', currencyCode: 'USD' }
      }))
    })) || [];

    res.json({
      success: true,
      user,
      orders
    });
  } catch (error: any) {
    console.error('[Auth] Get customer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customer details'
    });
  }
});

/**
 * POST /api/auth/recover
 * Password reset request
 */
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const mutation = `
      mutation customerRecover($email: String!) {
        customerRecover(email: $email) {
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const data = await shopifyFetch<{ customerRecover: { customerUserErrors: any[] } }>(mutation, { email });

    if (data.customerRecover.customerUserErrors?.length > 0) {
      const errors = data.customerRecover.customerUserErrors.map((e: any) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errors
      });
    }

    console.log(`[Auth] Password reset email sent to: ${email}`);
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error: any) {
    console.error('[Auth] Password recover error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send password reset email'
    });
  }
});

export default router;
