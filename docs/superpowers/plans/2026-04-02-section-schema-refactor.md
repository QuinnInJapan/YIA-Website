# Section Schema Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce 16 section types to 8 by renaming and consolidating schemas, migrating all production data, and retiring legacy renderers.

**Architecture:** New schemas are added alongside old ones first; frontend renderers for new types are written in parallel; Sanity data is migrated section-by-section via scripts; old schemas/renderers are removed last. This keeps the site functional throughout.

**Tech Stack:** TypeScript, Sanity 5 (`@sanity/client`), Next.js 16, `next-sanity`, Playwright E2E tests, Node.js `.mjs` migration scripts

---

## File Map

**Create:**

- `sanity/schemas/tableSection.ts` — new general-purpose table schema
- `sanity/schemas/labelTableSection.ts` — renamed from infoTableSection (note fields removed)
- `sanity/schemas/infoCardsSection.ts` — renamed from definitionsSection (no field changes)
- `sanity/schemas/imageCardsSection.ts` — renamed from sisterCitiesSection (`cities` → `items`)
- `components/SectionTable.tsx` — table renderer component (bilingual headers, type hints, group rows)
- `lib/section-renderers/table.tsx` — handler for `table` sections
- `lib/section-renderers/label-table.tsx` — handler for `labelTable` sections
- `lib/section-renderers/info-cards.tsx` — handler for `infoCards` sections
- `lib/section-renderers/image-cards.tsx` — handler for `imageCards` sections
- `scripts/migrate-01-renames.mjs` — rename `infoTable`→`labelTable`, `definitions`→`infoCards`, `sisterCities`→`imageCards` (+ `cities`→`items`)
- `scripts/migrate-02-content-subfields.mjs` — extract content sub-fields into sibling sections
- `scripts/migrate-03-labeltable-notes.mjs` — inline labelTable note fields
- `scripts/migrate-04-table-consolidation.mjs` — convert 7 types → `table`
- `scripts/migrate-05-eventschedule-single.mjs` — eventSchedule single-date → `labelTable`
- `scripts/migrate-06-fairtrade.mjs` — decompose fairTrade into 3 sections
- `scripts/migrate-07-flyers.mjs` — delete flyers sections

**Modify:**

- `sanity/schemas/contentSection.ts` — strip all sub-fields (infoTable, checklist, documents, note, images, schedule)
- `sanity/schemas/index.ts` — add new schemas, keep old ones during migration phase
- `sanity/schemas/page.ts` — add new types to sections array, keep old for migration phase
- `lib/types.ts` — add 4 new section types; remove old ones after migration
- `lib/section-renderers/content.tsx` — remove all sub-field rendering
- `lib/section-renderers/index.ts` — add new handlers, remove old after migration

**Delete (Task 18):**

- `sanity/schemas/infoTableSection.ts`, `definitionsSection.ts`, `sisterCitiesSection.ts`
- `sanity/schemas/tableScheduleSection.ts`, `historySection.ts`, `feeTableSection.ts`
- `sanity/schemas/groupScheduleSection.ts`, `boardMembersSection.ts`, `directoryListSection.ts`
- `sanity/schemas/eventScheduleSection.ts`, `fairTradeSection.ts`, `flyersSection.ts`
- `sanity/schemas/scheduleDateEntry.ts`, `boardMember.ts`, `groupScheduleRow.ts`, `eventFlyer.ts`, `definition.ts`, `sisterCity.ts`
- `lib/section-renderers/info-table.tsx`, `definitions.tsx`, `sister-cities.tsx`
- `lib/section-renderers/schedules.tsx`, `history.tsx`, `fair-trade.tsx`
- `lib/section-renderers/flyers.tsx`, `board-members.tsx`, `fee-table.tsx`, `directory-list.tsx`

---

### Task 1: Create `tableSection.ts` schema

**Files:**

- Create: `sanity/schemas/tableSection.ts`

- [ ] **Step 1: Write the schema file**

```typescript
// sanity/schemas/tableSection.ts
import { defineType, defineField } from "sanity";
import { TableIcon } from "@sanity/icons";

export default defineType({
  name: "table",
  title: "テーブルセクション",
  type: "object",
  description: "カスタム列定義と任意の行グループ分けを持つ汎用テーブル。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "テーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Table",
      media: TableIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "caption",
      title: "キャプション",
      type: "internationalizedArrayString",
      description: "タイトル下に小さく表示する補足（例：「〇〇年〇月現在」）。任意。",
    }),
    defineField({
      name: "columns",
      title: "列定義",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "列見出し",
              type: "internationalizedArrayString",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "type",
              title: "列の種類",
              type: "string",
              options: {
                list: [
                  { title: "テキスト (text)", value: "text" },
                  { title: "日付 (date)", value: "date" },
                  { title: "電話番号 (phone)", value: "phone" },
                  { title: "URL (url)", value: "url" },
                  { title: "金額 (currency)", value: "currency" },
                  { title: "氏名 (name)", value: "name" },
                ],
              },
              initialValue: "text",
            }),
          ],
          preview: {
            select: { label: "label", type: "type" },
            prepare: ({
              label,
              type,
            }: {
              label?: { _key: string; value: string }[];
              type?: string;
            }) => ({
              title: label?.find((l) => l._key === "ja")?.value || "列",
              subtitle: type || "text",
            }),
          },
        },
      ],
      description: "テーブルの列定義。",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "groupLabel",
              title: "グループ見出し",
              type: "internationalizedArrayString",
              description: "入力するとこの行がグループ見出し行になります（データセルは不要）。",
            }),
            defineField({
              name: "cells",
              title: "セル",
              type: "array",
              of: [{ type: "internationalizedArrayString" }],
              description: "各列に対応するセルの値。グループ見出し行では省略可。",
            }),
          ],
          preview: {
            select: { groupLabel: "groupLabel", cells: "cells" },
            prepare: ({
              groupLabel,
              cells,
            }: {
              groupLabel?: { _key: string; value: string }[];
              cells?: unknown[];
            }) => ({
              title:
                groupLabel?.find((g) => g._key === "ja")?.value ??
                `行（${cells?.length ?? 0}セル）`,
            }),
          },
        },
      ],
      description: "テーブルの行データ。",
    }),
  ],
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors for this new file (it doesn't import anything unknown yet).

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/tableSection.ts
git commit -m "feat: add tableSection schema for unified table type"
```

---

### Task 2: Create rename schemas (`labelTable`, `infoCards`, `imageCards`)

**Files:**

- Create: `sanity/schemas/labelTableSection.ts`
- Create: `sanity/schemas/infoCardsSection.ts`
- Create: `sanity/schemas/imageCardsSection.ts`

- [ ] **Step 1: Write `labelTableSection.ts`**

`infoTable` renamed to `labelTable`; `appointmentNote`, `additionalLanguageNote`, `otherNotes` removed.

```typescript
// sanity/schemas/labelTableSection.ts
import { defineType, defineField } from "sanity";
import { ThListIcon } from "@sanity/icons";

export default defineType({
  name: "labelTable",
  title: "ラベルテーブルセクション",
  type: "object",
  description: "ラベル・値の定義リスト形式で情報を表示（開催日時、対象者、費用など）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "ラベルテーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Label Table",
      media: ThListIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "テーブルの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [{ type: "infoRow" }],
      description: "テーブルの行。各行はラベルと値のペアです。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
```

- [ ] **Step 2: Write `infoCardsSection.ts`**

`definitions` renamed to `infoCards`. No field changes.

