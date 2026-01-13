import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Configuration from environment
function getShopifyConfig() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN || '';
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN || '';
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';
    const adminUrl = domain ? `https://${domain}/admin/api/${apiVersion}` : '';
    const storefrontUrl = domain ? `https://${domain}/api/${apiVersion}/graphql.json` : '';

    return { domain, adminToken, storefrontToken, apiVersion, adminUrl, storefrontUrl };
}

// Check if configured
function isShopifyConfigured(): boolean {
    const { domain, adminToken } = getShopifyConfig();
    return !!(domain && adminToken);
}

// Admin API fetch helper
async function shopifyAdminFetch(endpoint: string, options: any = {}): Promise<any> {
    const { adminUrl, adminToken } = getShopifyConfig();

    if (!isShopifyConfigured()) {
        throw new Error("Shopify not configured");
    }

    const url = `${adminUrl}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': adminToken,
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('[Shopify Admin] Error:', response.status, data);
        const errorData = data as any;
        throw new Error(errorData.errors?.[0]?.message || `Shopify API error: ${response.status}`);
    }

    return data;
}

/**
 * POST /api/shopify/create-order
 * Create Shopify draft order
 */
router.post('/create-order', async (req: Request, res: Response) => {
    try {
        const {
            orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            city,
            items,
            subtotal,
            deliveryCharge,
            total,
            paymentMethod,
        } = req.body;

        if (!orderNumber || !customerEmail || !items?.length) {
            return res.status(400).json({
                success: false,
                error: 'Order number, customer email, and items are required'
            });
        }

        // Create draft order
        const draftOrderData = {
            draft_order: {
                email: customerEmail,
                note: `Order Number: ${orderNumber}`,
                note_attributes: [
                    { name: 'Order Number', value: orderNumber },
                    { name: 'Customer Name', value: customerName },
                    { name: 'Customer Phone', value: customerPhone || '' },
                    { name: 'Customer Address', value: customerAddress },
                    { name: 'City', value: city },
                    { name: 'Payment Method', value: paymentMethod },
                ],
                line_items: items.map((item: any) => ({
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shipping_address: {
                    address1: customerAddress,
                    city: city,
                    country: 'Pakistan',
                    phone: customerPhone,
                },
                billing_address: {
                    address1: customerAddress,
                    city: city,
                    country: 'Pakistan',
                    phone: customerPhone,
                },
                tags: ['alclean'],
            }
        };

        console.log('[Shopify] Creating draft order:', {
            orderNumber,
            customerEmail,
            itemsCount: items.length,
            total
        });

        const draftOrderResponse = await shopifyAdminFetch('/draft_orders.json', {
            method: 'POST',
            body: JSON.stringify(draftOrderData),
        });

        const draftOrder = draftOrderResponse.draft_order;

        if (!draftOrder) {
            throw new Error('Failed to create draft order');
        }

        console.log('[Shopify] Draft order created:', draftOrder.id);

        // Complete the draft order to create actual order
        const completeResponse = await shopifyAdminFetch(`/draft_orders/${draftOrder.id}/complete.json`, {
            method: 'PUT',
            body: JSON.stringify({
                draft_order: {
                    payment_pending: paymentMethod === 'cod' // COD orders don't require payment
                }
            }),
        });

        const completedOrder = completeResponse.draft_order;

        if (completedOrder.order) {
            console.log('[Shopify] Order completed:', completedOrder.order.id);
            res.json({
                success: true,
                draftOrderId: draftOrder.id,
                orderId: completedOrder.order.id,
            });
        } else {
            // Draft order created but not completed
            res.json({
                success: true,
                draftOrderId: draftOrder.id,
                orderId: null,
            });
        }
    } catch (error: any) {
        console.error('[Shopify] Create order error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
});

export default router;
