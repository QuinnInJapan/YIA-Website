# Brand Blue Refresh

**Date:** 2026-04-20
**Status:** Approved

## Problem

Stakeholders want the site to feel brighter. Current brand color is a dark navy (`#1e3a5f`) that reads heavy. The new favicon uses near-pure electric blue (`#0022EE`). Homepage hero overlay compounds the darkness with a dense near-black vignette.

## Scope

Single file: `app/globals.css`. All components reference CSS custom properties, so no component changes are needed.

## Color Token Changes

All changes in the `:root` block of `globals.css`:

| Token                  | Old                   | New                   |
| ---------------------- | --------------------- | --------------------- |
| `--color-navy`         | `#1e3a5f`             | `#0022EE`             |
| `--color-navy-dark`    | `#132845`             | `#0011AA`             |
| `--color-navy-light`   | `#2d5a8a`             | `#3355FF`             |
| `--color-link`         | `#1e4a7a`             | `#0022CC`             |
| `--color-link-hover`   | `#153660`             | `#0011AA`             |
| `--color-hero-overlay` | `rgba(15,25,50,0.55)` | `rgba(0,25,180,0.44)` |
| `--color-tint-blue`    | `#eef2f7`             | `#eeeeff`             |
| `--color-info-border`  | `#1e3a5f`             | `#0022EE`             |

### Rationale

- `#0022EE` matches the favicon's dominant color (sampled: `#0000FF` core, `#2223ef` average with anti-aliasing)
- `#0011AA` dark variant maintains gradient depth at lower lightness
- `#3355FF` light variant sits ~15% lighter than primary in perceptual terms
- Link colors use slightly desaturated variants (`#0022CC`, `#0011AA`) to avoid full pure-blue on body text
- `--color-tint-blue` shifts from gray-blue to a near-white blue-tinted tint compatible with the new primary

## Homepage Hero Overlay Change

`.hero-viewport::before` in `globals.css`:

**Old:**

```css
background: radial-gradient(
  ellipse at center,
  rgba(15, 25, 50, 0.45) 0%,
  rgba(15, 25, 50, 0.7) 100%
);
```

**New:**

```css
background: radial-gradient(
  ellipse at center,
  rgba(0, 25, 180, 0.3) 0%,
  rgba(0, 15, 140, 0.58) 100%
);
```

The overlay color shifts from near-black navy to brand blue. Opacity reduced (0.45→0.30 center, 0.70→0.58 edge). Photo breathes more while text contrast is preserved — white text on `rgba(0,15,140,0.58)` over a typical outdoor photo exceeds WCAG AA.

## Subpage Hero Overlay Change

`.page-hero::before` in `globals.css`:

**Old:**

```css
background: linear-gradient(
  to top,
  rgba(10, 20, 40, 0.78) 0%,
  rgba(15, 25, 50, 0.5) 50%,
  rgba(15, 25, 50, 0.4) 100%
);
```

**New:**

```css
background: linear-gradient(
  to top,
  rgba(0, 15, 140, 0.65) 0%,
  rgba(0, 25, 180, 0.35) 50%,
  rgba(0, 20, 160, 0.25) 100%
);
```

Same bottom-weighted direction (text sits near the bottom of subpage heroes). Color shifts from near-black to brand blue. Opacity slightly relaxed at bottom (0.78→0.65) while still preserving white text contrast.

## Out of Scope

- Text colors (`--color-text`, `--color-text-muted`, `--color-text-faint`) — neutral grays, unaffected
- Accent/secondary colors — unrelated to the brightness concern
