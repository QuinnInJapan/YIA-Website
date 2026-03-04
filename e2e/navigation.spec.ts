import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {
  test("all nav dropdown links lead to valid pages", async ({ page }) => {
    await page.goto("/");
    const links = page.locator(".site-nav__dropdown .nav-item");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        hrefs.push(href);
      }
    }

    for (const href of hrefs) {
      const response = await page.goto(href);
      expect(response?.status(), `${href} should return 200`).toBe(200);
    }
  });

  test("homepage → announcements link works", async ({ page }) => {
    await page.goto("/");
    await page.click(".oshirase-viewall");
    await expect(page).toHaveURL(/\/announcements/);
    await expect(page.locator("h1, .page-hero__title")).toBeVisible();
  });

  test("skip-to-content link exists", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a.skip-link[href="#main"]');
    await expect(skipLink).toBeAttached();
  });
});
