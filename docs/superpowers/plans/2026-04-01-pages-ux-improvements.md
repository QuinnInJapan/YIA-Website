# ページ管理 UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six targeted UX improvements to the ページ管理 tool — replacing drag-and-drop reorder with ↑↓ arrows, removing visual noise from the left panel, auto-publishing nav changes, and adding a category preview panel.

**Architecture:** All changes are UI/UX layer only — no data model or GROQ query changes. The auto-publish change extracts a `publishNavDirectly` helper in `useNavData` so both the automatic post-save publish and the manual reorder-complete path share the same implementation.

**Tech Stack:** React 19, Sanity Studio v5, `@sanity/ui`, TypeScript, inline CSS styles (project convention)

---

## File Map

| File                                                     | Action     | Responsibility                                                                                                    |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `sanity/components/unified-pages/useNavData.ts`          | Modify     | Extract `publishNavDirectly`; auto-call it after `saveToSanity` succeeds                                          |
| `sanity/components/unified-pages/NavPublishBar.tsx`      | **Delete** | No longer needed — publishing is automatic                                                                        |
| `sanity/components/unified-pages/LeftPanel.tsx`          | Modify     | Replace D&D with ↑↓ arrows; collapse in reorder mode; 完了/キャンセル; remove hidden toggle; remove NavPublishBar |
| `sanity/components/unified-pages/CategoryManagement.tsx` | Modify     | Inline header rename (JP + EN + pencil); remove bottom rename button                                              |
| `sanity/components/unified-pages/CategoryPreview.tsx`    | **Create** | Read-only page list shown in right panel when a category is selected                                              |
| `sanity/components/UnifiedPagesTool.tsx`                 | Modify     | Fixed-width middle panel for system pages; CategoryPreview in right panel; dim middle+right when in reorder mode  |

---

### Task 1: useNavData — auto-publish after saveToSanity

**Files:**

- Modify: `sanity/components/unified-pages/useNavData.ts`

- [ ] **Step 1: Add `publishNavDirectly` helper above `saveToSanity`**

  In `useNavData.ts`, after the `flushSave` / after line 140 (before the `publishNav` function at line 144), insert `publishNavDirectly`. This extracts the publish logic from `publishNav` so it can be called without first flushing:

  ```typescript
  const publishNavDirectly = useCallback(
    async (draft: NavigationDoc) => {
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { _rev, ...rest } = draft;
        const tx = client.transaction();
        tx.createOrReplace({ ...rest, _id: "navigation", _type: "navigation" });
        tx.delete("drafts.navigation");
        const assignedPageIds = new Set<string>();
        for (const navCat of draft.categories ?? []) {
          const catRef = navCat.categoryRef?._ref;
          if (!catRef) continue;
          for (const item of navCat.items ?? []) {
            const pageRef = item.pageRef?._ref;
            if (!pageRef) continue;
            assignedPageIds.add(pageRef);
            tx.patch(pageRef, (p) => p.set({ categoryRef: { _type: "reference", _ref: catRef } }));
          }
        }
        for (const page of allPagesRef.current) {
          if (page.categoryRef?._ref && !assignedPageIds.has(page._id)) {
            tx.patch(page._id, (p) => p.unset(["categoryRef"]));
          }
        }
        await tx.commit();
        const [pubNav, refreshedPages] = await Promise.all([
          client.fetch<NavigationDoc | null>(PUB_NAV_QUERY),
          client.fetch<NavPageDoc[]>(PAGES_QUERY),
        ]);
        setPublishedNav(pubNav);
        setDraftNav(null);
        setCategories(pubNav?.categories ?? []);
        setAllPages(refreshedPages);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Publish failed:", err);
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [client],
  );
  ```

- [ ] **Step 2: Update `saveToSanity` to call `publishNavDirectly` after success**

  Replace the existing `saveToSanity` (lines 94–121) with:

  ```typescript
  const saveToSanity = useCallback(async () => {
    const pending = pendingCategoriesRef.current;
    if (!pending) return;
    pendingCategoriesRef.current = null;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const baseDoc = draftNavRef.current ?? publishedNavRef.current;
      if (!baseDoc) {
        setSaving(false);
        setSaveStatus("saved");
        return;
      }
      const draftId = "drafts.navigation";
      const tx = client.transaction();
      tx.createIfNotExists({ ...baseDoc, _id: draftId, _type: "navigation" });
      tx.patch(draftId, (p) => p.set({ categories: pending }));
      await tx.commit();
      const refreshed = await client.fetch<NavigationDoc | null>(DRAFT_NAV_QUERY);
      setDraftNav(refreshed);
      setSaveStatus("saved");
      setSaving(false);
      // Auto-publish: draft is an invisible implementation detail
      if (refreshed) await publishNavDirectly(refreshed);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setSaving(false);
    }
  }, [client, publishNavDirectly]);
  ```

