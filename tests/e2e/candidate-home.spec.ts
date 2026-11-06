import "./employer-journey.cases";
import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
// Private server-rendered routes require the local synthetic API fixture. No test auth path is shipped.
test.skip(process.env.CANDIDATE_HOME_FIXTURE !== "true", "Requires local synthetic API");
for (const [locale, messages] of Object.entries({ ar, fr, en, es })) {
  test(`${locale}: private home, next action and applications`, async ({ page, context }) => {
    const t = messages.CandidateHome;
    await page.goto(`/${locale}/account/home`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/login\\?next=`));
    await context.addCookies([
      { name: "geniura_sid", value: "review", domain: "localhost", path: "/" },
    ]);
    await page.goto(`/${locale}/account/home`);
    await expect(page.getByRole("heading", { name: t.actions.review.title })).toBeVisible();
    await expect(
      page.getByRole("link", { name: t.actions.review.cta, exact: true }),
    ).toHaveAttribute(
      "href",
      `/${locale}/account/profile/resumes/00000000-0000-4000-8000-000000000002/review`,
    );
    const experience = page
      .locator('[aria-labelledby="my-profile"] li')
      .filter({ hasText: t.sections.experience });
    await expect(experience.getByRole("link")).toContainText(t.hasInformationPending);
    await expect(experience.getByRole("link")).toHaveAttribute(
      "href",
      `/${locale}/account/profile/resumes/00000000-0000-4000-8000-000000000002/review#review-item-experience-item`,
    );
    const skill = page
      .locator('[aria-labelledby="my-profile"] li')
      .filter({ hasText: t.sections.skills });
    await expect(skill.getByRole("link")).toContainText(t.hasInformation);
    await expect(skill.getByRole("link")).not.toContainText(t.hasInformationPending);
    await expect(page.getByText(t.noApplications, { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await context.addCookies([
      { name: "geniura_sid", value: "complete", domain: "localhost", path: "/" },
    ]);
    await page.goto(`/${locale}/account/applications`);
    await expect(page.getByText(t.statuses.interview, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: t.more, exact: true }).click();
    await expect(page.getByText(t.statuses.submitted, { exact: true })).toBeVisible();
    await expect(page.getByText(t.statuses.interview, { exact: true })).toBeVisible();
    const response = await page.request.get(`/${locale}/account/home`);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
}
test("guest draft and API outage remain distinct from an empty workspace", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "geniura_sid", value: "draft", domain: "localhost", path: "/" },
  ]);
  await page.goto("/ar/account/home");
  await expect(
    page.getByRole("link", { name: ar.CandidateHome.actions.draft.cta, exact: true }),
  ).toHaveAttribute("href", "/ar/start?step=upload");
  await context.addCookies([
    { name: "geniura_sid", value: "outage", domain: "localhost", path: "/" },
  ]);
  await page.goto("/ar/account/home");
  await expect(page.getByText(ar.CandidateHome.loadError, { exact: true })).toBeVisible();
  await expect(page.getByText(ar.CandidateHome.applicationsError, { exact: true })).toBeVisible();
  await expect(page.getByText(ar.CandidateHome.noApplications, { exact: true })).toHaveCount(0);
});
test("ordinary login opens the candidate home", async ({ page }) => {
  await page.goto("/ar/login");
  await page.getByLabel(ar.Auth.fields.email, { exact: true }).fill("candidate@example.test");
  await page.getByLabel(ar.Auth.fields.password, { exact: true }).fill("Synthetic-Password-397!");
  await page.getByRole("button", { name: ar.Auth.login.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/account\/home$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("أمينة");
});

test("login preserves an intended private destination", async ({ page }) => {
  await page.goto("/ar/login?next=%2Faccount%2Fapplications");
  await page.getByLabel(ar.Auth.fields.email, { exact: true }).fill("candidate@example.test");
  await page.getByLabel(ar.Auth.fields.password, { exact: true }).fill("Synthetic-Password-397!");
  await page.getByRole("button", { name: ar.Auth.login.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/account\/applications$/);
  await expect(page.getByText(ar.CandidateHome.statuses.interview, { exact: true })).toBeVisible();
});

test("review links open the pending item and clear the marker after explicit approval", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "geniura_sid", value: `review__${Date.now()}`, domain: "localhost", path: "/" },
  ]);
  await page.goto("/ar/account/home");
  const experience = page
    .locator('[aria-labelledby="my-profile"] li')
    .filter({ hasText: ar.CandidateHome.sections.experience });
  await expect(experience.getByRole("link")).toContainText(ar.CandidateHome.hasInformationPending);
  await experience.getByRole("link").click();
  await expect(page).toHaveURL(/review#review-item-experience-item$/);
  const item = page.locator("#review-item-experience-item");
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: ar.Profile.review.confirm, exact: true }).click();
  await page
    .locator("#review-item-language-item")
    .getByRole("button", { name: ar.Profile.review.confirm, exact: true })
    .click();
  await page.getByRole("button", { name: "حفظ قرارين", exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/account\/profile$/);
  await page.getByRole("link", { name: ar.CandidateHome.overview, exact: true }).click();
  const updated = page
    .locator('[aria-labelledby="my-profile"] li')
    .filter({ hasText: ar.CandidateHome.sections.experience });
  await expect(updated.getByRole("link")).toContainText(ar.CandidateHome.hasInformation);
  await expect(updated.getByRole("link")).not.toContainText(ar.CandidateHome.hasInformationPending);
  await expect(
    page.getByRole("heading", { name: ar.CandidateHome.actions.review.title }),
  ).toHaveCount(0);
});

for (const [locale, messages] of Object.entries({ ar, fr, en, es })) {
  test(`${locale}: profile sections restore after refresh and retain edit dialogs`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "geniura_sid", value: "complete", domain: "localhost", path: "/" },
    ]);
    await page.goto(`/${locale}/account/profile#section-educations`);
    await expect(
      page.getByRole("heading", { name: messages.Profile.sections.educations.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Licence en droit privé – 3e année suivie", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Licence en droit privé – 3e année suivie", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: messages.Profile.item.add, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: messages.Profile.form.cancel, exact: true }).click();
    await page.locator('a[href="#section-languages"]').click();
    await expect(
      page.getByRole("heading", { name: messages.Profile.sections.languages.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Licence en droit privé – 3e année suivie", { exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
