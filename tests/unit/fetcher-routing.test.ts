import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, clearCsrfToken } from "@/lib/api/fetcher";
afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfToken();
});
describe("browser BFF slash normalization", () => {
  it("uses a redirect-free organization list URL and keeps query parameters", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    await apiFetch("/api/v1/organizations/?page=2");
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/bff/api/v1/organizations?page=2");
  });
  it("sends organization creation directly to the BFF while retaining CSRF", async () => {
    const fetch = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.endsWith("/auth/csrf") ? { csrf_token: "a".repeat(64) } : { id: "org" },
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
      );
    vi.stubGlobal("fetch", fetch);
    await apiFetch("/api/v1/organizations/", {
      method: "POST",
      body: JSON.stringify({ legal_name: "Synthetic" }),
    });
    const call = fetch.mock.calls.find((c) => c[1]?.method === "POST");
    expect(call?.[0]).toBe("/api/bff/api/v1/organizations");
    expect(new Headers(call?.[1].headers).get("X-CSRFToken")).toBe("a".repeat(64));
    expect(call?.[1].credentials).toBe("include");
  });
});
