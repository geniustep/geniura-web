import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

// Static CSP without nonces, so public pages keep their prerendered shell (a nonce forces dynamic
// rendering). `'unsafe-inline'` for scripts remains required by Next.js inline bootstrapping until
// hash-based SRI is adopted; the other directives still block framing, plugins, foreign form
// targets, and browser network calls outside this origin (Django is reached server-side).
const contentSecurityPolicy = [
  "default-src 'self'",
  // Cloudflare's analytics beacon is injected by the hosting layer, not by Next.js.
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Pages that may contain a user's data must never be stored by a shared cache.
const privateNoStore = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:locale/account", headers: privateNoStore },
      { source: "/:locale/account/:path*", headers: privateNoStore },
    ];
  },
};

export default withNextIntl(nextConfig);
