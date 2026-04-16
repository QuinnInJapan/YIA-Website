"use client";

import { TextInput } from "@sanity/ui";
import { i18nGet, i18nSet } from "./i18n";

export function BilingualInput({
  label,
  value,
  onChange,
  fontSize = 1,
}: {
  label: string;
  value: { _key: string; value: string }[] | null | undefined;
  onChange: (value: { _key: string; value: string }[]) => void;
  fontSize?: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 3 }}>
            日本語
          </div>
          <TextInput
            fontSize={fontSize}
            value={i18nGet(value, "ja")}
            onChange={(e) => onChange(i18nSet(value, "ja", e.currentTarget.value))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 3 }}>
            English
          </div>
          <TextInput
            fontSize={fontSize}
            value={i18nGet(value, "en")}
            onChange={(e) => onChange(i18nSet(value, "en", e.currentTarget.value))}
          />
        </div>
      </div>
    </div>
  );
}
