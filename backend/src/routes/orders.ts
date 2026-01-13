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

// Transform Shopify order to our Order format
function transformShopifyOrder(order: any): any {
    const lineItems = order.lineItems.edges.map((itemEdge: any) => {
        const item = itemEdge.node;
        return {
            product: {
                id: item.variant?.id || '',
                title: item.title,
                image: item.variant?.image?.url || '',
                price: parseFloat(item.variant?.price?.amount || '0'),
                variantId: item.variant?.id || '',
            },
            quantity: item.quantity,
        };
    });

    return {
        id: order.id,
        orderNumber: `#${order.orderNumber}`,
        customerName: '', // Not available in order list
        customerEmail: '', // Will be set by caller
        customerPhone: '',
        customerAddress: '',
        city: '',
        items: lineItems,
        subtotal: parseFloat(order.totalPrice.amount),
        deliveryCharge: 0, // Not available
        total: parseFloat(order.totalPrice.amount),
        paymentMethod: 'cod', // Default
        status: mapShopifyStatus(order.financialStatus, order.fulfillmentStatus),
        createdAt: order.processedAt,
        shopifyOrderId: order.id,
    };
}

// Map Shopify status to our status
function mapShopifyStatus(financialStatus: string, fulfillmentStatus: string): string {
    if (fulfillmentStatus === 'FULFILLED') return 'delivered';
    if (fulfillmentStatus === 'PARTIALLY_FULFILLED' || fulfillmentStatus === 'IN_PROGRESS') return 'in-transit';
    if (financialStatus === 'PAID' || financialStatus === 'PARTIALLY_PAID') return 'processing';
    return 'pending';
}

/**
 * GET /api/orders
 * Get orders for authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Get customer details including orders
        const query = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
          orders(first: 50) {
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
                        id
                        price {
                          amount
                          currencyCode
                        }
                        image {
                          url
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

        // Transform orders
        const orders = customer.orders?.edges?.map((edge: any) => {
            const order = transformShopifyOrder(edge.node);
            order.customerEmail = customer.email;
            order.customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email;
            order.customerPhone = customer.phone || '';
            return order;
        }) || [];

        // Sort by date (newest first)
        orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log(`[Orders] Fetched ${orders.length} orders for ${customer.email}`);
        res.json({
            success: true,
            orders
        });
    } catch (error: any) {
        console.error('[Orders] Get orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get orders'
        });
    }
});

export default router;
