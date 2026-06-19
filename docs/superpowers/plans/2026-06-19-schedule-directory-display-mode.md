# Schedule Directory Display Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `scheduleDirectory` table display mode with properly aligned desktop columns and readable mobile stacking, then apply it to the Japanese conversation salon schedule sections.

**Architecture:** Add a focused React renderer that consumes the existing table section columns/rows and infers schedule roles from keys and labels. Wire the display mode through public rendering, Sanity schema/editor preview, and the existing Playwright page coverage. Update Sanity content display values after the code path is ready.

**Tech Stack:** Next.js App Router, React/TypeScript, Sanity table sections, CSS grid in `app/globals.css`, Playwright E2E.

## Global Constraints

- The renderer must be reusable, not a bespoke Japanese conversation component.
- Desktop rows must use one shared grid context for day, time, class, details, and actions so columns align across entries without page-tuned fixed widths.
- Mobile must stack entries in the order day, time, class name, details, actions.
- File columns render as compact actions while preserving the full filename in the link title or accessible label.
- Do not require editors to restructure table content.
- Keep all source data available in markup.

---

## File Structure

- Create `components/ScheduleDirectory.tsx`: role inference, row rendering, file-action rendering, and accessible schedule markup.
- Modify `app/globals.css`: visual system for desktop aligned schedule rows and mobile stacked entries.
- Modify `lib/types.ts`: add `scheduleDirectory` to the `TableSection.display` union.
- Modify `lib/section-renderers/table.tsx`: route table sections with `display === "scheduleDirectory"` to the new component.
- Modify `sanity/components/pages/sections/table-utils.ts`: add the display value to Studio helper types.
- Modify `sanity/schemas/tableSection.ts`: expose `Schedule directory` as a display option.
- Modify `sanity/components/pages/sections/TableEditorPanel.tsx`: add the display option and preview component.
- Modify `e2e/program-pages.spec.ts`: make conversation salon tests assert the new renderer and mobile order.

---

### Task 1: Failing Page Tests

**Files:**

- Modify: `e2e/program-pages.spec.ts`

**Interfaces:**

- Consumes: Existing `/classes/conversation-salon` page and Playwright helpers.
- Produces: Tests requiring `.schedule-directory` sections and stacked mobile order.

- [ ] **Step 1: Write the failing desktop test**

Replace the current conversation-salon layout expectation with assertions equivalent to:

```ts
await expect(page.locator(".schedule-directory")).toHaveCount(3);
await expect(page.locator(".comparison-table")).toHaveCount(0);
await expect(page.locator(".schedule-list")).toHaveCount(0);

const sogoDirectory = page.locator(".schedule-directory").filter({ hasText: "Iroha-kai" });
const irohaEntry = sogoDirectory
  .locator(".schedule-directory__entry")
  .filter({ hasText: "Iroha-kai" })
  .first();

await expect(irohaEntry.locator(".schedule-directory__day")).toContainText("Mon");
await expect(irohaEntry.locator(".schedule-directory__time")).toContainText("10:15〜11:45");
await expect(irohaEntry.locator(".schedule-directory__name")).toContainText("Iroha-kai");
await expect(irohaEntry.locator(".schedule-directory__details")).toContainText("4F");
await expect(
  irohaEntry.locator('.schedule-directory__actions a[title="2026irohakai.pdf"]'),
).toBeVisible();
```

- [ ] **Step 2: Write the failing mobile test**

Add a mobile viewport test equivalent to:

```ts
await page.setViewportSize({ width: 390, height: 900 });
await page.goto("/classes/conversation-salon");
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

expect(order.join(" ")).toContain("schedule-directory__day");
expect(order.join(" ")).toContain("schedule-directory__time");
expect(order.join(" ")).toContain("schedule-directory__name");
expect(order.join(" ")).toContain("schedule-directory__details");
expect(order.join(" ")).toContain("schedule-directory__actions");
expect(order.findIndex((value) => value.includes("schedule-directory__day"))).toBeLessThan(
  order.findIndex((value) => value.includes("schedule-directory__time")),
);
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon" --project=chromium
```

