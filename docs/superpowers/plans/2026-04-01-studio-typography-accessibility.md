# Studio Typography & Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSS variables for studio label font sizes, enforce a 12px minimum everywhere in the studio, and darken all muted/light text colors for accessibility.

**Architecture:** Two-pronged — (1) update `studio-overrides.css` to introduce `--studio-label-size` and `--studio-hint-size` CSS variables and darken global color vars, then (2) sweep all TSX components to use these variables and raise any remaining sub-12 hardcoded values to 12.

**Tech Stack:** React inline styles, CSS custom properties, Sanity UI (`@sanity/ui`)

---

## File Map

| File                                                              | Change                                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `app/studio/studio-overrides.css`                                 | Add `--studio-label-size` / `--studio-hint-size` vars; darken `--card-muted-fg-color`, `--card-icon-color`, `--input-placeholder-color` |
| `sanity/components/shared/BilingualInput.tsx`                     | Replace `fontSize: 10/12` with CSS var                                                                                                  |
| `sanity/components/shared/BilingualTextarea.tsx`                  | Replace `fontSize: 10/12` with CSS var                                                                                                  |
| `sanity/components/pages/sections/ContentSectionEditor.tsx`       | Replace `fontSize: 12` labels with CSS var                                                                                              |
| `sanity/components/pages/sections/EventScheduleSectionEditor.tsx` | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/sections/GroupScheduleSectionEditor.tsx` | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/sections/BoardMembersSectionEditor.tsx`  | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/sections/FeeTableSectionEditor.tsx`      | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/sections/HistorySectionEditor.tsx`       | Replace labels                                                                                                                          |
| `sanity/components/pages/sections/GenericSectionEditor.tsx`       | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/sections/LinksSectionEditor.tsx`         | Replace labels                                                                                                                          |
| `sanity/components/shared/KeyValueListEditor.tsx`                 | Replace labels; raise `10` → `12`                                                                                                       |
| `sanity/components/pages/SectionBar.tsx`                          | Raise `10` → `12`                                                                                                                       |
| `sanity/components/pages/SectionPickerPanel.tsx`                  | Raise `11` → `12`                                                                                                                       |
| `sanity/components/homepage/SettingsSection.tsx`                  | Raise `11` → `12`                                                                                                                       |
| `sanity/components/blog/PteEditor.tsx`                            | Raise `10` → `12`; remove `opacity: 0.6`                                                                                                |
| `sanity/components/HeroImagePreview.tsx`                          | Darken `#666` → `#3d4f5f`                                                                                                               |
| `sanity/components/shared/RawJsonViewer.tsx`                      | Darken `#999` → `#555`; darken borders                                                                                                  |
| `sanity/components/shared/media-utils.tsx`                        | Darken `#6b7a8d` → `#3d4f5f`                                                                                                            |
| `sanity/components/shared/DocumentDetailPanel.tsx`                | Darken background/border hardcoded colors                                                                                               |
| `sanity/components/unified-pages/PageEditor.tsx`                  | Raise `11` badge → `12`; replace `12` labels with CSS var                                                                               |
| `sanity/components/unified-pages/LeftPanel.tsx`                   | Raise `10/11` → `12`                                                                                                                    |
| `sanity/components/unified-pages/PageCreationForm.tsx`            | Replace `12` labels with CSS var                                                                                                        |
| `sanity/components/unified-pages/CategoryCreationForm.tsx`        | Replace `12` labels with CSS var                                                                                                        |
| `sanity/components/unified-pages/CategoryManagement.tsx`          | Raise `10/11` → `12`; replace labels with CSS var                                                                                       |

---

## Task 1: Add CSS variables and darken global colors

**Files:**

- Modify: `app/studio/studio-overrides.css`

- [ ] **Step 1: Add font-size variables and darken muted colors**

In `app/studio/studio-overrides.css`, update the `[data-ui="Studio"], [data-ui="Studio"] *` block:

```css
/* ── Typography ──────────────────────────────────────── */
--font-size-0: 13px;
--font-size-1: 15px;
--font-size-2: 17px;
--font-size-3: 21px;
--font-size-4: 25px;

/* ── Custom label/hint scale (minimum 12px) ──────────── */
--studio-label-size: 12px;
--studio-hint-size: 12px;
```

Then darken these existing variables (change values only, keep the keys):

```css
/* ── Muted / secondary text ──────────────────────────── */
--card-muted-fg-color: #2a3a4a !important; /* was #3d4f5f */
--card-muted-bg-color: #eef1f5 !important;
--card-icon-color: #2a3a4a !important; /* was #3d4f5f */

/* ── Inputs ──────────────────────────────────────────── */
--input-fg-color: #1a2030 !important;
--input-placeholder-color: #5d6d7e !important; /* was #9aa8b8 */
```

- [ ] **Step 2: Commit**

```bash
git add app/studio/studio-overrides.css
git commit -m "feat(studio): add --studio-label-size/hint-size vars; darken muted colors for accessibility"
```

---

## Task 2: Update shared input components (BilingualInput, BilingualTextarea)

**Files:**

