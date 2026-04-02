# Section Schema Refactor Design

**Date:** 2026-04-02
**Scope:** Schema consolidation + required studio editor updates. Studio-only polish (カテゴリーなし, delete confirmation) is a separate follow-up spec.

---

## Goal

Reduce 16 section types to 8 by eliminating redundancy and renaming sections to reflect their visual presentation rather than their content type. Editors should think of sections as UI components, not data containers.

---

## Principles

- Section names describe **how it looks**, not **what it contains**
- Bias against sections with very specific usage — generalize instead
- Fields that could stand alone as a section should be their own section
- No hard requirement to preserve current data presentation

---

## New Section Taxonomy

| New schema name | Replaces                                                                                                  | Production instances |
| --------------- | --------------------------------------------------------------------------------------------------------- | -------------------- |
| `content`       | `content` (sub-fields stripped)                                                                           | 16                   |
| `labelTable`    | `infoTable`                                                                                               | 9                    |
| `infoCards`     | `definitions`                                                                                             | 2                    |
| `table`         | `tableSchedule`, `history`, `feeTable`, `groupSchedule`, `boardMembers`, `directoryList`, `eventSchedule` | 2+2+1+1+1+1+4 = 12   |
| `gallery`       | `gallery`                                                                                                 | 6                    |
| `links`         | `links`                                                                                                   | 7                    |
| `warnings`      | `warnings` + `content.note`                                                                               | 0+4 = 4              |
| `imageCards`    | `sisterCities`                                                                                            | 1                    |

**Removed entirely:** `fairTrade`, `flyers`

---

## Schema Changes Per Section

### `content` (was `content`)

Remove all sub-fields. Only retains:

- `id` (string) — anchor/deep-link ID
- `title` (bilingual, optional)
- `hideTitle` (boolean)
- `description` (bilingual portable text)

Sub-fields being removed and where their data migrates:
| Field | Uses | Migration |
|---|---|---|
| `infoTable` | 7 | → standalone `labelTable` sections inserted after the `content` section |
| `documents` | 2 | → standalone `links` sections inserted after |
| `images` | 2 | → standalone `gallery` sections inserted after |
| `schedule` | 1 | → standalone `labelTable` section (city→label, period→value) |
| `checklist` | 2 | → rephrase as `labelTable` rows (item text → value column, checkbox state dropped) |
| `note` | 4 | → standalone `warnings` sections inserted after |

### `labelTable` (was `infoTable`)

Rename only. Remove the three over-specific note fields:

- `appointmentNote` — currently injected into the row labelled "予約" at render time. Migrate value inline into that row's value field, then remove.
- `additionalLanguageNote` — same pattern, row labelled "対応言語". Migrate inline.
- `otherNotes` — renders as a `BilingualBlock` after the table. Migrate to a standalone `warnings` section inserted after.

Affected documents: `page-cooking` (otherNotes), `page-seikatsusodan` (appointmentNote + additionalLanguageNote).

Retained fields:

- `title` (bilingual, optional)
- `hideTitle` (boolean)
- `rows[]` — `infoRow` objects (label + value, bilingual)

### `infoCards` (was `definitions`)

Rename only. No field changes.

- `title` (bilingual, optional)
- `hideTitle` (boolean)
- `items[]` — term + definition (bilingual)

### `table` (new — replaces 7 section types)

A general-purpose table with custom column definitions and optional row grouping.

Fields:

- `title` (bilingual, optional)
- `hideTitle` (boolean)
- `caption` (bilingual, optional) — for "as of" dates (replaces `boardMembers.asOf`)
- `columns[]` — column definitions:
  - `label` (bilingual)
  - `type` — styling hint: `text` | `date` | `phone` | `url` | `currency` | `name`
- `rows[]` — each row:
  - `groupLabel` (bilingual, optional) — if set, this row is a group header (replaces history's year-grouping)
  - `cells[]` — bilingual text values, one per column

**Migration targets:**

| Old section                 | Page(s)                                          | Notes                                                                              |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `tableSchedule`             | page-cooking, page-seikatsusodan                 | Columns map directly                                                               |
| `history`                   | page-aboutyia                                    | Years become group-header rows; `intro` moves to a `content` section placed before |
| `feeTable`                  | page-kaiinn                                      | memberType→col1, fee→col2, description→col3; `type=currency` on fee column         |
| `groupSchedule`             | page-kaiwasalon                                  | group name, day, time, location as columns                                         |
| `boardMembers`              | page-aboutyia                                    | name + role columns; `asOf` date becomes `caption`                                 |
| `directoryList`             | page-sanjyokaiin                                 | name column with `type=url`, tel column with `type=phone`                          |
| `eventSchedule` multi-date  | page-englishguide, page-nihonbunka (3 instances) | date + time + venue as columns                                                     |
| `eventSchedule` single-date | page-kids, page-nihonbunka (2 instances)         | Single row → convert to `labelTable` with date/time/venue as label-value pairs     |

### `gallery` (unchanged)

No changes.

### `links` (unchanged)

No changes.

### `warnings` (was `warnings`)

Was unused. Now absorbs:

- `content.note` migrations (4 instances)
- `infoTable.otherNotes` migration (1 instance: page-cooking)

Fields remain:

- `items[]` — array of bilingual text blocks

### `imageCards` (was `sisterCities`)

Rename only. No field changes.

- `title` (bilingual, optional)
- `hideTitle` (boolean)
- `cities[]` — rename array to `items[]` for generality:
  - `image`
  - `name` (bilingual)
  - `country`
  - `note`

### Removed sections

**`fairTrade`** (1 instance: page-kokusaikoken)
Migrate to: `content` (description) + `labelTable` (price list: type→label, weight+price→value) + `content` (delivery text)

**`flyers`** — 0 production uses. Delete schema and renderer.

**`eventSchedule`** — fully absorbed into `table` and `labelTable`. Delete schema and renderer.

---

## Frontend Renderer Changes

Each renamed section needs its renderer updated to handle the new schema name. The `table` section needs a new renderer that:

1. Renders column headers using `label` (bilingual)
2. Applies CSS class hints based on column `type` (phone, url, date, currency, name)
3. Renders `groupLabel` rows as sub-headers when present
4. Renders `caption` below the table title when present

The existing `HistoryTimeline`, `FeeTable`, `MembershipTiers`, `BoardMembers`, `DirectoryList`, `GroupSchedule`, `TableSchedule` components are retired. The unified `table` renderer handles all cases directly — no conditional dispatch to legacy components.

---

## Migration Summary

| Migration                                               | Affected documents                                                                | Complexity                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| Strip `content` sub-fields, split into sibling sections | page-gaikokugo, page-honyaku, page-kaiinn, page-sistercity, page-nihongo-handbook | Medium — insert new sibling sections      |
| `infoTable` note fields → inline / warnings             | page-cooking, page-seikatsusodan                                                  | Low                                       |
| 7 section types → `table`                               | ~10 pages                                                                         | Medium — reshape data to column/row model |
| `eventSchedule` single-date → `labelTable`              | page-kids, page-nihonbunka                                                        | Low                                       |
| `fairTrade` → `content` + `labelTable` + `content`      | page-kokusaikoken                                                                 | Low                                       |
| Delete `flyers` instances                               | none (0 uses)                                                                     | None                                      |
| Rename `sisterCities.cities` → `imageCards.items`       | page-sistercity                                                                   | Low                                       |

---

## Out of Scope (follow-up spec)

- カテゴリーなし section in nav sidebar
- Delete-from-category draft-commit flow
- Studio editor UI polish
