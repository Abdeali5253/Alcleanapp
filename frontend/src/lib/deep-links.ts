export function getAllowedDeepLinkPath(rawUrl: string): "/account" | null {
  try {
    const url = new URL(rawUrl);
    const protocol = url.protocol.toLowerCase();
    if (
      protocol === "https:" &&
      url.hostname.toLowerCase() === "alclean.pk" &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === "/account"
    ) {
      return "/account";
    }
    if (protocol === "alclean:" || protocol === "com.alclean.app:") {
      const path = url.host ? `/${url.host}${url.pathname}` : url.pathname;
      return path === "/account" ? "/account" : null;
    }
  } catch {}
  return null;
}
