"use client";

import { useState, type ReactNode } from "react";
import { Text } from "@sanity/ui";
import { fs } from "@/sanity/lib/studioTokens";

type PreviewMode = "desktop" | "mobile";

const MOBILE_WIDTH = 390;

export function PreviewPanel({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--card-border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Text size={0} weight="semibold" muted>
          プレビュー
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Desktop / Mobile toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("desktop")}
              title="デスクトップ"
              style={{
                padding: "2px 8px",
                border: "none",
                background: mode === "desktop" ? "var(--card-border-color)" : "transparent",
                color: "var(--card-fg-color)",
                fontSize: fs.meta,
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              PC
            </button>
            <button
              type="button"
              onClick={() => setMode("mobile")}
              title="モバイル"
              style={{
                padding: "2px 8px",
                border: "none",
                borderLeft: "1px solid var(--card-border-color)",
                background: mode === "mobile" ? "var(--card-border-color)" : "transparent",
                color: "var(--card-fg-color)",
                fontSize: fs.meta,
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              SP
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="プレビューを閉じる"
              style={{
                padding: "2px 8px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                fontSize: fs.meta,
                cursor: "pointer",
              }}
            >
              閉じる
            </button>
          )}
        </div>
      </div>

      {/* Content: container-type enables @container queries keyed to preview panel width */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          background: mode === "mobile" ? "var(--card-code-bg-color, #f3f3f6)" : undefined,
        }}
      >
        <div
          style={{
            width: mode === "mobile" ? MOBILE_WIDTH : "100%",
            containerType: "inline-size",
            containerName: "preview",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
