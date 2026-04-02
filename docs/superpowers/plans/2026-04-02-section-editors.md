# Section Editors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all four uneditable section types (`labelTable`, `infoCards`, `imageCards`, `table`) fully editable in the custom Sanity Studio, while removing the `hideTitle` field from all schemas and fixing `sisterCity.note` to be bilingual.

**Architecture:** Four new dedicated editor components in `sanity/components/pages/sections/`, wired into `SectionEditor.tsx`. `KeyValueListEditor` gains `fieldNames` and `placeholders` props to support `labelTable` and `infoCards`. `TableSectionEditor` manages column/row alignment via auto-pad on add and confirmation-gated trim on remove.

**Tech Stack:** React (client components), TypeScript, `@sanity/ui` (`TextInput`, `Select`), `@sanity/icons` (`TrashIcon`), Sanity client (for migration scripts), existing shared primitives (`BilingualInput`, `KeyValueListEditor`, `i18nGet`, `i18nSet`).

---

## File Map

| Action | File                                                           |
| ------ | -------------------------------------------------------------- |
| Create | `scripts/check-hide-title.mjs`                                 |
| Create | `scripts/migrate-sisterCity-note.mjs`                          |
| Modify | `sanity/schemas/sisterCity.ts`                                 |
| Modify | `lib/types.ts`                                                 |
| Modify | `sanity/schemas/contentSection.ts`                             |
| Modify | `sanity/schemas/linksSection.ts`                               |
| Modify | `sanity/schemas/labelTableSection.ts`                          |
| Modify | `sanity/schemas/tableSection.ts`                               |
| Modify | `sanity/schemas/infoCardsSection.ts`                           |
| Modify | `sanity/schemas/imageCardsSection.ts`                          |
| Modify | `lib/section-renderers/label-table.tsx`                        |
| Modify | `lib/section-renderers/info-cards.tsx`                         |
| Modify | `lib/section-renderers/image-cards.tsx`                        |
| Modify | `lib/section-renderers/table.tsx`                              |
| Modify | `sanity/components/pages/types.ts`                             |
| Modify | `sanity/components/shared/KeyValueListEditor.tsx`              |
| Create | `sanity/components/pages/sections/LabelTableSectionEditor.tsx` |
| Create | `sanity/components/pages/sections/InfoCardsSectionEditor.tsx`  |
| Create | `sanity/components/pages/sections/ImageCardsSectionEditor.tsx` |
| Create | `sanity/components/pages/sections/table-utils.ts`              |
| Create | `sanity/components/pages/sections/TableSectionEditor.tsx`      |
| Modify | `sanity/components/pages/SectionEditor.tsx`                    |

---

## Task 1: Production data check — hideTitle

Check whether any production section has `hideTitle: true` AND a non-empty title. If so, those titles would become visible on the frontend after we remove `hideTitle`. Report results before proceeding.

**Files:**

- Create: `scripts/check-hide-title.mjs`

- [ ] **Step 1: Write the check script**

```javascript
// scripts/check-hide-title.mjs
import { createClient } from "@sanity/client";
import { config } from "dotenv";
config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const pages = await client.fetch(`*[_type == "page"]{ _id, sections }`);
let found = 0;
for (const page of pages) {
  for (const section of page.sections ?? []) {
    if (section.hideTitle === true) {
      const title = section.title?.find((t) => t._key === "ja")?.value?.trim();
      if (title) {
        console.log(
          `Page ${page._id} | section ${section._key} (${section._type}): title="${title}"`,
        );
        found++;
      }
    }
  }
}
console.log(`\nTotal: ${found} section(s) with hideTitle:true AND non-empty title.`);
if (found > 0) {
  console.log("These titles will become VISIBLE on the frontend. Confirm before deploying.");
}
```

- [ ] **Step 2: Run the script**

```bash
node scripts/check-hide-title.mjs
```

Expected: "Total: 0 section(s)..." — if non-zero, stop and confirm with the user which titles are okay to reveal before continuing.

---

## Task 2: Fix `sisterCity.note` — schema + migration

`sisterCity.note` is `type: "string"` (single language). Change it to `internationalizedArrayString` and migrate the 1 production instance.

**Files:**

- Modify: `sanity/schemas/sisterCity.ts`
- Modify: `lib/types.ts`
- Create: `scripts/migrate-sisterCity-note.mjs`

- [ ] **Step 1: Update the schema**

In `sanity/schemas/sisterCity.ts`, replace:

```typescript
    defineField({
      name: "note",
      title: "備考",
      type: "string",
      description: "提携年など補足情報（任意）。",
    }),
```

with:

