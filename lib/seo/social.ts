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

const imageAlts: Record<string, string> = {
  ar: "Geniura — التوظيف وتطوير الكفاءات",
  fr: "Geniura — Recrutement et compétences",
  en: "Geniura — Recruitment and skills",
  es: "Geniura — Reclutamiento y competencias",
};

/** Open Graph locale (language_TERRITORY); the platform is Moroccan in every language. */
function ogLocale(locale: string): string {
  return `${locale}_MA`;
}

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
  const imageAlt = imageAlts[locale] ?? imageAlts.fr;

  const commonOpenGraph = {
    title,
    description,
    url,
    siteName: "Geniura",
    locale: ogLocale(locale),
    alternateLocale: routing.locales.filter((code) => code !== locale).map(ogLocale),
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
