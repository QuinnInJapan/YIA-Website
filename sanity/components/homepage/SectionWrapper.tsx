"use client";

import { useState } from "react";

export function SectionWrapper({
  id,
  title,
  children,
  onExpand,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onExpand?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  function handleToggle() {
    if (collapsed) onExpand?.();
    setCollapsed(!collapsed);
  }

  return (
    <section id={id} style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 0",
          border: "none",
          borderBottom: "1px solid var(--card-border-color)",
          background: "transparent",
          cursor: "pointer",
          color: "var(--card-fg-color)",
          fontSize: 15,
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{
            transform: collapsed ? "rotate(-90deg)" : "rotate(0)",
            transition: "transform 150ms ease",
          }}
        >
          <path d="M4 6l4 4 4-4H4z" />
        </svg>
        {title}
      </button>
      {!collapsed && <div style={{ paddingTop: 16 }}>{children}</div>}
    </section>
  );
}
