# Blog Feature — Requirements

## 1. Overview

Add a blog section to the YIA website where staff can publish articles about events, community stories, cultural topics, and organizational updates. The blog sits alongside the existing content categories in the top navbar and follows the same bilingual (ja/en/easy) patterns used throughout the site.

---

## 2. Navigation & Routing

### 2.1 Navbar Placement

- Add a **ブログ / Blog** link to the top navbar, positioned after the existing category dropdowns.
- Unlike the category dropdowns (which expand to show sub-pages), the blog link is a **direct link** to `/blog` — no dropdown needed since blog posts are discovered via the listing page, not navigated by sub-category.
- On mobile, it appears as a single link in the drawer (no accordion expansion).

### 2.2 URL Structure

| Route | Description |
|---|---|
| `/blog` | Blog index — paginated list of all posts (newest first) |
| `/blog/[slug]` | Individual blog post |

### 2.3 Implementation Notes

- Create route files at `app/(site)/blog/page.tsx` and `app/(site)/blog/[slug]/page.tsx`.
- The blog link in the nav can be hardcoded in `SiteNav.tsx` (similar to the HOME link), since it is not a Sanity-managed category with sub-pages. Alternatively, it could be added as a navigation singleton — team preference.

---

## 3. Sanity Schema — `blogPost` Document Type

### 3.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `internationalizedArrayString` | Yes | Post title (ja/en/easy) |
| `slug` | `slug` | Yes | URL slug, auto-generated from Japanese title |
| `author` | `string` | No | Author name (plain string, no reference — keeps it simple) |
| `publishedAt` | `datetime` | Yes | Publication date/time, defaults to now |
| `category` | `string` with list options | No | Blog category tag — e.g. `event-report`, `culture`, `community`, `news`. Displayed as a label on the card/post. |
| `heroImage` | `image` (with hotspot) | No | Main image shown at the top of the post and on the listing card |
| `heroImageAlt` | `internationalizedArrayString` | No | Alt text for the hero image |
| `excerpt` | `internationalizedArrayString` | No | Short summary for listing cards and meta description. If omitted, auto-truncate from body. |
| `body` | `internationalizedArrayBlockContent` (extended — see §5) | Yes | The main post content in portable text |
| `relatedPosts` | `array` of references to `blogPost` | No | Hand-picked related posts shown at the bottom |
| `documents` | `array` of `documentLink` | No | Attached PDFs/links (reuses existing `documentLink` object type) |

### 3.2 Preview Configuration

```
preview: {
  select: { title: "title", date: "publishedAt", image: "heroImage" },
  prepare: ({ title, date, image }) => ({
    title: title?.find(t => t._key === "ja")?.value || "Untitled",
    subtitle: date ? new Date(date).toLocaleDateString("ja-JP") : "下書き",
    media: image,
  }),
}
```

### 3.3 Orderings

- Default: `publishedAt desc` (newest first)
- Secondary: `title asc` (alphabetical)

---

## 4. Sanity Studio — Content Editor Experience

### 4.1 Structure Sidebar

Add a **ブログ** section to the Sanity Studio structure (`sanity/structure.ts`):

```
S.listItem()
  .id("blog")
  .title("ブログ")
  .icon(BookIcon)  // or a new ComposeIcon
  .child(
    S.documentList()
      .title("ブログ記事")
      .schemaType("blogPost")
      .filter('_type == "blogPost"')
      .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
  )
```

Place it after "お知らせ" and before the page category groups — blog posts will be a frequently-used content type.

### 4.2 Workflow

