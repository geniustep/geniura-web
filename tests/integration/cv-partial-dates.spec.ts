import fs from "node:fs";
import path from "node:path";

import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

import { clearLocalThrottleCache } from "./integration-wsl";
import {
  CV_FULL_RANGE,
  cvMonthPresent,
  cvYearRange,
  makePdf,
  UI,
  type UiLocale,
} from "./cv-partial-dates-helpers";

const api = process.env.GENIURA_API_URL ?? "http://127.0.0.1:8000";
const password = process.env.INTEGRATION_CV_PASSWORD ?? "Integration-CV-Pass-2026!";
const carriedSessionPath = path.join(__dirname, ".cv-integration-session.json");
let userSlot = 0;
let loginAttempts = 0;

function integrationUserPrefix() {
  const fromEnv = process.env.GENIURA_USER_PREFIX;
  if (fromEnv) return fromEnv;
  const runFile = path.join(__dirname, "cv-run-env.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(runFile, "utf8")) as { prefix?: string };
    if (parsed.prefix) return parsed.prefix;
  } catch {
    /* globalSetup did not run */
  }
  return "cv-int-run";
}

function nextSeedEmail() {
  return `${integrationUserPrefix()}-${userSlot++}@example.test`;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  const host = new URL(api).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`Refusing CV integration tests against non-local API: ${api}`);
  }
  const csrf = await request.get(`${api}/api/v1/auth/csrf`);
  if (!csrf.ok()) {
    throw new Error(`geniura-api unreachable at ${api}`);
  }
});

async function persistCandidateSession(page: Page) {
  await page.context().storageState({ path: carriedSessionPath });
}

async function pageWithCarriedSession(browser: Browser, locale: UiLocale) {
  if (!fs.existsSync(carriedSessionPath)) {
    throw new Error("Missing carried session; prior test must call persistCandidateSession()");
  }
  const context = await browser.newContext({ storageState: carriedSessionPath });
  const page = await context.newPage();
  await page.goto(`/${locale}/account/profile/resumes`);
  await expect(page).toHaveURL(new RegExp(`\\/${locale}\\/account\\/profile\\/resumes`));
  return { page, context };
}

async function loginAsCandidate(page: Page, locale: UiLocale, email: string) {
  if (loginAttempts >= 9 || (loginAttempts > 0 && loginAttempts % 6 === 0)) {
    clearLocalThrottleCache();
  }
  loginAttempts += 1;
  const L = UI[locale];
  const profileUrl = new RegExp(`\\/${locale}\\/account\\/profile\\/resumes`);
  const throttled = () =>
    page
      .getByRole("main")
      .getByRole("alert")
      .filter({ hasText: /Too many attempts|trop de tentatives|محاولات/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      clearLocalThrottleCache();
    }
    await page.context().clearCookies();
    await page.goto(`/${locale}/login?next=%2Faccount%2Fprofile%2Fresumes`);
    await page.getByLabel(L.email).fill(email);
    await page.getByLabel(L.password, { exact: true }).fill(password);
    await page.getByRole("button", { name: L.login, exact: true }).click();
    const landed = await page
      .waitForURL(profileUrl, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (landed) {
      return;
    }
    if (!(await throttled().isVisible().catch(() => false))) {
      break;
    }
  }
  await expect(page).toHaveURL(profileUrl);
}

async function uploadCv(page: Page, lines: string[], locale: UiLocale = "en") {
  const L = UI[locale];
  const pdf = makePdf(lines);
  await page.getByLabel(L.versionName).fill("Synthetic CV");
  await page.locator('input[type="file"]').setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: L.uploadCv }).click();
  await expect(page.getByText(L.uploaded)).toBeVisible({ timeout: 30_000 });
  const reviewLink = page.getByRole("link", { name: L.reviewLink });
  await expect(reviewLink).toBeVisible({ timeout: 120_000 });
  await reviewLink.click();
  await expect(page).toHaveURL(/\/resumes\/[0-9a-f-]{36}\/review/i);
}