```typescript
    defineField({
      name: "note",
      title: "備考",
      type: "internationalizedArrayString",
      description: "提携年など補足情報（任意）。",
    }),
```

- [ ] **Step 2: Update `SisterCity` type in `lib/types.ts`**

Replace:

```typescript
export interface SisterCity {
  name: I18nString;
  country: I18nString;
  image?: SanityImage;
  note?: string;
}
```

with:

```typescript
export interface SisterCity {
  name: I18nString;
  country: I18nString;
  image?: SanityImage;
  note?: I18nString;
}
```

- [ ] **Step 3: Write the migration script**

```javascript
// scripts/migrate-sisterCity-note.mjs
import { createClient } from "@sanity/client";
import { config } from "dotenv";
config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Find all pages with imageCards sections that have string note values
const pages = await client.fetch(
  `*[_type == "page" && count(sections[_type == "imageCards"]) > 0]{ _id, sections }`,
);
let patched = 0;

for (const page of pages) {
  const updatedSections = page.sections.map((section) => {
    if (section._type !== "imageCards") return section;
    const updatedItems = (section.items ?? []).map((item) => {
      if (typeof item.note !== "string") return item;
      const wrapped = [
        { _key: "ja", value: item.note },
        { _key: "en", value: "" },
      ];
      console.log(`Page ${page._id}: wrapping note "${item.note}" → internationalizedArrayString`);
      patched++;
      return { ...item, note: wrapped };
    });
    return { ...section, items: updatedItems };
  });

  await client.patch(page._id).set({ sections: updatedSections }).commit();
}

console.log(`\nDone. Patched ${patched} sisterCity item(s).`);
```

- [ ] **Step 4: Run the migration**

```bash
node scripts/migrate-sisterCity-note.mjs
```

Expected output: "Patched 1 sisterCity item(s)." (or 0 if note was already null).

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add sanity/schemas/sisterCity.ts lib/types.ts scripts/migrate-sisterCity-note.mjs scripts/check-hide-title.mjs
git commit -m "fix: migrate sisterCity.note to internationalizedArrayString for bilingual editability"
```

---

## Task 3: Remove `hideTitle` from schemas, types, and renderer guards

`hideTitle` is present in 6 schemas, 4 renderer guards, and 2 type files. Remove all of it.

**Files:**

- Modify: `sanity/schemas/contentSection.ts`
- Modify: `sanity/schemas/linksSection.ts`
- Modify: `sanity/schemas/labelTableSection.ts`
- Modify: `sanity/schemas/tableSection.ts`
- Modify: `sanity/schemas/infoCardsSection.ts`
- Modify: `sanity/schemas/imageCardsSection.ts`
- Modify: `lib/types.ts`
- Modify: `sanity/components/pages/types.ts`
- Modify: `lib/section-renderers/label-table.tsx`
- Modify: `lib/section-renderers/info-cards.tsx`
- Modify: `lib/section-renderers/image-cards.tsx`
- Modify: `lib/section-renderers/table.tsx`

- [ ] **Step 1: Update `sanity/schemas/contentSection.ts`**

Remove the `hideTitle` field entirely and simplify the `title` field — remove the `hidden` callback and replace the custom validation with no validation (title is now purely optional):

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
      description: "セクションの見出し。省略可。",
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

- [ ] **Step 2: Update `sanity/schemas/linksSection.ts`**

Remove the `hideTitle` field and simplify the `title` field (remove `hidden` callback, remove custom validation, remove the `fieldsets` array since nothing uses it anymore):

```typescript
// sanity/schemas/linksSection.ts  (show only changed parts — replace title + hideTitle fields)
```

In the file, remove the entire `fieldsets` array (it only existed for the advanced group used by `hideTitle`), remove the `hidden: ({ parent }) => parent?.hideTitle` from the `title` field, remove the custom `validation` on `title`, and delete the `hideTitle` `defineField` block entirely.

The resulting `fields` array should be:

```typescript
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "リンクセクションの見出し。省略可。",
    }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "documentLink" }],
      description: "リンクの一覧。PDF・YouTube・外部サイトなどを追加できます。",
      validation: (Rule) => Rule.required(),
    }),
  ],
