import { ApiError, isCsrfFailure } from "./errors";
import { addPrelaunchAccessHeader } from "./prelaunch-access";

/**
 * The single transport used by the generated client (Orval mutator) on both server and browser.
 *
 * Browser: calls the same-origin Next.js BFF with credentials (session cookie `geniura_sid`), and
 * sends the masked csrf_token from GET /auth/csrf JSON in X-CSRFToken (ADR 0002).
 * The BFF bridges host-only HttpOnly cookies to the web origin.
 * Server: never sends cookies by itself; `lib/api/server.ts` passes them explicitly, and only
 * for requests that must act as the user. Nothing here caches responses.
 */

const CSRF_PATH = "/api/v1/auth/csrf";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const isBrowser = typeof window !== "undefined";

function apiUrl(path: string): string {
  if (isBrowser) return `/api/bff${path}`;
  const base =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://api-geniura.geniura.com";
  return `${base.replace(/\/$/, "")}${path}`;
}

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

/** Clear an in-memory CSRF token after login/logout (Django rotates it on login). */
export function clearCsrfToken() {
  csrfToken = null;
}

/**
 * Read masked CSRF from JSON; the CSRF cookie stays HttpOnly and is handled by the BFF.
 */
export async function ensureCsrfToken(force = false): Promise<string | undefined> {
  if (!isBrowser) return undefined;
  if (force) csrfToken = null;
  if (!force && csrfToken) return csrfToken;

  csrfRequest ??= fetch(apiUrl(CSRF_PATH), {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError(response.status, { code: "csrf_unavailable" });
      }
      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("csrf_token" in data) ||
        typeof data.csrf_token !== "string" ||
        !/^[A-Za-z0-9]{64}$/.test(data.csrf_token)
      ) {
        throw new ApiError(0, { code: "invalid_csrf_contract" });
      }
      csrfToken = data.csrf_token;
      return data.csrf_token;
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, { code: "network_error" });
    })
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
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

  const destination = apiUrl(url);
  if (!isBrowser) addPrelaunchAccessHeader(headers, destination);

  try {
    return await fetch(destination, {
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
  if (response.ok && isBrowser && method === "POST" && url === "/api/v1/auth/login") {
    clearCsrfToken();
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof body === "object" ? (body as ConstructorParameters<typeof ApiError>[1]) : undefined,
    );
  }
  return body as T;
};