```typescript
// sanity/schemas/infoCardsSection.ts
import { defineType, defineField } from "sanity";
import { BookIcon } from "@sanity/icons";

export default defineType({
  name: "infoCards",
  title: "情報カードセクション",
  type: "object",
  description: "用語と定義のカード形式一覧。用語集や概念の説明に使用します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "情報カードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Info Cards",
      media: BookIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "definition" }],
      description: "用語と定義のペア一覧。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
```

- [ ] **Step 3: Write `imageCardsSection.ts`**

`sisterCities` renamed to `imageCards`. `cities` array renamed to `items`.

```typescript
// sanity/schemas/imageCardsSection.ts
import { defineType, defineField } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export default defineType({
  name: "imageCards",
  title: "イメージカードセクション",
  type: "object",
  description: "画像付きカードの一覧表示。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "イメージカードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Image Cards",
      media: EarthGlobeIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "items",
      title: "アイテム",
      type: "array",
      of: [{ type: "sisterCity" }],
      description: "カードの一覧。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
```

- [ ] **Step 4: Commit**

```bash
git add sanity/schemas/labelTableSection.ts sanity/schemas/infoCardsSection.ts sanity/schemas/imageCardsSection.ts
git commit -m "feat: add labelTable, infoCards, imageCards schemas (renamed from infoTable, definitions, sisterCities)"
```

---

### Task 3: Strip sub-fields from `contentSection.ts`

**Files:**

- Modify: `sanity/schemas/contentSection.ts`

- [ ] **Step 1: Remove `infoTable`, `checklist`, `documents`, `note`, `images`, `schedule` fields, and the `extras` fieldset**

Replace the entire `contentSection.ts` with:

```typescript
// sanity/schemas/contentSection.ts
import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  description: "汎用コンテンツブロック（説明文）",
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "コンテンツセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Content",
      media: DocumentTextIcon,
    }),
  },
  fields: [
    defineField({
      name: "id",
      title: "ID",
      type: "string",
      fieldset: "advanced",
      description: "セクションの識別子（変更するとページ内リンクが壊れます。管理者のみ変更可能）",
      readOnly: true,
    }),
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。ページ上で太字の見出しとして表示されます。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      title: "タイトルなし",
      type: "boolean",
      fieldset: "advanced",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayText",
      description: "セクションの本文。",
    }),
  ],
});
```

- [ ] **Step 2: Commit**

```bash
git add sanity/schemas/contentSection.ts
git commit -m "refactor: strip content section sub-fields (infoTable, checklist, documents, note, images, schedule)"
```

---

### Task 4: Register new schemas and update `page.ts`

**Files:**

- Modify: `sanity/schemas/index.ts`
- Modify: `sanity/schemas/page.ts`

- [ ] **Step 1: Add new section imports and exports to `sanity/schemas/index.ts`**

Add after the existing section type imports (keep all old imports — they coexist during migration):

```typescript
// sanity/schemas/index.ts
// Object types
import infoRow from "./infoRow";
import imageFile from "./imageFile";
import documentLink from "./documentLink";
import eventFlyer from "./eventFlyer";
import definition from "./definition";
import sisterCity from "./sisterCity";
import groupScheduleRow from "./groupScheduleRow";
import scheduleDateEntry from "./scheduleDateEntry";
import boardMember from "./boardMember";

// Section types — NEW
import tableSection from "./tableSection";
import labelTableSection from "./labelTableSection";
import infoCardsSection from "./infoCardsSection";
import imageCardsSection from "./imageCardsSection";

// Section types — LEGACY (kept until migrations complete, removed in Task 18)
import warningsSection from "./warningsSection";
import contentSection from "./contentSection";
import infoTableSection from "./infoTableSection";
import tableScheduleSection from "./tableScheduleSection";
import groupScheduleSection from "./groupScheduleSection";
import eventScheduleSection from "./eventScheduleSection";
import gallerySection from "./gallerySection";
import sisterCitiesSection from "./sisterCitiesSection";
import definitionsSection from "./definitionsSection";
import linksSection from "./linksSection";
import historySection from "./historySection";
import fairTradeSection from "./fairTradeSection";
import flyersSection from "./flyersSection";
import boardMembersSection from "./boardMembersSection";
import feeTableSection from "./feeTableSection";
import directoryListSection from "./directoryListSection";

// Document types
import siteSettings from "./siteSettings";
import category from "./category";
import navigation from "./navigation";
import announcement from "./announcement";
import blogPost from "./blogPost";
import sidebar from "./sidebar";
import homepage from "./homepage";
import homepageAbout from "./homepageAbout";
import homepageFeatured from "./homepageFeatured";
import page from "./page";

export const schemaTypes = [
  // Object types
  infoRow,
  imageFile,
  documentLink,
  eventFlyer,
  definition,
  sisterCity,
  groupScheduleRow,
  scheduleDateEntry,
  boardMember,
  // Section types — NEW
  tableSection,
  labelTableSection,
  infoCardsSection,
  imageCardsSection,
  // Section types — LEGACY
  warningsSection,
  contentSection,
  infoTableSection,
  tableScheduleSection,
  groupScheduleSection,
  eventScheduleSection,
  gallerySection,
  sisterCitiesSection,
  definitionsSection,
  linksSection,
  historySection,
  fairTradeSection,
  flyersSection,
  boardMembersSection,
  feeTableSection,
  directoryListSection,
  // Document types
  siteSettings,
  category,
  navigation,
  announcement,
  blogPost,
  sidebar,
  homepage,
  homepageAbout,
  homepageFeatured,
  page,
];
```

- [ ] **Step 2: Add new section types to `page.ts` sections array**

In `sanity/schemas/page.ts`, update the `sections` field to include new types (keep old types for now):

```typescript
defineField({
  name: "sections",
  title: "セクション",
  type: "array",
  description: "ページの各セクション。追加・編集・並び替えができます。",
  of: [
    // New types (use these for new sections)
    "table",
    "labelTable",
    "infoCards",
    "imageCards",
    // Existing types (kept until migrations complete)
    "content",
    "infoTable",
    "links",
    "warnings",
    "gallery",
    "flyers",
    "eventSchedule",
    "groupSchedule",
    "tableSchedule",
    "definitions",
    "feeTable",
    "directoryList",
    "boardMembers",
    "fairTrade",
    "sisterCities",
    "history",
  ].map((type) => ({ type, options: { modal: { type: "fold" as const } } })),
}),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/schemas/index.ts sanity/schemas/page.ts
git commit -m "feat: register new section schemas alongside legacy types"
```

---

### Task 5: Update `lib/types.ts`

**Files:**

- Modify: `lib/types.ts`

Add 4 new section types. Keep all old types until migrations are done (renderers still need them).

- [ ] **Step 1: Add new types after the existing `WarningsSection` interface**

Add the following to `lib/types.ts` after line 91 (after `WarningsSection`):

```typescript
export interface TableColumn {
  _key: string;
  label: I18nString;
  type?: "text" | "date" | "phone" | "url" | "currency" | "name";
}

export interface TableRow {
  _key: string;
  groupLabel?: I18nString;
  cells: I18nString[];
}

export interface TableSection {
  _type: "table";
  title?: I18nString;
  hideTitle?: boolean;
  caption?: I18nString;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface LabelTableSection {
  _type: "labelTable";
  title?: I18nString;
  hideTitle?: boolean;
  rows: InfoRow[];
}

export interface InfoCardsSection {
  _type: "infoCards";
  title?: I18nString;
  hideTitle?: boolean;
  items: Definition[];
}

export interface ImageCardsSection {
  _type: "imageCards";
  title?: I18nString;
  hideTitle?: boolean;
  items: SisterCity[];
}
```

