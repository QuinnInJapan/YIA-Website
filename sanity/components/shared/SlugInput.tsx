"use client";

import { Button, TextInput } from "@sanity/ui";
import { fs } from "@/sanity/lib/studioTokens";
import type { SlugUniquenessStatus } from "./useSlugUniqueness";

export function SlugInput({
  id,
  label,
  value,
  publicUrlPrefix,
  formatError,
  uniquenessStatus,
  onChange,
  onRetry,
}: {
  id: string;
  label: string;
  value: string;
  publicUrlPrefix: string;
  formatError: string | null;
  uniquenessStatus: SlugUniquenessStatus;
  onChange: (slug: string) => void;
  onRetry: () => void;
}) {
  const uniquenessError =
    uniquenessStatus === "collision"
      ? "この公開URLは別の記事で使用されています。別の文字列に変更してください。"
      : uniquenessStatus === "error"
        ? "公開URLの重複を確認できませんでした。通信状況を確認してください。"
        : null;
  const error = formatError ?? uniquenessError;
  const helpId = `${id}-help`;

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: fs.label,
          color: "var(--card-muted-fg-color)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <TextInput
        id={id}
        fontSize={0}
        value={value}
        placeholder="summer-event"
        aria-invalid={Boolean(error)}
        aria-busy={uniquenessStatus === "checking"}
        aria-describedby={helpId}
        style={error ? { borderColor: "#b42318", boxShadow: "0 0 0 1px #b42318" } : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <div
        id={helpId}
        role={error ? "alert" : "status"}
        aria-live="polite"
        style={{
          marginTop: 6,
          color: error ? "#b42318" : "var(--card-muted-fg-color)",
          fontSize: fs.meta,
          lineHeight: 1.5,
        }}
      >
        {error ??
          (uniquenessStatus === "checking"
            ? "公開URLの重複を確認しています…"
            : uniquenessStatus === "available"
              ? `使用できます。公開URL：${publicUrlPrefix}${value}`
              : "公開URLを入力すると重複を確認します。")}
      </div>
      {uniquenessStatus === "error" && !formatError ? (
        <Button
          text="重複確認を再試行"
          mode="ghost"
          tone="caution"
          fontSize={0}
          padding={1}
          style={{ marginTop: 6 }}
          onClick={onRetry}
        />
      ) : null}
    </div>
  );
}
