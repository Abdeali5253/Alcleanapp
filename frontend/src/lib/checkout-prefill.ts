export interface CheckoutShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

// Keep Shopify's cart/session parameters while passing the customer's entered
// details, even if the backend address update could not return a checkout URL.
export function buildPrefilledCheckoutUrl(
  checkoutUrl: string,
  address: CheckoutShippingAddress,
  email: string,
): string {
  const url = new URL(checkoutUrl);
  const fields = {
    first_name: address.firstName,
    last_name: address.lastName,
    address1: address.address1,
    city: address.city,
    province: address.province,
    country: address.country,
    zip: address.zip,
    phone: address.phone,
  };
  for (const [field, value] of Object.entries(fields)) {
    const key = `checkout[shipping_address][${field}]`;
    if (value.trim()) url.searchParams.set(key, value.trim());
    else url.searchParams.delete(key);
  }
  if (email.trim()) url.searchParams.set("checkout[email]", email.trim());
  return url.toString();
}
