# Studio Focus Highlight — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user focuses any input in the Studio editor, the corresponding section in the preview pane highlights with a CSS outline and auto-scrolls into view.

**Architecture:** A polymorphic `StudioRegion` component renders as any HTML element while being studio-aware. It reads a `StudioContext` (defined in `@/lib/`, null in production) and applies an outline when its `studioId` matches the focused ID. A `FocusContext` in `sanity/` manages focus state and feeds it to `StudioContext`. Editor section wrappers fire `setFocus(id)` on `onFocusCapture`.

**Tech Stack:** React 18 (hooks, context), TypeScript, Next.js App Router, Sanity Studio v3

> **Note:** This project has no unit test framework (only Playwright e2e). All verification is manual in the studio. Skip any step that mentions "run tests" — substitute manual verification as described.

---

## File Map

**New files:**

- `lib/studio-context.tsx` — `StudioContextValue` interface, `StudioContext`, `useStudioContext()` hook. Null default — inert in production.
- `lib/components/StudioRegion.tsx` — Polymorphic component. Renders as `as` prop element. Reads `StudioContext` + `ParentIdContext`. Composes dot-path IDs. Applies outline + scroll.
- `sanity/components/shared/FocusContext.tsx` — `FocusProvider` + `useFocusContext()`. Manages focus state with debounced clear. Provides to `StudioContext`.

**Modified files:**

- `sanity/components/HomepageTool.tsx` — wrap return with `<FocusProvider>`
- `sanity/components/UnifiedPagesTool.tsx` — wrap return with `<FocusProvider>`
- `sanity/components/homepage/HeroSection.tsx` — wrap `<SectionWrapper>` with focus capture div
- `sanity/components/homepage/AboutSection.tsx` — same
- `sanity/components/homepage/ActivityGridSection.tsx` — same
- `sanity/components/homepage/ProgramCardsSection.tsx` — same
- `sanity/components/homepage/SettingsSection.tsx` — same
- `sanity/components/pages/SectionEditor.tsx` — wrap outer div with focus capture div
- `lib/section-renderer.tsx` — swap `<div className="page-section">` in `flush()` → `<StudioRegion>`
- `sanity/components/homepage/HomepagePreview.tsx` — swap 5 `<section>` tags → `<StudioRegion as="section">`

---

## Task 1: Create feature branch

**Files:** none

- [ ] **Create and switch to feature branch**

```bash
git checkout -b feat/studio-focus-highlight
```

- [ ] **Verify you are on the new branch**

```bash
git branch --show-current
```

Expected output: `feat/studio-focus-highlight`

---

## Task 2: StudioContext

**Files:**

- Create: `lib/studio-context.tsx`

- [ ] **Create the file**

```tsx
// lib/studio-context.tsx
"use client";

import { createContext, useContext } from "react";

export interface StudioContextValue {
  focusedId: string | null;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudioContext(): StudioContextValue | null {
  return useContext(StudioContext);
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/studio-context.tsx`

- [ ] **Commit**

```bash
git add lib/studio-context.tsx
git commit -m "feat(studio): add StudioContext for cross-boundary focus state"
```

---

## Task 3: StudioRegion

**Files:**

- Create: `lib/components/StudioRegion.tsx`

`StudioRegion` is polymorphic — it renders as whatever element you pass via the `as` prop (defaults to `div`). It composes a dot-path ID from ancestor `ParentIdContext` values. It applies `outline` when focused and scrolls into view on direct focus. **It is fully inert in production** (no `StudioContext` provider = no outline, no scroll).

- [ ] **Create `lib/components/` directory and the file**

```bash
mkdir -p lib/components
```

