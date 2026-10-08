import { describe, expect, it } from "vitest";
import { buildPrefilledCheckoutUrl } from "./checkout-prefill";

const address = {
  firstName: "Ali", lastName: "Khan", address1: "House #5 & Street 2",
  city: "Karachi", province: "", country: "PK", zip: "", phone: "+923001234567",
};

describe("checkout prefill", () => {
  it("passes customer fields without losing the checkout session or corrupting special characters", () => {
    const url = new URL(buildPrefilledCheckoutUrl(
      "https://alclean.pk/checkouts/session?key=cart-token&checkout[shipping_address][province]=Karachi&checkout[shipping_address][zip]=00000",
      address, " ali+orders@example.com ",
    ));
    expect(url.pathname).toBe("/checkouts/session");
    expect(url.searchParams.get("key")).toBe("cart-token");
    expect(url.searchParams.get("checkout[email]")).toBe("ali+orders@example.com");
    for (const [field, value] of Object.entries({
      first_name: "Ali", last_name: "Khan", address1: address.address1,
      city: "Karachi", country: "PK", phone: address.phone,
    })) expect(url.searchParams.get(`checkout[shipping_address][${field}]`)).toBe(value);
    expect(url.searchParams.has("checkout[shipping_address][province]")).toBe(false);
    expect(url.searchParams.has("checkout[shipping_address][zip]")).toBe(false);
  });

  it("retains a supplied postal code and does not invent guest email", () => {
    const url = new URL(buildPrefilledCheckoutUrl(
      "https://alclean.pk/checkouts/session", { ...address, zip: "75500" }, "",
    ));
    expect(url.searchParams.get("checkout[shipping_address][zip]")).toBe("75500");
    expect(url.searchParams.has("checkout[email]")).toBe(false);
  });
});
