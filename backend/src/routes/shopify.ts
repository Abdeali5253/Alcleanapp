import { Router, Request, Response } from 'express';

const router = Router();

interface OrderItem {
  variantId: string;
  quantity: number;
  title: string;
  price: number;
}

interface CreateOrderRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
}

/**
 * Make GraphQL request to Shopify
 */
async function shopifyGraphQL(query: string, variables: any = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || '2025-07';

  if (!domain || !token) {
    throw new Error('Shopify credentials not configured');
  }

  const url = `https://${domain}/admin/api/${version}/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Create draft order in Shopify
 */
async function createDraftOrder(orderData: CreateOrderRequest) {
  const lineItems = orderData.items.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));

  const nameParts = orderData.customerName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          totalPrice
          status
          legacyResourceId
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lineItems,
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      shippingAddress: {
        firstName,
        lastName,
        address1: orderData.customerAddress,
        city: orderData.city,
        country: 'Pakistan',
        countryCode: 'PK',
        phone: orderData.customerPhone,
      },
      billingAddress: {
        firstName,
        lastName,
        address1: orderData.customerAddress,
        city: orderData.city,
        country: 'Pakistan',
        countryCode: 'PK',
        phone: orderData.customerPhone,
      },
      shippingLine: {
        title: `Delivery to ${orderData.city}`,
        price: orderData.deliveryCharge.toString(),
      },
      note: `AlClean App Order - ${orderData.orderNumber}\nPayment Method: ${
        orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'
      }`,
      tags: ['alclean-app', orderData.paymentMethod],
    },
  };

  const result = await shopifyGraphQL(mutation, variables);

  if (result.data?.draftOrderCreate?.userErrors?.length > 0) {
    const errors = result.data.draftOrderCreate.userErrors;
    const errorMessages = errors.map((e: any) => e.message).join(', ');
    throw new Error(`Shopify errors: ${errorMessages}`);
  }

  if (!result.data?.draftOrderCreate?.draftOrder) {
    throw new Error('Failed to create draft order');
  }

  return result.data.draftOrderCreate.draftOrder;
}

/**
 * Complete draft order
 */
async function completeDraftOrder(draftOrderId: string) {
  const mutation = `
    mutation draftOrderComplete($id: ID!) {
      draftOrderComplete(id: $id) {
        draftOrder {
          id
          order {
            id
            name
            legacyResourceId
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { id: draftOrderId };
  const result = await shopifyGraphQL(mutation, variables);

  if (result.data?.draftOrderComplete?.userErrors?.length > 0) {
    console.warn('Draft order completion errors:', result.data.draftOrderComplete.userErrors);
    return null;
  }

  return result.data?.draftOrderComplete?.draftOrder?.order || null;
}

/**
 * POST /api/shopify/create-order
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const orderData: CreateOrderRequest = req.body;

    const requiredFields = [
      'orderNumber',
      'customerName',
      'customerEmail',
      'customerPhone',
      'customerAddress',
      'city',
      'items',
      'subtotal',
      'deliveryCharge',
      'total',
      'paymentMethod',
    ];

    for (const field of requiredFields) {
      if (!orderData[field as keyof CreateOrderRequest]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`,
        });
      }
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
    }

    console.log(`[Shopify] Creating order: ${orderData.orderNumber}`);

    const draftOrder = await createDraftOrder(orderData);
    console.log(`[Shopify] Draft order created: ${draftOrder.id}`);

    let order = null;
    try {
      order = await completeDraftOrder(draftOrder.id);
      if (order) {
        console.log(`[Shopify] Order completed: ${order.id}`);
      }
    } catch (error) {
      console.warn('[Shopify] Failed to complete draft order:', error);
    }

    res.json({
      success: true,
      draftOrderId: draftOrder.id,
      orderId: order?.id || null,
      orderName: order?.name || draftOrder.name,
      message: 'Order created successfully in Shopify',
    });
  } catch (error: any) {
    console.error('[Shopify] Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

export default router;
