import { expect, test } from "@playwright/test";

test("account settings require an authenticated session", async ({ page }) => {
  await page.goto("/ar/account");
  await expect(page).toHaveURL(/\/ar\/login\?next=%2Faccount$/);
});
