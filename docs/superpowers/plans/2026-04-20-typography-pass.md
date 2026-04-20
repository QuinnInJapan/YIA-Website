# Typography Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise base font sizes, increase text contrast, equalize English/Japanese type sizes, and replace all hardcoded studio font sizes with semantic tokens.

**Architecture:** All base-site changes live in `app/globals.css` and `app/blog.css` — updating CSS custom properties propagates most changes automatically. Studio component changes replace hardcoded inline `fontSize` numbers with a shared `fs` constants object from a new `sanity/lib/studioTokens.ts` file.

**Tech Stack:** CSS custom properties, TypeScript (React inline styles), Next.js App Router

---

## Files

**Modified:**

- `app/globals.css` — font-size tokens, color tokens, hardcoded px audit, `__en` parity
- `app/blog.css` — 2 `color-text-secondary` references
- `app/studio/studio-overrides.css` — 4 color variable updates
- `sanity/components/unified-pages/LeftPanel.tsx` — 11 inline font sizes
- `sanity/components/unified-pages/PageEditor.tsx` — 7 inline font sizes
- `sanity/components/unified-pages/CategoryManagement.tsx` — 9 inline font sizes
- `sanity/components/unified-pages/CategoryCreationForm.tsx` — 3 inline font sizes
- `sanity/components/unified-pages/PageCreationForm.tsx` — 5 inline font sizes
- `sanity/components/unified-pages/CategoryPreview.tsx` — 1 inline font size

**Created:**

- `sanity/lib/studioTokens.ts` — shared font-size constants

**Not changed:**

- `sanity/components/MediaBrowser.tsx` — all `fontSize` usages are Sanity UI JSX props (`fontSize={N}`), not inline styles

---

## Task 1: Update design tokens in globals.css

**Files:**

- Modify: `app/globals.css` (`:root` block, lines 86–111)

- [ ] **Step 1: Verify current token values**

```bash
grep -n "font-size-base\|font-size-sm\|font-size-xs\|color-text:" app/globals.css | head -10
```

Expected output includes `--font-size-base: 15px`, `--font-size-sm: 14px`, `--font-size-xs: 13px`, `--color-text: #1a2030`, etc.

- [ ] **Step 2: Update font-size tokens**

In `app/globals.css`, find the `:root` block and change:

```css
/* Before */
--font-size-base: 15px;
--font-size-sm: 14px;
--font-size-xs: 13px;

/* After */
--font-size-base: 16px;
--font-size-sm: 15px;
--font-size-xs: 14px;
```

(`--font-size-lg`, `--font-size-xl`, `--font-size-xxl` are unchanged.)

- [ ] **Step 3: Update color tokens**

In `app/globals.css`, find the `:root` block and change:

```css
/* Before */
--color-text: #1a2030;
--color-text-muted: #3d4f5f;
--color-text-secondary: #405060;
--color-text-faint: #4a5565;

/* After */
--color-text: #111820;
--color-text-muted: #2a3a4a;
/* --color-text-secondary removed — replaced by --color-text-muted throughout */
--color-text-faint: #4a5a6a;
```

- [ ] **Step 4: Replace all `color-text-secondary` usages in globals.css**

These 4 lines in `app/globals.css` reference `--color-text-secondary`. Change each to `--color-text-muted`:

| Selector context        | Line (approx) | Change                                                          |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| `.info-dl__row dt` area | ~1855         | `var(--color-text-secondary)` → `var(--color-text-muted)`       |
| `.definition-card` area | ~1900         | `var(--color-text-secondary)` → `var(--color-text-muted)`       |
| `.callout` area         | ~1949         | `var(--color-text-secondary, #555)` → `var(--color-text-muted)` |
| `.cat-item` area        | ~4941         | `var(--color-text-secondary)` → `var(--color-text-muted)`       |

- [ ] **Step 5: Replace `color-text-secondary` usages in blog.css**

In `app/blog.css`, find and change both:

```css
/* Before (~line 110) */
.blog-card__excerpt {
  color: var(--color-text-secondary);

/* After */
.blog-card__excerpt {
  color: var(--color-text-muted);
```