```

Also remove the `fieldsets` property from the schema definition entirely.

- [ ] **Step 3: Update `sanity/schemas/labelTableSection.ts`**

Remove `fieldsets`, remove `hidden` and `validation` from the `title` field, delete the `hideTitle` field. Resulting `fields`:

```typescript
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "テーブルの見出し。省略可。",
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
```

Also remove the `fieldsets` property.

- [ ] **Step 4: Update `sanity/schemas/tableSection.ts`**

Remove `fieldsets`, remove `hidden` and custom `validation` from `title`, delete `hideTitle` field. Resulting `fields`:

```typescript
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
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
```

Also remove `fieldsets` property.

- [ ] **Step 5: Update `sanity/schemas/infoCardsSection.ts`**

Remove `fieldsets`, remove `hidden` and custom `validation` from `title`, delete `hideTitle` field. Resulting `fields`:

```typescript
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
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
```

Also remove `fieldsets`.

- [ ] **Step 6: Update `sanity/schemas/imageCardsSection.ts`**

Remove `fieldsets`, remove `hidden` and custom `validation` from `title`, delete `hideTitle` field. Resulting `fields`:

```typescript
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
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
```

Also remove `fieldsets`.

- [ ] **Step 7: Remove `hideTitle` from `lib/types.ts`**

Remove `hideTitle?: boolean;` from `TableSection`, `LabelTableSection`, `InfoCardsSection`, and `ImageCardsSection` interfaces. No other interfaces in this file have it.

- [ ] **Step 8: Remove `hideTitle` from `sanity/components/pages/types.ts`**

Remove `hideTitle?: boolean;` from the `SectionItem` interface (line 44).

- [ ] **Step 9: Update renderer guards in `lib/section-renderers/`**

In each of these four files, change `if (s.title && !s.hideTitle)` to `if (s.title)`:

`lib/section-renderers/label-table.tsx` line 11:

```typescript
if (s.title) {
  ctx.addTocHeader(ja(s.title), en(s.title));
}
```

`lib/section-renderers/info-cards.tsx` line 11:

```typescript
if (s.title) {
  ctx.addTocHeader(ja(s.title), en(s.title));
}
```

`lib/section-renderers/image-cards.tsx` line 11:

```typescript
if (s.title) {
  ctx.addTocHeader(ja(s.title), en(s.title));
}
```

`lib/section-renderers/table.tsx` line 12:

```typescript
if (s.title) {
  ctx.addTocHeader(ja(s.title), en(s.title));
}
```

- [ ] **Step 10: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add sanity/schemas/contentSection.ts sanity/schemas/linksSection.ts \
  sanity/schemas/labelTableSection.ts sanity/schemas/tableSection.ts \
  sanity/schemas/infoCardsSection.ts sanity/schemas/imageCardsSection.ts \
  lib/types.ts sanity/components/pages/types.ts \
  lib/section-renderers/label-table.tsx lib/section-renderers/info-cards.tsx \
  lib/section-renderers/image-cards.tsx lib/section-renderers/table.tsx
git commit -m "refactor: remove hideTitle field from all section schemas, types, and renderer guards"
```

---

## Task 4: Update `KeyValueListEditor` with `fieldNames`, `placeholders`, and `addLabel` props

The existing component hardcodes `item.label` and `item.value` as field names. Add `fieldNames` and `placeholders` props so `InfoCardsSectionEditor` can use `term`/`definition` instead, and both editors can show placeholder text.

**Files:**

- Modify: `sanity/components/shared/KeyValueListEditor.tsx`

- [ ] **Step 1: Replace the file with the updated version**

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { i18nGet, i18nSet } from "./i18n";

