import { expect, test } from "@playwright/test";
import { t } from "@/i18n/t";

test("public demo opens without Clerk, API, IndexedDB, or persistent writes", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  const clerkRequests: string[] = [];

  await page.addInitScript(() => {
    const calls = { indexedDbOpen: 0 };
    Object.defineProperty(window, "__demoTestCalls", {
      configurable: false,
      value: calls,
    });
    const originalOpen = window.indexedDB.open.bind(window.indexedDB);
    window.indexedDB.open = (...args) => {
      calls.indexedDbOpen += 1;
      return originalOpen(...args);
    };
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin === new URL(page.url() || "http://localhost").origin &&
      url.pathname.startsWith("/api/")
    ) {
      apiRequests.push(url.pathname);
    }
    if (/clerk/i.test(request.url())) clerkRequests.push(request.url());
  });

  const introResponse = await page.goto("/demo");
  expect(introResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    t("landing.demo.intro.title"),
  );
  await page
    .getByRole("button", { name: t("landing.demo.intro.open") })
    .click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText(t("landing.demo.banner.message"))).toBeVisible();
  await expect(page.getByText("KES 210", { exact: true })).toBeVisible();
  await expect(page.getByText("Achieng's Greens & Eggs")).toBeVisible();

  await page
    .getByRole("button", { name: t("landing.demo.overview.newSale") })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(t("landing.demo.save.body"))).toBeVisible();

  const calls = await page.evaluate(
    () =>
      (
        window as unknown as {
          __demoTestCalls: { indexedDbOpen: number };
        }
      ).__demoTestCalls,
  );
  expect(calls.indexedDbOpen).toBe(0);
  expect(apiRequests).toEqual([]);
  expect(clerkRequests).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem("mazao.demo"))).toBe(
    "1",
  );
});

test("exiting demo clears its session flag and returns to the landing page", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: t("landing.demo.intro.open") })
    .click();
  await expect(page.getByText(t("landing.demo.banner.message"))).toBeVisible();
  await page
    .getByRole("button", { name: t("landing.demo.banner.exit") })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    t("landing.hero.title"),
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("mazao.demo")),
  ).toBeNull();
});
