import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { locales } from "@/lib/i18n/config";
import { routing } from "@/lib/i18n/routing";

// Locale negotiation (cookie, then Accept-Language) and HTTP status for unknown jobs.
// This is NOT an authorization layer: every permission is decided by the Django API.
const handleI18n = createMiddleware(routing);

const jobPath = new RegExp(`^/(${locales.join("|")})/jobs/([^/]+)/?$`);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;
const known = new Map<string, { exists: boolean; at: number }>();

/**
 * Pages stream their prerendered shell immediately, so a page cannot turn into a 404 once it has
 * started. Job pages therefore check existence here, before rendering: expired, held or unknown
 * jobs get a real 404 (Google's expired-job guidance), not a "soft 404". Public data only; an API
 * outage lets the page render and explain the problem instead of claiming the job is gone.
 */
async function jobExists(id: string): Promise<boolean> {
  if (!uuid.test(id)) return false;
  const cached = known.get(id);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.exists;

  const base = (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/api/v1/jobs/${id}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (response.status !== 200 && response.status !== 404) return true;
    const exists = response.status === 200;
    if (known.size >= MAX_ENTRIES) known.clear();
    known.set(id, { exists, at: Date.now() });
    return exists;
  } catch {
    return true;
  }
}

export default async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(jobPath);
  if (match && !(await jobExists(match[2]!))) {
    // Any unknown path under the locale renders the prerendered, localized 404 with status 404.
    return NextResponse.rewrite(new URL(`/${match[1]}/_missing-job`, request.url));
  }
  return handleI18n(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (robots.txt, favicon, fonts…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