function AutoTextarea({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(resize, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      style={{
        width: "100%",
        padding: "6px 8px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        fontSize: 12,
        fontFamily: "inherit",
        resize: "none",
        overflow: "hidden",
        background: "transparent",
        color: "inherit",
        lineHeight: 1.4,
        ...style,
      }}
    />
  );
}

interface KeyValueItem {
  _key: string;
  [key: string]: unknown;
}

export function KeyValueListEditor({
  label,
  labelHeader = "ラベル",
  valueHeader = "値",
  fieldNames = { label: "label", value: "value" },
  placeholders,
  addLabel = "+ 行を追加",
  items,
  onChange,
}: {
  label: string;
  labelHeader?: string;
  valueHeader?: string;
  fieldNames?: { label: string; value: string };
  placeholders?: {
    labelJa?: string;
    labelEn?: string;
    valueJa?: string;
    valueEn?: string;
  };
  addLabel?: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
}) {
  const labelField = fieldNames.label;
  const valueField = fieldNames.value;

  function getI18n(item: KeyValueItem, field: string) {
    return item[field] as { _key: string; value: string }[] | null | undefined;
  }

  function updateItem(index: number, field: string, lang: string, text: string) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: i18nSet(getI18n(updated[index], field) ?? null, lang, text),
    };
    onChange(updated);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([
      ...items,
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        [labelField]: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
        [valueField]: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
      },
    ]);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        {label}
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {items.map((item, index) => (
            <div
              key={item._key as string}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 6,
                padding: "8px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  {labelHeader}（日/EN）
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "ja")}
                  placeholder={placeholders?.labelJa}
                  onChange={(e) => updateItem(index, labelField, "ja", e.currentTarget.value)}
                  style={{ marginBottom: 4 }}
                />
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "en")}
                  placeholder={placeholders?.labelEn}
                  onChange={(e) => updateItem(index, labelField, "en", e.currentTarget.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  {valueHeader}（日/EN）
                </div>
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "ja")}
                  placeholder={placeholders?.valueJa}
                  onChange={(text) => updateItem(index, valueField, "ja", text)}
                  style={{ marginBottom: 4 }}
                />
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "en")}
                  placeholder={placeholders?.valueEn}
                  onChange={(text) => updateItem(index, valueField, "en", text)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                title="削除"
                style={{
                  padding: "4px",
                  border: "none",
                  borderRadius: 3,
                  background: "transparent",
                  color: "var(--card-muted-fg-color)",
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        style={{
          padding: "6px 12px",
          border: "1px dashed var(--card-border-color)",
          borderRadius: 4,
          background: "transparent",
          color: "var(--card-muted-fg-color)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {addLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. The existing `warnings` usage in `GenericSectionEditor` doesn't use `KeyValueListEditor` so there are no call-site changes needed.

- [ ] **Step 3: Commit**

```bash
git add sanity/components/shared/KeyValueListEditor.tsx
git commit -m "feat: add fieldNames, placeholders, and addLabel props to KeyValueListEditor"
```

---

## Task 5: `LabelTableSectionEditor` + routing

**Files:**

- Create: `sanity/components/pages/sections/LabelTableSectionEditor.tsx`
- Modify: `sanity/components/pages/SectionEditor.tsx`

- [ ] **Step 1: Create `LabelTableSectionEditor.tsx`**

```typescript
"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function LabelTableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const rows = (section.rows as { _key: string; [key: string]: unknown }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <KeyValueListEditor
        label="行"
        labelHeader="ラベル"
        valueHeader="値"
        fieldNames={{ label: "label", value: "value" }}
        placeholders={{
          labelJa: "例：開催日時",
          labelEn: "e.g., Date & Time",
          valueJa: "例：毎週月曜日 10:00〜12:00",
          valueEn: "e.g., Every Monday 10:00–12:00",
        }}
        addLabel="＋ 行を追加"
        items={rows}
        onChange={(items) =>
          onUpdateField(
            "rows",
            items.map((item) => ({ ...item, _type: "infoRow" })),
          )
        }
      />
    </>
  );
}
```

- [ ] **Step 2: Add route in `SectionEditor.tsx`**

Add this import at the top of `SectionEditor.tsx`:

```typescript
import { LabelTableSectionEditor } from "./sections/LabelTableSectionEditor";
```

Add this case to the `renderEditor` switch, before `default`:

```typescript
      case "labelTable":
        return <LabelTableSectionEditor section={section} onUpdateField={onUpdateField} />;
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/components/pages/sections/LabelTableSectionEditor.tsx \
  sanity/components/pages/SectionEditor.tsx
git commit -m "feat: add LabelTableSectionEditor with bilingual label/value rows"
```

---

## Task 6: `InfoCardsSectionEditor` + routing

**Files:**

- Create: `sanity/components/pages/sections/InfoCardsSectionEditor.tsx`
- Modify: `sanity/components/pages/SectionEditor.tsx`

- [ ] **Step 1: Create `InfoCardsSectionEditor.tsx`**

```typescript
"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function InfoCardsSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const items = (section.items as { _key: string; [key: string]: unknown }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <KeyValueListEditor
        label="項目"
        labelHeader="タイトル"
        valueHeader="文章"
        fieldNames={{ label: "term", value: "definition" }}
        placeholders={{
          labelJa: "例：在留資格",
          labelEn: "e.g., Residence Status",
          valueJa: "例：外国人が日本に滞在するための法的身分",
          valueEn: "e.g., Legal status required to stay in Japan",
        }}
        addLabel="＋ 項目を追加"
        items={items}
        onChange={(updated) =>
          onUpdateField(
            "items",
            updated.map((item) => ({ ...item, _type: "definition" })),
          )
        }
      />
    </>
  );
}
```

- [ ] **Step 2: Add route in `SectionEditor.tsx`**

Add import:

```typescript
import { InfoCardsSectionEditor } from "./sections/InfoCardsSectionEditor";
```

Add case before `default`:

```typescript
      case "infoCards":
        return <InfoCardsSectionEditor section={section} onUpdateField={onUpdateField} />;
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/components/pages/sections/InfoCardsSectionEditor.tsx \
  sanity/components/pages/SectionEditor.tsx
git commit -m "feat: add InfoCardsSectionEditor with bilingual title/text items"
```

---

## Task 7: `ImageCardsSectionEditor` + routing

Each item has bilingual name, bilingual country, an image (picked via `onOpenImagePicker`), and bilingual note. Renders as an accordion list.

**Files:**

- Create: `sanity/components/pages/sections/ImageCardsSectionEditor.tsx`
- Modify: `sanity/components/pages/SectionEditor.tsx`

- [ ] **Step 1: Create `ImageCardsSectionEditor.tsx`**

```typescript
"use client";

import { useState } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface ImageCardItem {
  _key: string;
  _type?: string;
  name?: { _key: string; value: string }[] | null;
  country?: { _key: string; value: string }[] | null;
  image?: { asset: { _ref: string } } | null;
  note?: { _key: string; value: string }[] | null;
}

export function ImageCardsSectionEditor({
  section,
  onUpdateField,
  onOpenImagePicker,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
}) {
  const items = (section.items as ImageCardItem[]) ?? [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function updateItem(index: number, patch: Partial<ImageCardItem>) {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onUpdateField("items", updated);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onUpdateField("items", updated);
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  }

  function addItem() {
    const newItem: ImageCardItem = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      _type: "sisterCity",
      name: [{ _key: "ja", value: "" }, { _key: "en", value: "" }],
      country: [{ _key: "ja", value: "" }, { _key: "en", value: "" }],
      note: [{ _key: "ja", value: "" }, { _key: "en", value: "" }],
    };
    const newItems = [...items, newItem];
    onUpdateField("items", newItems);
    setExpandedIndex(newItems.length - 1);
  }

  function handleImagePick(itemIndex: number) {
    onOpenImagePicker((assetId: string) => {
      updateItem(itemIndex, { image: { asset: { _ref: assetId } } });
    });
  }

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          カード一覧
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {items.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const nameJa = i18nGet(item.name, "ja") || "（名前なし）";
            const hasImage = !!item.image?.asset?._ref;

            return (
              <div
                key={item._key}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {/* Card header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    cursor: "pointer",
                    background: isExpanded ? "var(--card-bg-color)" : "transparent",
                  }}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  {/* Image indicator */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      background: hasImage
                        ? "var(--card-border-color)"
                        : "var(--card-code-bg-color, rgba(0,0,0,0.05))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "var(--card-muted-fg-color)",
                      flexShrink: 0,
                    }}
                  >
                    {hasImage ? "🖼" : "画像なし"}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nameJa}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    title="削除"
                    style={{
                      padding: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--card-muted-fg-color)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Expanded form */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderTop: "1px solid var(--card-border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {/* Image */}
                    <div>
                      <div
                        style={{ fontSize: 11, color: "var(--card-muted-fg-color)", marginBottom: 4 }}
                      >
                        画像
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImagePick(index)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid var(--card-border-color)",
                          borderRadius: 4,
                          background: "transparent",
                          color: "var(--card-fg-color)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {hasImage ? "画像を変更" : "画像を選択"}
                      </button>
                    </div>

                    {/* Name */}
                    <BilingualInput
                      label="名前"
                      value={item.name}
                      onChange={(val) => updateItem(index, { name: val })}
                    />

                    {/* Country */}
                    <BilingualInput
                      label="国"
                      value={item.country}
                      onChange={(val) => updateItem(index, { country: val })}
                    />

                    {/* Note */}
                    <BilingualInput
                      label="備考（任意）"
                      value={item.note}
                      onChange={(val) => updateItem(index, { note: val })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItem}
          style={{
            padding: "6px 12px",
            border: "1px dashed var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ＋ カードを追加
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add route in `SectionEditor.tsx`**

Add import:

```typescript
import { ImageCardsSectionEditor } from "./sections/ImageCardsSectionEditor";
```

Add case before `default`:

```typescript
      case "imageCards":
        return (
          <ImageCardsSectionEditor
            section={section}
            onUpdateField={onUpdateField}
            onOpenImagePicker={onOpenImagePicker}
          />
        );
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/components/pages/sections/ImageCardsSectionEditor.tsx \
  sanity/components/pages/SectionEditor.tsx
git commit -m "feat: add ImageCardsSectionEditor with per-item image picker and bilingual fields"
```

---

## Task 8: `TableSectionEditor` — pure data utilities

Extract the column/row normalization logic as pure functions so they can be reasoned about and tested independently from the UI component.

**Files:**

- Create: `sanity/components/pages/sections/table-utils.ts`

- [ ] **Step 1: Create `table-utils.ts`**

```typescript
// sanity/components/pages/sections/table-utils.ts

export type I18nArr = { _key: string; value: string }[];

export interface TableColumnDraft {
  _key: string;
  label?: I18nArr | null;
}

export interface TableRowDraft {
  _key: string;
  groupLabel?: I18nArr | null;
  cells?: I18nArr[] | null;
}

export function emptyBilingual(): I18nArr {
  return [
    { _key: "ja", value: "" },
    { _key: "en", value: "" },
  ];
}

/** When a column is added, append an empty bilingual cell to every data row. */
export function padRowsForNewColumn(rows: TableRowDraft[]): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel) return row; // group header rows don't have cells
    return { ...row, cells: [...(row.cells ?? []), emptyBilingual()] };
  });
}

/** When column at colIndex is removed, trim that positional cell from every data row. */
export function trimRowsForRemovedColumn(rows: TableRowDraft[], colIndex: number): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel) return row;
    const cells = [...(row.cells ?? [])];
    cells.splice(colIndex, 1);
    return { ...row, cells };
  });
}