- Editors create a new `blogPost` document, fill in title + body + optional fields.
- The slug auto-generates from the Japanese title (editable if needed).
- `publishedAt` defaults to the current date/time.
- The post appears on the site immediately upon publishing (no draft/scheduled system needed initially — Sanity's native draft mode handles this).

### 4.3 Prevent Accidental Creation from "New Document" Menu

Add `"blogPost"` to the `newDocumentOptions` filter in `sanity.config.ts` if we want blog posts to only be created from the ブログ section. Otherwise, leave it accessible from the global "+" button.

---

## 5. Extended Portable Text for Blog Body

The current `internationalizedArrayBlockContent` supports: paragraphs, h2/h3/h4, bold, italic, links, bullet/number lists, and inline images. For blog posts, extend this with additional block types to make posts more flexible and engaging.

### 5.1 New Block Types to Add

These are added to the `blockContent` field definition in `sanity.config.ts` (the `internationalizedArray` plugin config):

#### a) Callout / Info Box
A styled block for tips, warnings, or highlighted information.

```
{
  type: "object",
  name: "callout",
  title: "コールアウト",
  fields: [
    { name: "tone", type: "string", options: { list: ["info", "warning", "tip"] }, initialValue: "info" },
    { name: "body", type: "text", title: "内容" },
  ],
  preview: {
    select: { tone: "tone", body: "body" },
    prepare: ({ tone, body }) => ({ title: `${tone}: ${body?.slice(0, 50)}...` }),
  },
}
```

**Rendering**: Styled box with an icon and background color based on tone. Reuse the existing `Callout` component pattern from `components/Callout.tsx`.

#### b) YouTube Embed
Embed a YouTube video by URL.

```
{
  type: "object",
  name: "youtube",
  title: "YouTube動画",
  fields: [
    { name: "url", type: "url", title: "YouTube URL" },
    { name: "caption", type: "string", title: "キャプション" },
  ],
}
```

**Rendering**: Responsive 16:9 iframe embed. Extract the video ID from the URL.

#### c) Image Gallery
An inline gallery block within the post body (distinct from the page-level `gallery` section).

```
{
  type: "object",
  name: "inlineGallery",
  title: "ギャラリー",
  fields: [
    {
      name: "images",
      type: "array",
      of: [{ type: "imageFile" }],  // reuses existing imageFile object type
    },
  ],
}
```

**Rendering**: Reuse the existing `PhotoGallery` component with lightbox support.

### 5.2 New Mark Annotations (Optional, Lower Priority)

- **Highlight**: A `<mark>` annotation for emphasizing key phrases with a yellow background.

### 5.3 Portable Text Component Updates

Update `/lib/portable-text.tsx` to handle the new block types:

```typescript
export const blogPtComponents: PortableTextComponents = {
  ...ptComponents,
  types: {
    ...ptComponents.types,
    callout: ({ value }) => <Callout tone={value.tone} body={value.body} />,
    youtube: ({ value }) => <YouTubeEmbed url={value.url} caption={value.caption} />,
    inlineGallery: ({ value }) => <PhotoGallery images={value.images} />,
  },
};
```

---

## 6. Frontend — Blog Index Page (`/blog`)

### 6.1 Layout

- **Hero**: Solid-color hero (reuse `SolidHero`) with title "ブログ / Blog".
- **Post Grid/List**: Cards arranged in a responsive grid.
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column (stacked cards)

### 6.2 Blog Card Design

Each card shows:

```
┌──────────────────────────┐
│ [Hero Image]             │
│                          │
├──────────────────────────┤
│ カテゴリー  ·  2025.03.01│
│                          │
│ 記事タイトル              │
│ Article Title             │
│                          │
│ Excerpt text goes here...│
└──────────────────────────┘
```

- **Image**: Hero image with aspect ratio ~16:10, object-fit cover. Fallback to a solid color if no image.
- **Category badge**: Small colored label (maps category slug to a display name).
- **Date**: Formatted with `formatDateDot()` (reuse existing utility).
- **Title**: Japanese title, with English subtitle below in lighter text.
- **Excerpt**: 2-3 lines, truncated with ellipsis.

### 6.3 Pagination

- Start with simple "load more" or page-based pagination (10 posts per page).
- Use query params: `/blog?page=2`.

### 6.4 Reusable Components

| Need | Existing Component | Reuse? |
|---|---|---|
| Page layout wrapper | `PageLayout` | Yes |
| Hero section | `SolidHero` | Yes |
| Date formatting | `formatDateDot()` | Yes |
| Image rendering | `LazyImage` | Yes |
| Bilingual text | `ja()`, `en()` helpers | Yes |
| **New** | `BlogCard` | Create new |
| **New** | `BlogGrid` | Create new (thin wrapper) |

---

## 7. Frontend — Blog Post Page (`/blog/[slug]`)

### 7.1 Layout

```
┌─────────────────────────────────────────┐
│ Hero Image (full-width, with overlay)   │
│                                         │
│   カテゴリー                             │
│   記事タイトル                            │
│   Article Title                         │
│   2025年3月1日  ·  著者名                │
└─────────────────────────────────────────┘

┌───────────────────────────┬─────────────┐
│                           │ Sidebar TOC │
│  Blog body content        │  (auto from │
│  (portable text)          │   headings) │
│                           │             │
│  [Callout box]            │             │
│                           │             │
│  [YouTube embed]          │             │
│                           │             │
│  [Inline gallery]         │             │
│                           │             │
│  Attached documents       │             │
│                           │             │
├───────────────────────────┤             │
│  Related Posts             │             │
│  [Card] [Card] [Card]    │             │
└───────────────────────────┴─────────────┘
```

### 7.2 Components Breakdown

| Component | Source | Notes |
|---|---|---|
| Hero with image | **New**: `BlogPostHero` | Full-width image with gradient overlay, title, meta |
| Body content | `BilingualPortableText` + `blogPtComponents` | Extended portable text |
| Sidebar TOC | `SidebarToc` | Reuse — auto-extract headings from portable text |
| Document list | `DocList` | Reuse for attached PDFs |
| Related posts | `BlogCard` grid | Reuse the same card from the index |
| Page wrapper | `PageLayout` | Reuse |

### 7.3 Meta & SEO

- `<title>`: `{ja(post.title)} | ブログ | 横須賀国際交流協会`
- `<meta description>`: Excerpt or auto-truncated body
- Open Graph image: Hero image

---

## 8. Data Fetching

### 8.1 New Queries (`lib/sanity/queries.ts`)

```typescript
// All published blog posts (for index page)
export async function fetchBlogPosts(page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const { data } = await sanityFetch({
    query: `*[_type == "blogPost"] | order(publishedAt desc) [$start...$end] {
      ...,
      "slug": slug.current
    }`,
    params: { start, end },
  });
  return data;
}

// Single blog post by slug
export async function fetchBlogPostBySlug(slug: string) {
  const { data } = await sanityFetch({
    query: `*[_type == "blogPost" && slug.current == $slug][0] {
      ...,
      relatedPosts[]-> { ..., "slug": slug.current }
    }`,
    params: { slug },
  });
  return data;
}

// Total count for pagination
export async function fetchBlogPostCount() {
  const { data } = await sanityFetch({
    query: `count(*[_type == "blogPost"])`,
  });
  return data;
}
```

### 8.2 Integration with Site Data

Blog posts are fetched **independently** from the main `fetchSiteData()` call — they don't need to be bundled with the rest of the site data since they're only used on `/blog` routes. This keeps the main data payload lean.

---

## 9. TypeScript Types (`lib/types.ts`)

```typescript
export interface BlogPost {
  _type: "blogPost";
  _id: string;
  title: I18nString;
  slug: string;
  author?: string;
  publishedAt: string;
  category?: "event-report" | "culture" | "community" | "news";
  heroImage?: SanityImage;
  heroImageAlt?: I18nString;
  excerpt?: I18nString;
  body: I18nBlocks;
  relatedPosts?: BlogPost[];
  documents?: Document[];
}
```

---

## 10. Styling

### 10.1 Approach

Follow the existing pattern: plain CSS in `globals.css` using BEM-style class names and CSS custom properties. No CSS modules or Tailwind.

### 10.2 New CSS Classes

- `.blog-grid` — responsive card grid
- `.blog-card`, `.blog-card__image`, `.blog-card__meta`, `.blog-card__title`, `.blog-card__excerpt` — card styles
- `.blog-card__category` — category badge (small pill/tag)
- `.blog-post` — single post wrapper
- `.blog-post__hero` — full-width hero image with overlay
- `.blog-post__meta` — date + author line
- `.blog-post__body` — portable text body content
- `.blog-post__related` — related posts section
- `.pt-callout`, `.pt-callout--info`, `.pt-callout--warning`, `.pt-callout--tip` — callout block styles
- `.pt-youtube` — responsive YouTube embed wrapper
- `.blog-pagination` — pagination controls

### 10.3 Category Badge Colors

| Category | Japanese Label | Color |
|---|---|---|
| `event-report` | イベントレポート | `--color-navy` |
| `culture` | 文化 | `--color-accent` |
| `community` | コミュニティ | `--color-secondary` |
| `news` | お知らせ | `--color-navy-light` |

---

## 11. What We Reuse vs. What's New

### Reused (No Changes Needed)

- `PageLayout` — page structure with sidebar slot
- `SolidHero` — solid-color hero for the index page
- `SidebarToc` — table of contents from headings
- `BilingualPortableText` — bilingual portable text rendering
- `DocList` — PDF/link attachments
- `LazyImage` — image component with fade-in
- `formatDateDot()` — date formatting
- `ja()`, `en()`, `easy()` — i18n helpers
- `imageUrl()` / `urlFor()` — Sanity image URL builder
- `documentLink` object type — for attached files
- `imageFile` object type — for gallery images
- `PhotoGallery` — for inline gallery blocks

### New Components

| Component | Purpose |
|---|---|
| `BlogCard` | Post preview card for index/related sections |
| `BlogGrid` | Responsive grid wrapper for cards |
| `BlogPostHero` | Full-width hero image with title overlay |
| `YouTubeEmbed` | Responsive YouTube iframe |

### New Sanity Schema

| File | Purpose |
|---|---|
| `sanity/schemas/blogPost.ts` | Blog post document type |

### Modified Files

| File | Change |
|---|---|
| `sanity/schemas/index.ts` | Register `blogPost` schema |
| `sanity/structure.ts` | Add ブログ section to sidebar |
| `sanity.config.ts` | Add callout, youtube, inlineGallery to blockContent; optionally update `newDocumentOptions` |
| `lib/sanity/queries.ts` | Add blog fetch functions |
| `lib/types.ts` | Add `BlogPost` interface |
| `lib/portable-text.tsx` | Add `blogPtComponents` with new block type renderers |
| `components/SiteNav.tsx` | Add ブログ link |
| `app/globals.css` | Add blog-related CSS |

---

## 12. Demo Implementation Scope

For the initial demo, implement:

1. **Sanity schema** for `blogPost` with all fields from §3.
2. **Extended portable text** with callout, YouTube, and inline gallery blocks.
3. **Blog index page** at `/blog` with card grid.
4. **Blog post page** at `/blog/[slug]` with full layout.
5. **Navbar link** added to both desktop and mobile nav.
6. **One demo blog post** created as seed data or a fixture, showcasing:
   - A hero image
   - Mixed body content (headings, paragraphs, a callout, an image)
   - Category tag
   - Excerpt
7. **CSS styles** for all new components.

### Out of Scope for Demo (Future Work)

- Blog post search/filtering by category
- RSS feed
- Social sharing buttons
- Comment system
- Scheduled publishing
- Author profiles with images
- Tag/category index pages
- "Easy Japanese" blog body variant (schema supports it, but UI not needed yet)