function resumeIdFromPage(page: Page) {
  return page.url().match(/\/resumes\/([0-9a-f-]{36})\//i)?.[1];
}

async function acceptFirstExperience(page: Page, locale: UiLocale = "en") {
  const L = UI[locale];
  await page.getByRole("button", { name: L.accept }).first().click();
  const save = page.getByRole("button", { name: L.saveDecisions });
  await expect(save).toBeEnabled({ timeout: 15_000 });
  await save.click();
  await expect(page.locator("[data-sonner-toast]").first()).toContainText(
    /added|saved|enregistr|ajoutée|أُضيف/i,
    { timeout: 60_000 },
  );
}

function experienceSection(page: Page) {
  return page.locator('section[aria-labelledby="section-experiences"]');
}

async function openAddExperience(page: Page, locale: UiLocale) {
  const L = UI[locale];
  await experienceSection(page).getByRole("button", { name: L.addExperience }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

function partialDateBlock(dialog: Locator, fieldLabel: string) {
  return dialog.getByText(fieldLabel, { exact: true }).locator("xpath=..");
}

async function setPartialDate(
  dialog: Locator,
  L: (typeof UI)[UiLocale],
  fieldLabel: string,
  precision: "year" | "month" | "day",
  value: string,
) {
  const block = partialDateBlock(dialog, fieldLabel);
  await block.getByLabel(L.datePrecision).selectOption(precision);
  await block.getByLabel(L.dateValue).fill(value);
}

test("live BFF reaches Django health via Next proxy", async ({ page, request }) => {
  const direct = await request.get(`${api}/health/live`);
  expect(direct.ok()).toBeTruthy();
  const viaBff = await page.request.get("/api/bff/health/live");
  expect(viaBff.ok()).toBeTruthy();
});

test("CV journey EN: upload, confirm year range, profile shows 2016–2018", async ({ page }) => {
  const email = nextSeedEmail();
  await loginAsCandidate(page, "en", email);
  await uploadCv(page, cvYearRange(email), "en");
  await acceptFirstExperience(page, "en");

  await page.goto("/en/account/profile");
  await expect(page.getByText(/2016.*2018|2016 – 2018/)).toBeVisible({ timeout: 30_000 });
});

test("CV journey FR locale UI with year-only extraction", async ({ page }) => {
  const email = nextSeedEmail();
  await loginAsCandidate(page, "fr", email);
  await uploadCv(page, cvYearRange(email), "fr");
  await acceptFirstExperience(page, "fr");
  await page.goto("/fr/account/profile");
  await expect(page.getByText(/2016/)).toBeVisible();
});

test("CV journey AR locale UI", async ({ page }) => {
  const email = nextSeedEmail();
  await loginAsCandidate(page, "ar", email);
  await uploadCv(page, cvYearRange(email), "ar");
  await acceptFirstExperience(page, "ar");
  await page.goto("/ar/account/profile");
  await expect(page.getByText(/2016/)).toBeVisible();
});

test("manual profile edit preserves YYYY and YYYY-MM after reload", async ({ page }) => {
  await loginAsCandidate(page, "en", nextSeedEmail());

  await page.goto("/en/account/profile");
  await openAddExperience(page, "en");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(UI.en.jobTitle).fill("Analyst");
  await setPartialDate(dialog, UI.en, UI.en.from, "year", "2016");
  await setPartialDate(dialog, UI.en, UI.en.to, "year", "2018");
  await dialog.getByRole("button", { name: UI.en.save }).click();
  await expect(page.getByText(/2016.*2018|2016 – 2018/)).toBeVisible();

  await experienceSection(page).getByRole("button", { name: UI.en.edit }).first().click();
  const edit = page.getByRole("dialog");
  await setPartialDate(edit, UI.en, UI.en.from, "month", "2016-03");
  await edit.getByRole("button", { name: UI.en.save }).click();
  await page.reload();
  await expect(page.getByText(/2016|March|mars/i)).toBeVisible();
  await persistCandidateSession(page);
});

test("YYYY-MM-DD legacy-style date displays without forcing day precision", async ({ browser }) => {
  const { page, context } = await pageWithCarriedSession(browser, "en");
  try {
  await page.goto("/en/account/profile");
  await openAddExperience(page, "en");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(UI.en.jobTitle).fill("Engineer");
  await setPartialDate(dialog, UI.en, UI.en.from, "day", "2020-07-15");
  await dialog.getByRole("button", { name: UI.en.save }).click();
  await page.reload();
  await expect(page.getByText(/2020-07-15|2020/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test("legacy slash-month and year ranges from CV extract", async ({ page }) => {
  await loginAsCandidate(page, "en", nextSeedEmail());
  await uploadCv(page, CV_FULL_RANGE, "en");
  await acceptFirstExperience(page, "en");
  await page.goto("/en/account/profile");
  await expect(page.getByText(/2016/)).toBeVisible({ timeout: 30_000 });
  await persistCandidateSession(page);
});

test("is_current job via CV extract (month + present)", async ({ browser }) => {
  const { page, context } = await pageWithCarriedSession(browser, "en");
  try {
  const email = `${integrationUserPrefix()}-4@example.test`;
  await uploadCv(page, cvMonthPresent(email), "en");
  await acceptFirstExperience(page, "en");
  await page.goto("/en/account/profile");
  await expect(page.getByText(/present|Present|aujourd|حاض/i)).toBeVisible({ timeout: 30_000 });
  } finally {
    await context.close();
  }
});

test("duplicate CV review offers keep existing and does not duplicate row", async ({ page }) => {
  const email = nextSeedEmail();
  const lines = cvYearRange(email);
  await loginAsCandidate(page, "en", email);
  await uploadCv(page, lines, "en");
  await acceptFirstExperience(page, "en");

  await page.goto("/en/account/profile/resumes");
  const pdf = makePdf(lines);
  await page.getByLabel(UI.en.versionName).fill("Duplicate");
  await page.locator('input[type="file"]').setInputFiles({
    name: "cv2.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: UI.en.uploadCv }).click();
  const reviewLink = page.getByRole("link", { name: UI.en.reviewLink });
  await expect(reviewLink).toBeVisible({ timeout: 120_000 });
  await reviewLink.click();
  await page.getByRole("button", { name: UI.en.keepMine }).first().click();
  await page.getByRole("button", { name: UI.en.saveDecisions }).click();

  await page.goto("/en/account/profile");
  await expect(page.getByText(/2016/)).toHaveCount(1);
});

test("409 when update_existing has no profile match", async ({ page }) => {
  const email = nextSeedEmail();
  await loginAsCandidate(page, "en", email);
  await uploadCv(page, cvYearRange(email), "en");
  const resumeId = resumeIdFromPage(page);
  expect(resumeId).toBeTruthy();
  const itemId = await page.evaluate(async (id) => {
    const extraction = await fetch(`/api/bff/api/v1/candidates/me/resumes/${id}/extraction`, {
      credentials: "include",
    });
    const body = (await extraction.json()) as { items: { id: string }[] };
    return body.items[0]?.id;
  }, resumeId);
  expect(itemId).toBeTruthy();
  const status = await page.evaluate(
    async ({ id, item }) => {
      const csrf = (await (
        await fetch("/api/bff/api/v1/auth/csrf", { credentials: "include" })
      ).json()) as { csrf_token: string };
      const res = await fetch(`/api/bff/api/v1/candidates/me/resumes/${id}/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf.csrf_token,
        },
        body: JSON.stringify({ decisions: [{ item, action: "update_existing" }] }),
      });
      return res.status;
    },
    { id: resumeId, item: itemId },
  );
  expect(status).toBe(409);
});

test("412 conflict when editing stale experience version", async ({ page }) => {
  await loginAsCandidate(page, "en", nextSeedEmail());
  await page.goto("/en/account/profile");
  await openAddExperience(page, "en");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(UI.en.jobTitle).fill("Conflict test");
  await setPartialDate(dialog, UI.en, UI.en.from, "year", "2016");
  await dialog.getByRole("button", { name: UI.en.save }).click();
  await expect(page.locator("[data-sonner-toast]").first()).toContainText(/saved|Changes|Added/i, {
    timeout: 30_000,
  });
  await expect(experienceSection(page).getByText("Conflict test").first()).toBeVisible();

  const exp = await page.evaluate(async () => {
    const list = await fetch("/api/bff/api/v1/candidates/me/experiences?page_size=50", {
      credentials: "include",
    });
    const body = await list.json();
    return body.results[0] as { id: string; updated_at: string };
  });
  expect(exp.updated_at).toBeTruthy();

  const staleStatus = await page.evaluate(async (id) => {
    const csrf = (await (
      await fetch("/api/bff/api/v1/auth/csrf", { credentials: "include" })
    ).json()) as { csrf_token: string };
    const res = await fetch(`/api/bff/api/v1/candidates/me/experiences/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf.csrf_token,
        "If-Match": '"00000000-0000-0000-0000-000000000000"',
      },
      body: JSON.stringify({ description: "stale" }),
    });
    return res.status;
  }, exp.id);
  expect(staleStatus).toBe(412);
  await persistCandidateSession(page);
});

test("user isolation: second account cannot read first experiences", async ({ browser }) => {
  clearLocalThrottleCache();
  const prefix = integrationUserPrefix();
  const emailA = `${prefix}-14@example.test`;
  const emailB = `${prefix}-15@example.test`;
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  await loginAsCandidate(pageA, "en", emailA);
  await pageA.goto("/en/account/profile");
  await openAddExperience(pageA, "en");
  const dialog = pageA.getByRole("dialog");
  await dialog.getByLabel(UI.en.jobTitle).fill("Secret role");
  await dialog.getByRole("button", { name: UI.en.save }).click();

  clearLocalThrottleCache();
  await loginAsCandidate(pageB, "en", emailB);
  const countB = await pageB.evaluate(async () => {
    const list = await fetch("/api/bff/api/v1/candidates/me/experiences?page_size=50", {
      credentials: "include",
    });
    const data = await list.json();
    return (data.results as unknown[]).length;
  });
  expect(countB).toBe(0);

  await ctxA.close();
  await ctxB.close();
});

test("YYYY-MM-01 day assertion blocked in UI (API month round-trip)", async ({ browser }) => {
  const { page, context } = await pageWithCarriedSession(browser, "en");
  try {
    await page.goto("/en/account/profile");
    await openAddExperience(page, "en");
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(UI.en.jobTitle).fill("First day case");
    await setPartialDate(dialog, UI.en, UI.en.from, "day", "2020-07-01");
    await dialog.getByRole("button", { name: UI.en.save }).click();
    await expect(dialog.getByText(/first day of a month|premier jour|01/i)).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await context.close();
  }
});
