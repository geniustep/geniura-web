import { describe, expect, it } from "vitest";

import { env } from "@/lib/env";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildSiteIdentityGraph } from "@/lib/seo/site-identity";
import { buildSocialMetadata } from "@/lib/seo/social";

describe("social metadata", () => {
  it("generates canonical, absolute, locale-specific share URLs", () => {
    const result = buildSocialMetadata({
      locale: "ar",
      pathname: "/ar/jobs",
      title: "عروض العمل",
      description: "عروض عمل عامة",
    });

    expect(result.openGraph).toMatchObject({
      type: "website",
      url: new URL("/ar/jobs", env.NEXT_PUBLIC_SITE_URL).toString(),
      locale: "ar_MA",
      siteName: "Geniura",
      title: "عروض العمل",
      images: [
        {
          url: new URL("/ar/opengraph-image", env.NEXT_PUBLIC_SITE_URL).toString(),
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title: "عروض العمل",
    });
  });

  it("uses the job's own page rather than the homepage for an article", () => {
    const result = buildSocialMetadata({
      locale: "fr",
      pathname: "/fr/jobs/123",
      title: "Offre d'emploi",
      description: "Description",
      type: "article",
    });

    expect(result.openGraph).toMatchObject({
      type: "article",
      url: new URL("/fr/jobs/123", env.NEXT_PUBLIC_SITE_URL).toString(),
      locale: "fr_MA",
    });
  });
});

describe("public site JSON-LD", () => {
  it("identifies the brand and website without invented social or legal information", () => {
    const graph = buildSiteIdentityGraph();
    const data = JSON.parse(jsonLdScript(graph));
    const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;

    expect(data["@graph"]).toMatchObject([
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "Geniura",
        url: `${origin}/`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Geniura",
        url: `${origin}/`,
        inLanguage: ["ar", "fr", "en", "es"],
        publisher: { "@id": `${origin}/#organization` },
      },
    ]);
    expect(JSON.stringify(graph)).not.toContain("sameAs");
  });
});
