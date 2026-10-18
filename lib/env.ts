import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment. Server variables never reach the client bundle; only NEXT_PUBLIC_*
 * values do, so none of them may hold a secret (this repository is public).
 */
export const env = createEnv({
  server: {
    // Origin the Next.js server uses to reach Django (may be an internal address).
    // Defaults to the public API origin.
    API_BASE_URL: z.url().optional(),
  },
  client: {
    // Never emit localhost URLs in production sitemap/metadata when a deploy omits the variable.
    // Local development still opts into localhost explicitly via .env.local.
    NEXT_PUBLIC_SITE_URL: z.url().default("https://geniura.com"),
    // Public Django origin the browser calls with credentials, e.g. https://api-geniura.geniura.com.
    NEXT_PUBLIC_API_BASE_URL: z.url().default("https://api-geniura.geniura.com"),
    NEXT_PUBLIC_ALLOW_INDEXING: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  },
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
  },
  emptyStringAsUndefined: true,
});
