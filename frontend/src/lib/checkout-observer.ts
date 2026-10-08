// Read only rendered confirmation signals. Never read contact/address fields
// or use these signals to confirm payment or clear the cart.
export const CHECKOUT_RETURN_PROBE = `(() => {
  const text = document.body ? (document.body.innerText || document.body.textContent || "") : "";
  return {
    url: location.href,
    confirmationShown: /your\\s+order\\s+is\\s+confirmed/i.test(text) && /thank\\s+you[,!]/i.test(text)
  };
})()`;

interface CheckoutBrowser {
  executeScript(options: { code: string }, callback: (results: unknown[]) => void): void;
}

export function observeHostedCheckoutConfirmation(
  browser: CheckoutBrowser,
  initialUrl: string,
  onReturn: (url: string) => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { stopped = true; if (timer) clearInterval(timer); };
  const inspect = () => {
    if (stopped) return;
    try {
      browser.executeScript({ code: CHECKOUT_RETURN_PROBE }, (results) => {
        if (stopped) return;
        try {
          const value = typeof results?.[0] === "string" ? JSON.parse(results[0]) : results?.[0];
          if (!value || typeof value !== "object") return;
          const result = value as { url?: string; confirmationShown?: boolean };
          if (result.confirmationShown !== true || !result.url) return;
          const url = new URL(result.url);
          const hosts = new Set([new URL(initialUrl).hostname, "alclean.pk", "checkout.shopify.com"]);
          if (url.protocol !== "https:" || url.port || url.username || url.password || !hosts.has(url.hostname)) return;
          stop();
          onReturn(result.url);
        } catch {}
      });
    } catch {}
  };
  timer = setInterval(inspect, 1000);
  inspect();
  return stop;
}
