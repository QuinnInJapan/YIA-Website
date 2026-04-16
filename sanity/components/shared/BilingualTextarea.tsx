"use client";

import { useEffect, useRef } from "react";
import { i18nGet, i18nSet } from "./i18n";

export function AutoTextarea({
  value,
  onChange,
  style,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  style: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...style, overflow: "hidden", resize: "none" }}
    />
  );
}

export function BilingualTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { _key: string; value: string }[] | null | undefined;
  onChange: (value: { _key: string; value: string }[]) => void;
}) {
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid var(--card-border-color)",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "inherit",
    background: "transparent",
    color: "inherit",
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 3 }}>
            日本語
          </div>
          <AutoTextarea
            value={i18nGet(value, "ja")}
            onChange={(v) => onChange(i18nSet(value, "ja", v))}
            style={textareaStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 3 }}>
            English
          </div>
          <AutoTextarea
            value={i18nGet(value, "en")}
            onChange={(v) => onChange(i18nSet(value, "en", v))}
            style={textareaStyle}
          />
        </div>
      </div>
    </div>
  );
}