/** When toggling a row from data → group header: clear cells, initialise groupLabel. */
export function convertToGroupHeader(row: TableRowDraft): TableRowDraft {
  return { _key: row._key, groupLabel: emptyBilingual(), cells: [] };
}

/** When toggling a row from group header → data: clear groupLabel, pad cells to match column count. */
export function convertToDataRow(row: TableRowDraft, columnCount: number): TableRowDraft {
  const cells = Array.from({ length: columnCount }, () => emptyBilingual());
  return { _key: row._key, groupLabel: null, cells };
}
```

- [ ] **Step 2: Write a verification script to confirm logic**

```typescript
// Run inline to verify: paste in a Node REPL or ts-node
import {
  padRowsForNewColumn,
  trimRowsForRemovedColumn,
  convertToGroupHeader,
  convertToDataRow,
} from "./table-utils";

const rows = [
  {
    _key: "r1",
    cells: [
      [
        { _key: "ja", value: "田中" },
        { _key: "en", value: "Tanaka" },
      ],
    ],
  },
  {
    _key: "r2",
    groupLabel: [
      { _key: "ja", value: "役員" },
      { _key: "en", value: "Board" },
    ],
  },
];

const padded = padRowsForNewColumn(rows);
console.assert(padded[0].cells?.length === 2, "data row should have 2 cells after pad");
console.assert(padded[1].cells === undefined, "group header should be unchanged");

