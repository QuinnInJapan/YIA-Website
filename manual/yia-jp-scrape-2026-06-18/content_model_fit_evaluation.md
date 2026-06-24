# yia.jp content model fit evaluation

Evaluation date: 2026-06-19

Source archive: `manual/yia-jp-scrape-2026-06-18`

Goal: evaluate each scraped page against the current Sanity framework and decide whether it fits as a `page`, an `announcement` (`お知らせ`), or needs a model/structure note because it cannot be represented cleanly without loss.

## Current Framework

Active top-level content types relevant to this migration:

- `page`: categorized permanent page. Fields: `slug`, `categoryRef`, `title`, `description`, top images, and `sections`.
- `announcement`: dated `お知らせ`. Fields: `title`, `slug`, `date`, `pinned`, `heroImage`, `excerpt`, `body`, and attached `documents`.
- `homepage`: singleton for the top page. Not a normal `page`, but it exists in the current framework.
- `siteSettings` and `sidebar`: hold organization-wide contact/footer/document data.

Active page categories in Studio structure:

- `category-services`: 相談・サービス
- `category-classes`: 教室・講座
- `category-events`: イベント
- `category-partnerships`: 交流・協力
- `category-about`: 協会について

Reusable page section types:

- `content`: prose/rich text
- `labelTable`: label/value facts such as time, place, fee, target audience
- `table`: column/row tables, including file cells
- `links`: PDFs, files, YouTube, and external links
- `warnings`: highlighted notes
- `gallery`: photo collections
- `infoCards`: term/definition cards
- `imageCards`: image cards backed by the `sisterCity` object

## Decision Rules

- Stable program/service descriptions should become `page` records.
- Dated news, registration openings, newly posted documents, cancellations, and one-off event notices should become `announcement` records.
- Annual or term-specific details can remain inside a `page` when they describe the current offering, but should also be considered for `announcement` if they are a new notice.
- PDFs and forms can be attached via `documentLink`; the PDF text sidecars are extraction helpers only, not a replacement for the original files.
- The current i18n setup supports only Japanese and English (`ja`, `en`). Other languages can be preserved as plain multilingual text inside a Japanese or English body, but not as first-class language variants.

## Page-By-Page Fit

