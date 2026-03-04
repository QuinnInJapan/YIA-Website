import { test, expect } from "@playwright/test";

test.describe("Sanity Studio", () => {
  test("/studio loads without error", async ({ page }) => {
    const response = await page.goto("/studio");
    expect(response?.status()).toBe(200);
    // Studio renders client-side; just verify no crash
    await expect(page.locator("body")).toBeVisible();
  });
});
