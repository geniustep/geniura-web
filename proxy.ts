import createMiddleware from "next-intl/middleware";

import { routing } from "@/lib/i18n/routing";

// Locale negotiation only (cookie, then Accept-Language). This is NOT an authorization layer:
// every permission is decided by the Django API.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and files with an extension (robots.txt, favicon, fonts…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
