import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, errorMessageKey, fieldErrors, isCsrfFailure } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/fetcher";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("apiFetch (browser)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "geniura_csrftoken=token-1";
    document.documentElement.lang = "ar";
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    document.cookie = "geniura_csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("sends credentials and the interface language, without a CSRF header on GET", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await apiFetch("/api/v1/auth/me");
    const [url, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(url).toBe("http://localhost:8000/api/v1/auth/me");
    expect(init?.credentials).toBe("include");
    expect(headers.get("Accept-Language")).toBe("ar");
    expect(headers.has("X-CSRFToken")).toBe(false);
  });

  it("echoes the CSRF cookie on unsafe methods", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await apiFetch("/api/v1/auth/login", { method: "POST", body: "{}" });
    expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get("X-CSRFToken")).toBe("token-1");
  });

  it("refreshes the CSRF token once and retries after a CSRF rejection", async () => {
    fetchMock
      .mockResolvedValueOnce(
        json(403, {
          code: "permission_denied",
          message: "CSRF failed: CSRF token missing.",
          details: {},
          request_id: "r1",
        }),
      )
      .mockImplementationOnce(async () => {
        document.cookie = "geniura_csrftoken=token-2";
        return json(200, { detail: "CSRF cookie set." });
      })
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch("/api/v1/auth/logout", { method: "POST" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]![0]).toBe("http://localhost:8000/api/v1/auth/csrf");
    expect(new Headers(fetchMock.mock.calls[2]![1]?.headers).get("X-CSRFToken")).toBe("token-2");
  });

  it("does not retry a real permission error", async () => {
    fetchMock.mockResolvedValueOnce(
      json(403, {
        code: "permission_denied",
        message: "You do not have permission.",
        details: {},
        request_id: "r2",
      }),
    );
    await expect(apiFetch("/api/v1/x", { method: "POST" })).rejects.toMatchObject({
      status: 403,
      code: "permission_denied",
      request_id: "r2",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("turns a network failure into a typed error", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(apiFetch("/api/v1/jobs")).rejects.toMatchObject({
      status: 0,
      code: "network_error",
    });
  });
});

describe("API errors", () => {
  it("detects CSRF failures only from the CSRF message", () => {
    expect(isCsrfFailure(new ApiError(403, { message: "CSRF failed: token missing." }))).toBe(true);
    expect(isCsrfFailure(new ApiError(403, { message: "Not allowed." }))).toBe(false);
  });

  it("maps unknown codes to a generic message key", () => {
    expect(errorMessageKey(new ApiError(401, { code: "invalid_credentials" }))).toBe(
      "invalid_credentials",
    );
    expect(errorMessageKey(new ApiError(500, { code: "server_error" }))).toBe("unknown_error");
    expect(errorMessageKey(new Error("boom"))).toBe("unknown_error");
  });

  it("reads both shapes of Django field errors", () => {
    const byField = new ApiError(400, {
      code: "validation_error",
      details: { fields: { email: ["Enter a valid email."], non_field_errors: ["Mismatch."] } },
    });
    expect(fieldErrors(byField)).toEqual({
      byField: { email: "Enter a valid email." },
      general: ["Mismatch."],
    });

    const list = new ApiError(400, {
      code: "validation_error",
      details: { fields: ["Too short."] },
    });
    expect(fieldErrors(list)).toEqual({ byField: {}, general: ["Too short."] });
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/account", "/account"],
    ["/account/sessions?tab=1", "/account/sessions?tab=1"],
    ["//evil.example/steal", "/account"],
    ["https://evil.example", "/account"],
    ["/\\evil.example", "/account"],
    ["javascript:alert(1)", "/account"],
    ["/ok\u0000", "/account"],
    [undefined, "/account"],
  ])("%s → %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
});
