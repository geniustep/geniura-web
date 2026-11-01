import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

test.skip(
  process.env.NEXT_PUBLIC_ENABLE_GUEST_DRAFT_WORKSPACE !== "true",
  "Workspace release flag is off",
);
for (const [locale, messages] of Object.entries({ ar, fr, en, es })) {
  test(`${locale}: guest completes draft before activation`, async ({ page }) => {
    const t = messages.GuestWorkspace;
    const mutations: string[] = [];
    let state = {
      revision: 0,
      identity: { name: "Synthetic Person", email: "person@example.test", phone: "" },
      items: [],
      registration_prepared: false,
    };
    await page.route("**/api/bff/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      const reply = (status: number, body: unknown) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (method !== "GET") mutations.push(path);
      if (path.endsWith("/auth/me")) return reply(401, { code: "not_authenticated" });
      if (path.endsWith("/auth/csrf")) return reply(200, { csrf_token: "a".repeat(64) });
      if (path.endsWith("/guest-cv/workspace")) {
        if (method === "PATCH")
          state = { ...state, ...route.request().postDataJSON(), revision: state.revision + 1 };
        return reply(200, state);
      }
      if (path.endsWith("/guest-cv/registration")) {
        state.registration_prepared = true;
        return reply(202, { detail: "Prepared" });
      }
      if (path.endsWith("/guest-cv/email-code")) return reply(202, { detail: "Requested" });
      if (path.endsWith("/guest-cv/verify-email"))
        return reply(200, { verified: true, account_exists: false });
      if (path.endsWith("/guest-cv/complete"))
        return reply(200, { resume_id: "12345678-1234-4234-8234-123456789012" });
      if (path.endsWith("/guest-cv"))
        return reply(200, {
          status: "ready",
          identity: state.identity,
          expires_at: "2099-01-01T00:00:00Z",
          email_verified: false,
          claimed: false,
        });
      return reply(404, { code: "not_found" });
    });
    await page.goto(`/${locale}/start?step=upload`);
    await page.getByLabel(t.name, { exact: true }).fill("Reviewed Person");
    await page.getByRole("button", { name: t.save, exact: true }).click();
    await expect.poll(() => mutations).toEqual(["/api/bff/api/v1/onboarding/guest-cv/workspace"]);
    await page.getByLabel(t.password, { exact: true }).fill("Synthetic-Password-928!");
    await page.getByRole("button", { name: t.create, exact: true }).click();
    await expect(page.getByRole("button", { name: t.create, exact: true })).toHaveCount(0);
    expect(mutations.some((p) => p.endsWith("email-code"))).toBe(false);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole("button", { name: t.finish, exact: true }).click();
    await page.getByRole("button", { name: t.sendCode, exact: true }).click();
    await page.getByLabel(t.code, { exact: true }).fill("123456");
    await page.getByRole("button", { name: t.activate, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account/profile/resumes/.*/review`));
    expect(mutations.slice(-3)).toEqual([
      "/api/bff/api/v1/onboarding/guest-cv/email-code",
      "/api/bff/api/v1/onboarding/guest-cv/verify-email",
      "/api/bff/api/v1/onboarding/guest-cv/complete",
    ]);
  });
}
