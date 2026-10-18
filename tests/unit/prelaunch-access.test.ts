// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { addPrelaunchAccessHeader, PRELAUNCH_ACCESS_HEADER } from "@/lib/api/prelaunch-access";

const origin = "https://api-geniura.geniura.com";
const secret = "A".repeat(43);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("server-only prelaunch API access", () => {
  it("does not send any secret unless configured", () => {
    vi.stubEnv("GENIURA_PRELAUNCH_API_KEY", "");
    const headers = new Headers();
    addPrelaunchAccessHeader(headers, `${origin}/api/v1/auth/csrf`);
    expect(headers.has(PRELAUNCH_ACCESS_HEADER)).toBe(false);
  });

  it("sends a configured credential only to the approved HTTPS origin", () => {
    vi.stubEnv("GENIURA_PRELAUNCH_API_KEY", secret);
    const headers = new Headers();
    addPrelaunchAccessHeader(headers, `${origin}/api/v1/auth/csrf`);
    expect(headers.get(PRELAUNCH_ACCESS_HEADER)).toBe(secret);
  });

  it("refuses untrusted destinations even when a valid secret exists", () => {
    vi.stubEnv("GENIURA_PRELAUNCH_API_KEY", secret);
    for (const destination of [
      "https://evil.invalid",
      "https://api-geniura.geniura.com.evil.invalid/api/v1/auth/csrf",
      "http://api-geniura.geniura.com/api/v1/auth/csrf",
      "https://api-geniura.geniura.com:8443/api/v1/auth/csrf",
      "http://127.0.0.1:18080/api/v1/auth/csrf",
      "/api/v1/auth/csrf",
    ]) {
      const headers = new Headers();
      addPrelaunchAccessHeader(headers, destination);
      expect(headers.has(PRELAUNCH_ACCESS_HEADER)).toBe(false);
    }
  });

  it("fails closed on malformed credential", () => {
    vi.stubEnv("GENIURA_PRELAUNCH_API_KEY", "weak");
    expect(() => addPrelaunchAccessHeader(new Headers(), origin)).toThrow(
      "Invalid GENIURA_PRELAUNCH_API_KEY configuration",
    );
  });

  it("never adds a credential to requests originating in the browser", () => {
    vi.stubEnv("GENIURA_PRELAUNCH_API_KEY", secret);
    vi.stubGlobal("window", {});
    const headers = new Headers();
    addPrelaunchAccessHeader(headers, origin);
    expect(headers.has(PRELAUNCH_ACCESS_HEADER)).toBe(false);
  });
});
