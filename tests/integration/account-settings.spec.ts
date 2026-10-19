import { expect, test } from "@playwright/test";

test("account settings require an authenticated session", async ({ page }) => {
  await page.goto("/ar/account");
  await expect(page).toHaveURL(/\/ar\/login\?next=%2Faccount$/);
});

const api = process.env.GENIURA_API_URL ?? "http://localhost:8000";
const email = `account-qa-${Date.now()}@example.test`;
const initialPassword = "Synthetic-Passphrase-2026!";
const nextPassword = "Synthetic-Updated-Passphrase-2026!";

test("candidate edits account settings and changes password", async ({ page, request }) => {
  const csrf = await request.get(`${api}/api/v1/auth/csrf`).catch(() => null);
  test.skip(!csrf?.ok(), "Local synthetic backend is required");

  await page.goto("/ar/register");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.getByRole("heading", { name: "تحقّق من بريدك" })).toBeVisible();

  await page.goto("/ar/login?next=%2Faccount");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(initialPassword);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/account$/);

  await page.getByLabel("الاسم الكامل").fill("فحص إعدادات جنيورا");
  await page.getByLabel("لغة الواجهة المفضلة").selectOption("fr");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await expect(page).toHaveURL(/\/fr\/account$/);
  await page.reload();
  await expect(page.getByLabel("Nom complet")).toHaveValue("فحص إعدادات جنيورا");

  const compulsory = page.getByRole("checkbox", {
    name: "Sécurité du compte — Dans l’application",
  });
  await expect(compulsory).toBeDisabled();
  const applications = page.getByRole("checkbox", { name: "Candidatures — Dans l’application" });
  const wasEnabled = await applications.isChecked();
  if (wasEnabled) await applications.uncheck();
  else await applications.check();
  await page.getByRole("button", { name: "Enregistrer les préférences" }).click();
  await expect(page.getByRole("button", { name: "Enregistrer les préférences" })).toBeDisabled();
  await page.reload();
  expect(
    await page.getByRole("checkbox", { name: "Candidatures — Dans l’application" }).isChecked(),
  ).toBe(!wasEnabled);

  await page.getByLabel("Mot de passe actuel").fill(initialPassword);
  await page.getByLabel("Nouveau mot de passe", { exact: true }).fill(nextPassword);
  await page.getByLabel("Confirmer le nouveau mot de passe").fill(nextPassword);
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText(/Mot de passe modifié/)).toBeVisible();
});
