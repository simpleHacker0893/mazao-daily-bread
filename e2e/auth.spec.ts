import { expect, test } from "@playwright/test";
import { t } from "@/i18n/t";

// Clerk's sign-in and sign-up pages on the built app. Pages are never redirected by the server
// (offline-first, Phase 1 plan): the phone's PIN lock (LockGuard, Task 5) gates the app.

for (const path of ["/sign-in", "/sign-up"]) {
  test(`${path} shows the Clerk form`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(
      page.locator(".cl-rootBox, [data-clerk-component]").first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: t("shell.auth.demo") }),
    ).toHaveAttribute("href", "/demo");
  });
}

test("app pages are not redirected by the server when signed out", async ({
  page,
}) => {
  const response = await page.goto("/sales");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL("/sales");
});
