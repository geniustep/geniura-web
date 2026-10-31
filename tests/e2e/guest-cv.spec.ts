import { expect, test } from "@playwright/test";

import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";

test.skip(
  process.env.NEXT_PUBLIC_ENABLE_GUEST_CV !== "true",
  "Guest drafts are disabled in this build",
);
const catalogs = { ar, fr, en, es };
for (const [locale, messages] of Object.entries(catalogs)) {
  test(`${locale}: guest uploads, reviews identity and proves email before account routing`, async ({
    page,
  }) => {
    const t = messages.GuestCv;
    let uploaded = false;
    let sent = false;
    let verified = false;
    const mutations: string[] = [];
    await page.route("**/api/bff/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const reply = (status: number, body: unknown) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (request.method() !== "GET") mutations.push(path);
      if (path.endsWith("/auth/me")) return reply(401, { code: "not_authenticated" });
      if (path.endsWith("/auth/csrf")) return reply(200, { csrf_token: "a".repeat(64) });
      if (path.endsWith("/guest-cv/email-code")) {
        sent = true;
        return reply(202, { detail: "Confirmation code requested." });
      }
      if (path.endsWith("/guest-cv/verify-email")) {
        expect(sent).toBe(true);
        verified = true;
        return reply(200, { verified: true, account_exists: true });
      }
      if (path.endsWith("/guest-cv")) {
        if (request.method() === "POST") {
          expect(request.headers()["content-type"]).toContain("multipart/form-data");
          uploaded = true;
          return reply(202, {
            status: "queued",
            identity: {},
            expires_at: "2099-01-01T00:00:00Z",
            email_verified: false,
            claimed: false,
          });
        }
        return uploaded
          ? reply(200, {
              status: "ready",
              identity: {
                name: "Synthetic Person",
                email: "person@example.test",
                phone: "+21620123456",
                verified: false,
              },
              expires_at: "2099-01-01T00:00:00Z",
              email_verified: verified,
              claimed: false,
            })
          : reply(404, { code: "not_found" });
      }
      return reply(404, { code: "not_found" });
    });
    await page.goto(`/${locale}/start?step=upload`);
    await page
      .getByLabel(t.file)
      .setInputFiles({
        name: "cv.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("synthetic browser fixture; backend parsing tested separately"),
      });
    await expect(
      page.getByRole("heading", { name: t.welcomeName.replace("{name}", "Synthetic Person") }),
    ).toBeVisible();
    await page.getByLabel(t.name).fill("Reviewed Name");
    await expect(
      page.getByRole("heading", { name: t.welcomeName.replace("{name}", "Reviewed Name") }),
    ).toBeVisible();
    await expect(page.getByLabel(t.email)).toHaveValue("person@example.test");
    await expect(page.locator('main a[href*="/login?"]')).toHaveCount(0);
    await page.getByRole("button", { name: t.send, exact: true }).click();
    await page.getByLabel(t.code).fill("123456");
    await page.getByRole("button", { name: t.verify, exact: true }).click();
    await expect(page.locator('main a[href*="/login?"]')).toHaveAttribute(
      "href",
      /next=%2Fstart%3Fstep%3Dclaim/,
    );
    expect(verified).toBe(true);
    expect(mutations).toEqual([
      "/api/bff/api/v1/onboarding/guest-cv",
      "/api/bff/api/v1/onboarding/guest-cv/email-code",
      "/api/bff/api/v1/onboarding/guest-cv/verify-email",
    ]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test("ar: authenticated return requires explicit claim then opens review", async ({ page }) => {
  let claims = 0;
  const resumeId = "12345678-1234-4234-8234-123456789012";
  await page.route("**/api/bff/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = { code: "not_found" };
    let status = 404;
    if (path.endsWith("/auth/me")) {
      body = {
        id: "user-1",
        email: "person@example.test",
        full_name: "Synthetic Person",
        preferred_locale: "ar",
      };
      status = 200;
    }
    if (path.endsWith("/auth/csrf")) {
      body = { csrf_token: "a".repeat(64) };
      status = 200;
    }
    if (path.endsWith("/candidates/me/resumes")) {
      body = [];
      status = 200;
    }
    if (path.endsWith("/guest-cv")) {
      body = {
        status: "ready",
        identity: { name: "Synthetic Person", verified: false },
        expires_at: "2099-01-01T00:00:00Z",
        email_verified: true,
        claimed: false,
      };
      status = 200;
    }
    if (path.endsWith("/guest-cv/claim")) {
      claims += 1;
      body = { resume_id: resumeId };
      status = 200;
    }
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/ar/start?step=claim");
  const claim = page.getByRole("button", { name: ar.GuestCv.claim, exact: true });
  await expect(claim).toBeVisible();
  expect(claims).toBe(0);
  await claim.click();
  await expect(page).toHaveURL(new RegExp(`/ar/account/profile/resumes/${resumeId}/review`));
  expect(claims).toBe(1);
});
