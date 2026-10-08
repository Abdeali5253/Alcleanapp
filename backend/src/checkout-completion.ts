interface CartOrder {
  cartToken?: string | null;
  checkoutToken?: string | null;
  createdAt: string;
}

export function isCompletedCartOrder(
  order: CartOrder,
  cartToken: string,
  since: number,
): boolean {
  const createdAt = new Date(order.createdAt).getTime();
  // Exact cart identity proves which checkout completed. The app's estimated
  // shipping/tax total can differ from the final Shopify order total.
  return !!cartToken &&
    (order.cartToken === cartToken || order.checkoutToken === cartToken) &&
    Number.isFinite(createdAt) && createdAt >= since;
}
