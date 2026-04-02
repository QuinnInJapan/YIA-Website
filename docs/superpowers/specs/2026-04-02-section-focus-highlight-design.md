# Section Focus Highlight — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Overview

When a user focuses on any input within a section in the Studio editor, the corresponding region in the preview pane receives a CSS outline highlight. Ancestor regions are highlighted softly; the directly focused region is highlighted strongly. The preview auto-scrolls to the focused region.

This is implemented via a `StudioRegion` component that wraps existing elements in the preview. In production it is fully inert — no extra DOM nodes, no style changes, no behavior.

## Scope

- **Tools covered:** HomepageTool and UnifiedPagesTool
- **Initial granularity:** Section level (field-level wiring on the editor side is future work; the architecture supports it without changes)
- **Visual style:** `outline: 2px solid var(--card-focus-ring-color)` for direct focus; `outline: 1px dashed var(--card-focus-ring-color)` for ancestor focus
- **Out of scope:** Other tools (blog, announcements)

## Core Principle: Zero DOM Change in Production

`StudioRegion` uses a polymorphic `as` prop to render _as_ the existing element rather than wrapping it. The DOM structure is identical in production and studio — only the outline style differs in studio when focused.

```tsx
// Before
<section className="hero-viewport">...</section>
<div className="page-section" id="hero">...</div>

// After — identical DOM in production
<StudioRegion as="section" className="hero-viewport" studioId="hero">...</StudioRegion>
<StudioRegion as="div" className="page-section" id="hero" studioId="hero">...</StudioRegion>
```

## Architecture

### 1. Studio Context (`@/lib/studio-context.tsx`)

Defines the context interface and a null-default hook. Lives in `@/lib/` so `StudioRegion` can import it without pulling in any Sanity/studio dependencies into production code.

```ts
interface StudioContextValue {
  focusedId: string | null;
}

// Returns null when no provider is present (i.e., in production)
export function useStudioContext(): StudioContextValue | null;
```

`StudioRegion` only needs to read `focusedId`. `setFocus`/`clearFocus` are sanity-side concerns and live only on `FocusContext`.

Production never renders a provider, so `useStudioContext()` always returns null there.

### 2. StudioRegion (`@/lib/components/StudioRegion.tsx`)

Polymorphic component. Reads from `StudioContext` and a `ParentIdContext`. Composes its full dot-path from the tree automatically — callers only specify a local `studioId`.

**ID composition:**

```tsx
const parentId = useContext(ParentIdContext); // "" at root
const fullId = parentId ? `${parentId}.${studioId}` : studioId;
// Provides fullId as new ParentIdContext to children
```

**Focus matching:**

```tsx
const studio = useStudioContext();
const isDirectFocus = studio?.focusedId === fullId;
const isAncestorFocus = studio?.focusedId?.startsWith(fullId + ".") ?? false;
```

**Visual treatment:**

```tsx
const outlineStyle = isDirectFocus
  ? { outline: "2px solid var(--card-focus-ring-color)" }
  : isAncestorFocus
    ? { outline: "1px dashed var(--card-focus-ring-color)" }
    : undefined;
```

**Auto-scroll:** fires on direct focus only, not on ancestor focus or blur.

```tsx
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  if (isDirectFocus) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}, [isDirectFocus]);
```

**`studioId` is consumed internally and must not be forwarded to the DOM** — the implementation destructures it out before spreading remaining props onto the element, avoiding React unknown-prop warnings.

**In production:** `useStudioContext()` returns null → `isDirectFocus` and `isAncestorFocus` are both false → no outline, no scroll, no behavior. Renders as a plain `<Tag {...props} />`.

**Nesting example:**

```tsx
<StudioRegion as="section" studioId="hero">
  {" "}
  {/* fullId: "hero" */}
  <StudioRegion as="h1" studioId="title">
    {" "}
    {/* fullId: "hero.title" */}
    {heroTitle}
  </StudioRegion>
  <StudioRegion as="p" studioId="description">
    {" "}
    {/* fullId: "hero.description" */}
    {heroDescription}
  </StudioRegion>
</StudioRegion>
```

When `focusedId = "hero.title"`:

- `hero` → ancestor focus (soft dashed outline)
- `hero.title` → direct focus (strong solid outline)
- `hero.description` → no highlight

### 3. FocusContext (`sanity/components/shared/FocusContext.tsx`)

Lives in `sanity/` — never imported by production code. Manages focus state and provides it to `StudioContext`.

```ts
interface FocusContextValue {
  focusedId: string | null;
  setFocus: (id: string) => void;
  clearFocus: () => void;
}
```

- `setFocus` cancels any pending `clearFocus` timer before setting the new ID (prevents flicker when moving between inputs or sections)
- `clearFocus` is debounced 50ms — stored in a `useRef<ReturnType<typeof setTimeout>>`
- `FocusProvider` renders both a `FocusContext.Provider` and a `StudioContext.Provider` (from `@/lib/studio-context.tsx`) with the same values

**Provided at:** `HomepageTool.tsx` and `UnifiedPagesTool.tsx`

