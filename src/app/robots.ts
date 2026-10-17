import type { MetadataRoute } from "next";

// Site is not launched. Do not index dev/preview or incomplete public experiences.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