```tsx
// lib/components/StudioRegion.tsx
"use client";

import { createContext, useContext, useRef, useEffect } from "react";
import type { ElementType, ComponentPropsWithoutRef, ReactNode, CSSProperties } from "react";
import { useStudioContext } from "@/lib/studio-context";

// Tracks the composed dot-path ID of the nearest ancestor StudioRegion.
// Empty string at root — meaning this StudioRegion has no parent.
export const ParentIdContext = createContext<string>("");

type AsProp<T extends ElementType> = { as?: T };
type StudioRegionOwnProps = { studioId: string; style?: CSSProperties; children?: ReactNode };
type StudioRegionProps<T extends ElementType = "div"> = AsProp<T> &
  StudioRegionOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof AsProp<T> | keyof StudioRegionOwnProps>;

export function StudioRegion<T extends ElementType = "div">({
  as,
  studioId,
  style,
  children,
  ...props
}: StudioRegionProps<T>) {
  const Tag = (as ?? "div") as ElementType;

  // Build full dot-path ID: parent "" + "hero" = "hero"; "hero" + "title" = "hero.title"
  const parentId = useContext(ParentIdContext);
  const fullId = parentId ? `${parentId}.${studioId}` : studioId;

  const studio = useStudioContext();
  const isDirectFocus = studio?.focusedId === fullId;
  const isAncestorFocus = studio?.focusedId?.startsWith(`${fullId}.`) ?? false;

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isDirectFocus) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isDirectFocus]);

  const outlineStyle: CSSProperties | undefined = isDirectFocus
    ? { outline: "2px solid var(--card-focus-ring-color)" }
    : isAncestorFocus
      ? { outline: "1px dashed var(--card-focus-ring-color)" }
      : undefined;

  return (
    <ParentIdContext.Provider value={fullId}>
      <Tag ref={ref as any} style={outlineStyle ? { ...style, ...outlineStyle } : style} {...props}>
        {children}
      </Tag>
    </ParentIdContext.Provider>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `lib/components/StudioRegion.tsx`

- [ ] **Commit**

```bash
git add lib/components/StudioRegion.tsx
git commit -m "feat(studio): add StudioRegion polymorphic component"
```

---

## Task 4: FocusContext

**Files:**

- Create: `sanity/components/shared/FocusContext.tsx`

`FocusProvider` wraps studio tool components. It manages a `focusedId` string and provides it to both `FocusContext` (for editor components to call `setFocus`/`clearFocus`) and `StudioContext` (for `StudioRegion` to read `focusedId`).

The `clearFocus` is debounced 50ms. `setFocus` always cancels any pending clear first — this prevents the outline flickering when focus moves between inputs in the same section or between two sections.

- [ ] **Create the file**

```tsx
// sanity/components/shared/FocusContext.tsx
"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { StudioContext } from "@/lib/studio-context";

