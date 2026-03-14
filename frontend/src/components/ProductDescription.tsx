import { useMemo } from "react";

import { Product } from "../types/shopify";

interface ProductDescriptionProps {
  product: Pick<Product, "description" | "descriptionHtml">;
  className?: string;
}

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);

const URL_ATTRS = new Set(["href", "src"]);
const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

interface LinkResolution {
  href: string;
  internal: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripCssNoise(text: string): string {
  return text
    .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, " ")
    .replace(/[.#]?[a-zA-Z0-9_-]+\s+[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, " ")
    .replace(/[a-z-]+\s*:\s*[^;{}]+;?/gi, " ")
    .replace(/[{}]/g, " ")
    .replace(/\/\*/g, " ")
    .replace(/\*\//g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseBundleDescription(text: string): string {
  if (!text) {
    return "";
  }

  const normalizedText = text.replace(/\\"/g, '"');
  const hasBundleMarker = /Bundle Includes:/i.test(normalizedText);
  const hasBundleCss = /\.bundle-[a-z0-9_-]+/i.test(normalizedText);

  if (!hasBundleMarker && !hasBundleCss) {
    return "";
  }

  const bundleSection = hasBundleMarker
    ? normalizedText.split(/Bundle Includes:/i).slice(1).join(" ").trim()
    : normalizedText;

  const quotedItems = Array.from(bundleSection.matchAll(/"([^"]+)"/g))
    .map((match) => match[1].trim())
    .filter(Boolean);

  if (quotedItems.length > 0) {
    const listHtml = quotedItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return `<p><strong>Bundle Includes:</strong></p><ul>${listHtml}</ul>`;
  }

  const fallbackLines = bundleSection
    .replace(/\.bundle-[a-z0-9_-]+[^"]*/gi, " ")
    .replace(/\bView Product\b/gi, "\n")
    .replace(/[{}]/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith("."));

  if (fallbackLines.length === 0) {
    return `<p><strong>Bundle Includes:</strong></p>`;
  }

  const listItems = fallbackLines
    .map((line) => line.replace(/^"+|"+$/g, "").trim())
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  if (!listItems) {
    return `<p><strong>Bundle Includes:</strong></p>`;
  }

  return `<p><strong>Bundle Includes:</strong></p><ul>${listItems}</ul>`;
}

function formatBundleText(text: string): string {
  const parsedBundle = parseBundleDescription(text);
  if (parsedBundle) {
    return parsedBundle;
  }

  const cleaned = stripCssNoise(text);
  const normalized = cleaned
    .replace(/Bundle Includes:?/gi, "\nBundle Includes:\n")
    .replace(/\s+View Product/gi, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function isSafeUrl(value: string): boolean {
  try {
    const parsed = new URL(value, window.location.origin);
    return SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

function resolveAppLink(value: string): LinkResolution | null {
  try {
    const parsed = new URL(value, window.location.origin);
    const isAlCleanHost =
      parsed.hostname === "alclean.pk" ||
      parsed.hostname === "www.alclean.pk" ||
      parsed.hostname === window.location.hostname;

    if (isAlCleanHost) {
      const pathMatch = parsed.pathname.match(
        /\/products\/([^/?#]+)|\/collections\/[^/]+\/products\/([^/?#]+)/i,
      );
      const handle = pathMatch?.[1] || pathMatch?.[2];
      if (handle) {
        return {
          href: `#/product/${encodeURIComponent(handle)}`,
          internal: true,
        };
      }
    }

    if (SAFE_PROTOCOLS.includes(parsed.protocol)) {
      return { href: parsed.toString(), internal: false };
    }

    return null;
  } catch {
    return null;
  }
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html.trim()) {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("script, style, iframe, object, embed, form").forEach((node) => {
    node.remove();
  });

  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes)
      .map(sanitizeNode)
      .join("");

    if (!ALLOWED_TAGS.has(tag)) {
      return children;
    }

    const attrs: string[] = [];

    if (tag === "a") {
      const href = element.getAttribute("href");
      const resolvedLink = href ? resolveAppLink(href) : null;
      if (resolvedLink) {
        attrs.push(`href="${escapeHtml(resolvedLink.href)}"`);
        if (resolvedLink.internal) {
          attrs.push('data-internal-link="true"');
        } else {
          attrs.push('target="_blank"');
          attrs.push('rel="noopener noreferrer nofollow"');
        }
      }
    }

    if (tag === "img") {
      const src = element.getAttribute("src");
      if (!src || !isSafeUrl(src)) {
        return "";
      }
      attrs.push(`src="${escapeHtml(src)}"`);
      const alt = element.getAttribute("alt");
      if (alt) {
        attrs.push(`alt="${escapeHtml(alt)}"`);
      }
      attrs.push('loading="lazy"');
      return `<img ${attrs.join(" ")} />`;
    }

    for (const { name, value } of Array.from(element.attributes)) {
      const attrName = name.toLowerCase();
      if (attrName === "class" || attrName === "style" || attrName.startsWith("on")) {
        continue;
      }
      if (URL_ATTRS.has(attrName)) {
        continue;
      }
      if (["title", "aria-label"].includes(attrName)) {
        attrs.push(`${attrName}="${escapeHtml(value)}"`);
      }
    }

    const attrText = attrs.length ? ` ${attrs.join(" ")}` : "";
    return `<${tag}${attrText}>${children}</${tag}>`;
  };

  return Array.from(doc.body.childNodes)
    .map(sanitizeNode)
    .join("")
    .trim();
}

function normalizePlainText(text: string): string {
  const cleaned = formatBundleText(text);
  if (cleaned) {
    return cleaned;
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export function ProductDescription({
  product,
  className = "",
}: ProductDescriptionProps) {
  const isBundleDescription = useMemo(() => {
    const source = `${product.descriptionHtml || ""} ${product.description || ""}`;
    return /Bundle Includes:|\.bundle-[a-z0-9_-]+/i.test(source);
  }, [product.description, product.descriptionHtml]);

  const html = useMemo(() => {
    const sanitized = sanitizeHtml(product.descriptionHtml || "");
    if (sanitized) {
      return sanitized;
    }

    return normalizePlainText(product.description || "");
  }, [product.description, product.descriptionHtml]);

  if (!html) {
    return null;
  }

  return (
    <div
      className={[
        "product-description space-y-3 text-gray-600",
        "[&_a]:text-[#6DB33F] [&_a]:underline [&_a]:underline-offset-4",
        "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900",
        "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900",
        "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-900",
        isBundleDescription
          ? "[&_img]:my-2 [&_img]:h-16 [&_img]:w-16 [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:object-contain"
          : "[&_img]:my-4 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200",
        "[&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1",
        "[&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2",
        "[&_p]:leading-relaxed [&_p]:mb-3",
        "[&_ul]:space-y-2",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