- [ ] **Step 2: Add new types to the `PageSectionShape` union**

Find the `PageSectionShape` type (around line 203) and add the 4 new types:

```typescript
type PageSectionShape =
  | WarningsSection
  | ContentSection
  | InfoTableSection
  | TableScheduleSection
  | GroupScheduleSection
  | EventScheduleSection
  | GallerySection
  | SisterCitiesSection
  | DefinitionsSection
  | LinksSection
  | HistorySection
  | FairTradeSection
  | FlyersSection
  | BoardMembersSection
  | FeeTableSection
  | DirectoryListSection
  // New types
  | TableSection
  | LabelTableSection
  | InfoCardsSection
  | ImageCardsSection;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript types for table, labelTable, infoCards, imageCards sections"
```

---

### Task 6: Create `SectionTable` component

**Files:**

- Create: `components/SectionTable.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/SectionTable.tsx
import React from "react";
import { ja, en } from "@/lib/i18n";
import type { TableColumn, TableRow } from "@/lib/types";

interface SectionTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

export default function SectionTable({ columns, rows }: SectionTableProps) {
  const colCount = columns.length;

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col._key} scope="col" data-type={col.type ?? "text"}>
              {ja(col.label)}
              {en(col.label) && (
                <>
                  <br />
                  <span className="data-table__en" lang="en" translate="no">
                    {en(col.label)}
                  </span>
                </>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) =>
          row.groupLabel ? (
            <tr key={row._key} className="data-table__group-header">
              <td colSpan={colCount}>
                {ja(row.groupLabel)}
                {en(row.groupLabel) && (
                  <>
                    {" "}
                    <span className="data-table__en" lang="en" translate="no">
                      {en(row.groupLabel)}
                    </span>
                  </>
                )}
              </td>
            </tr>
          ) : (
            <tr key={row._key}>
              {columns.map((col, j) => {
                const cell = row.cells?.[j];
                return (
                  <td key={col._key} data-type={col.type ?? "text"}>
                    {cell ? (
                      <>
                        {ja(cell)}
                        {en(cell) && (
                          <>
                            <br />
                            <span className="data-table__en" lang="en" translate="no">
                              {en(cell)}
                            </span>
                          </>
                        )}
                      </>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SectionTable.tsx
git commit -m "feat: add SectionTable component with bilingual headers, type hints, and group rows"
```

---

### Task 7: Create `table` renderer

**Files:**

- Create: `lib/section-renderers/table.tsx`

- [ ] **Step 1: Write the renderer**

