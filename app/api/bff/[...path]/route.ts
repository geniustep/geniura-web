import { allowedBackendPath } from "@/lib/api/bff-routes";
import { addPrelaunchAccessHeader } from "@/lib/api/prelaunch-access";

type Context = { params: Promise<{ path: string[] }> };
const COOKIE_NAMES = new Set(["geniura_sid", "geniura_csrftoken"]);
const MAX_BYTES = 24 * 1024 * 1024;
const INPUT_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "x-csrftoken",
  "idempotency-key",
  "x-request-id",
  "if-none-match",
] as const;
const OUTPUT_HEADERS = [
  "content-type",
  "content-disposition",
  "x-request-id",
  "retry-after",
  "allow",
] as const;

function reject(status: number, code: string): Response {
  return Response.json(
    { code, message: "Request rejected.", details: {}, request_id: "" },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = new URL(request.url).origin;
  const browserOrigin = request.headers.get("origin");
  if (browserOrigin) return browserOrigin === origin;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === origin;
  } catch {
    return false;
  }
}

function sessionCookies(raw: string | null): string {
  return (raw ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter((item) => {
      const equals = item.indexOf("=");
      return equals > 0 && COOKIE_NAMES.has(item.slice(0, equals));
    })
    .join("; ");
}

async function relay(request: Request, context: Context, method: string): Promise<Response> {
  const { path } = await context.params;
  if (!Array.isArray(path) || path.some((part) => !/^[A-Za-z0-9_.~:-]{1,512}$/.test(part))) {
    return reject(404, "not_found");
  }
  const matched = allowedBackendPath(`/${path.join("/")}`, method);
  if (!matched) return reject(404, "not_found");
  if (method !== "GET" && !isSameOrigin(request)) return reject(403, "origin_denied");

  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length > MAX_BYTES) return reject(413, "payload_too_large");
  let body: ArrayBuffer | undefined;
  if (method !== "GET") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BYTES) return reject(413, "payload_too_large");
  }

  const base =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://api-geniura.geniura.com";
  const origin = new URL(base).origin;
  const segments = path.map((part) => encodeURIComponent(part)).join("/");
  const destination = `${origin}/${segments}${matched.endsWith("/") ? "/" : ""}${new URL(request.url).search}`;

  const headers = new Headers();
  for (const name of INPUT_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookie = sessionCookies(request.headers.get("cookie"));
  if (cookie) headers.set("Cookie", cookie);
  // Browser-origin validation precedes this trusted server-to-server Origin header.
  // Django still verifies the CSRF cookie and X-CSRFToken on unsafe requests.
  if (method !== "GET") headers.set("Origin", origin);
  addPrelaunchAccessHeader(headers, destination);

  let upstream: Response;
  try {
    upstream = await fetch(destination, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return reject(502, "api_unavailable");
  }
  if (upstream.status >= 300 && upstream.status < 400) {
    return reject(502, "upstream_redirect_blocked");
  }

  const outgoing = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of OUTPUT_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) outgoing.set(name, value);
  }
  for (const raw of upstream.headers.getSetCookie()) {
    const name = raw.split("=", 1)[0]?.trim();
    if (name && COOKIE_NAMES.has(name)) {
      outgoing.append("Set-Cookie", raw.replace(/;\s*Domain=[^;]*/gi, ""));
    }
  }
  return new Response(upstream.body, { status: upstream.status, headers: outgoing });
}

export async function GET(request: Request, context: Context) {
  return relay(request, context, "GET");
}
export async function POST(request: Request, context: Context) {
  return relay(request, context, "POST");
}
export async function PUT(request: Request, context: Context) {
  return relay(request, context, "PUT");
}
export async function PATCH(request: Request, context: Context) {
  return relay(request, context, "PATCH");
}
export async function DELETE(request: Request, context: Context) {
  return relay(request, context, "DELETE");
}
