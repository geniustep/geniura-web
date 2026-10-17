import { ApiError, isCsrfFailure } from "./errors";

/**
 * The single transport used by the generated client (Orval mutator) on both server and browser.
 *
 * Browser: calls the public Django origin with credentials (session cookie `geniura_sid`), and
 * echoes the `geniura_csrftoken` cookie in `X-CSRFToken` for unsafe methods (ADR 0002).
 * Server: never sends cookies by itself; `lib/api/server.ts` passes them explicitly, and only
 * for requests that must act as the user. Nothing here caches responses.
 */

export const CSRF_COOKIE = "geniura_csrftoken";
const CSRF_PATH = "/api/v1/auth/csrf";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const isBrowser = typeof window !== "undefined";

function apiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const url = isBrowser ? publicUrl : (process.env.API_BASE_URL ?? publicUrl);
  return url.replace(/\/$/, "");
}

export function readCookie(name: string): string | undefined {
  if (!isBrowser) return undefined;
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

let csrfRequest: Promise<void> | null = null;

/** Makes sure the CSRF cookie exists; concurrent callers share one request. */
export async function ensureCsrfToken(force = false): Promise<string | undefined> {
  if (!isBrowser) return undefined;
  if (force || !readCookie(CSRF_COOKIE)) {
    csrfRequest ??= fetch(`${apiBaseUrl()}${CSRF_PATH}`, { credentials: "include" })
      .then(() => undefined)
      .finally(() => {
        csrfRequest = null;
      });
    await csrfRequest;
  }
  return readCookie(CSRF_COOKIE);
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return response.json();
  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

async function send(url: string, init: RequestInit, method: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (isBrowser && !headers.has("Accept-Language") && document.documentElement.lang) {
    headers.set("Accept-Language", document.documentElement.lang);
  }
  if (isBrowser && UNSAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) headers.set("X-CSRFToken", token);
  }

  try {
    return await fetch(`${apiBaseUrl()}${url}`, {
      ...init,
      method,
      headers,
      credentials: isBrowser ? "include" : "omit",
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, { code: "network_error", message: String(cause) });
  }
}

export const apiFetch = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const method = (init.method ?? "GET").toUpperCase();
  let response = await send(url, init, method);

  // A rotated or missing CSRF token (e.g. after login) is refreshed once, then the request retried.
  if (isBrowser && response.status === 403 && UNSAFE_METHODS.has(method)) {
    const body = (await parseBody(response.clone())) as ConstructorParameters<typeof ApiError>[1];
    if (isCsrfFailure(new ApiError(403, body))) {
      await ensureCsrfToken(true);
      response = await send(url, init, method);
    }
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof body === "object" ? (body as ConstructorParameters<typeof ApiError>[1]) : undefined,
    );
  }
  return body as T;
};
