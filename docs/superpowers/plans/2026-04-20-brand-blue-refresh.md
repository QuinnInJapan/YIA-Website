# Brand Blue Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift the site's brand color from dark navy to electric blue (`#0022EE`) matching the favicon, and replace dark near-black photo overlays with blue-tinted equivalents.

**Architecture:** All changes are in `app/globals.css`. Components reference CSS custom properties, so token changes propagate everywhere without touching component files. No JavaScript, no schema changes.

**Tech Stack:** CSS custom properties, Next.js dev server (`npm run dev`)

---

## Files

- Modify: `app/globals.css:78-80` — navy color tokens
- Modify: `app/globals.css:90-93` — tint-blue, hero-overlay, link tokens
- Modify: `app/globals.css:103` — info-border token
- Modify: `app/globals.css:275-280` — subpage hero overlay gradient
- Modify: `app/globals.css:2545-2549` — homepage hero overlay gradient

---

### Task 1: Update brand color tokens

**Files:**

- Modify: `app/globals.css:78-80, 90-93, 103`

- [ ] **Step 1: Edit the `:root` color tokens in `globals.css`**

Make these exact replacements in the `:root` block (lines 78–103):

```css
/* Before → After */
--color-navy: #1e3a5f;           →  --color-navy: #0022EE;
--color-navy-dark: #132845;      →  --color-navy-dark: #0011AA;
--color-navy-light: #2d5a8a;     →  --color-navy-light: #3355FF;
--color-tint-blue: #eef2f7;      →  --color-tint-blue: #eeeeff;
--color-hero-overlay: rgba(15, 25, 50, 0.55);  →  --color-hero-overlay: rgba(0, 25, 180, 0.44);
--color-link: #1e4a7a;           →  --color-link: #0022CC;
--color-link-hover: #153660;     →  --color-link-hover: #0011AA;
--color-info-border: #1e3a5f;    →  --color-info-border: #0022EE;
```

The `:root` block after the change (lines 76–103 region) should look like:

```css
--color-bg: #f7f9fb;
--color-surface: #fcfdfe;
--color-navy: #0022ee;
--color-navy-dark: #0011aa;
--color-navy-light: #3355ff;
--color-white: #ffffff;
--color-silver: #9aa8b8;
--color-gray-light: #eef1f5;
--color-gray-mid: #d0d8e0;
--color-border: #d0d8e0;
--color-text: #111820;
--color-text-muted: #2a3a4a;
--color-text-faint: #4a5a6a;
--color-tint: #edf1f5;
--color-tint-blue: #eeeeff;
--color-hero-overlay: rgba(0, 25, 180, 0.44);
--color-link: #0022cc;
--color-link-hover: #0011aa;
--color-accent: #cc5533;
--color-accent-pink: #cc5533;
/* ... rest unchanged ... */
--color-info-border: #0022ee;
```

- [ ] **Step 2: Verify visually in dev server**

Make sure `npm run dev` is running (`http://localhost:3000`). Check:

- Navbar background is now vivid electric blue (not dark navy)
- Footer background is vivid electric blue
- Section headers with `.section-header--navy` are electric blue
- Links on white background are blue (not dark navy) — check any inner page
- Focus outlines (Tab key) are electric blue

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: shift brand color tokens from navy to electric blue (#0022EE)"
```

---

### Task 2: Update homepage hero overlay

**Files:**

- Modify: `app/globals.css:2540-2550` (`.hero-viewport::before`)

- [ ] **Step 1: Replace the radial gradient in `.hero-viewport::before`**

Find this block (around line 2540):

```css
.hero-viewport::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    ellipse at center,
    rgba(15, 25, 50, 0.45) 0%,
    rgba(15, 25, 50, 0.7) 100%
  );
}
```

Replace the `background` value only:

```css
.hero-viewport::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 25, 180, 0.3) 0%,
    rgba(0, 15, 140, 0.58) 100%
  );
}
```

- [ ] **Step 2: Verify visually**

On `http://localhost:3000` (homepage):

- Hero photo shows through more clearly — less darkness, more photo
- Overlay has a blue tint (subtle) rather than near-black
- White text (org name, tagline) remains clearly readable against the photo + overlay
- No obvious contrast failure (text should have solid separation from background)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: relax homepage hero overlay — blue-tinted, reduced opacity"
```

---

### Task 3: Update subpage hero overlay

**Files:**

- Modify: `app/globals.css:270-281` (`.page-hero::before`)

- [ ] **Step 1: Replace the linear gradient in `.page-hero::before`**

Find this block (around line 270):

```css
.page-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(10, 20, 40, 0.78) 0%,
    rgba(15, 25, 50, 0.5) 50%,
    rgba(15, 25, 50, 0.4) 100%
  );
}
```

Replace the `background` value only:

```css
.page-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(0, 15, 140, 0.65) 0%,
    rgba(0, 25, 180, 0.35) 50%,
    rgba(0, 20, 160, 0.25) 100%
  );
}
```

- [ ] **Step 2: Verify visually**

Navigate to any subpage with a hero photo (e.g., an About or Activities page):

- Bottom of the hero is darker (blue-tinted), fading to lighter at top
- White title and subtitle text remain clearly readable
- Overlay tint matches the new electric blue brand color (subtle blue cast)
- `.page-hero--solid` banners (no photo) are unaffected — they use a CSS gradient background directly and the `::before` is `display: none` for that variant

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: update subpage hero overlay to blue-tinted gradient"
```
