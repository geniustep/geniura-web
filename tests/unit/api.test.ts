import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, errorMessageKey, fieldErrors, isCsrfFailure } from "@/lib/api/errors";
import { apiFetch, clearCsrfToken } from "@/lib/api/fetcher";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("apiFetch (browser)", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const tokenOne = "a".repeat(64);
  const tokenTwo = "b".repeat(64);

  beforeEach(() => {
    clearCsrfToken();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    document.documentElement.lang = "ar";
  });

  afterEach(() => {
    clearCsrfToken();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("sends credentials and interface language without CSRF on GET", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await apiFetch("/api/v1/auth/me");
    const [url, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(url).toBe("/api/bff/api/v1/auth/me");
    expect(init?.credentials).toBe("include");
    expect(headers.get("Accept-Language")).toBe("ar");
    expect(headers.has("X-CSRFToken")).toBe(false);
  });

  it("gets masked token from JSON, never document.cookie", async () => {
    document.cookie = "geniura_csrftoken=unrelated-host-cookie";
    fetchMock.mockResolvedValueOnce(
      json(200, { detail: "CSRF cookie set.", csrf_token: tokenOne }),
    );
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await apiFetch("/api/v1/auth/login", { method: "POST", body: "{}" });
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/bff/api/v1/auth/csrf");
    expect(fetchMock.mock.calls[0]![1]?.credentials).toBe("include");
    expect(new Headers(fetchMock.mock.calls[1]![1]?.headers).get("X-CSRFToken")).toBe(tokenOne);
  });

  it("renews JSON token on CSRF failure and retries once", async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { csrf_token: tokenOne }))
      .mockResolvedValueOnce(
        json(403, {
          code: "csrf_failed",
          message: "CSRF verification failed.",
          details: {},
        }),
      )
      .mockResolvedValueOnce(json(200, { csrf_token: tokenTwo }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch("/api/v1/auth/logout", { method: "POST" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(new Headers(fetchMock.mock.calls[1]![1]?.headers).get("X-CSRFToken")).toBe(tokenOne);
    expect(new Headers(fetchMock.mock.calls[3]![1]?.headers).get("X-CSRFToken")).toBe(tokenTwo);
  });

  it("refetches token on next write after successful login", async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { csrf_token: tokenOne }))
      .mockResolvedValueOnce(json(200, { id: "user" }))
      .mockResolvedValueOnce(json(200, { csrf_token: tokenTwo }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    await apiFetch("/api/v1/auth/login", { method: "POST", body: "{}" });
    await apiFetch("/api/v1/me/preferences", { method: "PATCH", body: "{}" });
    expect(new Headers(fetchMock.mock.calls[3]![1]?.headers).get("X-CSRFToken")).toBe(tokenTwo);
  });

  it("rejects a missing token without sending an unsafe request", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { detail: "CSRF cookie set." }));
    await expect(apiFetch("/api/v1/auth/login", { method: "POST" })).rejects.toMatchObject({
      code: "invalid_csrf_contract",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a real permission error", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { csrf_token: tokenOne }));
    fetchMock.mockResolvedValueOnce(
      json(403, { code: "permission_denied", message: "You do not have permission.", details: {} }),
    );
    await expect(apiFetch("/api/v1/x", { method: "POST" })).rejects.toMatchObject({
      status: 403,
      code: "permission_denied",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
  it("detects CSRF failures from stable codes and supported legacy errors", () => {
    const legacyCsrf = new ApiError(403, {
      code: "permission_denied",
      message: "CSRF failed: token missing.",
    });
    const forbidden = new ApiError(403, {
      code: "permission_denied",
      message: "Not allowed.",
    });
    expect(isCsrfFailure(new ApiError(403, { code: "csrf_failed" }))).toBe(true);
    expect(isCsrfFailure(legacyCsrf)).toBe(true);
    expect(isCsrfFailure(forbidden)).toBe(false);
    expect(isCsrfFailure(new ApiError(401, { code: "csrf_failed" }))).toBe(false);
  });

  it("maps unknown codes to a generic message key", () => {
    expect(errorMessageKey(new ApiError(401, { code: "invalid_credentials" }))).toBe(
      "invalid_credentials",
    );
    expect(errorMessageKey(new ApiError(403, { code: "csrf_failed" }))).toBe("csrf_failed");
    expect(errorMessageKey(new ApiError(500, { code: "server_error" }))).toBe("unknown_error");
    expect(errorMessageKey(new Error("boom"))).toBe("unknown_error");
  });

  it("explains a disabled CV feature and masked upstream 503 without leaking server text", () => {
    expect(errorMessageKey(new ApiError(503, { code: "feature_disabled" }))).toBe(
      "feature_disabled",
    );
    expect(errorMessageKey(new ApiError(503, { code: "unknown_error" }))).toBe(
      "service_unavailable",
    );
    expect(errorMessageKey(new ApiError(503, undefined))).toBe("service_unavailable");
    expect(errorMessageKey(new ApiError(503, { code: "not_authenticated" }))).toBe(
      "not_authenticated",
    );
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
