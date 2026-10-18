# Geniura — SEO / AEO / Social Discovery Readiness

Updated: 2026-10-18. Scope: `geniura-web` / `dev`; **not production activation**.

## Implemented in source

- Public URL: `NEXT_PUBLIC_SITE_URL` defaults to `https://geniura.com` to prevent publishing `localhost:3000` sitemap/canonical URLs when the value is absent. Set it explicitly in Vercel Production; local development may opt into `localhost` via `.env.local`.
- Localized public canonical/hreflang remain in place. Sitemap is assembled from public home, job listings, and published job pages. Do not include private routes.
- Localized Open Graph and Twitter/X Card metadata now cover home, job listings, and individual job details, with absolute `og:url` and 1200×630 generated PNG share images. These images are **temporary**, typography-only, pending approval of the final visual identity.
- `Organization` and `WebSite` JSON-LD identify the public Geniura brand and domain on localized homepages. No unverified legal name, address, logo, or social profile URLs are asserted.
- Existing `JobPosting` JSON-LD stays on individual published job pages only.
- With `NEXT_PUBLIC_ALLOW_INDEXING=false`, `robots.txt` still returns `Disallow: /` and page metadata stays `noindex, nofollow`. The sitemap link is advertised by robots **only once indexing is approved and enabled**.

## Release gate (requires explicit approval)

1. Confirm that the final approved `dev` commit passes `pnpm check`, `pnpm build`, and Playwright E2E, including image generation.
2. Confirm Vercel Production `NEXT_PUBLIC_SITE_URL=https://geniura.com`, and check canonical host/HTTPS consistency, redirects, and metadata on both `/ar` and `/fr`.
3. Approve and deploy the exact commit to Production only after checking remaining functional dependencies (including public Django API availability).
4. Independently approve enabling `NEXT_PUBLIC_ALLOW_INDEXING=true` **when the public site is launch-ready**. Never index candidate, employer-private, account or staff spaces.
5. Check deployed `/robots.txt`, `/sitemap.xml`, OG images, page source, response codes, and structured data. Check jobs with actual eligible public job records; an empty or unavailable API must not create false offers.
6. Submit `https://geniura.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools only after the release gate; monitor indexing/errors. Structured data enables interpretation but **does not guarantee** rich results or AI citations.
7. Replace the temporary share images with approved brand assets; add `Organization.logo` and `sameAs` only after verification of the final logo and official social profiles.

Do not remove `noindex`, enable indexing, merge to `main`, or deploy solely because this document was updated.
