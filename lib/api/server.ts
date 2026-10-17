import "server-only";

import { cookies, headers } from "next/headers";

import { ApiError } from "./errors";
import { authMeRetrieve } from "./generated/endpoints/me/me";
import type { Me } from "./generated/model";

/** Only the Django session and CSRF cookies are forwarded, never the browser's other cookies. */
const FORWARDED_COOKIES = ["geniura_sid", "geniura_csrftoken"];

/**
 * Request options that make a server-side call act as the current visitor.
 * Never use them inside a `'use cache'` scope: responses would be shared between users.
 */
export async function withSession(locale?: string): Promise<RequestInit> {
  const store = await cookies();
  const cookieHeader = FORWARDED_COOKIES.flatMap((name) => {
    const value = store.get(name)?.value;
    return value ? [`${name}=${value}`] : [];
  }).join("; ");

  const forwarded = new Headers();
  if (cookieHeader) forwarded.set("Cookie", cookieHeader);
  if (locale) forwarded.set("Accept-Language", locale);
  const userAgent = (await headers()).get("user-agent");
  if (userAgent) forwarded.set("User-Agent", userAgent);
  return { headers: forwarded };
}

/** Current user from Django, or null when there is no valid session. */
export async function getSession(locale?: string): Promise<Me | null> {
  const init = await withSession(locale);
  if (!new Headers(init.headers).has("Cookie")) return null;
  try {
    return await authMeRetrieve(init);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}