| # | Source page | Recommended fit | Category / target | How to model it | Fit notes |
|---|---|---|---|---|---|
| 1 | `/` | Split: `homepage` + `siteSettings` + `announcement`/documents | Homepage singleton, site settings, about/resources | Use `homepage` for top-page presentation, `siteSettings` for contact/email/tel, and create dated announcements or document links for 2026-06-15 updates. | Not a clean `page` or single `announcement`. It mixes navigation, contact, homepage, access, organization docs, and update notices. |
| 2 | `/top/09aboutyia/aboutyia-top.htm` 横須賀国際交流協会とは | `page` | `category-about` | `content` for mission/history prose, `labelTable` for organization facts, `table` for history if kept on this page, `links` for bylaws/reports. | Fits well. Some governance PDFs may be better as a document library or announcement attachments rather than body prose. |
| 3 | `/top/09aboutyia/kaiinn/kaiinn-top.htm` 会員募集 | `page` | `category-about` | `content` for membership explanation, `labelTable` for fees, `links` for application forms (`.xls`). | Fits. Old Excel application forms are supported as document links but are not structurally editable in the current model. |
| 4 | `/top/09aboutyia/sanjo/sanjyokaiin-top.htm` 賛助会員 | `page` | `category-about` or `category-partnerships` | `content` intro plus `table` of sponsor/member names and TEL values. | Fits as a table. If YIA wants a maintainable sponsor directory with URLs, sort keys, logos, or active/inactive status, the current model is too flat. |
| 5 | `/top/09katsudo/shien/kaiwasalon/kaiwasalon-top/kaiwasalon-top.html` 日本語会話サロン | `page` with possible `announcement` items for annual schedule updates | `category-classes` or `category-services` | `content` for program description, `labelTable` for application/how-to, `links` for application form and class PDFs, `table` for schedule summaries. | Fits, but class schedule PDFs contain structured class data that would be lossy if stored only as links. |
| 6 | `/top/09katsudo/shien/seikatsusodan/sekatsusodan-top/seikatsusodan-top.html` 多言語による生活相談 | `page` | `category-services` | `content` for service explanation, `labelTable` for languages/hours, `links` for flyer PDF, include manual OCR schedule image text in body or label table. | Mostly fits. The Korean/Chinese/Spanish/Portuguese schedule text cannot be represented as first-class i18n fields because the app only supports `ja` and `en`. |
| 7 | `/top/09katsudo/shien/honyaku/honyaku-top/honyaku-top.html` 窓口翻訳 | `page` | `category-services` | `content` for service summary, `table` or `labelTable` for document types/fees/processing time, `links` for request form PDF/XLS. | Fits. If translation requests need workflow/status tracking, that is outside the current public content model. |
| 8 | `/top/09katsudo/shien/bosai/bosai-top/bosai-top.html` 外国人防災啓発事業 | `page` | `category-services` or `category-classes` | `content` for program description, `links` for YouTube, `labelTable` for contact. | Fits cleanly. YouTube is supported inside rich text and as `documentLink` type `youtube`. |
| 9 | `/top/09katsudo/kehatsu/gaikokugo/gaikokugo-top/gaikokugo-top.htm` 外国語講座 | `page` plus optional `announcement` for registration/term openings | `category-classes` | `content` for overview, `table` for language classes, `links` for 2026 PDFs, `warnings` for refund/minimum-enrollment notes. | Fits as a page, but not cleanly as structured class offerings. Details like term dates, fees, levels, capacity, and registration status are trapped in PDFs unless a course/session model is added. |
| 10 | `/top/09katsudo/kehatsu/kokusairikai/kokusairikai-top/kokusairikai-top.html` 国際理解講座 | `page` | `category-classes` or `category-events` | `content` for service/program description, `labelTable` for target/context, `gallery` for photos if retained. | Fits. This is an ongoing program page, not an `announcement`. |
| 11 | `/top/09katsudo/kehatsu/youthfo/youthfo-top/youthfo-top.html` 国際ユースフォーラム | `page` plus annual event `announcement` when recruiting/publishing schedule | `category-events` | `content` for purpose, `gallery` for 2024 photos, `labelTable` for schedule, `warnings` for registration notes if any. | Fits as a program page. The 2025-08-06 schedule is date-specific and should be reviewed as outdated/current during content pruning. |
| 12 | `/top/09katsudo/kouryu/nihonbunka/nihonbunka-top/nihonbunka-top.htm` 日本文化体験教室 & Japan Festival | `page` plus event announcements for annual schedules | `category-events` | `content` for overview, `gallery` for photos, `table` or `labelTable` for 2026 schedule, `links` if flyers are added. | Fits. Repeating event instances are only loosely modeled; no first-class event calendar/session object exists. |
| 13 | `/top/09katsudo/kouryu/kids/kids-top/kids-top.htm` キッズフェスティバル | `page` plus event `announcement` for yearly call/registration | `category-events` | `content` for overview, `gallery` for photos, `labelTable` or `warnings` for registration period and date. | Fits, but the 2025-10-19 date and 2025-08-18 registration start are past as of 2026-06-19. Do not discard automatically, but mark for review. |
| 14 | `/top/09katsudo/kouryu/homestay/homestay-top/englishguide-top.htm` 英語ガイドツアー | `page` plus tour announcements if needed | `category-events` or `category-partnerships` | `content` for overview, `labelTable`/`table` for 2026 tour schedule, `gallery` for tour photos. | Fits. Individual tours would be better as events if YIA wants listing/filtering by date. |
| 15 | `/top/09katsudo/kouryu/homestay/homestay-top/homestay-top.htm` ホームスティ・ホームビジット | `page` | `category-partnerships` | `content` for explanation, separate `content` sections for homestay/home visit, `gallery` for photos, `labelTable` for contact. | Fits cleanly as a permanent program page. |
| 16 | `/top/09katsudo/kouryu/cooking/cooking-top/cooking-top.htm` 世界の料理教室 | `page` plus class/event announcements for upcoming sessions | `category-events` or `category-classes` | `content` for overview, `gallery` for photos, `table` for historical yearly cuisine list. | Fits, but event history is unstructured. A blog/report model could represent past class recaps better than a long page table. |
| 17 | `/top/09katsudo/kokusaikoken/kokusaikoken-top/kokusaikoken-top.htm` 国際貢献 フェアトレードコーヒー | `page` | `category-partnerships` | `content` for explanation, `table` for product type/volume/price, `gallery` or image for product photo. | Fits as informational content. If purchase flow, stock, or product variants need management, current models are insufficient. |
| 18 | `/top/09katsudo/sistercity/sistercity-top/sistercity-top.htm` 姉妹都市交換学生派遣・受入事業 | `page` | `category-partnerships` | `content` for program overview, `imageCards` for sister cities, `gallery` for year-specific photos, `table` for dispatch/receiving status. | Strong fit because `imageCards` already uses `sisterCity`. Yearly exchange-student reports are less clean and may belong in announcements/blog posts. |
| 19 | `/index.htm` | Duplicate of #1 | Same as #1 | Treat as alias/duplicate of homepage. | Do not create a separate content record. Preserve only as source evidence. |
| 20 | `/top/09aboutyia/ennkaku/aboutyia-top.htm` 団体概要 / 沿革 | `page` or merge into #2 | `category-about` | If separate: `content` for organization overview and `table` for chronology. If merged: become a history section on #2. | Fits technically, but overlaps with #2. Decide whether the new site wants one consolidated “協会について” page or separate “団体概要/沿革”. |

