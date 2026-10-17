/**
 * Accepts only same-site relative paths for post-login redirects (no open redirects).
 * Returns the fallback for absolute URLs, protocol-relative URLs (`//evil`), backslash tricks
 * and anything that is not a plain path.
 */
export function safeRedirectPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://geniura.invalid");
    if (url.origin !== "https://geniura.invalid") return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
