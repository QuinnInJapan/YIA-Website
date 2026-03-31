"use client";

import { i18nGet } from "../shared/i18n";
import type { I18nString } from "../homepage/types";

export function PageItem({
  title,
  hidden,
  onToggleHidden,
}: {
  title: I18nString[] | undefined;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const ja = i18nGet(title, "ja") || "Untitled";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0 6px 24px",
        opacity: hidden ? 0.45 : 1,
      }}
    >
      <span
        style={{
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {ja}
      </span>
      <button
        type="button"
        onClick={onToggleHidden}
        style={{
          fontSize: 11,
          padding: "2px 8px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          background: hidden
            ? "var(--card-bg-color)"
            : "var(--card-badge-default-bg-color, #e6f0e6)",
          color: hidden
            ? "var(--card-muted-fg-color)"
            : "var(--card-badge-default-fg-color, #2d6a2d)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          marginLeft: 8,
        }}
      >
        {hidden ? "非表示" : "表示中"}
      </button>
    </div>
  );
}