The preview renders via React portal into an iframe (CSS isolation technique). It stays in the same React tree, so context crosses the iframe boundary without any `postMessage`.

### 4. Editor Side — Setting Focus

Focus is captured at the **section wrapper level** using capture-phase event handlers (`onFocusCapture` / `onBlurCapture`). This catches all child input focus/blur events without modifying individual field components.

**HomepageTool** — each section component wraps its content:

```tsx
const { setFocus, clearFocus } = useFocusContext()
<div onFocusCapture={() => setFocus("hero")} onBlurCapture={clearFocus}>
  {/* existing section content */}
</div>
```

Section IDs (match preview `studioId`): `"hero"`, `"about"`, `"activityGrid"`, `"programCards"`, `"settings"`

**UnifiedPagesTool** — `SectionEditor.tsx` uses `section._key`:

```tsx
<div onFocusCapture={() => setFocus(section._key)} onBlurCapture={clearFocus}>
  {/* existing section editor */}
</div>
```

**Future field-level wiring:** individual field wrappers inside section editors call `setFocus("hero.title")` etc. The architecture supports this without any changes to `StudioRegion` or `FocusContext` — only the editor-side wrappers need adding.

### 5. Preview Side — Using StudioRegion

**`lib/section-renderer.tsx`** — the `flush()` function creates all `<div className="page-section">` wrappers for page sections. One change covers all 11+ section types:

```tsx
// Before
<div className="page-section" id={currentSectionId}>

// After
<StudioRegion as="div" className="page-section" id={currentSectionId} studioId={currentSectionId}>
```

`PagePreview.tsx` needs **no changes** — it renders `{groups}` from `renderSections()` and sections wrap themselves.

**`sanity/components/homepage/HomepagePreview.tsx`** — swap 5-6 existing `<section>` tags:

```tsx
// Before
<section className="hero-viewport">

// After
<StudioRegion as="section" className="hero-viewport" studioId="hero">
```

Sections to wrap: `"hero"`, `"about"`, `"activityGrid"`, `"programCards"`, `"settings"`. The announcements band and footer are not wrapped — they have no corresponding editor sections.

## Data Flow

```
User focuses input in HeroSection editor
  → onFocusCapture fires on hero wrapper div
  → setFocus("hero") — cancels any pending clear, sets focusedId = "hero"
  → StudioContext updates
  → StudioRegion with studioId "hero" → isDirectFocus = true → solid outline + scroll
  → All other StudioRegions → no highlight

User focuses title input (future field-level wiring)
  → setFocus("hero.title")
  → StudioRegion "hero" → isAncestorFocus = true → soft dashed outline
  → StudioRegion "hero.title" → isDirectFocus = true → solid outline + scroll
  → StudioRegion "hero.description" → no highlight

User moves focus between inputs in same section
  → onBlurCapture schedules clearFocus (50ms)
  → onFocusCapture fires, setFocus cancels pending clear
  → No flicker, no outline change

User moves focus from one section to another
  → onBlurCapture schedules clearFocus (50ms)
  → onFocusCapture on new section fires, setFocus cancels pending clear, sets new ID
  → Outline transitions immediately, no flicker

User blurs entirely
  → onBlurCapture fires, clearFocus runs after 50ms
  → focusedId → null, all outlines removed
```

## Files Changed

| File                                                 | Change                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `@/lib/studio-context.tsx`                           | **New** — null-default context + `useStudioContext()` hook            |
| `@/lib/components/StudioRegion.tsx`                  | **New** — polymorphic component, ID composition, outline + scroll     |
| `sanity/components/shared/FocusContext.tsx`          | **New** — focus state, debounced clear, provides to StudioContext     |
| `sanity/components/HomepageTool.tsx`                 | Wrap with `<FocusProvider>`                                           |
| `sanity/components/UnifiedPagesTool.tsx`             | Wrap with `<FocusProvider>`                                           |
| `sanity/components/homepage/HeroSection.tsx`         | Add focus capture wrapper                                             |
| `sanity/components/homepage/AboutSection.tsx`        | Add focus capture wrapper                                             |
| `sanity/components/homepage/ActivityGridSection.tsx` | Add focus capture wrapper                                             |
| `sanity/components/homepage/ProgramCardsSection.tsx` | Add focus capture wrapper                                             |
| `sanity/components/homepage/SettingsSection.tsx`     | Add focus capture wrapper                                             |
| `sanity/components/pages/SectionEditor.tsx`          | Add focus capture wrapper using `section._key`                        |
| `lib/section-renderer.tsx`                           | Swap `<div className="page-section">` in `flush()` → `<StudioRegion>` |
| `sanity/components/homepage/HomepagePreview.tsx`     | Swap 5-6 `<section>` tags → `<StudioRegion as="section">`             |

`PagePreview.tsx` — no changes needed.

## Non-Goals

- Field-level editor wiring in this iteration (architecture supports it, wiring is future work)
- Other tools (blog, announcements)
- Highlight persistence across panel switches
