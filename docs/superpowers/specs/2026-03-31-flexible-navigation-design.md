# Flexible Navigation & Homepage Featured System — Wave 1

**Date:** 2026-03-31
**Scope:** Schema changes, data flow, homepage component updates (Wave 1 only). Custom Studio plugin UI is a separate spec (Wave 2).

## Problem

The homepage program grid is hardcoded to display categories that have a hero image, rendered in a rigid 4-column CSS grid. If a site admin adds or removes categories with hero images, the homepage breaks. There is no way to control page visibility in the nav, reorder items, or curate what appears on the homepage.

## Requirements

1. Admins manage navigation from Sanity Studio
2. Pages can be added to categories, reordered, and toggled visible/hidden in the nav
3. Exactly 4 categories are featured on the homepage (structurally enforced)
4. Each featured category card shows up to 4 pages + a "see all" link
5. Homepage grid stays rigid `repeat(4, 1fr)`
6. Categories can be renamed (bilingual labels) and deleted
7. Categories cannot be deleted if featured on the homepage
8. Pages cannot be deleted if referenced in the navigation document
9. Empty category warning shown on save (warning, not error)
10. Announcements are excluded from nav linking (already the case — `pageRef` only allows `type: "page"`)

## Approach

Separate concerns into two documents:

- **Navigation document** (existing, extended): controls what's in the nav — categories, page ordering, visibility
- **Homepage Featured document** (new singleton): controls what's on the homepage — exactly 4 category slots with page picks

## Schema Changes

### Navigation schema (`sanity/schemas/navigation.ts`)

Add `hidden` boolean field to each page item within a category:

```
categories[] → items[] → {
  pageRef: reference to page (existing),
  hidden: boolean (new, default false)
}
```

Array order determines display order (Sanity arrays are drag-sortable). No other structural changes.

**Validation:**

- Warning (not error) if a category has 0 visible items: "このカテゴリーにはページがありません (This category has no pages)"

### New `homepageFeatured` schema (`sanity/schemas/homepageFeatured.ts`)

Singleton document with 4 named fields (not an array — structurally enforces exactly 4):

```
slot1: { categoryRef (required, reference to category), pages[] (max 4, references to page) }
slot2: { categoryRef (required, reference to category), pages[] (max 4, references to page) }
slot3: { categoryRef (required, reference to category), pages[] (max 4, references to page) }
slot4: { categoryRef (required, reference to category), pages[] (max 4, references to page) }
```

Each slot requires a category reference. The `pages` array within each slot is a plain array of references to `page` documents (not wrapped in objects), max length 4.

### Category schema (`sanity/schemas/category.ts`)

Add `required()` validation to the `heroImage` field. Every category must have a hero image — this eliminates the need for heroImage-based filtering anywhere in the codebase and ensures homepage cards always have a background.

Labels are already editable (bilingual via `internationalizedArrayString`). Deletion protection is handled by Sanity's reference integrity — a category referenced by `homepageFeatured` or `navigation` cannot be deleted. Note: this relies on Sanity's default delete behavior. The project has a custom `cleanDeleteAction` in `sanity/actions/cleanDeleteAction.ts` but it currently only applies to `blogPost` (configured in `sanity.config.ts`). Do not extend it to categories or pages without adding reference checks.

### Page schema (`sanity/schemas/page.ts`)

No structural changes. Deletion protection is handled by Sanity's reference integrity — a page referenced in the navigation document cannot be deleted (same caveat about custom delete actions as above).

## Data Flow Changes

### GROQ query (`lib/sanity/queries.ts`)

Add `homepageFeatured` to the composite `fetchSiteData` query:

```groq
"homepageFeatured": *[_type == "homepageFeatured"][0]{
  slot1{ categoryRef->, pages[]-> },
  slot2{ categoryRef->, pages[]-> },
  slot3{ categoryRef->, pages[]-> },
  slot4{ categoryRef->, pages[]-> }
}
```

### Navigation enrichment (`lib/data.ts`)

**`getEnrichedNavigation`:** Filter out items where `hidden === true` before building the nav array. No other changes — ordering and categorization already derive from array position.

**New `getHomepageFeatured` helper:** Reads the 4 slots from `homepageFeatured`, builds category info + up to 4 page links for each, returns a fixed-length array of 4 featured category cards.

### SiteNav component

No changes. Already maps over categories dynamically and will naturally reflect hidden-item filtering from the data layer.

## Homepage Component Changes (`components/templates/HomepageTemplateAbout.tsx`)

Replace the current program grid logic:

```tsx
// Before: filter nav categories by hero image (brittle)
nav.categories.filter((cat) => cat.heroImage?.asset?._ref)

// After: consume homepageFeatured data (exactly 4 slots)
homepageFeatured.slots.map((slot) => ...)
```

Each of the 4 cards renders:

- Category hero image (from the category document)
- Category name (Japanese + English)
- Up to 4 page links (from the slot's `pages` array)
- "すべて見る / See All" link at the bottom, linking to the category page

If a slot has fewer than 4 pages, it shows what's there. CSS grid stays `repeat(4, 1fr)` with existing responsive breakpoints.

## Migration

Seed the `homepageFeatured` document to avoid breaking the live site during deployment:

1. Query current categories in navigation order: `*[_type == "category"] | order(_id asc)`
2. Populate the 4 slots with the first 4 categories
3. For each slot, populate `pages` with up to 4 pages from the corresponding navigation category's items (preserving current order)
4. Add `hidden: false` (or omit, since default) to all existing navigation items

This can be a Sanity CLI migration script or done manually in the Studio after deployment. Pre-populating `pages` is important — leaving them empty would cause the homepage to lose its page links until an admin fills them in.

## Files Affected

| File                                             | Change                                                          |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `sanity/schemas/navigation.ts`                   | Add `hidden` field to page items, add empty-category validation |
| `sanity/schemas/homepageFeatured.ts`             | New singleton schema                                            |
| `sanity/schemas/category.ts`                     | Add `required()` validation to `heroImage`                      |
| `sanity/schemas/index.ts`                        | Register `homepageFeatured` schema                              |
| `sanity/structure.ts`                            | Add `homepageFeatured` singleton to admin section               |
| `sanity.config.ts`                               | Add `homepageFeatured` to `newDocumentOptions` filter           |
| `lib/sanity/queries.ts`                          | Add `homepageFeatured` to composite query                       |
| `lib/types.ts`                                   | Add `hidden` to nav item type, add `HomepageFeatured` type      |
| `lib/data.ts`                                    | Filter hidden nav items, add `getHomepageFeatured` helper       |
| `components/templates/HomepageTemplateAbout.tsx` | Consume featured data instead of filtering by hero image        |
| `e2e/homepage.spec.ts`                           | Update program card assertions if needed                        |

## Out of Scope (Wave 2)

- Custom Sanity Studio plugin for drag-and-drop navigation management
- Visual slot assignment UI for homepage featured
- Toggle switches and polished editing interface
- Updating Studio preview/editor components (`HomepagePreview.tsx`, `ProgramCardsSection.tsx`, `HomepageEditor.tsx`) — these will be replaced by the Wave 2 plugin
- Removing `HomepageTemplateAlt.tsx` (inactive template that uses the old heroImage filter pattern)
