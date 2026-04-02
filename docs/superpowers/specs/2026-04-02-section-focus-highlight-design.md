# Section Focus Highlight — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Overview

When a user focuses on any input within a section in the Studio editor, the corresponding section in the preview pane receives a CSS outline highlight. This gives users a live spatial connection between what they're editing and where it appears in the rendered output.

## Scope

- **Tools covered:** HomepageTool and UnifiedPagesTool
- **Granularity:** Section level only (not field level)
- **Visual style:** `outline: 2px solid var(--card-focus-ring-color)` with `border-radius: 2px`
- **Out of scope:** Field-level highlighting, other tools (blog, announcements)

## Architecture

### FocusContext

New file: `sanity/components/shared/FocusContext.tsx`

```ts
interface FocusContextValue {
  focusedSection: string | null;
  setFocus: (sectionId: string) => void;
  clearFocus: () => void;
}
```

- `FocusProvider` wraps tool-level components
- Internal debounce (50ms) on `clearFocus` — a pending clear timer is stored in a `useRef`. **`setFocus` always cancels any pending timer before setting the new section**, so moving focus between sections (or within a section) never produces a flicker.
- `useFocusContext()` hook for consumer components

**Provided at:** `HomepageTool.tsx` and `UnifiedPagesTool.tsx`

The preview is rendered via a React portal into an iframe (CSS isolation technique). Because it stays in the same React tree, the context is accessible in preview components without any `postMessage` bridge.

### Editor Side — Setting Focus

Focus is captured at the **section wrapper level** using React's capture-phase event handlers (`onFocusCapture` / `onBlurCapture`). This catches all child input focus/blur events without modifying individual field components.

**HomepageTool:** Each section component (`HeroSection.tsx`, `AboutSection.tsx`, `ActivityGridSection.tsx`, `ProgramCardsSection.tsx`, `SettingsSection.tsx`) wraps its content in a div:

```tsx
const { setFocus, clearFocus } = useFocusContext()
<div onFocusCapture={() => setFocus("hero")} onBlurCapture={clearFocus}>
  {/* existing content */}
</div>
```

Section identifiers (string constants): `"hero"`, `"about"`, `"activityGrid"`, `"programCards"`, `"settings"`

**UnifiedPagesTool:** `SectionEditor.tsx` already dispatches per section and has access to each section's `_key`. It attaches the same handlers using `section._key` as the identifier:

```tsx
<div onFocusCapture={() => setFocus(section._key)} onBlurCapture={clearFocus}>
  {/* existing section editor content */}
</div>
```

### Preview Side — Applying the Outline

**HomepagePreview.tsx:** Each top-level section block is wrapped in a div with a `data-studio-section` attribute. Outline applied inline when focused:

```tsx
const { focusedSection } = useFocusContext()

<div
  data-studio-section="hero"
  style={focusedSection === "hero"
    ? { outline: "2px solid var(--card-focus-ring-color)", borderRadius: "2px" }
    : undefined}
>
  {/* hero content */}
</div>
```

Sections to wrap: only the sections that have a corresponding editor section — `"hero"`, `"about"`, `"activityGrid"`, `"programCards"`, `"settings"`. The announcements band and footer render in the preview but have no editor section wrappers, so they are not wrapped.

**PagePreview.tsx:** Sections are rendered via `renderSections()`. If it returns a per-section array, wrap each element directly. If it returns a single root node, switch to iterating `sections` and calling a single-section render helper per item. The implementor should verify the actual return shape of `renderSections()` before writing this code. Each wrapper is keyed by `section._key`:

```tsx
{
  sections.map((section) => (
    <div
      key={section._key}
      data-studio-section={section._key}
      style={
        focusedSection === section._key
          ? { outline: "2px solid var(--card-focus-ring-color)", borderRadius: "2px" }
          : undefined
      }
    >
      {renderSection(section)}
    </div>
  ));
}
```

The `_key` is the shared identifier on both sides — `SectionEditor.tsx` calls `setFocus(section._key)` and `PagePreview.tsx` wraps with `data-studio-section={section._key}`.

## Data Flow

```
User focuses input
  → onFocusCapture on section wrapper fires
  → setFocus(sectionId) updates FocusContext
  → Preview consumes focusedSection from same context
  → Matching section wrapper applies outline style
  → Outline renders in iframe preview

User moves focus to another input in same section
  → onBlurCapture fires, schedules clearFocus (50ms)
  → onFocusCapture fires, calls setFocus again, cancels pending clear
  → No flicker

User moves focus from one section directly to another
  → onBlurCapture on old section fires, schedules clearFocus (50ms)
  → onFocusCapture on new section fires, setFocus cancels pending clear, sets new section
  → Outline transitions immediately from old to new section, no flicker

User moves focus outside section or blurs entirely
  → onBlurCapture fires, clearFocus runs after 50ms
  → focusedSection → null, outline removed
```

## Files Changed

| File                                                 | Change                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `sanity/components/shared/FocusContext.tsx`          | **New** — context, provider, hook                                        |
| `sanity/components/HomepageTool.tsx`                 | Wrap with `<FocusProvider>`                                              |
| `sanity/components/UnifiedPagesTool.tsx`             | Wrap with `<FocusProvider>`                                              |
| `sanity/components/homepage/HeroSection.tsx`         | Add focus capture wrapper                                                |
| `sanity/components/homepage/AboutSection.tsx`        | Add focus capture wrapper                                                |
| `sanity/components/homepage/ActivityGridSection.tsx` | Add focus capture wrapper                                                |
| `sanity/components/homepage/ProgramCardsSection.tsx` | Add focus capture wrapper                                                |
| `sanity/components/homepage/SettingsSection.tsx`     | Add focus capture wrapper                                                |
| `sanity/components/pages/SectionEditor.tsx`          | Add focus capture wrapper using `section._key`                           |
| `sanity/components/homepage/HomepagePreview.tsx`     | Wrap sections with `data-studio-section`, apply outline, add scroll refs |
| `sanity/components/pages/PagePreview.tsx`            | Wrap sections with `data-studio-section`, apply outline, add scroll refs |

## Auto-Scroll in Preview

When `focusedSection` changes, the preview smoothly scrolls the focused section into view.

**Mechanism:** Each section wrapper in the preview holds a ref. A `useEffect` watches `focusedSection` and calls `ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })` on the matching section element.

Since `scrollIntoView` is called on the element itself (not via `document.querySelector`), it works correctly regardless of the portal/iframe context — the scroll happens within the iframe's scroll container.

**HomepagePreview.tsx:** A single `useRef<Map<string, HTMLDivElement>>` holds refs for all sections, populated via callback refs:

```tsx
const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

useEffect(() => {
  if (focusedSection) {
    sectionRefs.current.get(focusedSection)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}, [focusedSection])

// On each section wrapper:
ref={(el) => { if (el) sectionRefs.current.set("hero", el) }}
```

**PagePreview.tsx:** Same pattern, keyed by `section._key`.

**Scroll guard:** Auto-scroll only triggers when the user explicitly focuses an input (i.e., `focusedSection` transitions from `null` → a value, or from one section to another). It does not fire when `focusedSection` clears to `null` (user blurs without focusing elsewhere).

## Non-Goals

- Field-level highlighting (deferred — requires annotating production renderer or duplicating it)
- Highlight persistence across panel switches