```css
/* Before (~line 390) */
.blog-post__body-en {
  color: var(--color-text-secondary);
}

/* After */
.blog-post__body-en {
  color: var(--color-text-muted);
}
```

- [ ] **Step 6: Verify no remaining `color-text-secondary` references**

```bash
grep -r "color-text-secondary" app/ sanity/ components/
```

Expected: zero results.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/blog.css
git commit -m "style: update font-size and color design tokens"
```

---

## Task 2: Update body default and audit hardcoded font sizes in globals.css

**Files:**

- Modify: `app/globals.css`

- [ ] **Step 1: Update body default**

In `app/globals.css`, find the `body` rule near the top and change:

```css
/* Before */
body {
  ...
  font-size: 15px;

/* After */
body {
  ...
  font-size: 16px;
```

- [ ] **Step 2: Replace hardcoded sizes that should use variables**

Find each selector below and make the stated change:

```css
/* .oshirase-pin — was 10px, bump to xs */
.oshirase-pin {
  font-size: var(--font-size-xs); /* was 10px */
```

```css
/* .home-section__heading small — was 14px, use sm */
.home-section__heading small {
  font-size: var(--font-size-sm); /* was 14px */
```

```css
/* .about-showcase .mission-block__ja — was 15px, use base */
.about-showcase .mission-block__ja {
  font-size: var(--font-size-base); /* was 15px */
```

```css
/* .access-block__info — was 15px, use base */
.access-block__info {
  font-size: var(--font-size-base); /* was 15px */
```

```css
/* .access-block__name — was 17px, round up to lg */
.access-block__name {
  font-size: var(--font-size-lg); /* was 17px */
```

```css
/* close/menu button in mobile nav — was 18px, use lg */
/* selector is a button with font-size: 18px near .site-nav area ~line 3888 */
font-size: var(--font-size-lg); /* was 18px */
```

```css
/* .blog-card__category (tag badge) — was 11px, bump to xs */
/* find the rule with font-size: 11px near border-radius: 3px ~line 4929 */
font-size: var(--font-size-xs); /* was 11px */
```

- [ ] **Step 3: Mark intentional one-off values with comments**

Find each of these and add the `/* intentional: */` comment on the same line:

| Selector / location                                        | Value | Comment to add                                                                                   |
| ---------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `font-size: 0` (×2, ruby text hiding, lines ~182 and ~580) | 0     | `/* intentional: hides ruby visually, accessible to screen readers */`                           |
| `.announcement__title`                                     | 20px  | `/* intentional: announcement emphasis between --font-size-lg(18px) and --font-size-xl(22px) */` |
| Photo lightbox close button                                | 24px  | `/* intentional: lightbox UI control */`                                                         |
| Photo lightbox nav buttons (×2)                            | 28px  | `/* intentional: lightbox UI control */`                                                         |
| `.activity-grid__tile-big`                                 | 52px  | `/* intentional: large display number */`                                                        |
| `.site-nav__brand-en`                                      | 10px  | `/* intentional: supplementary brand sub-label in mobile nav, kept subordinate */`               |

- [ ] **Step 4: Verify all remaining bare px values are commented**

```bash
grep -n "font-size: [0-9]" app/globals.css
```

Every line in the output should either be `font-size: 0`, reference a variable via `var(--`, use `clamp(`, or have an `/* intentional:` comment. If any bare px values remain without a comment, add one or replace with a variable.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: audit and fix hardcoded font sizes in globals.css"
```

---

## Task 3: English parity — remove smaller `__en` font sizes

**Files:**

- Modify: `app/globals.css`

For each rule below, remove the `font-size` declaration so English text inherits its parent's size. **Do not remove any other properties** (color, weight, margin, etc.).

- [ ] **Step 1: Remove font-size from inline bilingual classes**

```css
/* .page-hero__description-en — remove font-size line */
.page-hero__description-en {
  /* remove: font-size: var(--font-size-sm); */
  margin-top: var(--spacing-xs);
}
```

```css
/* .section-header--plain .section-header__en — remove font-size line */
.section-header--plain .section-header__en {
  display: block;
  margin-left: 0;
  margin-top: var(--spacing-xs);
  /* remove: font-size: var(--font-size-xs); */
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

```css
/* .section-header__en — remove font-size line */
.section-header__en {
  /* remove: font-size: var(--font-size-sm); */
  font-weight: normal;
  margin-left: var(--spacing-sm);
  opacity: 0.8;
}
```

```css
/* .nav-item__en — remove font-size line */
.nav-item__en {
  display: block;
  /* remove: font-size: var(--font-size-sm); */
  color: var(--color-text-muted);
}
```

```css
/* .bilingual-block__en — remove font-size line */
.bilingual-block__en {
  /* remove: font-size: var(--font-size-xs); */
  color: var(--color-text-faint);
  line-height: 1.6;
  ...
}
```

```css
/* .resource-link__en — remove font-size line */
.resource-link__en {
  display: block;
  /* remove: font-size: var(--font-size-sm); */
  color: var(--color-text-faint);
  margin-top: var(--spacing-xs);
}
```

```css
/* .page-subtitle__en — remove font-size line */
.page-subtitle__en {
  /* remove: font-size: var(--font-size-sm); */
  color: var(--color-text-faint);
}
```

```css
/* .data-table__en — remove font-size line */
.data-table__en {
  color: var(--color-text-muted);
  /* remove: font-size: var(--font-size-xs); */
}
```

```css
/* .oshirase-title__en — remove font-size line */
.oshirase-title__en {
  /* remove: font-size: var(--font-size-xs); */
  color: var(--color-text-muted);
  line-height: 1.4;
}
```

```css
/* .oshirase-viewall__en — remove font-size line */
.oshirase-viewall__en {
  /* remove: font-size: var(--font-size-xs); */
  font-weight: 400;
  color: var(--color-text-muted);
}
```

```css
/* .site-nav__mobile-link .nav-item__en — remove font-size line */
.site-nav__mobile-link .nav-item__en {
  /* remove: font-size: var(--font-size-xs); */
  color: var(--color-text-faint);
}
```

```css
/* .cat-item__desc .bilingual-block__en — remove font-size line */
.cat-item__desc .bilingual-block__en {
  /* remove: font-size: var(--font-size-xs, 0.75rem); */
  color: var(--color-text-muted, #666);
  margin-top: 0.5rem;
  line-height: 1.7;
}
```

- [ ] **Step 2: Update clamp-based \_\_en classes**

```css
/* .mission-block__en — bump clamp range to match base/lg sizes */
.mission-block__en {
  font-size: clamp(16px, 1.6vw, 18px); /* was clamp(14px, 1.6vw, 16px) */
  ...
}
```

```css
/* .program-band__en — bump clamp minimum to base (16px = 1rem) */
.program-band__en {
  font-size: clamp(1rem, 1.6vw, 1.5rem); /* was clamp(0.9rem, 1.6vw, 1.35rem) */
  ...
}
```

- [ ] **Step 3: Verify no `__en` rules set a smaller font-size than base (14px)**

```bash
grep -A5 "__en" app/globals.css | grep "font-size"
```

Expected: only `clamp(` results or no results. No remaining `var(--font-size-xs)` or `var(--font-size-sm)` in `__en` rules (those are now handled by the parent inheriting).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: remove smaller font sizes from English variant CSS rules"
```

---

## Task 4: Create studio semantic token file

**Files:**

- Create: `sanity/lib/studioTokens.ts`

- [ ] **Step 1: Create the file**

```typescript
// sanity/lib/studioTokens.ts

/**
 * Semantic font-size constants for custom Studio components.
 *
 * These are for inline `style={{ fontSize: fs.body }}` usage in custom
 * React components. Do NOT use for Sanity UI component `fontSize={N}` props
 * — those use Sanity's own scale and should be left as-is.
 */
export const fs = {
  meta: 13, // hints, timestamps, system badges, count labels
  label: 14, // field labels, nav group headers, section titles in forms
  body: 15, // nav items, list items, descriptions, button text
  title: 17, // panel titles, major section headings
} as const;
```

- [ ] **Step 2: Verify file is importable (TypeScript check)**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add sanity/lib/studioTokens.ts
git commit -m "feat: add studio semantic font-size tokens"
```

---

## Task 5: Update LeftPanel.tsx inline font sizes

**Files:**

- Modify: `sanity/components/unified-pages/LeftPanel.tsx`

- [ ] **Step 1: Add import**

At the top of `sanity/components/unified-pages/LeftPanel.tsx`, add:

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

- [ ] **Step 2: Replace all inline style fontSize values**

Find every `fontSize: N` (colon syntax, in style objects — not `fontSize={N}` JSX props) and replace per this table:

| Current        | Replace with         | Role              |
| -------------- | -------------------- | ----------------- |
| `fontSize: 10` | `fontSize: fs.meta`  | tiny system label |
| `fontSize: 11` | `fontSize: fs.meta`  | small hint/badge  |
| `fontSize: 12` | `fontSize: fs.label` | field/group label |
| `fontSize: 13` | `fontSize: fs.body`  | nav item text     |

Affected lines (approximate, may shift after import added): 44, 122, 143, 162, 179, 316, 332, 349, 412, 417, 435.

Line 417 is inline JSX: `<span style={{ fontSize: 10, marginLeft: 6 }}>` — change to `<span style={{ fontSize: fs.meta, marginLeft: 6 }}>`.

- [ ] **Step 3: Verify no bare numbers remain in style objects**

```bash
grep -n "fontSize: [0-9]" sanity/components/unified-pages/LeftPanel.tsx
```

Expected: zero results.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add sanity/components/unified-pages/LeftPanel.tsx
git commit -m "style: replace hardcoded font sizes in LeftPanel with semantic tokens"
```

---

## Task 6: Update PageEditor.tsx inline font sizes

**Files:**

- Modify: `sanity/components/unified-pages/PageEditor.tsx`

- [ ] **Step 1: Add import**

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

- [ ] **Step 2: Replace inline style fontSize values**

| Current        | Replace with         | Role               |
| -------------- | -------------------- | ------------------ |
| `fontSize: 11` | `fontSize: fs.meta`  | section hint label |
| `fontSize: 12` | `fontSize: fs.label` | field label        |
| `fontSize: 13` | `fontSize: fs.body`  | description text   |

Affected lines: ~350, ~410, ~455, ~466, ~478, ~493, ~504, ~522, ~610.

Leave `fontSize={0}`, `fontSize={1}`, `fontSize={2}` (Sanity UI JSX props) unchanged.

- [ ] **Step 3: Verify**

```bash
grep -n "fontSize: [0-9]" sanity/components/unified-pages/PageEditor.tsx
```

Expected: zero results.

- [ ] **Step 4: TypeScript check + commit**

```bash
npx tsc --noEmit
git add sanity/components/unified-pages/PageEditor.tsx
git commit -m "style: replace hardcoded font sizes in PageEditor with semantic tokens"
```

---

## Task 7: Update CategoryManagement.tsx inline font sizes

**Files:**

- Modify: `sanity/components/unified-pages/CategoryManagement.tsx`

- [ ] **Step 1: Add import**

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

- [ ] **Step 2: Replace inline style fontSize values**

| Current        | Replace with        | Role             |
| -------------- | ------------------- | ---------------- |
| `fontSize: 11` | `fontSize: fs.meta` | small hint/badge |
| `fontSize: 13` | `fontSize: fs.body` | list item text   |
| `fontSize: 14` | `fontSize: fs.body` | item text        |

Affected lines: ~207, ~253, ~268, ~295, ~314, ~353, ~365, ~383, ~405.

Leave `fontSize={1}` (Sanity UI JSX prop at lines ~165, ~173, ~431) unchanged.

- [ ] **Step 3: Verify + commit**

```bash
grep -n "fontSize: [0-9]" sanity/components/unified-pages/CategoryManagement.tsx
# Expected: zero results
npx tsc --noEmit
git add sanity/components/unified-pages/CategoryManagement.tsx
git commit -m "style: replace hardcoded font sizes in CategoryManagement with semantic tokens"
```

---

## Task 8: Update CategoryCreationForm.tsx and PageCreationForm.tsx

**Files:**

- Modify: `sanity/components/unified-pages/CategoryCreationForm.tsx`
- Modify: `sanity/components/unified-pages/PageCreationForm.tsx`

- [ ] **Step 1: Add import to CategoryCreationForm.tsx**

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

- [ ] **Step 2: Replace in CategoryCreationForm.tsx**

| Current        | Replace with         |
| -------------- | -------------------- |
| `fontSize: 11` | `fontSize: fs.meta`  |
| `fontSize: 12` | `fontSize: fs.label` |
| `fontSize: 13` | `fontSize: fs.body`  |

Affected lines: ~89, ~115, ~141.

Leave `fontSize={1}` JSX props unchanged.

- [ ] **Step 3: Add import to PageCreationForm.tsx**

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

- [ ] **Step 4: Replace in PageCreationForm.tsx**

| Current        | Replace with         |
| -------------- | -------------------- |
| `fontSize: 11` | `fontSize: fs.meta`  |
| `fontSize: 12` | `fontSize: fs.label` |

Affected lines: ~89, ~102, ~111, ~129, ~142.

Leave `fontSize={1}` JSX props unchanged.

- [ ] **Step 5: Verify both files + commit**

```bash
grep -n "fontSize: [0-9]" sanity/components/unified-pages/CategoryCreationForm.tsx sanity/components/unified-pages/PageCreationForm.tsx
# Expected: zero results
npx tsc --noEmit
git add sanity/components/unified-pages/CategoryCreationForm.tsx sanity/components/unified-pages/PageCreationForm.tsx
git commit -m "style: replace hardcoded font sizes in creation forms with semantic tokens"
```

---

## Task 9: Update CategoryPreview.tsx

**Files:**

- Modify: `sanity/components/unified-pages/CategoryPreview.tsx`

- [ ] **Step 1: Read the file and determine role of line ~36**

```bash
sed -n '30,42p' sanity/components/unified-pages/CategoryPreview.tsx
```

If `fontSize: 16` is on a title/heading element → use `fs.title` (17).
If it is on body/description text → use `fs.body` (15).

- [ ] **Step 2: Add import and replace**

```typescript
import { fs } from "@/sanity/lib/studioTokens";
```

Replace `fontSize: 16` with `fs.title` or `fs.body` per the context determined above.

- [ ] **Step 3: Verify + commit**

```bash
grep -n "fontSize: [0-9]" sanity/components/unified-pages/CategoryPreview.tsx
# Expected: zero results
npx tsc --noEmit
git add sanity/components/unified-pages/CategoryPreview.tsx
git commit -m "style: replace hardcoded font size in CategoryPreview with semantic token"
```

---

## Task 10: Update studio CSS color variables

**Files:**

- Modify: `app/studio/studio-overrides.css`

- [ ] **Step 1: Update color variables**

In `app/studio/studio-overrides.css`, find the relevant sections and change:

```css
/* Before */
--card-fg-color: #1a2030 !important;
--card-muted-fg-color: #3d4f5f !important;
--card-icon-color: #3d4f5f !important;
--input-fg-color: #1a2030 !important;

/* After */
--card-fg-color: #111820 !important;
--card-muted-fg-color: #2a3a4a !important;
--card-icon-color: #2a3a4a !important;
--input-fg-color: #111820 !important;
```

- [ ] **Step 2: Commit**

```bash
git add app/studio/studio-overrides.css
git commit -m "style: update studio color variables to match new contrast tokens"
```

---

## Task 11: Final verification

- [ ] **Step 1: No remaining `color-text-secondary` anywhere**

```bash
grep -r "color-text-secondary" app/ sanity/ components/
```

Expected: zero results.

- [ ] **Step 2: No bare numeric font sizes in studio inline styles**

```bash
grep -rn "fontSize: [0-9]" sanity/components/
```

Expected: zero results.

- [ ] **Step 3: All hardcoded px values in globals.css are reviewed**

```bash
grep -n "font-size: [0-9]" app/globals.css
```

Expected: every line either is `font-size: 0` (ruby hiding), or has an `/* intentional:` comment.

- [ ] **Step 4: TypeScript clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Visual spot-checks**

Open the site locally and verify:

1. Body text is visibly larger and darker than before
2. A bilingual section (e.g. page hero, section header with `__en`) — English text is the same size as Japanese
3. Studio left panel — labels and item names are readable without squinting
4. Studio field labels are clearly legible at 14px
5. Blog card category tag is no longer tiny (was 11px → now 14px)
