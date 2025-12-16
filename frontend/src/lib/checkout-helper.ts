// Helper function to create Shopify checkout
import { createCheckout as createShopifyCheckout, CheckoutLineItem } from "./shopify";
import { CartItem } from "./cart";

export async function createCheckout(
  cartItems: CartItem[],
  paymentMethod?: string,
  screenshot?: File | null
): Promise<string> {
  // Convert cart items to Shopify line items using the stored variantId
  const lineItems: CheckoutLineItem[] = cartItems.map(item => {
    console.log('[Checkout Helper] Processing item:', {
      title: item.product.title,
      variantId: item.product.variantId,
      quantity: item.quantity
    });
    
    return {
      variantId: item.product.variantId,
      quantity: item.quantity,
    };
  });

  // Check if all variant IDs are valid
  const invalidItems = lineItems.filter(item => !item.variantId);
  if (invalidItems.length > 0) {
    console.error('[Checkout Helper] Items with missing variant IDs:', invalidItems);
    throw new Error(`${invalidItems.length} items are missing variant IDs. Please try re-adding them to your cart.`);
  }

  console.log('[Checkout Helper] Creating checkout with line items:', lineItems);

  // Create order note with payment method info if provided
  let note = '';
  if (paymentMethod) {
    note = `Payment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}`;
    if (paymentMethod === 'bank-transfer' && screenshot) {
      note += `\nBank transfer screenshot attached`;
    }
  }

  try {
    const result = await createShopifyCheckout({
      lineItems,
      note,
    });

    if (!result) {
      throw new Error('Failed to create checkout');
    }

    console.log('[Checkout Helper] Checkout created successfully:', result);

    // Return just the checkout URL for direct navigation
    return result.checkoutUrl;
  } catch (error) {
    console.error('[Checkout Helper] Error creating checkout:', error);
    throw error;
  }
}