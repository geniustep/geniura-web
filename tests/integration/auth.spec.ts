import { expect, test } from "@playwright/test";

const api = process.env.GENIURA_API_URL ?? "http://localhost:8000";
const password = "Integration-pass-2026!";
const email = `web-${Date.now()}@example.test`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${api}/api/v1/auth/csrf`).catch(() => null);
  test.skip(!health?.ok(), `geniura-api is not reachable at ${api}`);
});

test("anonymous visitors are sent to login with a return path", async ({ page }) => {
  await page.goto("/ar/account");
  await expect(page).toHaveURL(/\/ar\/login\?next=%2Faccount$/);
  await expect(page.getByRole("heading", { level: 1, name: "تسجيل الدخول" })).toBeVisible();
});

test("registration answers the same way whatever the address", async ({ page }) => {
  await page.goto("/fr/register");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByRole("heading", { name: "Consultez votre messagerie" })).toBeVisible();
});

test("weak passwords show Django's localized message", async ({ page }) => {
  await page.goto("/fr/register");
  await page.getByLabel("Adresse e-mail").fill(`weak-${Date.now()}@example.test`);
  await page.getByLabel("Mot de passe").fill("short");
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("trop court");
});

test("wrong credentials show a translated error with a support reference", async ({ page }) => {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill("wrong-password-123");
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toContainText("البريد أو كلمة المرور غير صحيحة.");
  await expect(alert).toContainText("مرجع الدعم");
});

test("login, account, sessions and logout work end to end", async ({ page }) => {
  await page.goto("/ar/login?next=%2Faccount%2Fsessions");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();

  // Safe `next` is honoured; the server-side gate recognises the forwarded session.
  await expect(page).toHaveURL(/\/ar\/account\/sessions$/);
  await expect(page.getByRole("main").getByText("هذا الجهاز")).toBeVisible();

  await page.goto("/ar/account");
  await expect(page.getByRole("main").getByText(email)).toBeVisible();
  await expect(page.getByRole("main").getByText("غير مؤكَّد", { exact: true })).toBeVisible();

  const response = await page.request.get("/ar/account");
  expect(response.headers()["cache-control"]).toContain("no-store");

  await page.getByRole("button", { name: "قائمة الحساب" }).click();
  await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toBeVisible();

  await page.goto("/ar/account");
  await expect(page).toHaveURL(/\/ar\/login/);
});

test("an open-redirect `next` is ignored", async ({ page }) => {
  await page.goto("/fr/login?next=%2F%2Fevil.example%2Fsteal");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Connexion", exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/account$/);
});

// Email links are only observable when the local backend prints mail to its log
// (console email backend). Point GENIURA_API_LOG at that file to run these.
test.describe("email links", () => {
  const log = process.env.GENIURA_API_LOG;
  test.skip(!log, "GENIURA_API_LOG is not set");

  async function lastLink(path: string, address: string) {
    const { readFile } = await import("node:fs/promises");
    const text = await readFile(log!, "utf8");
    const blocks = text
      .split("Subject:")
      .filter((block) => block.includes(address.replace("@", "@")));
    const match = blocks.at(-1)?.match(new RegExp(`http://localhost:3000${path}\\?[^\\s"\\\\]+`));
    if (!match) throw new Error(`No ${path} link for ${address} in ${log}`);
    return match[0].replace("http://localhost:3000", "");
  }

  test("verification link goes through the locale redirect and needs a click", async ({ page }) => {
    const link = await lastLink("/verify-email", email);
    await page.goto(link);
    await expect(page).toHaveURL(/\/(ar|fr|en|es)\/verify-email\?token=/);
    await page
      .getByRole("button")
      .filter({ hasText: /تأكيد بريدي|Confirmer mon adresse/ })
      .click();
    await expect(
      page.getByRole("heading", { name: /تم تأكيد بريدك|Adresse confirmée/ }),
    ).toBeVisible();
  });

  test("password reset link sets a new password", async ({ page }) => {
    await page.goto("/fr/forgot-password");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByRole("heading", { name: "Consultez votre messagerie" })).toBeVisible();

    await expect.poll(() => lastLink("/reset-password", email).catch(() => "")).not.toBe("");
    await page.goto(`/fr${await lastLink("/reset-password", email)}`);
    await page.getByLabel("Nouveau mot de passe").fill(`${password}x`);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("heading", { name: "Mot de passe modifié" })).toBeVisible();
  });
});