```tsx
// lib/section-renderers/table.tsx
import type { TableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SectionTable from "@/components/SectionTable";
import BilingualBlock from "@/components/BilingualBlock";

export const table: SectionHandler<TableSection> = (s, ctx) => {
  if (!s.columns?.length) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  if (s.caption) {
    ctx.push(<BilingualBlock ja={ja(s.caption)} en={en(s.caption)} />);
  }
  ctx.push(<SectionTable columns={s.columns} rows={s.rows ?? []} />);
  ctx.flush();
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. If `BilingualBlock` props are wrong, check `components/BilingualBlock.tsx` and adjust.

- [ ] **Step 3: Commit**

```bash
git add lib/section-renderers/table.tsx
git commit -m "feat: add table section renderer"
```

---

### Task 8: Create renamed renderers + update `content.tsx` + update dispatcher

**Files:**

- Create: `lib/section-renderers/label-table.tsx`
- Create: `lib/section-renderers/info-cards.tsx`
- Create: `lib/section-renderers/image-cards.tsx`
- Modify: `lib/section-renderers/content.tsx`
- Modify: `lib/section-renderers/index.ts`

- [ ] **Step 1: Write `label-table.tsx`**

Same logic as `info-table.tsx` but no note field handling (those fields no longer exist after migration).

```tsx
// lib/section-renderers/label-table.tsx
import type { LabelTableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import InfoTable from "@/components/InfoTable";

export const labelTable: SectionHandler<LabelTableSection> = (s, ctx) => {
  if (!s.rows) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<InfoTable rows={s.rows} />);
  ctx.flush();
};
```

- [ ] **Step 2: Write `info-cards.tsx`**

```tsx
// lib/section-renderers/info-cards.tsx
import type { InfoCardsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import DefinitionCard from "@/components/DefinitionCard";

export const infoCards: SectionHandler<InfoCardsSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  for (const def of s.items) {
    ctx.push(<DefinitionCard term={def.term} definition={def.definition} />);
  }
  ctx.flush();
};
```

- [ ] **Step 3: Write `image-cards.tsx`**

```tsx
// lib/section-renderers/image-cards.tsx
import type { ImageCardsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SisterCityCards from "@/components/SisterCityCards";

export const imageCards: SectionHandler<ImageCardsSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<SisterCityCards cities={s.items} />);
  ctx.flush();
};
```

- [ ] **Step 4: Update `content.tsx` — remove all sub-field rendering**

Replace the full file:

```tsx
// lib/section-renderers/content.tsx
import type { ContentSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";

export const content: SectionHandler<ContentSection> = (s, ctx) => {
  if (ja(s.title)) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  if (s.description) {
    ctx.push(<BilingualPortableText field={s.description} />);
  }
  ctx.flush();
};
```

- [ ] **Step 5: Update `lib/section-renderers/index.ts` — add new handlers**

Keep all legacy handlers alongside new ones (both active during migration phase):

```typescript
// lib/section-renderers/index.ts
import type { SectionHandler } from "./types";
// New handlers
import { table } from "./table";
import { labelTable } from "./label-table";
import { infoCards } from "./info-cards";
import { imageCards } from "./image-cards";
// Legacy handlers (removed in Task 18 after migrations)
import { warnings } from "./warnings";
import { content } from "./content";
import { infoTable } from "./info-table";
import { tableSchedule, groupSchedule, eventSchedule } from "./schedules";
import { gallery } from "./gallery";
import { sisterCities } from "./sister-cities";
import { definitions } from "./definitions";
import { links } from "./links";
import { history } from "./history";
import { fairTrade } from "./fair-trade";
import { flyers } from "./flyers";
import { boardMembers } from "./board-members";
import { feeTable } from "./fee-table";
import { directoryList } from "./directory-list";

export const sectionHandlers: Record<string, SectionHandler> = {
  // New
  table,
  labelTable,
  infoCards,
  imageCards,
  // Legacy
  warnings,
  content,
  infoTable,
  tableSchedule,
  groupSchedule,
  eventSchedule,
  gallery,
  sisterCities,
  definitions,
  links,
  history,
  fairTrade,
  flyers,
  boardMembers,
  feeTable,
  directoryList,
};
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/section-renderers/label-table.tsx lib/section-renderers/info-cards.tsx lib/section-renderers/image-cards.tsx lib/section-renderers/content.tsx lib/section-renderers/index.ts
git commit -m "feat: add labelTable, infoCards, imageCards renderers; strip content sub-field rendering"
```

---

### Task 9: E2E smoke test (pre-migration baseline)

**Files:**

- Test: `e2e/static-pages.spec.ts`

Verify existing tests still pass before running any migrations. This establishes a baseline.

- [ ] **Step 1: Run E2E tests**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx playwright test --reporter=line 2>&1 | tail -20
```

Expected: all tests pass (same as before this work began).

If tests fail, diagnose and fix before proceeding to migrations. Do not run migration scripts with broken tests.

---

### Task 10: Migration script — simple renames

**Files:**

- Create: `scripts/migrate-01-renames.mjs`

Renames `infoTable`→`labelTable`, `definitions`→`infoCards`, `sisterCities`→`imageCards`. Also renames `sisterCities.cities` → `imageCards.items`.

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 01: Simple _type renames
 *
 * infoTable      → labelTable
 * definitions    → infoCards
 * sisterCities   → imageCards  (+ renames .cities → .items)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-01-renames.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

const RENAMES = [
  { from: "infoTable", to: "labelTable" },
  { from: "definitions", to: "infoCards" },
];

async function renameSections() {
  let patchCount = 0;

  for (const { from, to } of RENAMES) {
    const pages = await client.fetch(
      `*[_type == "page" && defined(sections)]{
        _id,
        "sections": sections[_type == "${from}"]{_key}
      }[count(sections) > 0]`,
    );

    for (const page of pages) {
      for (const sec of page.sections) {
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: ${from}[${sec._key}] → ${to}`);
        if (!DRY_RUN) {
          await client
            .patch(page._id)
            .set({ [`sections[_key=="${sec._key}"]._type`]: to })
            .commit();
          patchCount++;
        }
      }
    }
  }

  return patchCount;
}

async function renameSisterCities() {
  let patchCount = 0;

  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "sisterCities"]{_key, cities}
    }[count(sections) > 0]`,
  );

  for (const page of pages) {
    for (const sec of page.sections) {
      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: sisterCities[${sec._key}] → imageCards (cities → items)`,
      );
      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({
            [`sections[_key=="${sec._key}"]._type`]: "imageCards",
            [`sections[_key=="${sec._key}"].items`]: sec.cities ?? [],
          })
          .unset([`sections[_key=="${sec._key}"].cities`])
          .commit();
        patchCount++;
      }
    }
  }

  return patchCount;
}

async function main() {
  const r1 = await renameSections();
  const r2 = await renameSisterCities();
  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${r1 + r2} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
export SANITY_TOKEN=$(grep SANITY_TOKEN .env.local | cut -d= -f2) && node scripts/migrate-01-renames.mjs --dry-run
```

Expected: lists which sections would be renamed (9 `infoTable`, 2 `definitions`, 1 `sisterCities`).

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-01-renames.mjs
git commit -m "feat: add migration script for simple section renames"
```

---

### Task 11: Migration script — `content` sub-field extraction

**Files:**

- Create: `scripts/migrate-02-content-subfields.mjs`

For each `content` section with sub-fields, inserts sibling sections immediately after it. Sub-fields: `infoTable`→`labelTable`, `checklist`→`labelTable`, `documents`→`links`, `images`→`gallery`, `schedule`→`labelTable`, `note`→`warnings`.

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 02: Extract content section sub-fields into sibling sections
 *
 * For each content section, any populated sub-fields are converted to
 * standalone sections inserted immediately after the content section.
 *
 * Sub-field → section type mapping:
 *   infoTable  → labelTable (rows copied directly)
 *   checklist  → labelTable (item.label → row.value, empty row.label)
 *   documents  → links      (documents array copied as items)
 *   images     → gallery    (images array copied directly)
 *   schedule   → labelTable (city→label, period→value)
 *   note       → warnings   (note value wrapped as single item)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-02-content-subfields.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function buildSiblings(sec) {
  const siblings = [];
  const order = ["infoTable", "checklist", "schedule", "documents", "images", "note"];

  for (const field of order) {
    if (!sec[field] || (Array.isArray(sec[field]) && sec[field].length === 0)) continue;

    if (field === "infoTable") {
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows: sec.infoTable,
      });
    }

    if (field === "checklist") {
      const rows = sec.checklist.map((item) => ({
        _key: randomKey(),
        label: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
        value: item.label,
      }));
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows,
      });
    }

    if (field === "schedule") {
      const rows = sec.schedule.map((entry) => ({
        _key: randomKey(),
        label: [
          { _key: "ja", value: entry.city },
          { _key: "en", value: entry.city },
        ],
        value: [
          { _key: "ja", value: entry.period },
          { _key: "en", value: entry.period },
        ],
      }));
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows,
      });
    }

    if (field === "documents") {
      siblings.push({
        _type: "links",
        _key: randomKey(),
        hideTitle: true,
        items: sec.documents,
      });
    }

    if (field === "images") {
      siblings.push({
        _type: "gallery",
        _key: randomKey(),
        images: sec.images,
      });
    }

    if (field === "note") {
      siblings.push({
        _type: "warnings",
        _key: randomKey(),
        items: [{ _key: randomKey(), value: sec.note }],
      });
    }
  }

  return siblings;
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "content"]{
        _key,
        infoTable,
        checklist,
        schedule,
        documents,
        images,
        note
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    // Fetch the full sections array for this page to know insertion indices
    const fullPage = await client.fetch(
      `*[_type == "page" && _id == $id][0]{ sections[]{_key, _type} }`,
      { id: page._id },
    );

    const allSections = fullPage.sections ?? [];

    // Process in reverse order so insertion indices don't shift
    const contentSections = page.sections
      .filter((sec) => {
        const hasSubFields =
          sec.infoTable?.length ||
          sec.checklist?.length ||
          sec.schedule?.length ||
          sec.documents?.length ||
          sec.images?.length ||
          sec.note;
        return hasSubFields;
      })
      .reverse();

    for (const sec of contentSections) {
      const siblings = buildSiblings(sec);
      if (!siblings.length) continue;

      const insertIndex = allSections.findIndex((s) => s._key === sec._key);
      if (insertIndex === -1) continue;

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: content[${sec._key}] → insert ${siblings.length} sibling(s) after index ${insertIndex}`,
      );
      for (const sib of siblings) {
        console.log(`  + ${sib._type}[${sib._key}]`);
      }

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .insert("after", `sections[_key=="${sec._key}"]`, siblings)
          .commit();

        // Remove sub-fields from the content section
        await client
          .patch(page._id)
          .unset([
            `sections[_key=="${sec._key}"].infoTable`,
            `sections[_key=="${sec._key}"].checklist`,
            `sections[_key=="${sec._key}"].schedule`,
            `sections[_key=="${sec._key}"].documents`,
            `sections[_key=="${sec._key}"].images`,
            `sections[_key=="${sec._key}"].note`,
          ])
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} content section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-02-content-subfields.mjs --dry-run
```

Expected: ~16 content sections inspected; sections with sub-fields listed with their extracted sibling types.

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-02-content-subfields.mjs
git commit -m "feat: add migration script for content sub-field extraction"
```

---

### Task 12: Migration script — `labelTable` note field inlining

**Files:**

- Create: `scripts/migrate-03-labeltable-notes.mjs`

Handles `appointmentNote` + `additionalLanguageNote` (inline into rows) and `otherNotes` (→ standalone `warnings`). Affects `page-seikatsusodan` and `page-cooking`.

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 03: Inline labelTable (formerly infoTable) note fields
 *
 * - appointmentNote: appended to the value of the row labelled "予約"
 * - additionalLanguageNote: appended to the value of the row labelled "対応言語"
 * - otherNotes: converted to a standalone `warnings` section inserted after
 *
 * Affects: page-seikatsusodan (appointmentNote + additionalLanguageNote)
 *          page-cooking (otherNotes)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-03-labeltable-notes.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function getVal(i18nArr, lang) {
  return i18nArr?.find((v) => v._key === lang)?.value ?? "";
}

function setVal(i18nArr, lang, newValue) {
  return (i18nArr ?? []).map((v) => (v._key === lang ? { ...v, value: newValue } : v));
}

async function main() {
  // Fetch pages that still have labelTable (after migrate-01) with note fields
  // Note: at this point _type is "labelTable" after migrate-01 ran; if migrate-01
  // hasn't run yet, query for "infoTable" instead. Run after migrate-01.
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "ltSections": sections[_type in ["labelTable", "infoTable"]]{
        _key,
        rows,
        appointmentNote,
        additionalLanguageNote,
        otherNotes
      }
    }[count(ltSections[defined(appointmentNote) || defined(additionalLanguageNote) || defined(otherNotes)]) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    const affectedSections = page.ltSections.filter(
      (s) => s.appointmentNote || s.additionalLanguageNote || s.otherNotes,
    );

    for (const sec of affectedSections) {
      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: labelTable[${sec._key}]`);

      let updatedRows = (sec.rows ?? []).map((row) => {
        const jaLabel = getVal(row.label, "ja");

        if (sec.appointmentNote && jaLabel === "予約") {
          const jaAppended = `${getVal(row.value, "ja")}\n${getVal(sec.appointmentNote, "ja")}`;
          const enAppended = `${getVal(row.value, "en")}\n${getVal(sec.appointmentNote, "en")}`;
          console.log(`  inline appointmentNote into "予約" row`);
          return {
            ...row,
            value: setVal(setVal(row.value, "ja", jaAppended), "en", enAppended),
          };
        }

        if (sec.additionalLanguageNote && jaLabel === "対応言語") {
          const jaAppended = `${getVal(row.value, "ja")}\n${getVal(sec.additionalLanguageNote, "ja")}`;
          const enAppended = `${getVal(row.value, "en")}\n${getVal(sec.additionalLanguageNote, "en")}`;
          console.log(`  inline additionalLanguageNote into "対応言語" row`);
          return {
            ...row,
            value: setVal(setVal(row.value, "ja", jaAppended), "en", enAppended),
          };
        }

        return row;
      });

      if (!DRY_RUN) {
        const unsetFields = [
          `sections[_key=="${sec._key}"].appointmentNote`,
          `sections[_key=="${sec._key}"].additionalLanguageNote`,
        ].filter((_, i) => (i === 0 ? !!sec.appointmentNote : !!sec.additionalLanguageNote));

        await client
          .patch(page._id)
          .set({ [`sections[_key=="${sec._key}"].rows`]: updatedRows })
          .unset(unsetFields)
          .commit();
      }

      if (sec.otherNotes) {
        const warningsSection = {
          _type: "warnings",
          _key: randomKey(),
          items: [{ _key: randomKey(), value: sec.otherNotes }],
        };
        console.log(`  otherNotes → warnings[${warningsSection._key}] after section`);

        if (!DRY_RUN) {
          await client
            .patch(page._id)
            .insert("after", `sections[_key=="${sec._key}"]`, [warningsSection])
            .unset([`sections[_key=="${sec._key}"].otherNotes`])
            .commit();
        }
      }

      patchCount++;
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-03-labeltable-notes.mjs --dry-run
```

Expected: `page-seikatsusodan` (inline appointmentNote + additionalLanguageNote), `page-cooking` (otherNotes → warnings).

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-03-labeltable-notes.mjs
git commit -m "feat: add migration script for labelTable note field inlining"
```

---

### Task 13: Migration script — 7 section types → `table`

**Files:**

- Create: `scripts/migrate-04-table-consolidation.mjs`

Converts `tableSchedule`, `history`, `feeTable`, `groupSchedule`, `boardMembers`, `directoryList`, and multi-date `eventSchedule` into the new `table` type.

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 04: Consolidate 7 section types into `table`
 *
 * tableSchedule → table  (pages: page-cooking, page-seikatsusodan)
 * history       → table  (page: page-aboutyia; intro → standalone content before)
 * feeTable      → table  (page: page-kaiinn)
 * groupSchedule → table  (page: page-kaiwasalon)
 * boardMembers  → table  (page: page-aboutyia; asOf → caption)
 * directoryList → table  (page: page-sanjyokaiin)
 * eventSchedule (multi-date, entries array) → table (pages: page-englishguide, page-nihonbunka)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-04-table-consolidation.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function bi(ja, en) {
  return [
    { _key: "ja", value: ja ?? "" },
    { _key: "en", value: en ?? "" },
  ];
}

function getVal(i18n, lang) {
  return i18n?.find((v) => v._key === lang)?.value ?? "";
}

function convertTableSchedule(sec) {
  const cols = (sec.columns ?? []).map((col, i) => ({
    _key: randomKey(),
    label: bi(col, sec.columnsEn?.[i] ?? ""),
    type: "text",
  }));

  let rows = [];
  if (typeof sec.rows === "string") {
    try {
      const parsed = JSON.parse(sec.rows);
      rows = parsed.map((r) => ({
        _key: randomKey(),
        cells: r.map((v) => bi(v, "")),
      }));
    } catch {
      rows = [];
    }
  } else if (Array.isArray(sec.rows)) {
    rows = sec.rows.map((r) => {
      const cells = Array.isArray(r.cells) ? r.cells : Array.isArray(r) ? r : [];
      return {
        _key: randomKey(),
        cells: cells.map((c) => {
          if (typeof c === "string") return bi(c, "");
          if (c.text) return bi(getVal(c.text, "ja"), getVal(c.text, "en"));
          return bi(getVal(c, "ja"), getVal(c, "en"));
        }),
      };
    });
  }

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertHistory(sec) {
  const cols = (sec.columns ?? ["年", "内容"]).map((col, i) => ({
    _key: randomKey(),
    label: bi(col, sec.columnsEn?.[i] ?? ""),
    type: "text",
  }));

  const rows = (sec.years ?? []).map((entry) => ({
    _key: randomKey(),
    cells: [bi(entry.year, entry.year), bi(entry.cuisines, entry.cuisines)],
  }));

  return {
    tableSection: {
      _type: "table",
      _key: sec._key,
      title: sec.title,
      hideTitle: sec.hideTitle,
      columns: cols,
      rows,
    },
    introSection: sec.intro
      ? { _type: "content", _key: randomKey(), hideTitle: true, description: sec.intro }
      : null,
  };
}

function convertFeeTable(sec) {
  const cols = [
    { _key: randomKey(), label: bi("種別", "Type"), type: "name" },
    { _key: randomKey(), label: bi("会費", "Fee"), type: "currency" },
    { _key: randomKey(), label: bi("説明", "Description"), type: "text" },
  ];

  const rows = (sec.rows ?? []).map((r) => ({
    _key: randomKey(),
    cells: [
      bi(getVal(r.memberType, "ja"), getVal(r.memberType, "en")),
      bi(getVal(r.fee, "ja"), getVal(r.fee, "en")),
      bi(getVal(r.description, "ja"), getVal(r.description, "en")),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertGroupSchedule(sec) {
  const cols = [
    { _key: randomKey(), label: bi("グループ名", "Group"), type: "name" },
    { _key: randomKey(), label: bi("曜日", "Day"), type: "text" },
    { _key: randomKey(), label: bi("時間", "Time"), type: "text" },
    { _key: randomKey(), label: bi("場所", "Location"), type: "text" },
  ];

  const rows = (sec.groups ?? []).map((g) => ({
    _key: randomKey(),
    cells: [
      bi(getVal(g.name, "ja"), getVal(g.name, "en")),
      bi(g.day ?? "", g.day ?? ""),
      bi(g.time ?? "", g.time ?? ""),
      bi(g.location ?? "", g.location ?? ""),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertBoardMembers(sec) {
  const cols = [
    { _key: randomKey(), label: bi("氏名", "Name"), type: "name" },
    { _key: randomKey(), label: bi("役職", "Role"), type: "text" },
  ];

  const rows = (sec.members ?? []).map((m) => ({
    _key: randomKey(),
    cells: [bi(m.name ?? "", m.name ?? ""), bi(getVal(m.role, "ja"), getVal(m.role, "en"))],
  }));

  const caption = sec.asOf ? bi(`${sec.asOf}現在`, `As of ${sec.asOf}`) : undefined;

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    caption,
    columns: cols,
    rows,
  };
}

function convertDirectoryList(sec) {
  const cols = [
    { _key: randomKey(), label: bi("団体名", "Organization"), type: "url" },
    { _key: randomKey(), label: bi("電話", "Tel"), type: "phone" },
  ];

  const rows = (sec.entries ?? []).map((e) => ({
    _key: randomKey(),
    cells: [bi(e.nameJa ?? "", e.url ?? ""), bi(e.tel ?? "", e.tel ?? "")],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertEventScheduleMulti(sec) {
  const cols = [
    { _key: randomKey(), label: bi("日付", "Date"), type: "date" },
    { _key: randomKey(), label: bi("時間", "Time"), type: "text" },
    { _key: randomKey(), label: bi("場所", "Venue"), type: "text" },
  ];

  const rows = (sec.entries ?? []).map((e) => ({
    _key: randomKey(),
    cells: [
      bi(e.date ?? "", e.date ?? ""),
      bi(e.time ?? "", e.time ?? ""),
      bi(getVal(e.location, "ja"), getVal(e.location, "en")),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

const MULTI_DATE_EVENT_TYPES = [
  "tableSchedule",
  "feeTable",
  "groupSchedule",
  "boardMembers",
  "directoryList",
  "history",
];

async function main() {
  const allTypes = [...MULTI_DATE_EVENT_TYPES, "eventSchedule"];

  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type in ${JSON.stringify(allTypes)}]
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      let newSection = null;
      let insertBefore = null;

      if (sec._type === "tableSchedule") {
        newSection = convertTableSchedule(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: tableSchedule[${sec._key}] → table`,
        );
      } else if (sec._type === "history") {
        const { tableSection, introSection } = convertHistory(sec);
        newSection = tableSection;
        insertBefore = introSection;
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: history[${sec._key}] → table${introSection ? " + content before" : ""}`,
        );
      } else if (sec._type === "feeTable") {
        newSection = convertFeeTable(sec);
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: feeTable[${sec._key}] → table`);
      } else if (sec._type === "groupSchedule") {
        newSection = convertGroupSchedule(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: groupSchedule[${sec._key}] → table`,
        );
      } else if (sec._type === "boardMembers") {
        newSection = convertBoardMembers(sec);
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: boardMembers[${sec._key}] → table`);
      } else if (sec._type === "directoryList") {
        newSection = convertDirectoryList(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: directoryList[${sec._key}] → table`,
        );
      } else if (sec._type === "eventSchedule" && sec.entries?.length) {
        newSection = convertEventScheduleMulti(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: eventSchedule[${sec._key}] (multi) → table`,
        );
      } else {
        continue; // single-date eventSchedule handled in migrate-05
      }

      if (!DRY_RUN && newSection) {
        if (insertBefore) {
          await client
            .patch(page._id)
            .insert("before", `sections[_key=="${sec._key}"]`, [insertBefore])
            .commit();
        }

        const { _key, ...rest } = newSection;
        await client
          .patch(page._id)
          .set({ [`sections[_key=="${_key}"]`]: { _key, ...rest } })
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-04-table-consolidation.mjs --dry-run
```

Expected: ~12 sections across ~10 pages listed for conversion.

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-04-table-consolidation.mjs
git commit -m "feat: add migration script for 7-type to table consolidation"
```

---

### Task 14: Migration script — `eventSchedule` single-date → `labelTable`

**Files:**

- Create: `scripts/migrate-05-eventschedule-single.mjs`

Converts `eventSchedule` sections that use `entry` (single date) rather than `entries` (array).

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 05: eventSchedule single-date → labelTable
 *
 * eventSchedule sections with .entry (single date) → labelTable with
 * date/time/venue as label-value pairs.
 *
 * Affects: page-kids, page-nihonbunka (2 instances with .entry)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-05-eventschedule-single.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function bi(ja, en) {
  return [
    { _key: "ja", value: ja ?? "" },
    { _key: "en", value: en ?? "" },
  ];
}

function getVal(i18n, lang) {
  return i18n?.find((v) => v._key === lang)?.value ?? "";
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "eventSchedule" && defined(entry)]{
        _key,
        title,
        hideTitle,
        entry,
        venue
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      const rows = [];

      if (sec.entry?.date) {
        const dateStr = sec.entry.time ? `${sec.entry.date} ${sec.entry.time}` : sec.entry.date;
        rows.push({
          _key: randomKey(),
          label: bi("日時", "Date / Time"),
          value: bi(dateStr, dateStr),
        });
      }

      if (sec.venue?.location) {
        rows.push({
          _key: randomKey(),
          label: bi("会場", "Venue"),
          value: bi(getVal(sec.venue.location, "ja"), getVal(sec.venue.location, "en")),
        });
      }

      const newSection = {
        _type: "labelTable",
        title: sec.title,
        hideTitle: sec.hideTitle,
        rows,
      };

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: eventSchedule[${sec._key}] (single) → labelTable (${rows.length} rows)`,
      );

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({ [`sections[_key=="${sec._key}"]`]: { _key: sec._key, ...newSection } })
          .commit();
        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-05-eventschedule-single.mjs --dry-run
```

Expected: 2 sections (`page-kids`, `page-nihonbunka`) listed.

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-05-eventschedule-single.mjs
git commit -m "feat: add migration script for single-date eventSchedule → labelTable"
```

---

### Task 15: Migration script — `fairTrade` decomposition

**Files:**

- Create: `scripts/migrate-06-fairtrade.mjs`

Converts the single `fairTrade` section on `page-kokusaikoken` into 3 sections: `content` (description) → `labelTable` (price list) → `content` (delivery).

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 06: Decompose fairTrade section into content + labelTable + content
 *
 * fairTrade.description → content section (before)
 * fairTrade.priceList   → labelTable (type→label, weight+price→value)
 * fairTrade.delivery    → content section (after)
 *
 * Affects: page-kokusaikoken (1 instance)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-06-fairtrade.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function bi(ja, en) {
  return [
    { _key: "ja", value: ja ?? "" },
    { _key: "en", value: en ?? "" },
  ];
}

function getVal(i18n, lang) {
  return i18n?.find((v) => v._key === lang)?.value ?? "";
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "fairTrade"]{
        _key,
        title,
        description,
        priceList,
        delivery
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      const replacements = [];

      if (sec.description) {
        replacements.push({
          _type: "content",
          _key: randomKey(),
          title: sec.title,
          hideTitle: false,
          description: sec.description,
        });
      }

      if (sec.priceList?.length) {
        const rows = sec.priceList.map((p) => {
          const jaWeight = getVal(p.weight, "ja");
          const enWeight = getVal(p.weight, "en");
          const jaPrice = getVal(p.price, "ja");
          const enPrice = getVal(p.price, "en");
          return {
            _key: randomKey(),
            label: bi(getVal(p.type, "ja"), getVal(p.type, "en")),
            value: bi(
              [jaWeight, jaPrice].filter(Boolean).join(" — "),
              [enWeight, enPrice].filter(Boolean).join(" — "),
            ),
          };
        });

        replacements.push({
          _type: "labelTable",
          _key: randomKey(),
          hideTitle: true,
          rows,
        });
      }

      if (sec.delivery) {
        replacements.push({
          _type: "content",
          _key: randomKey(),
          hideTitle: true,
          description: sec.delivery,
        });
      }

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: fairTrade[${sec._key}] → ${replacements.map((r) => r._type).join(" + ")}`,
      );

      if (!DRY_RUN) {
        // Insert replacements before the fairTrade section, then remove it
        await client
          .patch(page._id)
          .insert("before", `sections[_key=="${sec._key}"]`, replacements)
          .commit();

        await client
          .patch(page._id)
          .unset([`sections[_key=="${sec._key}"]`])
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-06-fairtrade.mjs --dry-run
```

Expected: 1 section on `page-kokusaikoken` → `content + labelTable + content`.

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-06-fairtrade.mjs
git commit -m "feat: add migration script for fairTrade decomposition"
```

---

### Task 16: Migration script — `flyers` deletion

**Files:**

- Create: `scripts/migrate-07-flyers.mjs`

Deletes all `flyers` sections (0 production uses per spec, but verify first).

- [ ] **Step 1: Write the script**

```javascript
/**
 * Migration 07: Delete flyers sections
 *
 * flyers has 0 production uses per spec. This script removes any instances
 * found (none expected) to clean up for schema removal.
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-07-flyers.mjs
 *   Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "flyers"]{_key}
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: delete flyers[${sec._key}]`);
      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .unset([`sections[_key=="${sec._key}"]`])
          .commit();
        patchCount++;
      }
    }
  }

  if (pages.length === 0) {
    console.log("No flyers sections found. Nothing to do.");
  }

  console.log(`\nDone. ${DRY_RUN ? "Would delete" : "Deleted"} ${patchCount} section(s).`);
}