- [ ] **Step 3: Simplify `publishNav` to delegate to `publishNavDirectly`**

  Replace the existing `publishNav` (lines 144–192) with:

  ```typescript
  const publishNav = useCallback(async () => {
    await flushSave();
    const draft = draftNavRef.current;
    if (!draft) {
      setSaveStatus("saved");
      setSaving(false);
      return;
    }
    await publishNavDirectly(draft);
  }, [flushSave, publishNavDirectly]);
  ```

- [ ] **Step 4: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors. If you see "publishNavDirectly is used before it is defined", make sure `publishNavDirectly` is declared above `saveToSanity` in the file.

- [ ] **Step 5: Commit**

  ```bash
  git add sanity/components/unified-pages/useNavData.ts
  git commit -m "feat(unified-pages): auto-publish nav draft after debounced save"
  ```

---

### Task 2: Delete NavPublishBar — remove from LeftPanel and its props

**Files:**

- Delete: `sanity/components/unified-pages/NavPublishBar.tsx`
- Modify: `sanity/components/unified-pages/LeftPanel.tsx`
- Modify: `sanity/components/UnifiedPagesTool.tsx`

- [ ] **Step 1: Delete `NavPublishBar.tsx`**

  ```bash
  rm sanity/components/unified-pages/NavPublishBar.tsx
  ```

- [ ] **Step 2: Remove NavPublishBar from LeftPanel**

  In `LeftPanel.tsx`:

  a. Remove the import on line 7:

  ```typescript
  // DELETE this line:
  import { NavPublishBar } from "./NavPublishBar";
  ```

  b. Remove `saving`, `hasDraft`, and `onPublishNav` from the props interface (lines 208–241). The new props interface is:

  ```typescript
  export function LeftPanel({
    loading,
    saveStatus,
    categories,
    categoryDocs,
    pagesMap,
    draftPageIds,
    selectedMiddle,
    onSelectCategory,
    onSelectPage,
    onSelectSystemPage,
    onCreateCategory,
    onTogglePageHidden,
    onReorderCategories,
  }: {
    loading: boolean;
    saveStatus: NavSaveStatus;
    categories: NavCategoryRaw[];
    categoryDocs: Map<string, CategoryDoc>;
    pagesMap: Map<string, NavPageDoc>;
    draftPageIds: Set<string>;
    selectedMiddle: MiddlePanelState;
    onSelectCategory: (key: string) => void;
    onSelectPage: (id: string) => void;
    onSelectSystemPage: (name: "blog" | "announcements") => void;
    onCreateCategory: () => void;
    onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
    onReorderCategories: (newCategories: NavCategoryRaw[]) => void;
  });
  ```

  c. Remove the `<NavPublishBar ... />` render at the bottom of LeftPanel (lines 399–405):

  ```tsx
  // DELETE these lines:
  {
    /* Publish bar */
  }
  <NavPublishBar
    saveStatus={saveStatus}
    hasDraft={hasDraft}
    saving={saving}
    onPublish={onPublishNav}
  />;
  ```

- [ ] **Step 3: Remove removed props from UnifiedPagesTool's `<LeftPanel>` call**

  In `UnifiedPagesTool.tsx`, find the `<LeftPanel ... />` render (lines 374–391) and remove the three props:

  ```tsx
  // DELETE these three props:
  saving={navData.saving}
  hasDraft={navData.hasDraft}
  onPublishNav={navData.publishNav}
  ```

- [ ] **Step 4: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors. The `saving`, `hasDraft` fields still exist in the `useNavData` return value — we just stopped passing them to LeftPanel.

- [ ] **Step 5: Commit**

  ```bash
  git add sanity/components/unified-pages/LeftPanel.tsx \
          sanity/components/UnifiedPagesTool.tsx
  git rm sanity/components/unified-pages/NavPublishBar.tsx
  git commit -m "feat(unified-pages): remove NavPublishBar — publishing is now automatic"
  ```

---

### Task 3: LeftPanel — replace drag-and-drop with ↑↓ arrow buttons

**Files:**

- Modify: `sanity/components/unified-pages/LeftPanel.tsx`
- Modify: `sanity/components/UnifiedPagesTool.tsx`

