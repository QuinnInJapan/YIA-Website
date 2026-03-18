"use client";

import { i18nGet, i18nSet } from "./i18n";

export function BilingualTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: { _key: string; value: string }[] | null | undefined;
  onChange: (value: { _key: string; value: string }[]) => void;
  rows?: number;
}) {
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid var(--card-border-color)",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "inherit",
    resize: "vertical",
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
          <textarea
            rows={rows}
            value={i18nGet(value, "ja")}
            onChange={(e) => onChange(i18nSet(value, "ja", e.target.value))}
            style={textareaStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 3 }}>
            English
          </div>
          <textarea
            rows={rows}
            value={i18nGet(value, "en")}
            onChange={(e) => onChange(i18nSet(value, "en", e.target.value))}
            style={textareaStyle}
          />
        </div>
      </div>
    </div>
  );
}