main().catch(console.error);
```

- [ ] **Step 2: Dry-run**

```bash
node scripts/migrate-07-flyers.mjs --dry-run
```

Expected: "No flyers sections found. Nothing to do."

- [ ] **Step 3: Commit script**

```bash
git add scripts/migrate-07-flyers.mjs
git commit -m "feat: add migration script for flyers section deletion"
```

---

### Task 17: Run all migrations

Run each migration in order. Always dry-run first, verify output, then run for real.

- [ ] **Step 1: Export Sanity token**

```bash
export SANITY_TOKEN=$(grep SANITY_TOKEN .env.local | cut -d= -f2)
```

Verify it's set: `echo $SANITY_TOKEN | head -c 20` (should show token prefix, not empty).

- [ ] **Step 2: Run migration 01 — simple renames (dry run)**

```bash
node scripts/migrate-01-renames.mjs --dry-run
```

Expected: lists all infoTable, definitions, sisterCities sections to be renamed.

- [ ] **Step 3: Run migration 01 — real**

```bash
node scripts/migrate-01-renames.mjs
```

Expected: "Patched N section(s)." with no errors.

- [ ] **Step 4: Run migration 02 — content sub-fields (dry run)**

```bash
node scripts/migrate-02-content-subfields.mjs --dry-run
```

Expected: content sections with sub-fields listed with new sibling types.

- [ ] **Step 5: Run migration 02 — real**

```bash
node scripts/migrate-02-content-subfields.mjs
```

Expected: "Patched N content section(s)."

- [ ] **Step 6: Run migration 03 — labelTable notes (dry run)**

```bash
node scripts/migrate-03-labeltable-notes.mjs --dry-run
```

Expected: 2 pages (page-seikatsusodan, page-cooking) listed.

- [ ] **Step 7: Run migration 03 — real**

```bash
node scripts/migrate-03-labeltable-notes.mjs
```

Expected: "Patched 2 section(s)."

- [ ] **Step 8: Run migration 04 — table consolidation (dry run)**

```bash
node scripts/migrate-04-table-consolidation.mjs --dry-run
```

Expected: ~12 sections listed across ~10 pages.

- [ ] **Step 9: Run migration 04 — real**

```bash
node scripts/migrate-04-table-consolidation.mjs
```

Expected: "Patched N section(s)."

- [ ] **Step 10: Run migration 05 — single-date eventSchedule (dry run)**

```bash
node scripts/migrate-05-eventschedule-single.mjs --dry-run
```

Expected: 2 sections listed (page-kids, page-nihonbunka).

- [ ] **Step 11: Run migration 05 — real**

```bash
node scripts/migrate-05-eventschedule-single.mjs
```

Expected: "Patched 2 section(s)."

- [ ] **Step 12: Run migration 06 — fairTrade (dry run)**

```bash
node scripts/migrate-06-fairtrade.mjs --dry-run
```

Expected: 1 section on page-kokusaikoken.

- [ ] **Step 13: Run migration 06 — real**

```bash
node scripts/migrate-06-fairtrade.mjs
```

Expected: "Patched 1 section(s)."

- [ ] **Step 14: Run migration 07 — flyers (dry run + real)**

```bash
node scripts/migrate-07-flyers.mjs --dry-run && node scripts/migrate-07-flyers.mjs
```

Expected: "No flyers sections found." for both runs.

- [ ] **Step 15: Run E2E tests after all migrations**

```bash
npx playwright test --reporter=line 2>&1 | tail -20
```

Expected: all tests pass. If a test fails, stop — diagnose whether the migration broke rendering or the test needs updating.

---

### Task 18: Cleanup — remove legacy schemas, renderers, and object types

All production data now uses new section types. Remove everything that was kept "for migration phase".

**Files:**

- Modify: `sanity/schemas/index.ts` (remove legacy imports)
- Modify: `sanity/schemas/page.ts` (remove legacy types from sections array)
- Modify: `lib/section-renderers/index.ts` (remove legacy handlers)
- Modify: `lib/types.ts` (remove old section type interfaces and union entries)
- Delete: 12 section schema files, 6 object type schema files, 10 renderer files
- Modify: `e2e/static-pages.spec.ts` (update test titles to match new section type names if needed)

- [ ] **Step 1: Verify no documents still use legacy types in Sanity**

```bash
node -e "
const { createClient } = require('next-sanity');
const client = createClient({ projectId: 'tarzpcp3', dataset: 'production', apiVersion: '2024-01-01', useCdn: false });
const legacyTypes = ['infoTable','definitions','sisterCities','tableSchedule','history','feeTable','groupSchedule','boardMembers','directoryList','eventSchedule','fairTrade','flyers'];
const q = legacyTypes.map(t => \`count(*[_type == 'page' && defined(sections[_type == '\${t}'])])\`).join(', ');
client.fetch('[' + q + ']').then(r => { legacyTypes.forEach((t,i) => console.log(t, r[i])); }).catch(console.error);
"
```

Expected: all counts are 0. If any are non-zero, re-run the relevant migration script before continuing.

- [ ] **Step 2: Delete legacy schema files**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs
rm sanity/schemas/infoTableSection.ts
rm sanity/schemas/definitionsSection.ts
rm sanity/schemas/sisterCitiesSection.ts
rm sanity/schemas/tableScheduleSection.ts
rm sanity/schemas/historySection.ts
rm sanity/schemas/feeTableSection.ts
rm sanity/schemas/groupScheduleSection.ts
rm sanity/schemas/boardMembersSection.ts
rm sanity/schemas/directoryListSection.ts
rm sanity/schemas/eventScheduleSection.ts
rm sanity/schemas/fairTradeSection.ts
rm sanity/schemas/flyersSection.ts
```

- [ ] **Step 3: Delete legacy object type schema files**

```bash
rm sanity/schemas/scheduleDateEntry.ts
rm sanity/schemas/boardMember.ts
rm sanity/schemas/groupScheduleRow.ts
rm sanity/schemas/eventFlyer.ts
rm sanity/schemas/definition.ts
rm sanity/schemas/sisterCity.ts
```

Note: `sisterCity.ts` is still used by `imageCardsSection.ts` (via `of: [{ type: "sisterCity" }]`). Only delete it if you also update `imageCardsSection.ts` to use an inline object type instead. For now, **keep** `sanity/schemas/sisterCity.ts` and `sanity/schemas/definition.ts`.

- [ ] **Step 4: Update `sanity/schemas/index.ts`** — remove legacy imports

```typescript
// sanity/schemas/index.ts
// Object types
import infoRow from "./infoRow";
import imageFile from "./imageFile";
import documentLink from "./documentLink";
import definition from "./definition"; // still used by infoCardsSection
import sisterCity from "./sisterCity"; // still used by imageCardsSection

// Section types
import tableSection from "./tableSection";
import labelTableSection from "./labelTableSection";
import infoCardsSection from "./infoCardsSection";
import imageCardsSection from "./imageCardsSection";
import warningsSection from "./warningsSection";
import contentSection from "./contentSection";
import gallerySection from "./gallerySection";
import linksSection from "./linksSection";

// Document types
import siteSettings from "./siteSettings";
import category from "./category";
import navigation from "./navigation";
import announcement from "./announcement";
import blogPost from "./blogPost";
import sidebar from "./sidebar";
import homepage from "./homepage";
import homepageAbout from "./homepageAbout";
import homepageFeatured from "./homepageFeatured";
import page from "./page";

export const schemaTypes = [
  // Object types
  infoRow,
  imageFile,
  documentLink,
  definition,
  sisterCity,
  // Section types
  tableSection,
  labelTableSection,
  infoCardsSection,
  imageCardsSection,
  warningsSection,
  contentSection,
  gallerySection,
  linksSection,
  // Document types
  siteSettings,
  category,
  navigation,
  announcement,
  blogPost,
  sidebar,
  homepage,
  homepageAbout,
  homepageFeatured,
  page,
];
```

- [ ] **Step 5: Update `sanity/schemas/page.ts`** — remove legacy types from sections array

```typescript
defineField({
  name: "sections",
  title: "セクション",
  type: "array",
  description: "ページの各セクション。追加・編集・並び替えができます。",
  of: [
    "content",
    "labelTable",
    "links",
    "warnings",
    "gallery",
    "table",
    "infoCards",
    "imageCards",
  ].map((type) => ({ type, options: { modal: { type: "fold" as const } } })),
}),
```

- [ ] **Step 6: Delete legacy renderer files**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs
rm lib/section-renderers/info-table.tsx
rm lib/section-renderers/definitions.tsx
rm lib/section-renderers/sister-cities.tsx
rm lib/section-renderers/schedules.tsx
rm lib/section-renderers/history.tsx
rm lib/section-renderers/fair-trade.tsx
rm lib/section-renderers/flyers.tsx
rm lib/section-renderers/board-members.tsx
rm lib/section-renderers/fee-table.tsx
rm lib/section-renderers/directory-list.tsx
```

- [ ] **Step 7: Update `lib/section-renderers/index.ts`** — remove legacy handlers

```typescript
// lib/section-renderers/index.ts
import type { SectionHandler } from "./types";
import { table } from "./table";
import { labelTable } from "./label-table";
import { infoCards } from "./info-cards";
import { imageCards } from "./image-cards";
import { warnings } from "./warnings";
import { content } from "./content";
import { gallery } from "./gallery";
import { links } from "./links";

export const sectionHandlers: Record<string, SectionHandler> = {
  table,
  labelTable,
  infoCards,
  imageCards,
  warnings,
  content,
  gallery,
  links,
};
```

- [ ] **Step 8: Update `lib/types.ts`** — remove old section type interfaces

Remove these interfaces:

- `InfoTableSection`
- `TableScheduleSection`
- `GroupScheduleSection`
- `EventScheduleSection`
- `SisterCitiesSection`
- `DefinitionsSection`
- `HistorySection`
- `FairTradeSection`
- `FlyersSection`
- `BoardMembersSection`
- `FeeTableSection`
- `DirectoryListSection`

Remove the following supporting interfaces (if not used elsewhere):

- `GroupScheduleRow`
- `ScheduleDateEntry`
- `BoardMember`
- `EventFlyer`

Update `PageSectionShape` to only include current types:

```typescript
type PageSectionShape =
  | WarningsSection
  | ContentSection
  | GallerySection
  | LinksSection
  | TableSection
  | LabelTableSection
  | InfoCardsSection
  | ImageCardsSection;
```

- [ ] **Step 9: Final typecheck**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 10: Run E2E tests**

```bash
npx playwright test --reporter=line 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 11: Commit cleanup**

```bash
git add -A
git commit -m "refactor: remove legacy section schemas, renderers, and types after migration complete"
```

---

## Self-Review

### Spec Coverage

| Spec requirement                                             | Task                          |
| ------------------------------------------------------------ | ----------------------------- |
| `content` sub-fields stripped                                | Task 3, Task 11               |
| `labelTable` (renamed from `infoTable`, note fields removed) | Task 2, Task 12               |
| `infoCards` (renamed from `definitions`)                     | Task 2, Task 10               |
| `table` new schema (7 old types → 1)                         | Task 1, Task 13               |
| `gallery` unchanged                                          | No changes needed             |
| `links` unchanged                                            | No changes needed             |
| `warnings` absorbs `content.note` and `infoTable.otherNotes` | Tasks 11, 12                  |
| `imageCards` (renamed from `sisterCities`, `cities`→`items`) | Task 2, Task 10               |
| `fairTrade` → `content` + `labelTable` + `content`           | Task 15                       |
| `flyers` deleted                                             | Task 16                       |
| `eventSchedule` multi-date → `table`                         | Task 13                       |
| `eventSchedule` single-date → `labelTable`                   | Task 14                       |
| Frontend renderer for new `table` type                       | Tasks 6, 7                    |
| Frontend renderers for renamed types                         | Task 8                        |
| `history.intro` → standalone `content` section before        | Task 13 (convertHistory)      |
| `boardMembers.asOf` → `caption`                              | Task 13 (convertBoardMembers) |
| Remove retired component dispatch                            | Task 8 (content.tsx), Task 18 |

### Type Consistency Check

- `TableColumn._key`, `TableRow._key` defined in Task 5 and used in `SectionTable.tsx` (Task 6) ✓
- `LabelTableSection.rows: InfoRow[]` — `InfoRow` already defined in `lib/types.ts` ✓
- `InfoCardsSection.items: Definition[]` — `Definition` already defined ✓
- `ImageCardsSection.items: SisterCity[]` — `SisterCity` already defined ✓
- `SectionTable` props use `TableColumn`, `TableRow` from `lib/types.ts` ✓
- `table` renderer imports `SectionTable` (Task 7 imports from Task 6) ✓
- `label-table` renderer uses `InfoTable` component (same as legacy `info-table`) ✓
- `image-cards` renderer passes `s.items` to `SisterCityCards cities=` prop ✓
