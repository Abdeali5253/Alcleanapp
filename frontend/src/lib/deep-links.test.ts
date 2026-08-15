import { describe, expect, it } from "vitest";
import { getAllowedDeepLinkPath } from "./deep-links";

describe("deep-link allowlist", () => {
  it.each([
    "https://alclean.pk/account",
    "https://alclean.pk/account?ignored=1",
    "alclean://account",
    "com.alclean.app://account",
  ])("accepts the exact account destination: %s", (url) => {
    expect(getAllowedDeepLinkPath(url)).toBe("/account");
  });

  it.each([
    "http://alclean.pk/account",
    "https://evil.example/account",
    "https://alclean.pk.evil.example/account",
    "https://alclean.pk:444/account",
    "https://alclean.pk/account/extra",
    "https://alclean.pk/checkout/success",
    "alclean://checkout/success",
    "alclean://account/extra",
    "javascript:alert(1)",
    "not a url",
  ])("rejects hostile or non-allowlisted destinations: %s", (url) => {
    expect(getAllowedDeepLinkPath(url)).toBeNull();
  });
});
