import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Public CI has no backend: the pages must still render, explain the outage and stay accessible.
// With a backend (local runs), the same assertions hold with real results.
test("job search page renders, is accessible and keeps filters in the URL", async ({ page }) => {
  await page.goto("/ar/jobs?contract_type=permanent");
  await expect(page.getByRole("heading", { level: 1, name: "عروض العمل" })).toBeVisible();
  await expect(page.getByRole("search")).toBeVisible();
  // Either real results (with a backend) or the outage explanation (public CI has no backend).
  await expect(
    page
      .getByRole("main")
      .getByRole("status")
      .or(page.getByRole("heading", { name: "تعذّر تحميل العروض" })),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test("the home search lands on the results URL", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("main").getByRole("searchbox").fill("comptable");
  await page.getByRole("main").getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/\/fr\/jobs\?q=comptable$/);
});

test("the home page shows the latest jobs or explains the outage", async ({ page }) => {
  await page.goto("/ar");
  const latest = page.getByRole("region", { name: "أحدث العروض" });
  await expect(
    latest
      .getByRole("listitem")
      .first()
      .or(latest.getByRole("heading", { name: "تعذّر تحميل العروض" }))
      .or(latest.getByRole("heading", { name: "لا توجد عروض منشورة بعد" })),
  ).toBeVisible();
});

test("home latest-jobs section opens public browsing without an account", async ({ page }) => {
  await page.goto("/fr");
  await page
    .getByRole("region", { name: "Offres récentes", exact: true })
    .getByRole("link", { name: "Voir toutes les offres", exact: true })
    .click();
  await expect(page).toHaveURL(/\/fr\/jobs$/);
});

test.describe("malformed job ids", () => {
  test.use({
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  });
  test("are a real 404 for crawlers", async ({ page }) => {
    const response = await page.goto("/fr/jobs/not-a-job");
    expect(response?.status()).toBe(404);
  });
});

test("the jobs listing is linked from the header", async ({ page, isMobile }) => {
  await page.goto("/fr");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Offres d’emploi" }).first().click();
  await expect(page).toHaveURL(/\/fr\/jobs$/);
});

test("sitemap emits canonical public URLs rather than development origins", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://geniura.com").replace(/\/$/, "");

  for (const locale of ["ar", "fr", "en", "es"]) {
    expect(body).toContain(`<loc>${origin}/${locale}</loc>`);
    expect(body).toContain(`<loc>${origin}/${locale}/jobs</loc>`);
  }
  expect(body).not.toMatch(/\/(account|login|register|design-system)/);
  if (process.env.CI) {
    expect(body).not.toContain("localhost");
    expect(body).not.toContain("127.0.0.1");
  }
});

test("job listings expose social metadata but remain noindex before launch", async ({ page }) => {
  for (const locale of ["ar", "fr", "en", "es"]) {
    await page.goto(`/${locale}/jobs`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://geniura.com/${locale}/jobs`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://geniura.com/${locale}/jobs`,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
  }
});
