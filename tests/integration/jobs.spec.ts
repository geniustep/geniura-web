import { expect, test } from "@playwright/test";

// Needs a local geniura-api with published (synthetic) jobs, including a French "Java" posting.
const api = process.env.GENIURA_API_URL ?? "http://localhost:8000";

test.beforeAll(async ({ request }) => {
  const response = await request.get(`${api}/api/v1/jobs?page_size=1`).catch(() => null);
  const count = response?.ok() ? ((await response.json()) as { count: number }).count : 0;
  test.skip(count === 0, "No published jobs on the local geniura-api");
});

test("keyword search finds the Java job and opens its page", async ({ page }) => {
  await page.goto("/fr/jobs");
  await page.getByLabel("Mots-clés").fill("java");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/q=java/);
  const link = page.getByRole("link", { name: /Java/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Java");
});

test("filters narrow the results and are reflected in the URL", async ({ page }) => {
  await page.goto("/ar/jobs");
  const all = page.getByRole("main").getByRole("status");
  await expect(all).toBeVisible();
  const before = await all.textContent();
  await page.getByRole("complementary").getByLabel("نوع العقد").selectOption("internship");
  await expect(page).toHaveURL(/contract_type=internship/);
  await expect(all).not.toHaveText(before ?? "");
  for (const badge of await page.getByRole("main").locator("article").all()) {
    await expect(badge).toContainText("تدريب");
  }
});

test("a job page has valid JobPosting data and a canonical in the job's language", async ({
  page,
  request,
}) => {
  const list = (await (await request.get(`${api}/api/v1/jobs?q=java&page_size=1`)).json()) as {
    results: { id: string }[];
  };
  const id = list.results[0]!.id;
  await page.goto(`/ar/jobs/${id}`);
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? "{}") as Record<string, unknown>;
  expect(data["@type"]).toBe("JobPosting");
  expect(data.validThrough).toBeTruthy();
  expect(data.datePosted).toBeTruthy();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/fr/jobs/${id}$`),
  );
  // French posting inside the Arabic interface keeps its own language and direction.
  await expect(page.getByRole("heading", { level: 1 })).toHaveAttribute("dir", "ltr");
});

test.describe("unknown jobs", () => {
  const unknown = "/fr/jobs/00000000-0000-4000-8000-000000000000";

  test.describe("for crawlers", () => {
    test.use({
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });
    test("are a real 404", async ({ page }) => {
      const response = await page.goto(unknown);
      expect(response?.status()).toBe(404);
    });
  });

  test("show the not-found page and are never indexable for visitors", async ({ page }) => {
    await page.goto(unknown);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  });
});

test("a visitor can report a job anonymously", async ({ page, request }) => {
  const list = (await (await request.get(`${api}/api/v1/jobs?page_size=1`)).json()) as {
    results: { id: string }[];
  };
  await page.goto(`/fr/jobs/${list.results[0]!.id}`);
  await page.getByRole("button", { name: "Signaler cette offre" }).click();
  await page.getByLabel("Motif").selectOption("fee_request");
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByRole("dialog")).toContainText("Merci");
});

test("the sitemap lists published jobs", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body).toMatch(/\/(ar|fr)\/jobs\/[0-9a-f-]{36}/);
});