const trimmed = trimRowsForRemovedColumn(padded, 0);
console.assert(trimmed[0].cells?.length === 1, "data row should have 1 cell after trim at index 0");

const asHeader = convertToGroupHeader(rows[0]);
console.assert(!!asHeader.groupLabel, "should have groupLabel");
console.assert(asHeader.cells?.length === 0, "should have empty cells");

const asData = convertToDataRow(rows[1], 3);
console.assert(asData.cells?.length === 3, "should have 3 empty cells");
console.assert(!asData.groupLabel, "should have no groupLabel");

console.log("All assertions passed.");
```

Run verification:

```bash
npx ts-node --skip-project -e "$(cat <<'EOF'
// paste verification code above here
EOF
)"
```

If `ts-node` isn't available, verify by TypeScript type-check only:

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/pages/sections/table-utils.ts
git commit -m "feat: add table-utils with pure column/row normalization functions"
```

---

## Task 9: `TableSectionEditor` — full UI + routing

The most complex editor. Two sections: columns (label only, no type dropdown) and rows (group header toggle, one BilingualInput per column for data rows).

**Files:**

- Create: `sanity/components/pages/sections/TableSectionEditor.tsx`
- Modify: `sanity/components/pages/SectionEditor.tsx`

- [ ] **Step 1: Create `TableSectionEditor.tsx`**

