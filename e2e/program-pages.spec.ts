import { test, expect } from "@playwright/test";

test.describe("Program Pages", () => {
  test("/seikatsusodan loads with title and sections", async ({ page }) => {
    const response = await page.goto("/seikatsusodan");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    const sections = page.locator(".page-section");
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
  });

  test("/kaiwasalon loads with content", async ({ page }) => {
    const response = await page.goto("/kaiwasalon");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
  });

  test("all program page slugs return 200", async ({ page }) => {
    // Get all program page links from the nav dropdowns
    await page.goto("/");
    const links = page.locator(".site-nav__dropdown .nav-item");
    const count = await links.count();

    const slugs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        slugs.add(href);
      }
    }

    for (const slug of slugs) {
      const response = await page.goto(slug);
      expect(response?.status(), `${slug} should return 200`).toBe(200);
    }
  });
});
