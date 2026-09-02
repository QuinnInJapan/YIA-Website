"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

const BASE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 4,
  background: "transparent",
  cursor: "pointer",
  color: "var(--card-fg-color)",
};

const ACTIVE_STYLE: CSSProperties = {
  background: "var(--card-muted-bg-color)",
  borderColor: "var(--card-link-color)",
  color: "var(--card-link-color)",
};

export function RichTextToolbarButton({
  label,
  title = label,
  pressed,
  expanded,
  disabled,
  onActivate,
  children,
}: {
  label: string;
  title?: string;
  pressed?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  onActivate: () => void;
  children: ReactNode;
}) {
  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (event.button === 0 && !disabled) onActivate();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Keyboard and assistive-technology activation produces a detail-less click.
    if (event.detail === 0 && !disabled) onActivate();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if ((event.key === "Enter" || event.key === " ") && !disabled) {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      title={title}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        ...BASE_STYLE,
        ...(pressed ? ACTIVE_STYLE : null),
        ...(disabled ? { cursor: "not-allowed", opacity: 0.45 } : null),
      }}
    >
      {children}
    </button>
  );
}