The goal: when user enters reorder mode, all categories collapse, ↑↓ buttons appear, 完了 is disabled until `saveStatus === "saved"`, キャンセル reverts. The parent (UnifiedPagesTool) dims middle+right panels when reorder mode is active.

- [ ] **Step 1: Replace `CategoryRow` with the new arrow-based version**

  Replace the entire `CategoryRow` function (lines 114–205 in LeftPanel.tsx) with:

  ```tsx
  function CategoryRow({
    navCat,
    categoryDoc,
    pagesMap,
    selectedMiddle,
    isReorderMode,
    idx,
    totalCount,
    onSelectCategory,
    onSelectPage,
    onTogglePageHidden,
    onMoveUp,
    onMoveDown,
  }: {
    navCat: NavCategoryRaw;
    categoryDoc: CategoryDoc | undefined;
    pagesMap: Map<string, NavPageDoc>;
    selectedMiddle: MiddlePanelState;
    isReorderMode: boolean;
    idx: number;
    totalCount: number;
    onSelectCategory: (key: string) => void;
    onSelectPage: (id: string) => void;
    onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
  }) {
    const [expanded, setExpanded] = useState(true);
    const label = categoryDoc?.label?.find((l) => l._key === "ja")?.value ?? "（カテゴリ名なし）";
    const isCategorySelected =
      selectedMiddle?.type === "category" && selectedMiddle.key === navCat._key;
    const showItems = !isReorderMode && expanded;

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "8px 8px",
            borderRadius: 4,
            background: isCategorySelected ? "var(--card-border-color)" : "transparent",
          }}
        >
          {!isReorderMode && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 10,
                opacity: 0.5,
                padding: 0,
                color: "var(--card-fg-color)",
                flexShrink: 0,
              }}
            >
              {expanded ? "▼" : "▶"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!isReorderMode) onSelectCategory(navCat._key);
            }}
            style={{
              flex: 1,
              textAlign: "left",
              border: "none",
              background: "transparent",
              cursor: isReorderMode ? "default" : "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--card-fg-color)",
              padding: 0,
            }}
          >
            {label}
          </button>
          {isReorderMode && (
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={idx === 0}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 3,
                  background: "transparent",
                  cursor: idx === 0 ? "default" : "pointer",
                  fontSize: 11,
                  padding: "2px 6px",
                  color: "var(--card-fg-color)",
                  opacity: idx === 0 ? 0.25 : 1,
                }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={idx === totalCount - 1}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 3,
                  background: "transparent",
                  cursor: idx === totalCount - 1 ? "default" : "pointer",
                  fontSize: 11,
                  padding: "2px 6px",
                  color: "var(--card-fg-color)",
                  opacity: idx === totalCount - 1 ? 0.25 : 1,
                }}
              >
                ↓
              </button>
            </div>
          )}
        </div>
        {showItems && (
          <div>
            {(navCat.items ?? []).map((item) => {
              const page = pagesMap.get(item.pageRef._ref);
              if (!page) return null;
              const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
              return (
                <PageRow
                  key={item._key}
                  pageId={item.pageRef._ref}
                  title={titleJa}
                  hasDraft={false}
                  hidden={!!item.hidden}
                  isSelected={
                    selectedMiddle?.type === "page" && selectedMiddle.id === item.pageRef._ref
                  }
                  onSelect={() => onSelectPage(item.pageRef._ref)}
                  onToggleHidden={() => onTogglePageHidden(navCat._key, item._key)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Update LeftPanel props interface to add `onReorderModeChange`**

  In the `LeftPanel` function signature, add `onReorderModeChange` as an optional callback. The full updated props interface (replace lines 224–241):

  ```typescript
  {
    loading: boolean;
    saveStatus: NavSaveStatus;
    categories: NavCategoryRaw[];
    categoryDocs: Map<string, CategoryDoc>;
    pagesMap: Map<string, NavPageDoc>;
    draftPageIds: Set<string>;
    selectedMiddle: MiddlePanelState;
    onSelectCategory: (key: string) => void;
    onSelectPage: (id: string) => void;
    onSelectSystemPage: (name: "blog" | "announcements") => void;
    onCreateCategory: () => void;
    onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
    onReorderCategories: (newCategories: NavCategoryRaw[]) => void;
    onReorderModeChange?: (active: boolean) => void;
  }
  ```

- [ ] **Step 3: Replace reorder state and handlers in LeftPanel body**

  Replace the existing state/handler block (lines 242–283) with:

  ```typescript
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localCategories, setLocalCategories] = useState<NavCategoryRaw[]>(categories);
  const preEditSnapshotRef = useRef<NavCategoryRaw[]>([]);

  // Keep localCategories in sync when categories prop changes (and not in reorder mode)
  const prevCategoriesRef = useRef(categories);
  if (!isReorderMode && prevCategoriesRef.current !== categories) {
    prevCategoriesRef.current = categories;
    setLocalCategories(categories);
  }

  const displayCategories = isReorderMode ? localCategories : categories;

  const enterReorderMode = useCallback(() => {
    preEditSnapshotRef.current = [...categories];
    setLocalCategories([...categories]);
    setIsReorderMode(true);
    onReorderModeChange?.(true);
  }, [categories, onReorderModeChange]);

  const handleMoveCategory = useCallback((idx: number, direction: "up" | "down") => {
    setLocalCategories((prev) => {
      const next = [...prev];
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const handleCompleteReorder = useCallback(() => {
    onReorderCategories(localCategories);
    setIsReorderMode(false);
    onReorderModeChange?.(false);
  }, [localCategories, onReorderCategories, onReorderModeChange]);

  const handleCancelReorder = useCallback(() => {
    setLocalCategories(preEditSnapshotRef.current);
    setIsReorderMode(false);
    onReorderModeChange?.(false);
  }, [onReorderModeChange]);
  ```

- [ ] **Step 4: Replace the header button with 完了/キャンセル pair**

  Replace the header section (lines 295–323) with:

  ```tsx
  {
    /* Header */
  }
  <div
    style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--card-border-color)",
      flexShrink: 0,
    }}
  >
    <Flex align="center" justify="space-between">
      <Text size={1} weight="semibold">
        ページ管理
      </Text>
      {isReorderMode ? (
        <Flex align="center" gap={2}>
          <button
            type="button"
            onClick={handleCompleteReorder}
            disabled={saveStatus !== "saved"}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              background: saveStatus === "saved" ? "var(--blue-500, #2563eb)" : "transparent",
              color: saveStatus === "saved" ? "#fff" : "var(--card-muted-fg-color)",
              cursor: saveStatus === "saved" ? "pointer" : "not-allowed",
              opacity: saveStatus === "saved" ? 1 : 0.5,
            }}
          >
            完了
          </button>
          <button
            type="button"
            onClick={handleCancelReorder}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </Flex>
      ) : (
        <button
          type="button"
          onClick={enterReorderMode}
          style={{
            fontSize: 11,
            padding: "4px 8px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            cursor: "pointer",
          }}
        >
          ナビの順番を変更
        </button>
      )}
    </Flex>
  </div>;
  ```

- [ ] **Step 5: Update CategoryRow renders in the map + dim non-category sections**

  Replace the category tree section (lines 325–396):

  ```tsx
  {
    /* Category tree */
  }
  <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
    <Stack space={1}>
      {displayCategories.map((navCat, idx) => (
        <CategoryRow
          key={navCat._key}
          navCat={navCat}
          categoryDoc={categoryDocs.get(navCat.categoryRef?._ref)}
          pagesMap={pagesMap}
          selectedMiddle={selectedMiddle}
          isReorderMode={isReorderMode}
          idx={idx}
          totalCount={displayCategories.length}
          onSelectCategory={onSelectCategory}
          onSelectPage={onSelectPage}
          onTogglePageHidden={onTogglePageHidden}
          onMoveUp={() => handleMoveCategory(idx, "up")}
          onMoveDown={() => handleMoveCategory(idx, "down")}
        />
      ))}
    </Stack>

    {/* System pages */}
    <div
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--card-border-color)",
        opacity: isReorderMode ? 0.3 : 1,
        pointerEvents: isReorderMode ? "none" : "auto",
      }}
    >
      {SYSTEM_PAGES.map((sp) => (
        <button
          key={sp.name}
          type="button"
          onClick={() => onSelectSystemPage(sp.name)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "6px 8px",
            border: "none",
            borderRadius: 4,
            background:
              selectedMiddle?.type === "system" && selectedMiddle.name === sp.name
                ? "var(--card-border-color)"
                : "transparent",
            cursor: "pointer",
            fontSize: 13,
            color: "var(--card-muted-fg-color)",
          }}
        >
          {sp.label}
          <span style={{ fontSize: 10, marginLeft: 6 }}>(システム)</span>
        </button>
      ))}
    </div>

    {/* Add category */}
    <div
      style={{
        padding: "12px 0 4px",
        opacity: isReorderMode ? 0.3 : 1,
        pointerEvents: isReorderMode ? "none" : "auto",
      }}
    >
      <button
        type="button"
        onClick={onCreateCategory}
        style={{
          width: "100%",
          fontSize: 12,
          padding: "8px 12px",
          border: "1px dashed var(--card-border-color)",
          borderRadius: 6,
          background: "transparent",
          cursor: "pointer",
          color: "var(--card-muted-fg-color)",
        }}
      >
        + カテゴリを追加
      </button>
    </div>
  </div>;
  ```

- [ ] **Step 6: Add `isReorderMode` state to UnifiedPagesTool + dim middle/right**

  In `UnifiedPagesTool.tsx`, after line 39 (`const [draftPageIds, ...`) add:

  ```typescript
  const [isReorderMode, setIsReorderMode] = useState(false);
  ```

  Pass the callback to `<LeftPanel>` by adding this prop to the LeftPanel render (after `onReorderCategories`):

  ```tsx
  onReorderModeChange = { setIsReorderMode };
  ```

  Replace the center panel div (line 394–395) with:

  ```tsx
  {
    /* ── Center: Middle panel ── */
  }
  <div
    style={{
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      opacity: isReorderMode ? 0.3 : 1,
      pointerEvents: isReorderMode ? "none" : "auto",
      transition: "opacity 0.15s",
    }}
  >
    {renderMiddlePanel()}
  </div>;
  ```

  Replace the right panel render (line 397–398) with:

  ```tsx
  {
    /* ── Right: Section tools or preview ── */
  }
  <div
    style={{
      display: "contents",
      opacity: isReorderMode ? 0.3 : 1,
      pointerEvents: isReorderMode ? "none" : "auto",
    }}
  >
    {renderRightPanel()}
  </div>;
  ```

  Note: `display: contents` is used so the div doesn't affect the flex layout. The `opacity` and `pointerEvents` still apply to children.

  Actually, `display: contents` doesn't apply opacity/pointerEvents. Use a wrapper div with the right panel's flex sizing instead. Replace the right panel render:

  ```tsx
  {
    /* ── Right: Section tools or preview ── */
  }
  {
    (() => {
      const panel = renderRightPanel();
      if (!panel) return null;
      return (
        <div
          style={{
            opacity: isReorderMode ? 0.3 : 1,
            pointerEvents: isReorderMode ? "none" : "auto",
            display: "flex",
            flexShrink: 0,
            transition: "opacity 0.15s",
          }}
        >
          {panel}
        </div>
      );
    })();
  }
  ```

  For `renderRightPanel()` when it returns null (e.g. category selected, no page preview), the dimming isn't needed anyway. But for when it does render a panel, this correctly dims it.

- [ ] **Step 7: Also remove unused drag-related imports from LeftPanel**

  In the LeftPanel imports, remove `useRef` if it's no longer used (it is used for `preEditSnapshotRef` and `prevCategoriesRef`, so keep it). Remove `useCallback` only if unused (it is used, keep it). The import changes needed: remove `draggingKey` state and `dragIdxRef` ref — those were for the old D&D and are now replaced.

  Verify the import line at the top still has `useCallback, useRef, useState`.

- [ ] **Step 8: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors. Common issue: if `CategoryRow` is missing a prop, ensure all new props (`idx`, `totalCount`, `onMoveUp`, `onMoveDown`) are passed in the map.

- [ ] **Step 9: Commit**

  ```bash
  git add sanity/components/unified-pages/LeftPanel.tsx \
          sanity/components/UnifiedPagesTool.tsx
  git commit -m "feat(unified-pages): replace D&D category reorder with ↑↓ arrow buttons"
  ```

---

### Task 4: LeftPanel — remove hidden toggle from PageRow, style hidden pages visually

**Files:**

- Modify: `sanity/components/unified-pages/LeftPanel.tsx`

- [ ] **Step 1: Remove the hidden toggle button from `PageRow`**

  In `PageRow`, remove the `onToggleHidden` prop from the interface and the button that renders it (lines 21, 32, 90–109). The new `PageRow` becomes:

  ```tsx
  function PageRow({
    pageId,
    title,
    hasDraft,
    hidden,
    isSelected,
    onSelect,
  }: {
    pageId: string;
    title: string;
    hasDraft: boolean;
    hidden: boolean;
    isSelected: boolean;
    onSelect: () => void;
  }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px 6px 28px",
          borderRadius: 4,
          background: isSelected ? "var(--card-border-color)" : "transparent",
          opacity: hidden ? 0.45 : 1,
          cursor: "pointer",
        }}
        onClick={onSelect}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: hidden ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {title}
        </span>
        {hasDraft && (
          <span
            title="未公開の変更あり"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#e6a317",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    );
  }
  ```

  The row is now a plain `<div onClick>` instead of containing a nested button, since the whole row is the click target.

- [ ] **Step 2: Remove `onToggleHidden` from CategoryRow's PageRow calls**

  In the updated `CategoryRow` (from Task 3), the `PageRow` call still passes `onToggleHidden`. Remove that prop:

  ```tsx
  <PageRow
    key={item._key}
    pageId={item.pageRef._ref}
    title={titleJa}
    hasDraft={false}
    hidden={!!item.hidden}
    isSelected={selectedMiddle?.type === "page" && selectedMiddle.id === item.pageRef._ref}
    onSelect={() => onSelectPage(item.pageRef._ref)}
  />
  ```

  Also remove `onTogglePageHidden` from CategoryRow's props interface and body — it is no longer needed in LeftPanel (it's still available in CategoryManagement for the middle panel toggle).

  The simplified CategoryRow props:

  ```typescript
  {
    navCat: NavCategoryRaw;
    categoryDoc: CategoryDoc | undefined;
    pagesMap: Map<string, NavPageDoc>;
    selectedMiddle: MiddlePanelState;
    isReorderMode: boolean;
    idx: number;
    totalCount: number;
    onSelectCategory: (key: string) => void;
    onSelectPage: (id: string) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
  }
  ```

- [ ] **Step 3: Remove `onTogglePageHidden` from LeftPanel's props interface**

  Remove `onTogglePageHidden` from LeftPanel's exported props interface and its usage in the CategoryRow map call.

  Updated LeftPanel props (remove the `onTogglePageHidden` line):

  ```typescript
  {
    loading: boolean;
    saveStatus: NavSaveStatus;
    categories: NavCategoryRaw[];
    categoryDocs: Map<string, CategoryDoc>;
    pagesMap: Map<string, NavPageDoc>;
    draftPageIds: Set<string>;
    selectedMiddle: MiddlePanelState;
    onSelectCategory: (key: string) => void;
    onSelectPage: (id: string) => void;
    onSelectSystemPage: (name: "blog" | "announcements") => void;
    onCreateCategory: () => void;
    onReorderCategories: (newCategories: NavCategoryRaw[]) => void;
    onReorderModeChange?: (active: boolean) => void;
  }
  ```

  In `UnifiedPagesTool.tsx`, remove the `onTogglePageHidden={navData.togglePageHidden}` prop from the `<LeftPanel>` call.

- [ ] **Step 4: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add sanity/components/unified-pages/LeftPanel.tsx \
          sanity/components/UnifiedPagesTool.tsx
  git commit -m "feat(unified-pages): remove hidden toggle from PageRow, style hidden pages with opacity"
  ```

---

### Task 5: CategoryManagement — inline header rename

**Files:**

- Modify: `sanity/components/unified-pages/CategoryManagement.tsx`

The current header (lines 149–156) shows only the Japanese label. The bottom section (lines 355–407) has the rename form. Goal: move rename inline into the header, remove the bottom section.

- [ ] **Step 1: Add `labelEn` derivation after `label`**

  After line 61 (`const label = ...`), add:

  ```typescript
  const labelEn = categoryDoc?.label?.find((l) => l._key === "en")?.value;
  ```

- [ ] **Step 2: Replace the header `<Box>` with the new inline-rename header**

  Replace the existing header (lines 149–156):

  ```tsx
  {
    /* Header */
  }
  <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}>
    {isRenaming ? (
      <div>
        <BilingualInput label="カテゴリ名" value={renameLabel} onChange={setRenameLabel} />
        <Flex gap={2} style={{ marginTop: 8 }}>
          <Button
            text={renameSaving ? "保存中…" : "保存"}
            tone="positive"
            fontSize={1}
            padding={2}
            onClick={handleSaveRename}
            disabled={renameSaving}
          />
          <Button
            text="キャンセル"
            mode="ghost"
            fontSize={1}
            padding={2}
            onClick={() => {
              setIsRenaming(false);
              setRenameLabel(categoryDoc?.label ?? []);
            }}
          />
        </Flex>
      </div>
    ) : (
      <Flex align="flex-start" justify="space-between" gap={2}>
        <div>
          <Text size={1} weight="semibold">
            {label}
          </Text>
          {labelEn && (
            <Text size={0} muted style={{ marginTop: 3, display: "block" }}>
              {labelEn}
            </Text>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setRenameLabel(categoryDoc?.label ?? []);
            setIsRenaming(true);
          }}
          title="カテゴリ名を変更"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "2px 4px",
            fontSize: 14,
            color: "var(--card-muted-fg-color)",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ✎
        </button>
      </Flex>
    )}
  </Box>;
  ```

- [ ] **Step 3: Remove the bottom rename section**

  Remove the entire `{/* Rename */}` div (lines 355–407 in the current file):

  ```tsx
  // DELETE this entire block:
  {/* Rename */}
  <div
    style={{
      borderTop: "1px solid var(--card-border-color)",
      paddingTop: 16,
      marginBottom: 16,
    }}
  >
    {isRenaming ? (
      ...
    ) : (
      <Flex align="center" justify="space-between">
        <Button text="カテゴリ名を変更" ... />
        <Button icon={TrashIcon} text="削除" ... onClick={onDeleteCategory} />
      </Flex>
    )}
  </div>
  ```

  The delete button must still exist. Replace the deleted block with just the delete button in its own section:

  ```tsx
  {
    /* Danger zone */
  }
  <div
    style={{
      borderTop: "1px solid var(--card-border-color)",
      paddingTop: 16,
      marginBottom: 16,
    }}
  >
    <Flex align="center" justify="flex-end">
      <Button
        icon={TrashIcon}
        text="削除"
        tone="critical"
        mode="ghost"
        fontSize={1}
        padding={2}
        onClick={onDeleteCategory}
      />
    </Flex>
  </div>;
  ```

- [ ] **Step 4: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add sanity/components/unified-pages/CategoryManagement.tsx
  git commit -m "feat(unified-pages): inline category rename in header, show JP+EN labels"
  ```

---

### Task 6: Create `CategoryPreview` component

**Files:**

- Create: `sanity/components/unified-pages/CategoryPreview.tsx`

- [ ] **Step 1: Write the component**

  Create `sanity/components/unified-pages/CategoryPreview.tsx`:

  ```tsx
  // sanity/components/unified-pages/CategoryPreview.tsx
  "use client";

  import { Text } from "@sanity/ui";
  import type { NavCategoryRaw, NavPageDoc } from "./types";

  export function CategoryPreview({
    navCat,
    pagesMap,
  }: {
    navCat: NavCategoryRaw;
    pagesMap: Map<string, NavPageDoc>;
  }) {
    const items = navCat.items ?? [];

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--card-border-color)",
            flexShrink: 0,
          }}
        >
          <Text size={0} muted>
            ページ一覧（プレビュー）
          </Text>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {items.length === 0 ? (
            <Text size={0} muted>
              ページがありません
            </Text>
          ) : (
            items.map((item) => {
              const page = pagesMap.get(item.pageRef._ref);
              if (!page) return null;
              const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
              return (
                <div
                  key={item._key}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 4,
                    marginBottom: 2,
                    opacity: item.hidden ? 0.45 : 1,
                  }}
                >
                  <Text
                    size={1}
                    style={{
                      color: item.hidden ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
                    }}
                  >
                    {titleJa}
                  </Text>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add sanity/components/unified-pages/CategoryPreview.tsx
  git commit -m "feat(unified-pages): add CategoryPreview read-only right-panel component"
  ```

---

### Task 7: UnifiedPagesTool — system page fixed width + CategoryPreview in right panel

**Files:**

- Modify: `sanity/components/UnifiedPagesTool.tsx`

- [ ] **Step 1: Import `CategoryPreview`**

  Add the import after the `SystemPageNotice` import:

  ```typescript
  import { CategoryPreview } from "./unified-pages/CategoryPreview";
  ```

- [ ] **Step 2: Fixed-width middle panel for system pages**

  In `UnifiedPagesTool.tsx`, replace the center panel div (current: `<div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>`) with:

  ```tsx
  {
    /* ── Center: Middle panel ── */
  }
  <div
    style={{
      flex: middlePanel?.type === "system" ? "0 0 480px" : 1,
      minWidth: 0,
      overflow: "hidden",
      opacity: isReorderMode ? 0.3 : 1,
      pointerEvents: isReorderMode ? "none" : "auto",
      transition: "opacity 0.15s",
    }}
  >
    {renderMiddlePanel()}
  </div>;
  ```

- [ ] **Step 3: Add CategoryPreview to `renderRightPanel`**

  In `renderRightPanel()`, in the `if (!rightPanel)` block, add the category case after the page preview case:

  ```typescript
  function renderRightPanel() {
    if (!rightPanel) {
      // Show preview when viewing a page and no tool panel open
      if (middlePanel?.type === "page" && mergedDoc) {
        return (
          <RightPanel>
            <PreviewPanel>
              <PagePreview page={mergedDoc} />
            </PreviewPanel>
          </RightPanel>
        );
      }
      // Show category page list preview when a category is selected
      if (middlePanel?.type === "category") {
        const navCat = navData.categories.find((c) => c._key === middlePanel.key);
        if (navCat) {
          return (
            <RightPanel>
              <CategoryPreview navCat={navCat} pagesMap={navData.pagesMap} />
            </RightPanel>
          );
        }
      }
      return null;
    }

    return (
      <RightPanel>
        {/* ... existing rightPanel switch remains unchanged ... */}
      </RightPanel>
    );
  }
  ```

- [ ] **Step 4: Wrap right panel render with reorder-mode dimming**

  The current right panel render at the bottom of the JSX (line 397–398) is just `{renderRightPanel()}`. Because the right panel might or might not render, we need to only wrap it when it renders. Replace with:

  ```tsx
  {
    /* ── Right: Section tools or preview ── */
  }
  {
    isReorderMode ? (
      <div
        style={{
          opacity: 0.3,
          pointerEvents: "none",
          display: "flex",
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        {renderRightPanel()}
      </div>
    ) : (
      renderRightPanel()
    );
  }
  ```

- [ ] **Step 5: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add sanity/components/UnifiedPagesTool.tsx
  git commit -m "feat(unified-pages): system page fixed width, CategoryPreview right panel"
  ```

---

## Self-Review

### Spec Coverage Check

| Spec requirement                                             | Task                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Replace D&D with ↑↓ arrows in LeftPanel                      | Task 3                                                         |
| Collapse categories on enter reorder mode                    | Task 3 (CategoryRow: `showItems = !isReorderMode && expanded`) |
| 完了 + キャンセル side-by-side                               | Task 3, Step 4                                                 |
| 完了 disabled while saveStatus dirty/saving                  | Task 3, Step 4 (disabled prop + style)                         |
| キャンセル reverts localCategories                           | Task 3, Step 3 (`handleCancelReorder`)                         |
| Middle + right panels dimmed in reorder mode                 | Task 3, Step 6 + Task 7, Step 4                                |
| Remove hidden toggle from PageRow in LeftPanel               | Task 4                                                         |
| Hidden pages: opacity 0.45 + muted color in LeftPanel        | Task 4, Step 1                                                 |
| Remove NavPublishBar from UI                                 | Task 2                                                         |
| Auto-publish after saveToSanity succeeds                     | Task 1                                                         |
| Race condition: 完了 disabled while dirty/saving             | Task 3, Step 4                                                 |
| Show JP + EN labels in CategoryManagement header             | Task 5, Step 2                                                 |
| Pencil icon to enter rename inline                           | Task 5, Step 2                                                 |
| Remove bottom "カテゴリ名を変更" button                      | Task 5, Step 3                                                 |
| Fixed-width (480px) middle panel for system pages            | Task 7, Step 2                                                 |
| CategoryPreview component (read-only page list)              | Task 6                                                         |
| Render CategoryPreview in right panel for category selection | Task 7, Step 3                                                 |
| Hidden pages in CategoryPreview styled with opacity + muted  | Task 6, Step 1                                                 |

All spec requirements are covered. ✓

### Placeholder Scan

No TBD, TODO, or incomplete steps found. All code blocks are complete and runnable.

### Type Consistency Check

- `NavCategoryRaw`, `NavPageDoc`, `CategoryDoc`, `MiddlePanelState`, `NavSaveStatus` — used consistently with the types defined in `types.ts` and `useNavData.ts`.
- `publishNavDirectly(draft: NavigationDoc)` — defined in Task 1, called in Task 1 (saveToSanity) and Task 1 (publishNav). Consistent.
- `onReorderModeChange?(active: boolean)` — optional prop defined in Task 3, passed in Task 3 (UnifiedPagesTool). Consistent.
- `CategoryPreview({ navCat, pagesMap })` — created in Task 6, imported and used in Task 7. Consistent.
- `handleMoveCategory(idx, direction)` used in Task 3 — defined in Step 3, called in Step 5. Consistent.
