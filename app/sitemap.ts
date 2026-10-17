import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { getJobsPage } from "@/lib/api/public";
import { env } from "@/lib/env";
import { routing } from "@/lib/i18n/routing";

const MAX_JOB_PAGES = 100; // × 50 = up to 5,000 jobs; split with generateSitemaps beyond that.

/**
 * Public pages and published jobs only (never candidate, account or employer pages).
 * Expired or held jobs disappear because the API no longer lists them.
 * `lastModified` uses `published_at` until the API exposes `updated_at` (coordination item 6).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // built per request, never baked into the build
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const languages = (path: string) =>
    Object.fromEntries(routing.locales.map((locale) => [locale, `${base}/${locale}${path}`]));

  const entries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => [
    { url: `${base}/${locale}`, alternates: { languages: languages("") } },
    { url: `${base}/${locale}/jobs`, alternates: { languages: languages("/jobs") } },
  ]);

  try {
    for (let page = 1; page <= MAX_JOB_PAGES; page++) {
      const data = await getJobsPage({
        sort: "newest",
        page_size: 50,
        ...(page > 1 ? { page } : {}),
      });
      for (const job of data.results) {
        const locale = (routing.locales as readonly string[]).includes(job.source_locale)
          ? job.source_locale
          : routing.defaultLocale;
        entries.push({
          url: `${base}/${locale}/jobs/${job.id}`,
          ...(job.published_at ? { lastModified: job.published_at } : {}),
        });
      }
      if (!data.next) break;
    }
  } catch {
    // The static entries are still useful when the API is unavailable.
  }
  return entries;
}
