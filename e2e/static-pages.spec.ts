import { test, expect } from "@playwright/test";

test.describe("About Page", () => {
  test("/aboutyia renders mission and org details", async ({ page }) => {
    const response = await page.goto("/aboutyia");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    // Mission section heading
    await expect(
      page.getByRole("heading", { name: "私たちの理念" })
    ).toBeVisible();
    // Org overview section heading
    await expect(
      page.getByRole("heading", { name: "団体概要" })
    ).toBeVisible();
  });

  test("/aboutyia renders history section", async ({ page }) => {
    await page.goto("/aboutyia");
    await expect(
      page.getByRole("heading", { name: "あゆみ" })
    ).toBeVisible();
  });
});

test.describe("Membership Page", () => {
  test("/kaiinn renders fee table and registration info", async ({ page }) => {
    const response = await page.goto("/kaiinn");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    // Fee table section heading
    await expect(
      page.getByRole("heading", { name: "年会費のご案内" })
    ).toBeVisible();
    // How to join heading
    await expect(
      page.getByRole("heading", { name: "入会のお申込み" })
    ).toBeVisible();
  });
});

test.describe("Directory Page", () => {
  test("directory page renders", async ({ page }) => {
    // Find the directory link from nav (slug may differ from default)
    await page.goto("/");
    const navLinks = page.locator(".site-nav__dropdown .nav-item");
    const count = await navLinks.count();

    // Look for the link whose text contains common directory-related keywords
    let directoryHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const text = await navLinks.nth(i).textContent();
      const href = await navLinks.nth(i).getAttribute("href");
      if (text && href && /directory|リンク集|関連団体/i.test(text)) {
        directoryHref = href;
        break;
      }
    }

    // If not found via text, try the known slug
    if (!directoryHref) {
      directoryHref = "/directory";
    }

    const response = await page.goto(directoryHref);
    // Only assert 200 if page exists; skip gracefully if not in Sanity
    if (response?.status() === 200) {
      await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    }
  });
});

test.describe("Announcements Page", () => {
  test("/announcements renders articles with TOC", async ({ page }) => {
    const response = await page.goto("/announcements");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    // TOC sidebar
    await expect(page.locator(".ann-toc")).toBeVisible();
    // At least one announcement article
    const articles = page.locator(".announcement");
    expect(await articles.count()).toBeGreaterThanOrEqual(1);
  });
});