- Modify: `sanity/components/shared/BilingualInput.tsx`
- Modify: `sanity/components/shared/BilingualTextarea.tsx`

- [ ] **Step 1: Update BilingualInput.tsx**

Read the file first, then replace all `fontSize: 10` and `fontSize: 12` inline styles on label/hint elements with the CSS variable:

- `fontSize: 12` (field label) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lang tag / hint) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 2: Update BilingualTextarea.tsx**

Same pattern as BilingualInput:

- `fontSize: 12` → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 3: Commit**

```bash
git add sanity/components/shared/BilingualInput.tsx sanity/components/shared/BilingualTextarea.tsx
git commit -m "feat(studio): use --studio-label-size/hint-size in bilingual input components"
```

---

## Task 3: Update section editor label fonts (ContentSection, EventSchedule, GroupSchedule)

**Files:**

- Modify: `sanity/components/pages/sections/ContentSectionEditor.tsx`
- Modify: `sanity/components/pages/sections/EventScheduleSectionEditor.tsx`
- Modify: `sanity/components/pages/sections/GroupScheduleSectionEditor.tsx`

- [ ] **Step 1: ContentSectionEditor.tsx**

Replace all `fontSize: 12` on label `<div>` elements with `fontSize: "var(--studio-label-size)"`.

- [ ] **Step 2: EventScheduleSectionEditor.tsx**

- `fontSize: 12` labels → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 66, 81, 96, 167, 178) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 3: GroupScheduleSectionEditor.tsx**

- `fontSize: 12` labels → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 128, 178, 192, 206) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 4: Commit**

```bash
git add sanity/components/pages/sections/ContentSectionEditor.tsx \
        sanity/components/pages/sections/EventScheduleSectionEditor.tsx \
        sanity/components/pages/sections/GroupScheduleSectionEditor.tsx
git commit -m "feat(studio): use CSS vars for label font sizes in section editors (content/event/group)"
```

---

## Task 4: Update section editor label fonts (BoardMembers, FeeTable, History, Generic, Links)

**Files:**

- Modify: `sanity/components/pages/sections/BoardMembersSectionEditor.tsx`
- Modify: `sanity/components/pages/sections/FeeTableSectionEditor.tsx`
- Modify: `sanity/components/pages/sections/HistorySectionEditor.tsx`
- Modify: `sanity/components/pages/sections/GenericSectionEditor.tsx`
- Modify: `sanity/components/pages/sections/LinksSectionEditor.tsx`

- [ ] **Step 1: BoardMembersSectionEditor.tsx**

- `fontSize: 12` (lines 35, 47) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 61, 75) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 2: FeeTableSectionEditor.tsx**

- `fontSize: 12` (line 34) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 52, 83, 100) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 3: HistorySectionEditor.tsx**

- `fontSize: 12` (lines 42, 68, 77, 114) → `fontSize: "var(--studio-label-size)"`

- [ ] **Step 4: GenericSectionEditor.tsx**

- `fontSize: 12` (lines 139, 181, 194, 251, 389) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 415, 439, 464) → `fontSize: "var(--studio-hint-size)"`
- `fontSize: 13` on textareas (lines 275, 297) → keep as-is (already ≥ 12)

- [ ] **Step 5: LinksSectionEditor.tsx** — check for any label divs with `fontSize: 12` and replace with `fontSize: "var(--studio-label-size)"`.

- [ ] **Step 6: Commit**

```bash
git add sanity/components/pages/sections/BoardMembersSectionEditor.tsx \
        sanity/components/pages/sections/FeeTableSectionEditor.tsx \
        sanity/components/pages/sections/HistorySectionEditor.tsx \
        sanity/components/pages/sections/GenericSectionEditor.tsx \
        sanity/components/pages/sections/LinksSectionEditor.tsx
git commit -m "feat(studio): use CSS vars for label font sizes in section editors (board/fee/history/generic/links)"
```

---

## Task 5: Update KeyValueListEditor and SectionBar/SectionPickerPanel

**Files:**

- Modify: `sanity/components/shared/KeyValueListEditor.tsx`
- Modify: `sanity/components/pages/SectionBar.tsx`
- Modify: `sanity/components/pages/SectionPickerPanel.tsx`

- [ ] **Step 1: KeyValueListEditor.tsx**

- `fontSize: 12` (lines 40, 109) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 10` (lines 129, 145) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 2: SectionBar.tsx**

- `fontSize: 10` (line 61) → `fontSize: 12`

(Other values at 13/14 are fine.)

- [ ] **Step 3: SectionPickerPanel.tsx**

- `fontSize: 11` (lines 73, 131) → `fontSize: 12`

- [ ] **Step 4: Commit**

```bash
git add sanity/components/shared/KeyValueListEditor.tsx \
        sanity/components/pages/SectionBar.tsx \
        sanity/components/pages/SectionPickerPanel.tsx
