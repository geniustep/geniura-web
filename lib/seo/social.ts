import type { Metadata } from "next";

import { env } from "@/lib/env";
import { routing } from "@/lib/i18n/routing";

type SocialMetadataOptions = {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  type?: "website" | "article";
};

/** Share previews are page-specific; never use the homepage as every page's og:url. */
export function buildSocialMetadata({
  locale,
  pathname,
  title,
  description,
  type = "website",
}: SocialMetadataOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const url = new URL(pathname, env.NEXT_PUBLIC_SITE_URL).toString();
  const imageUrl = new URL(`/${locale}/opengraph-image`, env.NEXT_PUBLIC_SITE_URL).toString();
  const imageAlt =
    locale === "ar" ? "Geniura — التوظيف وتطوير الكفاءات" : "Geniura — Recrutement et compétences";

  const commonOpenGraph = {
    title,
    description,
    url,
    siteName: "Geniura",
    locale: locale === "ar" ? "ar_MA" : "fr_MA",
    alternateLocale: routing.locales
      .filter((code) => code !== locale)
      .map((code) => (code === "ar" ? "ar_MA" : "fr_MA")),
    images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
  };

  return {
    openGraph:
      type === "article"
        ? { ...commonOpenGraph, type: "article" }
        : { ...commonOpenGraph, type: "website" },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
