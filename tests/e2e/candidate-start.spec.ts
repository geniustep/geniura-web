import { expect, test } from "@playwright/test";

const locales = [
  { locale: "ar", title: "لنبدأ بملفك المهني", action: "أضف سيرتك الذاتية" },
  { locale: "fr", title: "Créons votre profil", action: "Ajouter mon CV" },
  { locale: "en", title: "Let’s create your profile", action: "Add my CV" },
  { locale: "es", title: "Creemos tu perfil", action: "Añadir mi CV" },
];
for (const { locale, title, action } of locales) {
  test(`${locale}: offers the candidate journey before authentication`, async ({
    page,
    request,
  }) => {
    await page.route("**/api/bff/api/v1/auth/me", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ code: "not_authenticated", message: "Not authenticated" }),
      }),
    );
    await page.route("**/api/bff/api/v1/onboarding/guest-cv", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "not_found" }),
      }),
    );
    await page.goto(`/${locale}/start`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await page.getByRole("button", { name: action, exact: true }).click();
    if (process.env.NEXT_PUBLIC_ENABLE_GUEST_CV === "true") {
      await expect(page.locator('main input[type="file"]')).toHaveCount(1);
    } else {
      await expect(page.locator(`main a[href*="/login?next="]`)).toHaveAttribute(
        "href",
        /next=%2Fstart%3Fstep%3Dupload/,
      );
      await expect(page.locator('main input[type="file"]')).toHaveCount(0);
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const response = await request.get(`/${locale}/start`);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
}
