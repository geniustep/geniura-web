import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
test.skip(process.env.CANDIDATE_HOME_FIXTURE !== "true", "Requires local synthetic API");
for (const [locale, m] of Object.entries({ ar, fr, en, es })) {
  test(`${locale}: employer draft survives login and requires explicit submission`, async ({
    page,
  }) => {
    const t = m.EmployerDraft;
    let submissions = 0;
    page.on("request", (r) => {
      if (r.url().includes("/jobs/") && r.url().endsWith("/submit") && r.method() === "POST")
        submissions++;
    });
    await page.goto(`/${locale}`);
    await page.getByRole("link", { name: m.Home.profileFirst.employerAction, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/employers$`));
    await page.getByRole("link", { name: t.start, exact: true }).click();
    await page.getByLabel(t.jobTitle, { exact: true }).fill("Synthetic employer offer");
    await page.getByLabel(t.contract, { exact: true }).selectOption("permanent");
    await page.getByLabel(t.workMode, { exact: true }).selectOption("remote");
    await page
      .getByLabel(t.description, { exact: true })
      .fill("Synthetic job description for an authorized test.");
    await expect(page.getByText(t.saved, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(t.jobTitle, { exact: true })).toHaveValue(
      "Synthetic employer offer",
    );
    await page.getByRole("button", { name: t.preview, exact: true }).click();
    await page.getByRole("button", { name: t.continue, exact: true }).click();
    await page.getByRole("button", { name: t.login, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: t.authSaved })).toBeVisible();
    await page.getByLabel(m.Auth.fields.email, { exact: true }).fill("employer@example.test");
    await page.getByLabel(m.Auth.fields.password, { exact: true }).fill("Synthetic-Password-397!");
    await page.getByRole("button", { name: m.Auth.login.submit, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/employers/new$`));
    await expect(
      page.getByRole("heading", { name: "Synthetic employer offer", exact: true }),
    ).toBeVisible();
    await page.getByLabel(t.companyName, { exact: true }).fill("Synthetic organization");
    await page.getByRole("button", { name: t.reviewRequest, exact: true }).click();
    await expect(page.getByRole("heading", { name: t.confirmTitle, exact: true })).toBeVisible();
    expect(submissions).toBe(0);
    await expect(page.getByRole("button", { name: t.submit, exact: true })).toBeDisabled();
    await page.getByLabel(t.consent, { exact: true }).check();
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    await expect(page.getByRole("heading", { name: t.sentTitle, exact: true })).toBeVisible();
    expect(submissions).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await page.getByRole("button", { name: t.checkRequest, exact: true }).click();
    await expect(page.getByRole("heading", { name: t.sentTitle, exact: true })).toBeVisible();
    expect(submissions).toBe(1);
    await page.getByRole("link", { name: t.workspace, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account/employer$`));
    await expect(
      page.getByRole("heading", { name: m.EmployerWorkspace.jobs, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(m.EmployerWorkspace.states.submitted, { exact: true }),
    ).toBeVisible();
    await page.getByText("Synthetic employer offer", { exact: true }).click();
    await expect(
      page.getByText("Synthetic job description for an authorized test.", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText("Synthetic employer offer", { exact: true })).toBeVisible();
    await expect(
      page.getByText(m.EmployerWorkspace.states.submitted, { exact: true }),
    ).toBeVisible();
    expect(submissions).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
test("employer registration defaults to employer and preserves the draft destination", async ({
  page,
}) => {
  const t = ar.EmployerDraft;
  await page.goto("/ar/employers/new");
  await page.getByLabel(t.jobTitle, { exact: true }).fill("Draft");
  await page.getByLabel(t.contract, { exact: true }).selectOption("permanent");
  await page.getByLabel(t.workMode, { exact: true }).selectOption("remote");
  await page.getByLabel(t.description, { exact: true }).fill("Synthetic description");
  await page.getByRole("button", { name: t.preview, exact: true }).click();
  await page.getByRole("button", { name: t.continue, exact: true }).click();
  await page.getByRole("button", { name: t.register, exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: t.authSaved })).toBeVisible();
  await page.getByLabel(ar.Auth.fields.email, { exact: true }).fill("new-employer@example.test");
  await page.getByLabel(ar.Auth.fields.password, { exact: true }).fill("Synthetic-Password-397!");
  const posted = page.waitForRequest(
    (r) => r.url().endsWith("/auth/register") && r.method() === "POST",
  );
  await page.getByRole("button", { name: ar.Auth.register.submit, exact: true }).click();
  expect((await posted).postDataJSON().signup_intent).toBe("employer");
  await expect(page.getByRole("link", { name: ar.Auth.backToLogin, exact: true })).toHaveAttribute(
    "href",
    "/ar/login?next=%2Femployers%2Fnew",
  );
});

test("a failed submission keeps the server draft and never claims success", async ({
  page,
  context,
}) => {
  const t = ar.EmployerDraft;
  await context.addCookies([
    { name: "geniura_sid", value: "submit-failure", domain: "localhost", path: "/" },
  ]);
  await page.addInitScript(() =>
    localStorage.setItem(
      "geniura.employer-draft.v1",
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        step: "confirm",
        sourceLocale: "ar",
        title: "Synthetic offer",
        description: "Synthetic description",
        responsibilities: "",
        location: "",
        contractType: "permanent",
        workMode: "remote",
        companyName: "Synthetic organization",
        server: { userId: "00000000-0000-4000-8000-000000000001", orgId: "synthetic-org" },
      }),
    ),
  );
  await page.goto("/ar/employers/new");
  await page.getByLabel(t.consent, { exact: true }).check();
  await page.getByRole("button", { name: t.submit, exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("heading", { name: t.sentTitle, exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("geniura.employer-draft.v1")!).server.jobId,
    ),
  ).toBeTruthy();
});
test("an unverified employer keeps the draft and sees verification before any organization creation", async ({
  page,
  context,
}) => {
  const t = ar.EmployerDraft;
  await context.addCookies([
    { name: "geniura_sid", value: "unverified", domain: "localhost", path: "/" },
  ]);
  await page.addInitScript(() =>
    localStorage.setItem(
      "geniura.employer-draft.v1",
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        step: "organization",
        sourceLocale: "ar",
        title: "Synthetic offer",
        description: "Synthetic description",
        responsibilities: "",
        location: "",
        contractType: "permanent",
        workMode: "remote",
        companyName: "",
      }),
    ),
  );
  let creates = 0;
  page.on("request", (r) => {
    if (r.url().includes("/organizations") && r.method() === "POST") creates++;
  });
  await page.goto("/ar/employers/new");
  await expect(page.getByText(t.verify, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: t.submit, exact: true })).toHaveCount(0);
  expect(creates).toBe(0);
});

test("employer workspace distinguishes missing organizations from API failure", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "geniura_sid", value: "empty-employer", domain: "localhost", path: "/" },
  ]);
  await page.goto("/ar/account/employer");
  await expect(
    page.getByRole("heading", { name: ar.EmployerWorkspace.emptyOrg, exact: true }),
  ).toBeVisible();
  await page.route("**/api/bff/api/v1/organizations", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ code: "unavailable" }),
    }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(ar.EmployerWorkspace.error);
  await expect(
    page.getByRole("heading", { name: ar.EmployerWorkspace.emptyOrg, exact: true }),
  ).toBeHidden();
});