```typescript
"use client";

import { useState } from "react";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import {
  emptyBilingual,
  padRowsForNewColumn,
  trimRowsForRemovedColumn,
  convertToGroupHeader,
  convertToDataRow,
  type I18nArr,
  type TableColumnDraft,
  type TableRowDraft,
} from "./table-utils";
import type { SectionItem } from "../types";

// ── Add/edit column form ─────────────────────────────────────────────

function ColumnForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TableColumnDraft;
  onSave: (col: TableColumnDraft) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState<I18nArr>(initial?.label ?? emptyBilingual());

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <BilingualInput
        label="列見出し"
        value={label}
        onChange={setLabel}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            onSave({
              _key: initial?._key ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              label,
            })
          }
          style={{
            padding: "5px 12px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "var(--card-bg-color)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "5px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--card-muted-fg-color)",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ── Add/edit row form ────────────────────────────────────────────────

function RowForm({
  initial,
  columns,
  onSave,
  onCancel,
}: {
  initial?: TableRowDraft;
  columns: TableColumnDraft[];
  onSave: (row: TableRowDraft) => void;
  onCancel: () => void;
}) {
  const isInitiallyGroupHeader = !!initial?.groupLabel;
  const [isGroupHeader, setIsGroupHeader] = useState(isInitiallyGroupHeader);
  const [groupLabel, setGroupLabel] = useState<I18nArr>(
    initial?.groupLabel ?? emptyBilingual(),
  );
  const [cells, setCells] = useState<I18nArr[]>(
    initial?.cells ??
      Array.from({ length: columns.length }, () => emptyBilingual()),
  );

  function toggleGroupHeader(checked: boolean) {
    setIsGroupHeader(checked);
    if (checked) {
      // switching to group header: preserve any groupLabel we had
    } else {
      // switching to data row: ensure cells array matches column count
      setCells((prev) => {
        const next = [...prev];
        while (next.length < columns.length) next.push(emptyBilingual());
        return next.slice(0, columns.length);
      });
    }
  }

  function updateCell(colIndex: number, lang: string, text: string) {
    setCells((prev) => {
      const next = [...prev];
      next[colIndex] = i18nSet(next[colIndex] ?? emptyBilingual(), lang, text);
      return next;
    });
  }

  function handleSave() {
    const key = initial?._key ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    if (isGroupHeader) {
      onSave({ _key: key, groupLabel, cells: [] });
    } else {
      onSave({ _key: key, groupLabel: null, cells });
    }
  }

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Group header toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={isGroupHeader}
          onChange={(e) => toggleGroupHeader(e.target.checked)}
        />
        グループ見出し行にする
      </label>

      {isGroupHeader ? (
        <BilingualInput
          label="見出し"
          value={groupLabel}
          onChange={setGroupLabel}
        />
      ) : (
        columns.map((col, colIndex) => {
          const colLabelJa = i18nGet(col.label, "ja") || `列 ${colIndex + 1}`;
          return (
            <BilingualInput
              key={col._key}
              label={colLabelJa}
              value={cells[colIndex] ?? emptyBilingual()}
              onChange={(val) => {
                setCells((prev) => {
                  const next = [...prev];
                  next[colIndex] = val as I18nArr;
                  return next;
                });
              }}
            />
          );
        })
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "5px 12px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "var(--card-bg-color)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "5px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--card-muted-fg-color)",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────

export function TableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const columns = (section.columns as TableColumnDraft[]) ?? [];
  const rows = (section.rows as TableRowDraft[]) ?? [];

  const [addingColumn, setAddingColumn] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Only data rows (not group headers) count for the deletion warning
  const dataRowCount = rows.filter((r) => !r.groupLabel).length;

  // ── Column operations ──────────────────────────────────────────────

  function saveColumn(col: TableColumnDraft) {
    if (editingColumnIndex !== null) {
      // editing existing
      const updated = [...columns];
      updated[editingColumnIndex] = col;
      onUpdateField("columns", updated);
      setEditingColumnIndex(null);
    } else {
      // adding new — also pad all existing data rows
      onUpdateField("columns", [...columns, col]);
      onUpdateField("rows", padRowsForNewColumn(rows));
      setAddingColumn(false);
    }
  }

  function deleteColumn(colIndex: number) {
    const colLabelJa = i18nGet(columns[colIndex]?.label, "ja") || "この列";
    if (
      dataRowCount > 0 &&
      !window.confirm(
        `「${colLabelJa}」列を削除すると、全ての行からこの列のデータが削除されます。よろしいですか？`,
      )
    ) {
      return;
    }
    const updatedColumns = columns.filter((_, i) => i !== colIndex);
    const updatedRows = trimRowsForRemovedColumn(rows, colIndex);
    onUpdateField("columns", updatedColumns);
    onUpdateField("rows", updatedRows);
  }

  // ── Row operations ─────────────────────────────────────────────────

  function saveRow(row: TableRowDraft) {
    if (editingRowIndex !== null) {
      const updated = [...rows];
      updated[editingRowIndex] = row;
      onUpdateField("rows", updated);
      setEditingRowIndex(null);
    } else {
      onUpdateField("rows", [...rows, row]);
      setAddingRow(false);
    }
  }

  function deleteRow(rowIndex: number) {
    onUpdateField("rows", rows.filter((_, i) => i !== rowIndex));
    if (editingRowIndex === rowIndex) setEditingRowIndex(null);
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      {/* Title */}
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      {/* Caption */}
      <BilingualInput
        label="キャプション（任意）"
        value={section.caption as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("caption", val)}
      />

      {/* ── Columns section ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          列定義
        </div>

        {columns.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {columns.map((col, colIndex) => {
              const labelJa = i18nGet(col.label, "ja") || "（ラベルなし）";
              const isEditing = editingColumnIndex === colIndex;

              return (
                <div key={col._key}>
                  {isEditing ? (
                    <ColumnForm
                      initial={col}
                      onSave={saveColumn}
                      onCancel={() => setEditingColumnIndex(null)}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        border: "1px solid var(--card-border-color)",
                        borderRadius: 4,
                      }}
                    >
                      <span
                        style={{ flex: 1, fontSize: 13, cursor: "pointer" }}
                        onClick={() => setEditingColumnIndex(colIndex)}
                      >
                        {labelJa}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteColumn(colIndex)}
                        title="列を削除"
                        style={{
                          padding: 4,
                          border: "none",
                          background: "transparent",
                          color: "var(--card-muted-fg-color)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {addingColumn ? (
          <ColumnForm onSave={saveColumn} onCancel={() => setAddingColumn(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAddingColumn(true)}
            style={{
              padding: "6px 12px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ＋ 列を追加
          </button>
        )}
      </div>

      {/* ── Rows section ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          行
        </div>

        {columns.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", fontStyle: "italic" }}>
            先に列を定義してください
          </div>
        ) : (
          <>
            {rows.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {rows.map((row, rowIndex) => {
                  const isEditing = editingRowIndex === rowIndex;
                  const isGroupHeader = !!row.groupLabel;
                  const labelJa = isGroupHeader
                    ? i18nGet(row.groupLabel, "ja") || "（見出しなし）"
                    : i18nGet(row.cells?.[0], "ja") || "（空の行）";

                  return (
                    <div key={row._key}>
                      {isEditing ? (
                        <RowForm
                          initial={row}
                          columns={columns}
                          onSave={saveRow}
                          onCancel={() => setEditingRowIndex(null)}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            border: "1px solid var(--card-border-color)",
                            borderRadius: 4,
                            background: isGroupHeader
                              ? "var(--card-code-bg-color, rgba(0,0,0,0.03))"
                              : "transparent",
                          }}
                        >
                          {isGroupHeader && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--card-muted-fg-color)",
                                border: "1px solid var(--card-border-color)",
                                borderRadius: 3,
                                padding: "1px 4px",
                                flexShrink: 0,
                              }}
                            >
                              見出し
                            </span>
                          )}
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: isGroupHeader ? 600 : 400,
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => setEditingRowIndex(rowIndex)}
                          >
                            {labelJa}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteRow(rowIndex)}
                            title="行を削除"
                            style={{
                              padding: 4,
                              border: "none",
                              background: "transparent",
                              color: "var(--card-muted-fg-color)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {addingRow ? (
              <RowForm
                columns={columns}
                onSave={saveRow}
                onCancel={() => setAddingRow(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingRow(true)}
                style={{
                  padding: "6px 12px",
                  border: "1px dashed var(--card-border-color)",
                  borderRadius: 4,
                  background: "transparent",
                  color: "var(--card-muted-fg-color)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ＋ 行を追加
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add route in `SectionEditor.tsx`**

Add import:

```typescript
import { TableSectionEditor } from "./sections/TableSectionEditor";
```

Add case before `default`:

```typescript
      case "table":
        return <TableSectionEditor section={section} onUpdateField={onUpdateField} />;
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/components/pages/sections/TableSectionEditor.tsx \
  sanity/components/pages/SectionEditor.tsx
git commit -m "feat: add TableSectionEditor with columns, data rows, group headers, and column safety"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run TypeScript check one last time**

```bash
npx tsc --noEmit
```

Expected: no errors across the entire codebase.

- [ ] **Step 2: Verify all four section types are routed**

Open `sanity/components/pages/SectionEditor.tsx` and confirm the switch statement has explicit cases for `"labelTable"`, `"infoCards"`, `"imageCards"`, and `"table"` — and none of them fall through to `GenericSectionEditor`.

- [ ] **Step 3: Verify the "未対応" fallback is gone for all four types**

In `GenericSectionEditor.tsx`, confirm the `if (!config)` fallback block still exists (for truly unknown future types) but none of the four new types would reach it.

- [ ] **Step 4: Push to remote**

```bash
git push origin main
```
