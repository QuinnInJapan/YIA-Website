// sanity/components/unified-pages/LeftPanel.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Flex, Stack, Text } from "@sanity/ui";
import { LoadingDots } from "../shared/ui";
import { SYSTEM_PAGES, shortId } from "./types";
import type { NavCategoryRaw, NavPageDoc, CategoryDoc, MiddlePanelState } from "./types";
import type { NavSaveStatus } from "./useNavData";

function PageRow({
  pageId,
  title,
  hasDraft,
  hidden,
  isSelected,
  isDragging,
  draggable,
  onSelect,
  onToggleHidden,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  pageId: string;
  title: string;
  hasDraft: boolean;
  hidden: boolean;
  isSelected: boolean;
  isDragging?: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
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
        opacity: isDragging ? 0.4 : 1,
        cursor: draggable ? "grab" : "pointer",
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          fontSize: 13,
          color: "var(--card-fg-color)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        {title}
      </button>
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden();
        }}
        title={hidden ? "非表示（クリックで表示）" : "表示中（クリックで非表示）"}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "2px 4px",
          fontSize: 11,
          borderRadius: 3,
          color: hidden ? "var(--card-muted-fg-color)" : "var(--green-600, #16a34a)",
          flexShrink: 0,
        }}
      >
        {hidden ? "○ 非表示" : "● 表示中"}
      </button>
    </div>
  );
}

function CategoryRow({
  navCat,
  categoryDoc,
  pagesMap,
  selectedMiddle,
  isReorderMode,
  isDragging,
  onSelectCategory,
  onSelectPage,
  onTogglePageHidden,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  navCat: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, NavPageDoc>;
  selectedMiddle: MiddlePanelState;
  isReorderMode: boolean;
  isDragging: boolean;
  onSelectCategory: (key: string) => void;
  onSelectPage: (id: string) => void;
  onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const label = categoryDoc?.label?.find((l) => l._key === "ja")?.value ?? "（カテゴリ名なし）";
  const isCategorySelected =
    selectedMiddle?.type === "category" && selectedMiddle.key === navCat._key;

  return (
    <div
      style={{ opacity: isDragging ? 0.4 : 1 }}
      draggable={isReorderMode}
      onDragStart={isReorderMode ? onDragStart : undefined}
      onDragOver={isReorderMode ? onDragOver : undefined}
      onDragEnd={isReorderMode ? onDragEnd : undefined}
    >
      <button
        type="button"
        onClick={() => {
          if (!isReorderMode) onSelectCategory(navCat._key);
          setExpanded((v) => !v);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          padding: "8px 8px",
          border: "none",
          borderRadius: 4,
          background: isCategorySelected ? "var(--card-border-color)" : "transparent",
          cursor: isReorderMode ? "grab" : "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--card-fg-color)",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.5 }}>{expanded ? "▼" : "▶"}</span>
        {label}
      </button>
      {expanded && (
        <div>
          {(navCat.items ?? []).map((item) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
            const hasDraft = false; // will be set by subscription in parent
            return (
              <PageRow
                key={item._key}
                pageId={item.pageRef._ref}
                title={titleJa}
                hasDraft={hasDraft}
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
}) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localCategories, setLocalCategories] = useState<NavCategoryRaw[]>(categories);
  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Keep localCategories in sync when categories prop changes (and not in reorder mode)
  const prevCategoriesRef = useRef(categories);
  if (!isReorderMode && prevCategoriesRef.current !== categories) {
    prevCategoriesRef.current = categories;
    setLocalCategories(categories);
  }

  const displayCategories = isReorderMode ? localCategories : categories;

  const handleDragStart = useCallback((idx: number, key: string) => {
    dragIdxRef.current = idx;
    setDraggingKey(key);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      const fromIdx = dragIdxRef.current;
      if (fromIdx === null || fromIdx === idx) return;
      const next = [...localCategories];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(idx, 0, moved);
      setLocalCategories(next);
      dragIdxRef.current = idx;
    },
    [localCategories],
  );

  const handleDragEnd = useCallback(() => {
    dragIdxRef.current = null;
    setDraggingKey(null);
  }, []);

  const handleCompleteReorder = useCallback(() => {
    setIsReorderMode(false);
    onReorderCategories(localCategories);
  }, [localCategories, onReorderCategories]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <LoadingDots />
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
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
          <button
            type="button"
            onClick={isReorderMode ? handleCompleteReorder : () => setIsReorderMode(true)}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              background: isReorderMode ? "var(--blue-500, #2563eb)" : "transparent",
              color: isReorderMode ? "#fff" : "var(--card-muted-fg-color)",
              cursor: "pointer",
            }}
          >
            {isReorderMode ? "完了" : "ナビの順番を変更"}
          </button>
        </Flex>
      </div>

      {/* Category tree */}
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
              isDragging={draggingKey === navCat._key}
              onSelectCategory={onSelectCategory}
              onSelectPage={onSelectPage}
              onTogglePageHidden={onTogglePageHidden}
              onDragStart={() => handleDragStart(idx, navCat._key)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Stack>

        {/* System pages */}
        <div
          style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--card-border-color)" }}
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
        <div style={{ padding: "12px 0 4px" }}>
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
      </div>
    </div>
  );
}
