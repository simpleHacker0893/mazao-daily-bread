import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";
import { t } from "@/i18n/t";
import { authFile } from "../playwright.config";

setup.describe.configure({ mode: "serial" });

setup("configure Clerk testing", async () => {
  await clerkSetup({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
});

// Seam 2: the development test user signs in and reaches the protected dashboard.
setup("sign in the test user and save the session", async ({ page }) => {
  const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
  if (!emailAddress) throw new Error("E2E_CLERK_USER_EMAIL is not set in .env");

  // First load of a development instance is slow (handshake plus Clerk's scripts from its CDN).
  setup.setTimeout(120_000);

  // /sign-in loads Clerk; the landing page deliberately does not.
  await page.goto("/sign-in");
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress });
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    t("shell.page.overview"),
  );

  mkdirSync(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
