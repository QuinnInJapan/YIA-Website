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

  test("/classes/conversation-salon schedule matches cached 2026 source facts", async ({
    page,
  }) => {
    const response = await page.goto("/classes/conversation-salon");
    expect(response?.status()).toBe(200);

    await expect(page.locator(".schedule-directory")).toHaveCount(3);
    await expect(page.locator(".comparison-table")).toHaveCount(0);
    await expect(page.locator(".schedule-list")).toHaveCount(0);
    await expect(page.locator("body")).toContainText("はじめに");
    await expect(page.locator("body")).toContainText("総合福祉会館");
    await expect(page.locator("body")).toContainText("Adult Classes at Sogo Fukushi Kaikan");
    await expect(page.locator("body")).toContainText("Adult Classes at Other Locations");
    await expect(page.locator("body")).toContainText("Children and Student Class List");
    const sogoDirectory = page.locator(".schedule-directory").filter({ hasText: "Iroha-kai" });
    await expect(sogoDirectory.locator(".schedule-directory__head")).toContainText("Day");
    await expect(sogoDirectory.locator(".schedule-directory__head")).toContainText("Time");
    const irohaEntry = sogoDirectory
      .locator(".schedule-directory__entry")
      .filter({ hasText: "Iroha-kai" })
      .first();
    await expect(irohaEntry.locator(".schedule-directory__name")).toContainText("いろは会");
    await expect(irohaEntry.locator(".schedule-directory__name")).toContainText("Iroha-kai");
    await expect(irohaEntry.locator(".schedule-directory__day")).toContainText("月");
    await expect(irohaEntry.locator(".schedule-directory__day")).toContainText("Mon");
    await expect(irohaEntry.locator(".schedule-directory__time")).toContainText("10:15〜11:45");
    await expect(irohaEntry.locator(".schedule-directory__details")).toContainText("4階");
    await expect(irohaEntry.locator(".schedule-directory__details")).toContainText("4F");
    await expect(irohaEntry.locator(".schedule-directory__details")).toContainText("1学期 1,000円");
    await expect(
      irohaEntry.locator('.schedule-directory__actions a[title="2026irohakai.pdf"]'),
    ).toBeVisible();

    await expect(page.locator("body")).not.toContainText("月 Mon\n月 Mon");
    await expect(page.locator("body")).toContainText("Potluck International");
    await expect(page.locator("body")).toContainText("TERAKOYA-SAN");
    await expect(page.locator("body")).toContainText("TSUBASA");
    await expect(
      sogoDirectory.locator('.schedule-directory__actions a[title="photos.pdf"]'),
    ).toBeVisible();
    await expect(page.locator(".doc-list")).toContainText("2026年度予定表");
    await expect(page.locator(".doc-list")).toContainText("たのしいにほんご 写真");
    await expect(page.locator("body")).toContainText("施設が休館した場合は休講");
    await expect(page.locator("body")).toContainText("participation may be denied");
  });

  test("/classes/conversation-salon schedule directory stacks consistently on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const response = await page.goto("/classes/conversation-salon");
    expect(response?.status()).toBe(200);

    const irohaEntry = page
      .locator(".schedule-directory__entry")
      .filter({ hasText: "Iroha-kai" })
      .first();
    const order = await irohaEntry.evaluate((node) =>
      Array.from(
        node.querySelectorAll(
          ".schedule-directory__day, .schedule-directory__time, .schedule-directory__name, .schedule-directory__details, .schedule-directory__actions",
        ),
      ).map((child) => child.className),
    );

    const dayIndex = order.findIndex((value) => value.includes("schedule-directory__day"));
    const timeIndex = order.findIndex((value) => value.includes("schedule-directory__time"));
    const nameIndex = order.findIndex((value) => value.includes("schedule-directory__name"));
    const detailsIndex = order.findIndex((value) => value.includes("schedule-directory__details"));
    const actionsIndex = order.findIndex((value) => value.includes("schedule-directory__actions"));

    expect(dayIndex).toBeGreaterThanOrEqual(0);
    expect(dayIndex).toBeLessThan(timeIndex);
    expect(timeIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(detailsIndex);
    expect(detailsIndex).toBeLessThan(actionsIndex);
    await expect(
      irohaEntry.locator('.schedule-directory__actions a[title="2026irohakai.pdf"]'),
    ).toBeVisible();
  });

  test("/classes/foreign-languages matches cached class details and fees", async ({ page }) => {
    const response = await page.goto("/classes/foreign-languages");
    expect(response?.status()).toBe(200);

    await expect(page.locator("body")).toContainText("21,000円／12回");
    await expect(page.locator("body")).toContainText("18,000円／12回");
    await expect(page.locator("body")).toContainText("ヴェルクよこすか");
    await expect(page.locator("body")).toContainText("Class Details (FY2026 Term 1)");
    const pdfTable = page.locator(".data-table").filter({ hasText: "Travel English" });
    await expect(pdfTable).toContainText("トラベル英会話");
    await expect(pdfTable).toContainText("Travel English");
    await expect(pdfTable).toContainText("おしゃべり英会話");
    await expect(pdfTable).toContainText("English Conversation");
    await expect(pdfTable).toContainText("夜間英会話");
    await expect(pdfTable).toContainText("Night English");
    await expect(pdfTable).toContainText("中国語講座");
    await expect(pdfTable).toContainText("Chinese");

    await expect(pdfTable.locator('a[href$=".pdf"]')).toHaveCount(4);
    await expect(pdfTable.locator("a", { hasText: "旅行英語.pdf" })).toBeVisible();
    await expect(pdfTable.locator("a", { hasText: "英会話.pdf" })).toBeVisible();
    await expect(pdfTable.locator("a", { hasText: "夜間クラス.pdf" })).toBeVisible();
    await expect(pdfTable.locator("a", { hasText: "中国語講座.pdf" })).toBeVisible();
  });

  test("cached event and class schedule facts are reflected", async ({ page }) => {
    let response = await page.goto("/events/japan-festival");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("2026年6月13日（土）");
    await expect(page.locator("body")).toContainText("2027年2月28日（日）");
    await expect(page.locator("body")).toContainText("総合福祉会館 5階・6階");

    response = await page.goto("/classes/guide-training");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("2026年5月30日（土）");
    await expect(page.locator("body")).toContainText("2026年10月10日（土）");
    await expect(page.locator("body")).toContainText("2027年2月13日（土）");

    response = await page.goto("/classes/cooking");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("中国料理");
    await expect(page.locator("body")).toContainText("大津コミュニティセンター");
    await expect(page.locator("body")).toContainText("密封容器・袋");
  });

  test("cached organization facts are reflected", async ({ page }) => {
    let response = await page.goto("/about/about");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("令和8年度 役員一覧");
    await expect(page.locator("body")).toContainText("赤嶺 岳子");
    await expect(page.locator("body")).toContainText("スタッフ7名、外国人生活相談員4名");

    response = await page.goto("/about/supporting-membership");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("2025年6月末現在");
    await expect(page.locator("body")).toContainText("（学）三浦学苑高等学校");
    await expect(page.locator("body")).not.toContainText("サニーヒル横須賀");
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
