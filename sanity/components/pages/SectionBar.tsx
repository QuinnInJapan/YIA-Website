"use client";

import { ChevronDownIcon, ChevronRightIcon, TrashIcon } from "@sanity/icons";
import { i18nGet } from "../shared/i18n";
import type { SectionItem, SectionTypeName } from "./types";
import { SECTION_TYPE_LABELS } from "./types";

export function SectionBar({
  section,
  index,
  totalCount,
  isExpanded,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  section: SectionItem;
  index: number;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const typeLabel = SECTION_TYPE_LABELS[section._type as SectionTypeName] ?? section._type;
  const title = i18nGet(section.title, "ja");
  const titleless = ["gallery", "flyers", "warnings"].includes(section._type);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 4,
        background: isExpanded
          ? "var(--card-bg-color)"
          : "var(--card-code-bg-color, rgba(0,0,0,0.03))",
        border: isExpanded
          ? "1px solid var(--card-focus-ring-color, #4a90d9)"
          : "1px solid var(--card-border-color)",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={onToggle}
    >
      {/* Expand chevron */}
      <span style={{ flexShrink: 0, color: "var(--card-muted-fg-color)" }}>
        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </span>

      {/* Type badge */}
      <span
        style={{
          flexShrink: 0,
          padding: "1px 6px",
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          background: "var(--card-border-color)",
          color: "var(--card-muted-fg-color)",
          whiteSpace: "nowrap",
        }}
      >
        {typeLabel}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title || (titleless ? "" : "（タイトルなし）")}
      </span>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          title="上へ移動"
          style={{
            padding: "2px 4px",
            border: "none",
            borderRadius: 3,
            background: "transparent",
            color: index === 0 ? "var(--card-border-color)" : "var(--card-muted-fg-color)",
            cursor: index === 0 ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
          title="下へ移動"
          style={{
            padding: "2px 4px",
            border: "none",
            borderRadius: 3,
            background: "transparent",
            color:
              index === totalCount - 1 ? "var(--card-border-color)" : "var(--card-muted-fg-color)",
            cursor: index === totalCount - 1 ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          ▼
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="削除"
          style={{
            padding: "2px 4px",
            border: "none",
            borderRadius: 3,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
          }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
