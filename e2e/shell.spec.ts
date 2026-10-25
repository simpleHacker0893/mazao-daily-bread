import { expect, type Page, test } from "@playwright/test";
import { type MessageKey, t } from "@/i18n/t";

// Every R0 placeholder route and its title key (#17, English routes per D-050).
const routes: [path: string, title: MessageKey][] = [
  ["/", "shell.page.overview"],
  ["/sales", "shell.page.sales"],
  ["/sales/new", "shell.page.sales.new"],
  ["/expenses", "shell.page.expenses"],
  ["/expenses/new", "shell.page.expenses.new"],
  ["/debts", "shell.page.debts"],
  [
    "/debts/customer?id=00000000-0000-4000-8000-000000000000",
    "shell.page.debts.customer",
  ],
  ["/items", "shell.page.items"],
  ["/settings", "shell.page.settings"],
  ["/onboarding", "shell.page.onboarding"],
  ["/onboarding/review", "shell.page.onboarding.review"],
  ["/notebook", "shell.page.notebook"],
  ["/today", "shell.page.today"],
  ["/lock", "shell.page.lock"],
  ["/set-pin", "shell.page.setPin"],
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

for (const [path, title] of routes) {
  test(`${path} renders its English page title`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t(title));
    expect(errors).toEqual([]);
  });
}

test("the customer debt page keeps the id from the query string", async ({
  page,
}) => {
  await page.goto("/debts/customer?id=00000000-0000-4000-8000-000000000000");
  await expect(
    page.locator("[data-customer-id='00000000-0000-4000-8000-000000000000']"),
  ).toBeVisible();
});

test.describe("bottom nav at 360px", () => {
  test("shows the five tabs in English", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: t("shell.nav.label") });
    await expect(nav.getByRole("link")).toHaveText([
      t("shell.nav.overview"),
      t("shell.nav.sales"),
      t("shell.nav.debts"),
      t("shell.nav.expenses"),
    ]);
    await expect(
      nav.getByRole("button", { name: t("shell.nav.more") }),
    ).toBeVisible();
  });

  test("every tab and More entry is at least 48x48px", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: t("shell.nav.label") });
    const targets = [
      ...(await nav.getByRole("link").all()),
      nav.getByRole("button", { name: t("shell.nav.more") }),
    ];

    await nav.getByRole("button", { name: t("shell.nav.more") }).click();
    const drawer = page.getByRole("dialog", { name: t("shell.nav.more") });
    await expect(drawer).toBeVisible();
    targets.push(
      drawer.getByRole("link", { name: t("shell.nav.items") }),
      drawer.getByRole("link", { name: t("shell.nav.settings") }),
      drawer.getByRole("button", { name: t("shell.nav.close") }),
    );

    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
    }
  });

  test("More opens a drawer that reaches Items and Settings", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: t("shell.nav.more") }).click();
    const drawer = page.getByRole("dialog", { name: t("shell.nav.more") });
    await drawer.getByRole("link", { name: t("shell.nav.settings") }).click();
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      t("shell.page.settings"),
    );
    await expect(drawer).toBeHidden();
  });

  test("Escape closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: t("shell.nav.more") }).click();
    const drawer = page.getByRole("dialog", { name: t("shell.nav.more") });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});

test.describe("bottom nav at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("still shows the bottom nav and no sidebar (D-040)", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: t("shell.nav.label") });
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box?.y).toBeGreaterThan(700);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page.getByRole("navigation")).toHaveCount(1);
  });
});
