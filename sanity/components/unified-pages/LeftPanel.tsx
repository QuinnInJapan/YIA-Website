// sanity/components/unified-pages/LeftPanel.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Flex, Stack, Text } from "@sanity/ui";
import { LoadingDots } from "../shared/ui";
import { SYSTEM_PAGES } from "./types";
import type { NavCategoryRaw, NavPageDoc, CategoryDoc, MiddlePanelState } from "./types";
import type { NavSaveStatus } from "./useNavData";

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
  onReorderCategories,
  onReorderModeChange,
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
  onReorderCategories: (newCategories: NavCategoryRaw[]) => void;
  onReorderModeChange?: (active: boolean) => void;
}) {
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
    setLocalCategories((current) => {
      onReorderCategories(current);
      return current;
    });
    setIsReorderMode(false);
    onReorderModeChange?.(false);
  }, [onReorderCategories, onReorderModeChange]);

  const handleCancelReorder = useCallback(() => {
    setLocalCategories(preEditSnapshotRef.current);
    setIsReorderMode(false);
    onReorderModeChange?.(false);
  }, [onReorderModeChange]);

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
              idx={idx}
              totalCount={displayCategories.length}
              onSelectCategory={onSelectCategory}
              onSelectPage={onSelectPage}
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
      </div>
    </div>
  );
}