## お知らせ Candidates

These are not necessarily separate scraped HTML pages, but they are page areas or linked documents that naturally fit `announcement`.

| Source | Suggested announcement | Date basis | Documents/body |
|---|---|---|---|
| Homepage update block | “令和8年度資料を掲載しました” or similar | 2026-06-15 shown on homepage | Attach bylaws, officer list, FY2027? / Reiwa 7 reports, balance sheet, Reiwa 8 plan/budget PDFs. |
| 外国語講座 page/PDFs | “2026年度 外国語講座 申込開始” | PDF says general applications from 2026-03-23 | Attach class overview and class-specific PDFs. |
| 日本語会話サロン page/PDFs | “2026年度 日本語教室日程表を掲載しました” | Schedule PDFs are for 2026年度 | Attach schedule and class flyer PDFs. |
| 多言語生活相談 page/PDF | “多言語による生活相談のご案内” | Flyer appears current for 2025/2026 context but needs date confirmation | Body can include multilingual schedule text from manual OCR; attach `Chirashi2025.pdf`. |
| キッズフェスティバル page | “キッズフェスティバル開催/申込開始” | Page lists 2025-10-19 and 2025-08-18 | Past as of 2026-06-19; only migrate as archive or replace if updated. |
| 国際ユースフォーラム page | Annual forum schedule/recruiting announcement | Page lists 2025-08-06 | Past as of 2026-06-19; review before migrating as live news. |
| 英語ガイドツアー page | Individual tour announcements | 2026-05-30, 2026-10-10, and later schedule rows | First date is past as of 2026-06-19; future dates can become announcements if recruiting/signups are open. |

## Model Gaps And Lossy Fits

### 1. Event/session model

Many pages describe time-bound events or annual programs: Kids Festival, Youth Forum, Japan Festival, English Guide Tour, World Cooking Class, Japanese culture workshops. Current `page` and `announcement` can display this content, but cannot cleanly represent reusable event fields such as:

- event date/time
- registration start/end
- venue
- capacity
- status such as scheduled, full, cancelled, completed
- recurring year/session archives

If the homepage needs an “upcoming events” area, this is the largest framework gap.

### 2. Course/class offering model

Foreign language classes and Japanese conversation salons have structured data: term dates, day/time, fee, level, capacity, location, teacher/group, and downloadable flyers. Current pages can use `table`, `labelTable`, and `links`, but the data will not be filterable, reusable, or easy to keep in sync across pages and announcements.

This is acceptable if the goal is faithful page migration. It is not ideal if YIA wants class listings, registration status, or future term rollover.

### 3. Multilingual content beyond Japanese/English

The app’s `internationalizedArray` configuration only supports:

- `ja`
- `en`

The old site includes counseling details in Korean, Chinese, Spanish, and Portuguese. Current models can preserve these as plain text in a `content` or `labelTable` field, but the frontend/editor will not treat them as language variants. This is a clean content-preservation path, but not a clean multilingual UX path.

### 4. Document library / governance records

The homepage has annual governance PDFs: bylaws, officers, business reports, financial statements, balance sheets, plans, and budgets. Current `documentLink` can attach files to pages or announcements, but there is no structured document library with fiscal year, document type, approval status, or publication date.

Best current fit: a page section or announcement with attached documents.

Cleaner future model: `resourceDocument` or `governanceDocument` with year/type/date/file fields.

### 5. Sponsor/member directory

The supporting members page fits in a `table`, but that loses directory semantics. There is no model for organization name, tel, URL, display order, logo, active year, or sponsorship tier.

This is only a gap if YIA expects to maintain sponsors as records rather than static table rows.

### 6. Products/sales items

Fair-trade coffee, handmade hanging hina dolls, and patchwork sale photos can be represented as page content/tables/images. There is no product model for inventory, price variants, purchase methods, or availability.

This is fine if the site is informational. It is a gap if YIA wants an actual product/catalog workflow.

### 7. Downloads/forms versioning

Membership forms and request forms are old Office/PDF files. `documentLink` supports attaching them, including file type labels, but not version/date/language/form-purpose metadata. If staff need to audit old vs current forms, a richer file model would help.

## Recommended Migration Shape

1. Create or update `page` records for the permanent program/service pages.
2. Treat `/` and `/index.htm` as homepage/source evidence, not normal pages.
3. Consolidate or separate #2 and #20 intentionally; do not migrate duplicate history content twice by accident.
4. Create `announcement` records only for dated notices and newly posted document sets, especially the 2026-06-15 homepage update and current course/schedule PDFs.
5. Preserve multilingual counseling text as body content for now; document that it is not true language switching.
6. Defer model additions until after the initial faithful migration, except consider an event/session model if homepage “upcoming events” is required.
