import "server-only";

import type { Me } from "@/lib/api/generated/model";
import { getSession } from "@/lib/api/server";
import { redirect } from "@/lib/i18n/navigation";

/**
 * Server-side gate for private pages: asks Django who the visitor is (Django is the authority)
 * and sends anonymous visitors to the login page with a safe return path.
 * Call it only inside a Suspense boundary: it reads request cookies.
 */
export async function requireSession(locale: string, returnTo: string): Promise<Me> {
  const me = await getSession(locale);
  if (!me) {
    return redirect({ href: { pathname: "/login", query: { next: returnTo } }, locale });
  }
  return me;
}
