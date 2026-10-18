import { env } from "@/lib/env";
import { routing } from "@/lib/i18n/routing";

/** Public brand identity only. Do not invent legal names, social handles or a final logo. */
export function buildSiteIdentityGraph() {
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
  const organizationId = `${origin}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Geniura",
        url: `${origin}/`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Geniura",
        url: `${origin}/`,
        inLanguage: [...routing.locales],
        publisher: { "@id": organizationId },
      },
    ],
  };
}
