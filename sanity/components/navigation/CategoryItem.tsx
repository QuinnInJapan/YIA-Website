// sanity/components/navigation/CategoryItem.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet } from "../shared/i18n";
import type { NavCategoryRaw, CategoryDoc, PageDoc, RightPanelState } from "./types";
import { DragHandle } from "./DragHandle";

export function CategoryItem({
  navCategory,
  categoryDoc,
  pagesMap,
  isActive,
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
  isActive: boolean;
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

  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  const thumbUrl = useMemo(() => {
    if (!categoryDoc?.heroImage?.asset?._ref) return null;
    return builder
      .image(categoryDoc.heroImage)
      .width(96)
      .height(56)
      .fit("crop")
      .auto("format")
      .url();
  }, [categoryDoc, builder]);

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
        background: isActive
          ? "var(--card-bg2-color, #f5f5f5)"
          : isDragging
            ? "var(--card-bg2-color, #f5f5f5)"
            : undefined,
      }}
    >
      {/* Category header row */}
      <div
        onClick={() => onOpenPanel({ type: "editCategory", categoryKey: navCategory._key })}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          cursor: "pointer",
          userSelect: "none",
          gap: 8,
        }}
      >
        <DragHandle />
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
          {pageCount}ページ
        </span>

        {/* Thumbnail accent */}
        <div
          style={{
            width: 48,
            height: 28,
            borderRadius: 3,
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--card-muted-bg-color, #eee)",
          }}
        >
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
        </div>

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
    </div>
  );
}
