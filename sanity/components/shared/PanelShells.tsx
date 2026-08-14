"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@sanity/icons";

export function CollapsibleListPanel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="studio-list-panel studio-list-panel--collapsed">
        <button
          type="button"
          className="studio-panel-rail-button"
          aria-label={`${label}を開く`}
          title={`${label}を開く`}
          aria-expanded="false"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRightIcon />
          <span>{label}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="studio-list-panel">
      <button
        type="button"
        className="studio-panel-collapse-button studio-panel-collapse-button--left"
        aria-label={`${label}を閉じる`}
        title={`${label}を閉じる`}
        aria-expanded="true"
        onClick={() => setCollapsed(true)}
      >
        <ChevronLeftIcon />
      </button>
      {children}
    </div>
  );
}