interface FocusContextValue {
  focusedId: string | null;
  setFocus: (id: string) => void;
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function useFocusContext(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocusContext must be used within FocusProvider");
  return ctx;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setFocus(id: string) {
    // Cancel any pending clear before setting new focus — prevents flicker
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setFocusedId(id);
  }

  function clearFocus() {
    timerRef.current = setTimeout(() => {
      setFocusedId(null);
      timerRef.current = null;
    }, 50);
  }

  const value: FocusContextValue = { focusedId, setFocus, clearFocus };

  return (
    <FocusContext.Provider value={value}>
      <StudioContext.Provider value={{ focusedId }}>{children}</StudioContext.Provider>
    </FocusContext.Provider>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `sanity/components/shared/FocusContext.tsx`

- [ ] **Commit**

```bash
git add sanity/components/shared/FocusContext.tsx
git commit -m "feat(studio): add FocusContext and FocusProvider"
```

---

## Task 5: Wire FocusProvider into both tools

**Files:**

- Modify: `sanity/components/HomepageTool.tsx`
- Modify: `sanity/components/UnifiedPagesTool.tsx`

Both tools' entire render tree needs to be inside `<FocusProvider>` so that editor components and preview components share the same context instance.

- [ ] **Update `HomepageTool.tsx`**

Add import at the top (after existing imports):

```tsx
import { FocusProvider } from "./shared/FocusContext";
```

Wrap the return value (line 72). Change from:

```tsx
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
```

to:

```tsx
  return (
    <FocusProvider>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
```

Add a closing `</FocusProvider>` before the final `);` (after the closing `</div>`). The end of the return should look like:

```tsx
      </div>
    </FocusProvider>
  );
```

- [ ] **Update `UnifiedPagesTool.tsx`**

Add import (after existing imports):

```tsx
import { FocusProvider } from "./shared/FocusContext";
```

Wrap the return value (line 384). Change from:

```tsx
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
```

to:

```tsx
  return (
    <FocusProvider>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
```

Add `</FocusProvider>` before the final `);`. The end of the return should look like:

```tsx
      </div>
    </FocusProvider>
  );
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add sanity/components/HomepageTool.tsx sanity/components/UnifiedPagesTool.tsx
git commit -m "feat(studio): wrap HomepageTool and UnifiedPagesTool with FocusProvider"
```

---

## Task 6: Homepage section editor focus wrappers

**Files:**

- Modify: `sanity/components/homepage/HeroSection.tsx`
- Modify: `sanity/components/homepage/AboutSection.tsx`
- Modify: `sanity/components/homepage/ActivityGridSection.tsx`
- Modify: `sanity/components/homepage/ProgramCardsSection.tsx`
- Modify: `sanity/components/homepage/SettingsSection.tsx`

Each section editor's return gets wrapped in a `<div onFocusCapture onBlurCapture>`. The `onFocusCapture` and `onBlurCapture` capture-phase events catch all focus/blur events from child inputs without modifying any individual field component.

The `studioId` values here must exactly match what `HomepagePreview.tsx` will use in Task 9.

- [ ] **Update `HeroSection.tsx`**

Add import after existing imports:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call inside the component function body (after existing `useMemo`):

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
  return (
    <SectionWrapper id="section-hero" title="ヒーロー">
```

to:

```tsx
  return (
    <div onFocusCapture={() => setFocus("hero")} onBlurCapture={clearFocus}>
      <SectionWrapper id="section-hero" title="ヒーロー">
```

Add `</div>` after the closing `</SectionWrapper>`:

```tsx
      </SectionWrapper>
    </div>
  );
```

- [ ] **Update `AboutSection.tsx`**

Add import:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call in the component body:

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
  return (
    <SectionWrapper id="section-about" title="YIAについて">
```

to:

```tsx
  return (
    <div onFocusCapture={() => setFocus("about")} onBlurCapture={clearFocus}>
      <SectionWrapper id="section-about" title="YIAについて">
```

Add `</div>` after `</SectionWrapper>`:

```tsx
      </SectionWrapper>
    </div>
  );
```

- [ ] **Update `ActivityGridSection.tsx`**

Add import:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call:

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
  return (
    <SectionWrapper id="section-activity" title="活動グリッド">
```

to:

```tsx
  return (
    <div onFocusCapture={() => setFocus("activityGrid")} onBlurCapture={clearFocus}>
      <SectionWrapper id="section-activity" title="活動グリッド">
```

Add `</div>` after `</SectionWrapper>`:

```tsx
      </SectionWrapper>
    </div>
  );
```

- [ ] **Update `ProgramCardsSection.tsx`**

Add import:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call:

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
  return (
    <SectionWrapper id="section-programs" title="注目カテゴリー (Featured Categories)">
```

to:

```tsx
  return (
    <div onFocusCapture={() => setFocus("programCards")} onBlurCapture={clearFocus}>
      <SectionWrapper id="section-programs" title="注目カテゴリー (Featured Categories)">
```

Add `</div>` after `</SectionWrapper>`:

```tsx
      </SectionWrapper>
    </div>
  );
```

- [ ] **Update `SettingsSection.tsx`**

Add import:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call:

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
  return (
    <SectionWrapper id="section-settings" title="サイト設定">
```

to:

```tsx
  return (
    <div onFocusCapture={() => setFocus("settings")} onBlurCapture={clearFocus}>
      <SectionWrapper id="section-settings" title="サイト設定">
```

Add `</div>` after `</SectionWrapper>`:

```tsx
      </SectionWrapper>
    </div>
  );
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add \
  sanity/components/homepage/HeroSection.tsx \
  sanity/components/homepage/AboutSection.tsx \
  sanity/components/homepage/ActivityGridSection.tsx \
  sanity/components/homepage/ProgramCardsSection.tsx \
  sanity/components/homepage/SettingsSection.tsx
git commit -m "feat(studio): wire focus capture into homepage section editors"
```

---

## Task 7: SectionEditor focus wrapper (pages tool)

**Files:**

- Modify: `sanity/components/pages/SectionEditor.tsx`

`SectionEditor` is called once per section in the pages tool. Each instance wraps the content for one section. We add a focus capture wrapper around the entire div — using `section._key` as the ID, which is the stable unique key Sanity assigns to each section object. This is the same key the section-renderer in Task 8 will use as `studioId`.

- [ ] **Update `SectionEditor.tsx`**

Add import after existing imports:

```tsx
import { useFocusContext } from "../shared/FocusContext";
```

Add hook call inside the `SectionEditor` function body (before `renderEditor`):

```tsx
const { setFocus, clearFocus } = useFocusContext();
```

Wrap the return. Change from:

```tsx
return (
  <div
    style={{
      padding: "12px 16px",
      border: "1px solid var(--card-border-color)",
      borderTop: "none",
      borderRadius: "0 0 4px 4px",
      background: "var(--card-bg-color)",
    }}
  >
    {renderEditor()}
  </div>
);
```

to:

```tsx
return (
  <div onFocusCapture={() => setFocus(section._key)} onBlurCapture={clearFocus}>
    <div
      style={{
        padding: "12px 16px",
        border: "1px solid var(--card-border-color)",
        borderTop: "none",
        borderRadius: "0 0 4px 4px",
        background: "var(--card-bg-color)",
      }}
    >
      {renderEditor()}
    </div>
  </div>
);
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add sanity/components/pages/SectionEditor.tsx
git commit -m "feat(studio): wire focus capture into SectionEditor using section._key"
```

---

## Task 8: Wire StudioRegion into section-renderer

**Files:**

- Modify: `lib/section-renderer.tsx`

`flush()` creates the `<div className="page-section">` wrapper. We swap it to `<StudioRegion as="div">` and use `section._key` as `studioId` — matching what `SectionEditor` fires in Task 7.

This requires two additions:

1. A `currentSectionKey` variable that tracks the Sanity `_key` of the section currently being processed
2. A `flush()` call at the start of each loop iteration, so each top-level section starts a fresh group. If a handler internally calls `ctx.flush()` to create sub-groups, all sub-groups of the same section share the same `currentSectionKey` and highlight together — correct behaviour.

The `id` attribute on the div (used for anchor links) remains `currentSectionId`, unchanged.

- [ ] **Update `lib/section-renderer.tsx`**

Add import after existing imports (line 6):

```tsx
import { StudioRegion } from "@/lib/components/StudioRegion";
```

Replace the full body of `renderSections`. Change from:

```tsx
export function renderSections(sections: PageSection[]): SectionBuilderResult {
  const groups: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  const tocEntries: TocEntry[] = [];

  let currentSectionId: string | undefined;

  function flush() {
    if (current.length) {
      groups.push(
        <div className="page-section" id={currentSectionId} key={`section-${groups.length}`}>
          {current.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>,
      );
      current = [];
      currentSectionId = undefined;
    }
  }

  function push(...nodes: React.ReactNode[]) {
    current.push(...nodes);
  }

  function addTocHeader(textJa: string, textEn: string = "") {
    if (!textJa) return;
    const id = tocId(textJa);
    tocEntries.push({ id, text: textJa, subtext: textEn || undefined });
    currentSectionId = id;
    current.push(<SectionHeader text={textJa} textEn={textEn} variant="plain" level={2} />);
  }

  const ctx = { push, flush, addTocHeader };

  for (const sec of sections) {
    const handler = sectionHandlers[sec._type];
    if (handler) handler(sec, ctx);
  }

  // Flush any remaining content
  flush();

  return {
    groups: <>{groups}</>,
    tocEntries,
  };
}
```

to:

```tsx
export function renderSections(sections: PageSection[]): SectionBuilderResult {
  const groups: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  const tocEntries: TocEntry[] = [];

  let currentSectionId: string | undefined;
  let currentSectionKey: string | undefined;

  function flush() {
    if (current.length) {
      groups.push(
        <StudioRegion
          as="div"
          className="page-section"
          id={currentSectionId}
          studioId={currentSectionKey ?? ""}
          key={`section-${groups.length}`}
        >
          {current.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </StudioRegion>,
      );
      current = [];
      currentSectionId = undefined;
      currentSectionKey = undefined;
    }
  }

  function push(...nodes: React.ReactNode[]) {
    current.push(...nodes);
  }

  function addTocHeader(textJa: string, textEn: string = "") {
    if (!textJa) return;
    const id = tocId(textJa);
    tocEntries.push({ id, text: textJa, subtext: textEn || undefined });
    currentSectionId = id;
    current.push(<SectionHeader text={textJa} textEn={textEn} variant="plain" level={2} />);
  }

  const ctx = { push, flush, addTocHeader };

  for (const sec of sections) {
    flush(); // flush previous section's content before starting a new one
    currentSectionKey = sec._key; // track key so studioId matches SectionEditor's setFocus call
    const handler = sectionHandlers[sec._type];
    if (handler) handler(sec, ctx);
  }

  // Flush any remaining content
  flush();

  return {
    groups: <>{groups}</>,
    tocEntries,
  };
}
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add lib/section-renderer.tsx
git commit -m "feat(studio): use StudioRegion in section-renderer, key by section._key"
```

---

## Task 9: Wire StudioRegion into HomepagePreview

**Files:**

- Modify: `sanity/components/homepage/HomepagePreview.tsx`

Five `<section>` tags get swapped to `<StudioRegion as="section">`. The `studioId` values must match exactly what the editor wrappers in Task 6 use.

The announcements band (`<section className="oshirase-band">`) and `<footer>` are **not** wrapped — they have no corresponding editor sections.

- [ ] **Add import to `HomepagePreview.tsx`**

After the last existing import (line 15):

```tsx
import { StudioRegion } from "@/lib/components/StudioRegion";
```

- [ ] **Swap the activity grid section (line 77, inside `renderActivityGrid`)**

Change from:

```tsx
      <section className="activity-grid-wrap">
```

to:

```tsx
      <StudioRegion as="section" className="activity-grid-wrap" studioId="activityGrid">
```

Change the matching closing tag (line 155) from:

```tsx
      </section>
```

to:

```tsx
      </StudioRegion>
```

- [ ] **Swap the program grid section (line 162, inside `renderProgramGrid`)**

Change from:

```tsx
      <section className="program-grid">
```

to:

```tsx
      <StudioRegion as="section" className="program-grid" studioId="programCards">
```

Change the matching closing tag (line 215) from:

```tsx
      </section>
```

to:

```tsx
      </StudioRegion>
```

- [ ] **Swap the hero section (line 232)**

Change from:

```tsx
      <section className="hero-viewport" style={{ position: "relative", minHeight: 300 }}>
```

to:

```tsx
      <StudioRegion as="section" className="hero-viewport" style={{ position: "relative", minHeight: 300 }} studioId="hero">
```

Change the closing tag (line 257) from:

```tsx
      </section>
```

to:

```tsx
      </StudioRegion>
```

- [ ] **Swap the about section (line 298)**

Change from:

```tsx
          <section className="home-section home-section--about">
```

to:

```tsx
          <StudioRegion as="section" className="home-section home-section--about" studioId="about">
```

Change the closing tag (line 329) from:

```tsx
          </section>
```

to:

```tsx
          </StudioRegion>
```

- [ ] **Swap the settings/access section (line 336)**

Change from:

```tsx
        <section className="home-section home-section--tinted">
```

to:

```tsx
        <StudioRegion as="section" className="home-section home-section--tinted" studioId="settings">
```

Change the closing tag (line 397) from:

```tsx
        </section>
```

to:

```tsx
        </StudioRegion>
```

- [ ] **Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add sanity/components/homepage/HomepagePreview.tsx
git commit -m "feat(studio): use StudioRegion in HomepagePreview sections"
```

---

## Task 10: Verify in studio

- [ ] **Start dev server**

```bash
npm run dev
```

- [ ] **Open studio and navigate to the Homepage tool**

Go to `http://localhost:3000/studio` → Homepage tool.

- [ ] **Verify homepage focus highlighting**

Click into any input in the Hero section. The preview should show a solid blue outline around the hero section and auto-scroll to it.

Click into an input in the About section. The hero outline should disappear and the about section should highlight.

Click somewhere outside the editor (e.g. the nav bar). All outlines should disappear after ~50ms.

- [ ] **Verify no flickering**

While in the Hero section, tab through several inputs. The outline should stay on the hero section continuously — no flicker between fields.

- [ ] **Navigate to the Pages tool and verify section highlighting**

Open a page with multiple sections. Click into a section editor. The corresponding section in the preview should highlight and scroll into view.

- [ ] **Verify production build has no DOM changes**

```bash
npm run build
```

Expected: build succeeds with no errors. Open a page in the built app (e.g. `http://localhost:3000/`) and inspect the DOM — section elements should have no `style` attribute or `data-studio-section` attributes. The DOM structure is identical to before.

---

## Task 11: Open pull request

- [ ] **Push branch**

```bash
git push -u origin feat/studio-focus-highlight
```

- [ ] **Open PR targeting `main`**

```bash
gh pr create \
  --title "feat(studio): highlight focused sections in preview" \
  --body "$(cat <<'EOF'
## Summary

- Adds `StudioRegion` polymorphic component (`lib/components/StudioRegion.tsx`) that renders as any element and applies a CSS outline when the corresponding editor section is focused
- Adds `StudioContext` (`lib/studio-context.tsx`) — null in production, inert with no DOM changes
- Adds `FocusContext` (`sanity/components/shared/FocusContext.tsx`) — tracks focused section ID with debounced clear
- Wires focus capture into all 5 homepage section editors and `SectionEditor` (pages)
- Swaps 5 `<section>` tags in `HomepagePreview` and the `flush()` wrapper in `section-renderer` to use `StudioRegion`

## Behaviour

- Focusing any input in a section highlights that section in the preview with a blue outline and auto-scrolls to it
- Moving focus between sections transitions the outline immediately (no flicker)
- Architecture supports nested field-level highlighting in future (hierarchical dot-path IDs)

## Production impact

None. `StudioContext` defaults to null — `StudioRegion` renders as a plain element with no extra DOM nodes, no inline styles, no attributes.

## Test plan

- [ ] Focus each section in HomepageTool — correct section highlights in preview
- [ ] Focus each section in a page in UnifiedPagesTool — correct section highlights
- [ ] Tab between inputs within a section — no flicker
- [ ] Click outside editor — outline disappears after ~50ms
- [ ] `npm run build` succeeds, production DOM has no outline styles or extra attributes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
