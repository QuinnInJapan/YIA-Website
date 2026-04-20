# Typography Pass — YIA Site + Studio

**Date:** 2026-04-20
**Scope:** Base site (`app/globals.css`) + Studio custom components (`sanity/components/`)

---

## Goals

1. Semantic font sizes in Studio — all text of the same role uses the same token
2. Higher contrast across both site and studio — darker text, clearer tier separation
3. English parity — English text renders at the same size as its Japanese counterpart

---

## Base Site Changes (`app/globals.css`)

### Font Size Variables

Shift bottom three tokens up by 1px. Heading sizes unchanged.

| Token              | Old  | New  |
| ------------------ | ---- | ---- |
| `--font-size-xs`   | 13px | 14px |
| `--font-size-sm`   | 14px | 15px |
| `--font-size-base` | 15px | 16px |
| `--font-size-lg`   | 18px | 18px |
| `--font-size-xl`   | 22px | 22px |
| `--font-size-xxl`  | 26px | 26px |

These tokens are language-agnostic — they define role (body, label, caption), not language.

### Text Color Variables

Simplify from 4 tiers to 3, all darkened.

| Token                    | Old       | New         | Note                |
| ------------------------ | --------- | ----------- | ------------------- |
| `--color-text`           | `#1a2030` | `#111820`   | slightly darker     |
| `--color-text-muted`     | `#3d4f5f` | `#2a3a4a`   | meaningfully darker |
| `--color-text-secondary` | `#405060` | _(removed)_ | merged into muted   |
| `--color-text-faint`     | `#4a5565` | `#4a5a6a`   | cleaner blue-gray   |

All `var(--color-text-secondary)` references in the codebase → `var(--color-text-muted)`.

### English Parity

Remove font-size overrides from all `__en`-suffixed CSS rules that set a smaller size than their Japanese counterpart. English text inherits the same role token as its parent.

Exceptions (intentionally smaller — structural, not language-demoting):

- Ruby/furigana `rt` elements — these annotate characters, not body text
- `.site-header__name-en` — supplementary brand sub-label, kept visually subordinate

All `clamp()` values on `__en` classes are updated to match their Japanese sibling's range.

---

## Studio Changes

### Shared Token File (new)

**`sanity/lib/studioTokens.ts`**

```ts
export const fs = {
  meta: 13, // hints, timestamps, system badges, count labels
  label: 14, // field labels, nav group headers, section titles in forms
  body: 15, // nav items, list items, descriptions, button text
  title: 17, // panel titles, major section headings
} as const;
```

### Studio CSS Color Variables (`app/studio/studio-overrides.css`)

Update to match the new site palette:

| Variable                | Old       | New       |
| ----------------------- | --------- | --------- |
| `--card-fg-color`       | `#1a2030` | `#111820` |
| `--card-muted-fg-color` | `#3d4f5f` | `#2a3a4a` |
| `--card-icon-color`     | `#3d4f5f` | `#2a3a4a` |

### Component Inline Style Updates

All hardcoded `fontSize` values in the following files are replaced with `fs.*` tokens:

- `sanity/components/unified-pages/LeftPanel.tsx`
- `sanity/components/unified-pages/PageEditor.tsx`
- `sanity/components/unified-pages/CategoryManagement.tsx`
- `sanity/components/unified-pages/CategoryCreationForm.tsx`
- `sanity/components/unified-pages/PageCreationForm.tsx`
- `sanity/components/MediaBrowser.tsx`

**Mapping:**

| Current hardcoded values   | → Token                              |
| -------------------------- | ------------------------------------ |
| 10px, 11px                 | `fs.meta` (13)                       |
| 12px                       | `fs.label` (14)                      |
| 13px                       | `fs.body` (15)                       |
| 14px                       | `fs.body` (15)                       |
| 16px (inline style)        | `fs.body` or `fs.title` — by context |
| Sanity `fontSize={0}` prop | leave — Sanity UI native             |
| Sanity `fontSize={1}` prop | leave — Sanity UI native             |
| Sanity `fontSize={2}` prop | leave — Sanity UI native             |

Sanity UI component `fontSize` props (numeric, passed to `<Button>`, `<Text>`, etc.) are **not changed** — those use Sanity's own scale (`--font-size-0` through `--font-size-4`) which is already reasonable.

---

## Verification

- [ ] `grep -r "color-text-secondary" app/` returns zero results
- [ ] `grep -r "color-text-secondary" sanity/` returns zero results
- [ ] `grep -rn "fontSize: [0-9]" sanity/components/` returns zero results (all inline style numeric sizes replaced by `fs.*`)
- [ ] Visual spot-check: English text at same size as Japanese in section headers, page heroes, blog cards, nav, data tables
- [ ] Visual spot-check: Studio left panel labels readable at 13–15px
