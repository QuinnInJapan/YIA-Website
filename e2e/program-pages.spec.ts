import { test, expect } from "@playwright/test";

test.describe("Program Pages", () => {
  test("/services/counseling loads with title and sections", async ({ page }) => {
    const response = await page.goto("/services/counseling");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
    const sections = page.locator(".page-section");
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
  });

  test("/services/counseling reflects the 2026 multilingual counseling updates", async ({
    page,
  }) => {
    const response = await page.goto("/services/counseling");
    expect(response?.status()).toBe(200);

    await expect(page.locator("body")).toContainText("ネパール語");
    await expect(page.locator("body")).toContainText("Nepali");
    await expect(page.locator("body")).not.toContainText("スペイン語");
    await expect(page.locator("body")).not.toContainText("Spanish");

    const nepaliRow = page.locator(".data-table tbody tr").filter({ hasText: "ネパール語" });
    await expect(nepaliRow).toContainText("木曜日");
    await expect(nepaliRow).toContainText("10:00〜12:00");

    await expect(page.locator(".doc-list")).toContainText("チラシ（R8）");
  });

  test("event pages show the 2026 dates", async ({ page }) => {
    let response = await page.goto("/events/youth-forum");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("2026年8月2日（日）");

    response = await page.goto("/events/kids");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("2026年10月18日（日）");
  });

  test("/classes/conversation-salon loads with content", async ({ page }) => {
    const response = await page.goto("/classes/conversation-salon");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".page-hero__title, h1")).toBeVisible();
  });

  test("/classes/conversation-salon schedule avoids duplicate bilingual cells", async ({ page }) => {
    const response = await page.goto("/classes/conversation-salon");
    expect(response?.status()).toBe(200);

    const firstRowCells = await page
      .locator(".data-table tbody tr")
      .first()
      .locator("td")
      .evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).innerText));

    expect(firstRowCells).toEqual([
      "いろは会\nIroha-kai",
      "月\nMon",
      "10:15〜11:45",
      "ヴェルクよこすか\nWerk Yokosuka",
    ]);

    await expect(page.locator(".data-table")).not.toContainText("月 Mon\n月 Mon");
    await expect(page.locator(".data-table")).toContainText("Potluck International (Princess)");
  });

  test("/classes/foreign-languages shows English class PDFs in the class table", async ({
    page,
  }) => {
    const response = await page.goto("/classes/foreign-languages");
    expect(response?.status()).toBe(200);

    await expect(page.locator("body")).toContainText("English Class PDFs");
    const pdfTable = page.locator(".data-table").filter({ hasText: "Travel English" });
    await expect(pdfTable).toContainText("旅行英語");
    await expect(pdfTable).toContainText("Travel English");
    await expect(pdfTable).toContainText("英会話");
    await expect(pdfTable).toContainText("English Conversation");
    await expect(pdfTable).toContainText("夜間クラス");
    await expect(pdfTable).toContainText("Night Class");

    await expect(pdfTable.locator('a[href$=".pdf"]')).toHaveCount(3);
    await expect(pdfTable.locator("a", { hasText: "旅行英語.pdf" })).toBeVisible();
    await expect(pdfTable.locator("a", { hasText: "英会話.pdf" })).toBeVisible();
    await expect(pdfTable.locator("a", { hasText: "夜間クラス.pdf" })).toBeVisible();
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
