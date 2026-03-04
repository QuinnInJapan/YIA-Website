import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("header shows org name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".site-header__name-jp")).toContainText(
      "横須賀国際交流協会"
    );
  });

  test("navigation renders category dropdown groups", async ({ page }) => {
    await page.goto("/");
    const groups = page.locator(".site-nav__group");
    await expect(groups.first()).toBeVisible();
    expect(await groups.count()).toBeGreaterThanOrEqual(1);
  });

  test("announcements band visible with links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".oshirase-band")).toBeVisible();
    const items = page.locator(".oshirase-item");
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });

  test("program card grid renders category cards", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".program-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test("access/map section visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".access-block")).toBeVisible();
  });

  test("footer renders with copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".site-footer__copyright")).toBeVisible();
  });
});
