import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { locale: "ar", dir: "rtl", heading: /سيرتك الذاتية/ },
  { locale: "fr", dir: "ltr", heading: /Votre CV/ },
  { locale: "en", dir: "ltr", heading: /Your CV/ },
  { locale: "es", dir: "ltr", heading: /Tu CV/ },
] as const;

for (const { locale, dir, heading } of pages) {
  test.describe(`home (${locale})`, () => {
    test("sets the document language and direction", async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.getByRole("banner").getByRole("img", { name: "Geniura" })).toBeVisible();
    });

    test("has no serious or critical accessibility violations", async ({ page }) => {
      await page.goto(`/${locale}`);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });

    test("is not indexable before launch", async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  });
}

test.describe("Arabic browser", () => {
  test.use({ locale: "ar-MA" });

  test("redirects the bare origin to Arabic", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
  });
});

test.describe("English browser", () => {
  test.use({ locale: "en-US" });

  test("negotiates English from Accept-Language", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });
});

test.describe("Spanish browser", () => {
  test.use({ locale: "es-ES" });

  test("negotiates Spanish from Accept-Language", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/es$/);
  });
});

test.describe("French browser", () => {
  test.use({ locale: "fr-FR" });

  test("negotiates French from Accept-Language", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr$/);
  });
});

test("switches language and keeps the current page", async ({ page }) => {
  await page.goto("/ar/design-system");
  await page.getByRole("button", { name: /اللغة الحالية/ }).click();
  await page.getByRole("menuitem", { name: "Français" }).click();
  await expect(page).toHaveURL(/\/fr\/design-system$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("renders a localized 404 for unknown paths", async ({ page }) => {
  const response = await page.goto("/ar/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});

test("sends security headers", async ({ request }) => {
  const response = await request.get("/ar");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
  expect(headers["content-security-policy"]).toContain("connect-src 'self'");
  expect(headers["content-security-policy"]).not.toContain("api-geniura.geniura.com");
});

test("robots.txt disallows everything before launch", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toMatch(/Disallow: \/\s*$/m);
});

test("home pages publish localized social cards and brand identity", async ({ page, request }) => {
  for (const locale of ["ar", "fr", "en", "es"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://geniura.com/${locale}`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`^https://geniura\\.com/${locale}/opengraph-image`),
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const graph = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(graph).toBeTruthy();
    const data = JSON.parse(graph ?? "{}");
    expect(data["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "Organization", name: "Geniura" }),
        expect.objectContaining({ "@type": "WebSite", name: "Geniura" }),
      ]),
    );

    const image = await request.get(`/${locale}/opengraph-image`);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("design-system page is never indexed", async ({ page }) => {
  await page.goto("/fr/design-system");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("mobile menu opens as a dialog and closes with Escape", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu button only exists on small screens.");
  await page.goto("/ar");
  await page.getByRole("button", { name: "القائمة" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
