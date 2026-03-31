// sanity/components/navigation/CategoryItem.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { i18nGet } from "../shared/i18n";
import { PageItem } from "./PageItem";
import type { NavCategoryRaw, NavItemRaw, CategoryDoc, PageDoc, RightPanelState } from "./types";

export function CategoryItem({
  navCategory,
  categoryDoc,
  pagesMap,
  expanded,
  onToggleExpand,
  onTogglePageHidden,
  onRemovePage,
  onOpenPanel,
  onDeleteCategory,
  // Drag props
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onOpenPanel: (panel: RightPanelState) => void;
  onDeleteCategory: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const labelJa = i18nGet(categoryDoc?.label, "ja") || "Untitled";
  const labelEn = i18nGet(categoryDoc?.label, "en");
  const pageCount = navCategory.items?.length ?? 0;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleMenuAction = useCallback(
    (action: "rename" | "delete") => {
      setMenuOpen(false);
      if (action === "rename") {
        onOpenPanel({ type: "renameCategory", categoryKey: navCategory._key });
      } else {
        onDeleteCategory();
      }
    },
    [navCategory._key, onOpenPanel, onDeleteCategory],
  );

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragEnd={onDragEnd}
      style={{
        borderBottom: "1px solid var(--card-border-color)",
        opacity: isDragging ? 0.4 : 1,
        background: isDragging ? "var(--card-bg2-color, #f5f5f5)" : undefined,
      }}
    >
      {/* Category header row */}
      <div
        onClick={onToggleExpand}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          cursor: "pointer",
          userSelect: "none",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--card-muted-fg-color)",
            width: 16,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {expanded ? "▼" : "▶"}
        </span>

        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {labelJa}
          {labelEn && (
            <span
              style={{
                fontWeight: 400,
                color: "var(--card-muted-fg-color)",
                marginLeft: 6,
                fontSize: 12,
              }}
            >
              / {labelEn}
            </span>
          )}
        </span>

        <span style={{ fontSize: 11, color: "var(--card-muted-fg-color)", flexShrink: 0 }}>
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>

        <div style={{ position: "relative", flexShrink: 0 }} ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 4px",
              color: "var(--card-muted-fg-color)",
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                zIndex: 10,
                background: "var(--card-bg-color)",
                border: "1px solid var(--card-border-color)",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                minWidth: 140,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("rename");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  color: "var(--card-fg-color)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                名前を変更
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("delete");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  color: "#cc3333",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded page list */}
      {expanded && (
        <div style={{ padding: "0 12px 10px" }}>
          {(navCategory.items ?? []).map((item) => {
            const pageDoc = pagesMap.get(item.pageRef?._ref);
            return (
              <div key={item._key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PageItem
                    title={pageDoc?.title}
                    hidden={!!item.hidden}
                    onToggleHidden={() => onTogglePageHidden(item._key)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePage(item._key)}
                  title="このページを削除"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--card-muted-fg-color)",
                    padding: "2px 4px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 8, paddingLeft: 24 }}>
            <button
              type="button"
              onClick={() => onOpenPanel({ type: "addPage", categoryKey: navCategory._key })}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: "var(--card-bg-color)",
                cursor: "pointer",
                color: "var(--card-fg-color)",
              }}
            >
              + ページを追加
            </button>
            <button
              type="button"
              onClick={() => onOpenPanel({ type: "reorderPages", categoryKey: navCategory._key })}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: "var(--card-bg-color)",
                cursor: "pointer",
                color: "var(--card-fg-color)",
              }}
            >
              並び替え
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
