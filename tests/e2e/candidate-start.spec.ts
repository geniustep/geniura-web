import { expect, test } from "@playwright/test";

const locales = [
  { locale: "ar", title: "لنبدأ بملفك المهني", action: "أضف سيرتك الذاتية" },
  { locale: "fr", title: "Commençons votre profil professionnel", action: "Ajouter mon CV" },
  { locale: "en", title: "Let’s start your professional profile", action: "Add my CV" },
  { locale: "es", title: "Empecemos tu perfil profesional", action: "Añadir mi CV" },
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
    await page.goto(`/${locale}/start`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator(`main a[href*="/login?next="]`)).toHaveAttribute(
      "href",
      new RegExp(`next=%2F${locale}%2Fstart%3Fstep%3Dupload`),
    );
    await expect(page.locator('main input[type="file"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const response = await request.get(`/${locale}/start`);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
}
