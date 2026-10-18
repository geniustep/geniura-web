// @vitest-environment node

import { readFileSync } from "node:fs";

import { parse } from "yaml";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/bff/[...path]/route";
import { allowedBackendPath, publicApiRoutes } from "@/lib/api/bff-routes";

const base = "https://geniura.com/api/bff";
const ctx = (path: string) => ({
  params: Promise.resolve({ path: path.split("/").filter(Boolean) }),
});

function serverHeaders(request: Request, extra: Record<string, string>): Request {
  const get = request.headers.get.bind(request.headers);
  vi.spyOn(request.headers, "get").mockImplementation(
    (name) => extra[name.toLowerCase()] ?? get(name),
  );
  return request;
}

describe("BFF route, cookie and CSRF isolation", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("matches every public route and method in the pinned OpenAPI contract", () => {
    const source = readFileSync("contracts/openapi.web.v1.yaml", "utf8");
    const schema = parse(source) as { paths: Record<string, Record<string, unknown>> };
    const methods = ["get", "post", "put", "patch", "delete"];
    const expected = Object.fromEntries(
      Object.entries(schema.paths).map(([path, operations]) => [
        path,
        methods.filter((method) => method in operations).map((method) => method.toUpperCase()),
      ]),
    );
    expect(publicApiRoutes).toEqual(expected);
  });

  it("permits only declared public paths and HTTP methods", () => {
    expect(Object.keys(publicApiRoutes)).toHaveLength(113);
    expect(Object.values(publicApiRoutes).flat()).toHaveLength(149);
    expect(allowedBackendPath("/api/v1/staff/metrics", "GET")).toBeNull();
    expect(allowedBackendPath("/api/v1/files/verification-documents/token", "GET")).toBeNull();
    expect(allowedBackendPath("/api/v1/organizations", "POST")).toBe("/api/v1/organizations/");
    expect(allowedBackendPath("/api/v1/auth/login", "DELETE")).toBeNull();
  });

  it("denies internal downloads before any network request", async () => {
    const path = "api/v1/files/verification-documents/token";
    const response = await GET(new Request(`${base}/${path}`), ctx(path));
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only forwards session/CSRF cookies and rewrites Set-Cookie as host-only", async () => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append(
      "Set-Cookie",
      "geniura_sid=abc; Domain=.geniura.com; Path=/; HttpOnly; Secure; SameSite=Lax",
    );
    headers.append("Set-Cookie", "tracking=bad; Path=/");
    fetchMock.mockResolvedValueOnce(new Response('{"id":1}', { status: 200, headers }));
    const path = "api/v1/auth/me";
    const response = await GET(
      serverHeaders(new Request(`${base}/${path}`), {
        cookie: "tracking=bad; geniura_sid=abc; geniura_csrftoken=xyz",
      }),
      ctx(path),
    );
    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api-geniura.geniura.com/api/v1/auth/me");
    expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get("Cookie")).toBe(
      "geniura_sid=abc; geniura_csrftoken=xyz",
    );
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).not.toMatch(/domain=/i);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("rejects cross-site and originless POSTs", async () => {
    const path = "api/v1/auth/login";
    const missing = await POST(
      new Request(`${base}/${path}`, { method: "POST", body: "{}" }),
      ctx(path),
    );
    const attack = await POST(
      serverHeaders(
        new Request(`${base}/${path}`, {
          method: "POST",
          body: "{}",
        }),
        { origin: "https://evil.example" },
      ),
      ctx(path),
    );
    expect(missing.status).toBe(403);
    expect(attack.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards masked CSRF and server-to-server Origin", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const path = "api/v1/auth/login";
    const response = await POST(
      serverHeaders(
        new Request(`${base}/${path}`, {
          method: "POST",
          headers: { "X-CSRFToken": "masked", "Content-Type": "application/json" },
          body: '{"email":"a@example.test"}',
        }),
        { origin: "https://geniura.com", cookie: "geniura_csrftoken=abc" },
      ),
      ctx(path),
    );
    expect(response.status).toBe(200);
    const h = new Headers(fetchMock.mock.calls[0]![1]?.headers);
    expect(h.get("Origin")).toBe("https://api-geniura.geniura.com");
    expect(h.get("X-CSRFToken")).toBe("masked");
    expect(h.get("Cookie")).toBe("geniura_csrftoken=abc");
  });

  it("does not relay a spoofed prelaunch key from the browser", async () => {
    const path = "api/v1/auth/me";
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const response = await GET(
      new Request(`${base}/${path}`, {
        headers: { "X-Geniura-Prelaunch-Key": "fake-browser-key" },
      }),
      ctx(path),
    );
    expect(response.status).toBe(200);
    const forwarded = new Headers(fetchMock.mock.calls[0]![1]?.headers);
    expect(forwarded.has("X-Geniura-Prelaunch-Key")).toBe(false);
  });

  it("blocks backend redirects and does not leak Location", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { Location: "https://evil.example" } }),
    );
    const path = "api/v1/auth/me";
    const response = await GET(new Request(`${base}/${path}`), ctx(path));
    expect(response.status).toBe(502);
    expect(response.headers.get("location")).toBeNull();
  });
});
