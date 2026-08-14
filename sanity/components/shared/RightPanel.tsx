"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@sanity/icons";

export function RightPanel({
  children,
  mode = "panel",
}: {
  children: React.ReactNode;
  mode?: "panel" | "workspace";
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (mode === "panel" && collapsed) {
    return (
      <div className="studio-right-panel studio-right-panel--collapsed">
        <button
          type="button"
          className="studio-panel-rail-button"
          aria-label="プレビュー・ツールパネルを開く"
          title="プレビュー・ツールパネルを開く"
          aria-expanded="false"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeftIcon />
          <span>プレビュー</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`studio-right-panel studio-right-panel--${mode}`}>
      {mode === "panel" ? (
        <button
          type="button"
          className="studio-panel-collapse-button studio-panel-collapse-button--right"
          aria-label="プレビュー・ツールパネルを閉じる"
          title="プレビュー・ツールパネルを閉じる"
          aria-expanded="true"
          onClick={() => setCollapsed(true)}
        >
          <ChevronRightIcon />
        </button>
      ) : null}
      {children}
    </div>
  );
}
