import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// These run without a backend (as in public CI): they check rendering, accessibility,
// indexing and client-side validation. Full flows live in tests/integration.
const authPages = [
  "/ar/login",
  "/fr/register",
  "/ar/forgot-password",
  "/fr/reset-password?uid=a&token=b",
];

for (const path of authPages) {
  test(`${path} is accessible and not indexable`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

test("login validates in the interface language before calling the API", async ({ page }) => {
  await page.goto("/ar/login");
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await expect(page.getByText("هذا الحقل مطلوب.").first()).toBeVisible();
  await expect(page.getByLabel("البريد الإلكتروني")).toHaveAttribute("aria-invalid", "true");
});

test("a reset link without its token explains what to do", async ({ page }) => {
  await page.goto("/fr/reset-password");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Le lien est incomplet");
});

test("verification is never triggered by merely opening the link", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/email/verify")) calls.push(request.method());
  });
  await page.goto("/ar/verify-email?token=abc");
  await expect(page.getByRole("button", { name: "تأكيد بريدي" })).toBeVisible();
  expect(calls).toEqual([]);
});

test("anonymous visitors see a sign-in link in the header", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("banner").getByRole("link", { name: "Se connecter" })).toBeVisible();
});

test("private pages send a CSP and are never cached by shared caches", async ({ request }) => {
  const response = await request.get("/ar/account", { maxRedirects: 0 });
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["cache-control"]).toContain("no-store");
});