git commit -m "feat(studio): enforce 12px minimum in KeyValueListEditor and SectionBar/Picker"
```

---

## Task 6: Update homepage SettingsSection and blog PteEditor

**Files:**

- Modify: `sanity/components/homepage/SettingsSection.tsx`
- Modify: `sanity/components/blog/PteEditor.tsx`

- [ ] **Step 1: SettingsSection.tsx**

- `fontSize: 11` (lines 26, 64, 303) → `fontSize: 12`

- [ ] **Step 2: PteEditor.tsx**

- `fontSize: 10` (line 188) → `fontSize: 12`
- `opacity: 0.6` (line 188 or nearby) → remove the opacity entirely (it dims text below accessible contrast)

(Other values at 13/14/15/18/22 are fine.)

- [ ] **Step 3: Commit**

```bash
git add sanity/components/homepage/SettingsSection.tsx \
        sanity/components/blog/PteEditor.tsx
git commit -m "feat(studio): enforce 12px min in SettingsSection and PteEditor; remove opacity dimming"
```

---

## Task 7: Update unified-pages components

**Files:**

- Modify: `sanity/components/unified-pages/PageEditor.tsx`
- Modify: `sanity/components/unified-pages/LeftPanel.tsx`
- Modify: `sanity/components/unified-pages/PageCreationForm.tsx`
- Modify: `sanity/components/unified-pages/CategoryCreationForm.tsx`
- Modify: `sanity/components/unified-pages/CategoryManagement.tsx`

- [ ] **Step 1: PageEditor.tsx**

- `fontSize: 12` label divs (lines 397, 453, 465, 479, 491, 505, 528, 558) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 11` badge span (line 337) → `fontSize: 12`

- [ ] **Step 2: LeftPanel.tsx**

- `fontSize: 10` (lines 122, 417) → `fontSize: 12`
- `fontSize: 11` (lines 162, 179, 316, 332, 349, 412) → `fontSize: 12`

- [ ] **Step 3: PageCreationForm.tsx**

- `fontSize: 12` labels (lines 89, 111, 129, 142) → `fontSize: "var(--studio-label-size)"`
- `fontSize: 11` URL preview (line 102) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 4: CategoryCreationForm.tsx**

- `fontSize: 12` labels → `fontSize: "var(--studio-label-size)"`
- `fontSize: 11` (line 115) → `fontSize: "var(--studio-hint-size)"`

- [ ] **Step 5: CategoryManagement.tsx**

- `fontSize: 12` labels → `fontSize: "var(--studio-label-size)"`
- `fontSize: 11` (lines 249, 264, 310, 361, 379) → `fontSize: 12`

- [ ] **Step 6: Commit**

```bash
git add sanity/components/unified-pages/PageEditor.tsx \
        sanity/components/unified-pages/LeftPanel.tsx \
        sanity/components/unified-pages/PageCreationForm.tsx \
        sanity/components/unified-pages/CategoryCreationForm.tsx \
        sanity/components/unified-pages/CategoryManagement.tsx
git commit -m "feat(studio): CSS var labels + 12px minimum in unified-pages components"
```

---

## Task 8: Darken hardcoded hex colors in shared components

**Files:**

- Modify: `sanity/components/HeroImagePreview.tsx`
- Modify: `sanity/components/shared/RawJsonViewer.tsx`
- Modify: `sanity/components/shared/media-utils.tsx`
- Modify: `sanity/components/shared/DocumentDetailPanel.tsx`

- [ ] **Step 1: HeroImagePreview.tsx**

- `color: "#666"` → `color: "#333"`
- `background: "#f5f5f5"` → leave (background, not text)

- [ ] **Step 2: RawJsonViewer.tsx**

- `color: "#999"` (lines 33, 120) → `color: "#555"`
- `color: "#e0e0e0"` (lines 104, 141) — these are likely borders/dividers, leave or check context

- [ ] **Step 3: media-utils.tsx**

- `color: "#6b7a8d"` → `color: "var(--card-muted-fg-color)"` (use the now-darkened CSS var)

- [ ] **Step 4: DocumentDetailPanel.tsx**

- `background: "#f0f2f5"` → leave (background)
- `border: "1px solid #e0e0e0"` → `border: "1px solid var(--card-border-color)"` (consistent with theme)

- [ ] **Step 5: Commit**

```bash
git add sanity/components/HeroImagePreview.tsx \
        sanity/components/shared/RawJsonViewer.tsx \
        sanity/components/shared/media-utils.tsx \
        sanity/components/shared/DocumentDetailPanel.tsx
git commit -m "feat(studio): darken hardcoded light hex colors for accessibility"
```

---

## Self-Review Checklist

- [x] CSS variables introduced: `--studio-label-size`, `--studio-hint-size`
- [x] Global muted color vars darkened: `--card-muted-fg-color`, `--card-icon-color`, `--input-placeholder-color`
- [x] All `fontSize: 10` occurrences addressed
- [x] All `fontSize: 11` occurrences addressed
- [x] `opacity: 0.6` on text removed (PteEditor)
- [x] Hardcoded `#999`, `#666`, `#6b7a8d` darkened
- [x] SVG `fontSize: "5"` intentionally excluded (SVG attribute, not CSS — harmless)
- [x] `--font-size-0: 13px` (Sanity UI scale) untouched — already ≥ 12
