# Design System — YIA Website

## Spacing

Base unit: **4px**

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 56px |
| `--spacing-3xl` | 48px |
| `--spacing-4xl` | 64px |

Raw 1-3px values are acceptable for fine-tuning (borders, micro-adjustments).
6px and 12px are intentional half-steps for tight layouts — no token needed.

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, inputs, tags |
| `--radius-md` | 6px | Cards, callouts, media |
| `--radius-lg` | 8px | Elevated cards, modals |
| `50%` | — | Circles (avatars) |
| `999px` | — | Pill shapes |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.1)` | Subtle elevation (maps, images) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.35)` | Modals, lightboxes |

Multi-layer and context-specific shadows stay inline.

## Depth Strategy

**Borders-first.** Use `1px solid var(--color-border)` for structural separation.
Shadows only for true elevation (cards, overlays, floating elements).
Ratio: ~4:1 borders to shadows.

## Colors

Navy palette with warm accent.

### Core
| Token | Value | Usage |
|-------|-------|-------|
| `--color-navy` | #1e3a5f | Primary brand, headings, buttons |
| `--color-navy-dark` | #132845 | Dark backgrounds |
| `--color-navy-light` | #2d5a8a | Secondary navy |
| `--color-accent` | #cc5533 | Warm accent, warnings |
| `--color-secondary` | #855f07 | Amber secondary |

### Surface
| Token | Value |
|-------|-------|
| `--color-bg` | #f7f9fb |
| `--color-surface` | #fcfdfe |
| `--color-tint` | #edf1f5 |
| `--color-tint-blue` | #eef2f7 |
| `--color-gray-light` | #eef1f5 |
| `--color-gray-mid` | #d0d8e0 |
| `--color-border` | #d0d8e0 |

### Text
| Token | Value |
|-------|-------|
| `--color-text` | #1a2030 |
| `--color-text-muted` | #3d4f5f |
| `--color-text-secondary` | #405060 |
| `--color-text-faint` | #4a5565 |

Use `var(--color-white)` instead of raw `#fff`.

## Typography

### Font Size Scale
| Token | Value |
|-------|-------|
| `--font-size-xs` | 13px |
| `--font-size-sm` | 14px |
| `--font-size-base` | 15px |
| `--font-size-lg` | 18px |
| `--font-size-xl` | 22px |
| `--font-size-xxl` | 26px |

Headings use `clamp()` for fluid sizing. Raw pixel font-sizes only in one-off contexts.

### Font Weights
| Weight | Usage |
|--------|-------|
| 400 | Body text, secondary |
| 500 | Buttons, emphasis |
| 600 | Labels, navigation, subheadings |
| 700 | Headings, bold |

### Line Heights
- `1.7` — Body text (default)
- `1.4` — Headings
- `1.3` — Tight headings / hero
- `1.8` — Blog body (relaxed reading)

## Layout

### Container
| Token | Value |
|-------|-------|
| `--max-width` | 1100px |
| `--container-max` | calc(max-width + 2 * site-gutter) |
| `--content-width` | 720px (reading width) |
| `--section-width` | 900px |
| `--site-gutter` | var(--spacing-lg) = 24px |

### Touch Target
`--touch-target: 44px` — Minimum interactive element size (WCAG).

## Breakpoints

| Width | Usage |
|-------|-------|
| 1100px | Blog TOC sidebar (min-width) |
| 960px | Blog grid 3→2 columns |
| 768px | Primary tablet/mobile |
| 600px | Blog mobile adjustments |
| 480px | Small mobile refinements |

Mobile-first exceptions only for TOC (min-width: 1100px). Everything else is max-width (desktop-first).

## Patterns

### Buttons
- Padding: `var(--spacing-sm) var(--spacing-xl)` (8px 32px)
- Border-radius: `var(--radius-sm)` (4px)
- Font-weight: 500
- Primary: `background: var(--color-navy)`, white text
- Outline: `border: 2px solid var(--color-navy)`, transparent bg
- Pill (FAB): `border-radius: 24px+`

### Cards
Two strategies:
1. **Shadow-elevated** (blog cards): `var(--radius-lg)`, `box-shadow`, no border
2. **Border-outlined** (resource boxes): `var(--radius-sm)`, `1px solid var(--color-border)`, no shadow

Body padding: `var(--spacing-md)` to `var(--spacing-lg)`.

### Section Spacing
- Desktop: `var(--spacing-4xl)` (64px) vertical padding
- Mobile: `var(--spacing-3xl)` (48px) vertical padding
- Horizontal: `var(--site-gutter)` (24px) always

## Transitions

- `0.15s` — Subtle (color, border-color)
- `0.2s` — Standard (background, transform, opacity)
- `0.3s–0.5s` — Dramatic (slide, fade-in)
- Always respect `prefers-reduced-motion: reduce`
