import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { t } from "@/i18n/t";

// The landing page at / and /privacy on the built app (#22, spec #32; at / per D-055).

async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
}

test.describe("calls to action", () => {
  for (const [label, path] of [
    ["landing.cta.start", "/sign-in"],
    ["landing.cta.demo", "/demo"],
  ] as const) {
    test(`every "${t(label)}" link (header, hero, closing band) goes to ${path}`, async ({
      page,
    }) => {
      await page.goto("/");
      const links = page.getByRole("link", { name: t(label), exact: true });
      await expect(links).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await page.goto("/");
        await links.nth(i).click();
        await expect(page).toHaveURL(path);
      }
    });
  }

  test("Sign in joins the header from 768 px", async ({ page }) => {
    const signIn = page.getByRole("link", {
      name: t("landing.cta.signIn"),
      exact: true,
    });
    await page.goto("/");
    await expect(signIn).toBeHidden();
    await page.setViewportSize({ width: 768, height: 800 });
    await signIn.click();
    await expect(page).toHaveURL("/sign-in");
  });

  test("every link and button is at least 48 px tall", async ({ page }) => {
    await page.goto("/");
    for (const target of await page
      .locator("a:visible, summary:visible")
      .all()) {
      const box = await target.boundingBox();
      expect(box?.height, await target.innerText()).toBeGreaterThanOrEqual(48);
    }
  });
});

test.describe("loading order", () => {
  test("the heading and Start free render while images are held back", async ({
    page,
  }) => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/images/landing/**", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: t("landing.hero.title") }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: t("landing.cta.start") })
        .first(),
    ).toBeVisible();
    release();
  });

  test("only the hero photo is eager; the rest are lazy", async ({ page }) => {
    await page.goto("/");
    const loading = await page
      .locator("main img")
      .evaluateAll((all) => all.map((img) => img.getAttribute("loading")));
    expect(loading[0]).toBe("eager");
    expect(loading.length).toBeGreaterThan(1);
    expect(new Set(loading.slice(1))).toEqual(new Set(["lazy"]));
  });

  test("far-below photos don't load until scrolled near", async ({ page }) => {
    // A pilot phone on mobile data. Unthrottled, headless Chrome treats the whole page as near.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 50,
      downloadThroughput: 4_000_000,
      uploadThroughput: 1_000_000,
      connectionType: "cellular4g",
    });
    const requested = new Set<string>();
    page.on("request", (request) => {
      const name = request
        .url()
        .match(/\/images\/landing\/([a-z-]+)-\d+\.webp/)?.[1];
      if (name) requested.add(name);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    for (const name of ["boda-rider", "duka-shelf", "phone-fundi-kiosk"]) {
      expect([...requested], name).not.toContain(name);
    }

    await scrollToBottom(page);
    await page.waitForLoadState("networkidle");
    for (const name of ["boda-rider", "duka-shelf", "phone-fundi-kiosk"]) {
      expect([...requested], name).toContain(name);
    }
  });
});

test.describe("network isolation", () => {
  test("/ (landing) makes no Clerk request and no /api request", async ({
    page,
  }) => {
    const urls: string[] = [];
    page.on("request", (request) => urls.push(request.url()));
    await page.goto("/");
    await scrollToBottom(page);
    await page.waitForLoadState("networkidle");
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => /clerk/i.test(url))).toEqual([]);
    expect(
      urls.filter((url) => new URL(url).pathname.startsWith("/api/")),
    ).toEqual([]);
  });
});

test.describe("accessibility", () => {
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

  for (const width of [360, 1280]) {
    for (const path of ["/", "/privacy"]) {
      test(`${path} has no WCAG AA violations at ${width} px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        await scrollToBottom(page);
        const results = await new AxeBuilder({ page }).withTags(tags).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }

  test("the FAQ opens from the keyboard and announces its state", async ({
    page,
  }) => {
    await page.goto("/");
    const question = page.locator("summary", {
      hasText: t("landing.faq.free.question"),
    });
    const answer = page.getByText(t("landing.faq.free.answer"));
    await expect(answer).toBeHidden();
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(answer).toBeVisible();
    await expect(page.locator("details", { has: question })).toHaveAttribute(
      "open",
      "",
    );
    await page.keyboard.press("Space");
    await expect(answer).toBeHidden();
  });

  for (const path of ["/", "/privacy"]) {
    test(`${path} reflows at 200% text with no sideways scroll at 360 px`, async ({
      page,
    }) => {
      await page.goto(path);
      const { scrollWidth, innerWidth } = await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
});

test.describe("pages", () => {
  test("/ is the landing page and /welcome redirects to it (D-055)", async ({
    page,
  }) => {
    await page.goto("/welcome");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      t("landing.hero.title"),
    );
  });

  test("/privacy renders and the footer links to it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: t("landing.footer.privacy") }).click();
    await expect(page).toHaveURL("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      t("privacy.title"),
    );
  });

  test("/ (landing) has its title and description", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(t("landing.meta.title"));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      t("landing.meta.description"),
    );
  });
});

test.describe("offline", () => {
  // Needs the service worker and precache from #18, which is not merged yet.
  test.fixme("/ (landing) and /privacy open cold offline after one visit (#18)", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    for (const [path, title] of [
      ["/", t("landing.hero.title")],
      ["/privacy", t("privacy.title")],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    }
    await context.close();
  });
});
