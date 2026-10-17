import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

// Until a launch is explicitly approved, nothing is crawlable. Private spaces stay disallowed
// afterwards too, and also carry `noindex`, because robots.txt is not an access control.
export default function robots(): MetadataRoute.Robots {
  if (!env.NEXT_PUBLIC_ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/account", "/*/employer", "/*/staff", "/*/apply", "/*/design-system"],
    },
  };
}