Expected: FAIL because `.schedule-directory` does not exist yet.

---

### Task 2: Renderer and Styling

**Files:**

- Create: `components/ScheduleDirectory.tsx`
- Modify: `app/globals.css`
- Modify: `lib/types.ts`
- Modify: `lib/section-renderers/table.tsx`

**Interfaces:**

- Consumes: `SectionTableColumn`, `SectionTableRow`, and existing table display helpers.
- Produces: `ScheduleDirectory({ columns, rows })` and a public `scheduleDirectory` display route.

- [ ] **Step 1: Implement `ScheduleDirectory`**

Create a component that:

```ts
type ScheduleDirectoryProps = {
  columns: SectionTableColumn[];
  rows: SectionTableRow[];
};
```

It must infer roles for `name`, `day`, `time`, `floor`, `location`, `fee`, `learner`, `remarks`, unknown detail fields, and file action columns. It must render each non-group row with child elements in this order:

```tsx
<li className="schedule-directory__entry">
  <div className="schedule-directory__day">...</div>
  <div className="schedule-directory__time">...</div>
  <div className="schedule-directory__name">...</div>
  <div className="schedule-directory__details">...</div>
  <div className="schedule-directory__actions">...</div>
</li>
```

File links must use compact visible labels like `PDF` or `Photos` and include `title={fileName}` plus an `aria-label` containing the filename.

- [ ] **Step 2: Add desktop and mobile CSS**

Add CSS with one parent-owned desktop grid:

```css
.schedule-directory__grid {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.25fr) minmax(0, 1fr) auto;
}

.schedule-directory__head,
.schedule-directory__entry {
  display: contents;
}
```

The mobile media query must collapse entries to one column and keep child order day, time, name, details, actions.

- [ ] **Step 3: Wire public rendering**

Add `scheduleDirectory` to `TableSection.display` and route it in `lib/section-renderers/table.tsx`:

```tsx
if (s.display === "scheduleDirectory") {
  ctx.push(<ScheduleDirectory columns={s.columns} rows={s.rows ?? []} />);
  ctx.flush();
  return;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon" --project=chromium
```

Expected: PASS locally once Sanity content uses `scheduleDirectory` in the development dataset or the renderer fallback is testable.

---

### Task 3: Sanity Editor and Content Migration

**Files:**

- Modify: `sanity/components/pages/sections/table-utils.ts`
- Modify: `sanity/schemas/tableSection.ts`
- Modify: `sanity/components/pages/sections/TableEditorPanel.tsx`

**Interfaces:**

- Consumes: Existing table display field and editor preview props.
- Produces: Editor-selectable `scheduleDirectory` display mode and matching preview.

- [ ] **Step 1: Add the Studio display option**

Add `"scheduleDirectory"` to the relevant display unions and schema options:

```ts
{ title: "スケジュールディレクトリ", value: "scheduleDirectory" }
```

- [ ] **Step 2: Add Studio preview rendering**

Import `ScheduleDirectory` and render it when the display value is `scheduleDirectory`.

- [ ] **Step 3: Patch Sanity content**

Patch both `page-kaiwasalon` and `drafts.page-kaiwasalon` so these section keys use the new display mode:

```text
adult-sogo-schedule
adult-other-location-schedule
youth-schedule
```

- [ ] **Step 4: Verify local tests and production**

Run:

```bash
./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon" --project=chromium
curl -sS https://yia-nextjs.vercel.app/classes/conversation-salon
```

Expected: Playwright PASS, production HTML includes `schedule-directory`, `Iroha-kai`, `Potluck International`, and `TERAKOYA-SAN`.

---

## Self-Review

- Spec coverage: The tasks cover renderer reuse, desktop alignment, mobile stacking, field mapping, file actions, CMS behavior, accessibility, tests, and content migration.
- Placeholder scan: No task uses open-ended placeholders; every step names exact files, commands, or expected code shape.
- Type consistency: The display value is consistently `scheduleDirectory`; the component interface is consistently `ScheduleDirectory({ columns, rows })`.
