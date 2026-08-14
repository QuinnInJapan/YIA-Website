"use client";

import { useEffect, useRef } from "react";
import { Button, Flex, Text } from "@sanity/ui";
import { CloseIcon, PublishIcon } from "@sanity/icons";
import { fs } from "@/sanity/lib/studioTokens";

export interface PublishCheck {
  label: string;
  detail?: string;
  tone: "ok" | "warning" | "error";
}

export function PublishConfirmation({
  title,
  description,
  checks,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  checks: PublishCheck[];
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasErrors = checks.some((check) => check.tone === "error");

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--card-backdrop-color, rgba(15, 25, 50, 0.55))",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
        aria-describedby="publish-dialog-description"
        style={{
          width: "min(520px, 100%)",
          maxHeight: "min(720px, calc(100vh - 48px))",
          overflow: "auto",
          border: "1px solid var(--card-border-color)",
          borderRadius: 8,
          background: "var(--card-bg-color)",
          color: "var(--card-fg-color)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
        }}
      >
        <div style={{ padding: 20, borderBottom: "1px solid var(--card-border-color)" }}>
          <Flex align="center" justify="space-between" gap={3}>
            <div>
              <Text id="publish-dialog-title" size={2} weight="semibold">
                {title}
              </Text>
              <Text
                id="publish-dialog-description"
                size={1}
                muted
                style={{ display: "block", marginTop: 6, lineHeight: 1.6 }}
              >
                {description}
              </Text>
            </div>
            <button
              ref={closeRef}
              type="button"
              aria-label="確認画面を閉じる"
              title="閉じる"
              onClick={onClose}
              disabled={busy}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                border: "none",
                borderRadius: 4,
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </Flex>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {checks.map((check) => {
              const colors = {
                ok: { bg: "rgba(45, 120, 80, 0.1)", fg: "#2d7850", mark: "✓" },
                warning: { bg: "rgba(133, 95, 7, 0.1)", fg: "#855f07", mark: "!" },
                error: { bg: "rgba(204, 51, 51, 0.1)", fg: "#b42318", mark: "×" },
              }[check.tone];
              return (
                <div
                  key={`${check.label}-${check.detail ?? ""}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: colors.bg,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: colors.fg, fontWeight: 700, width: 16, textAlign: "center" }}
                  >
                    {colors.mark}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: fs.body, fontWeight: 600 }}>{check.label}</div>
                    {check.detail ? (
                      <div style={{ fontSize: fs.meta, marginTop: 2, lineHeight: 1.5 }}>
                        {check.detail}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {hasErrors ? (
            <Text size={1} style={{ display: "block", marginTop: 16, color: "#b42318" }}>
              赤い項目を入力すると公開できます。
            </Text>
          ) : null}
        </div>

        <Flex
          justify="flex-end"
          gap={2}
          style={{ padding: 16, borderTop: "1px solid var(--card-border-color)" }}
        >
          <Button text="編集に戻る" mode="ghost" onClick={onClose} disabled={busy} />
          <Button
            icon={PublishIcon}
            text={busy ? "公開中…" : "この内容を公開"}
            tone="positive"
            onClick={onConfirm}
            disabled={busy || hasErrors}
          />
        </Flex>
      </div>
    </div>
  );
}

export function StudioErrorBanner({
  message,
  actionLabel,
  onAction,
  onDismiss,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        margin: "10px 12px 0",
        padding: "10px 12px",
        border: "1px solid rgba(180, 35, 24, 0.35)",
        borderRadius: 6,
        background: "rgba(204, 51, 51, 0.08)",
        color: "var(--card-fg-color)",
      }}
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Text size={1} style={{ lineHeight: 1.5 }}>
          {message}
        </Text>
        <Flex gap={1}>
          {actionLabel && onAction ? (
            <Button text={actionLabel} mode="ghost" tone="critical" onClick={onAction} />
          ) : null}
          {onDismiss ? (
            <Button
              icon={CloseIcon}
              mode="bleed"
              aria-label="エラーを閉じる"
              onClick={onDismiss}
            />
          ) : null}
        </Flex>
      </Flex>
    </div>
  );
}

export function ActionConfirmation({
  title,
  description,
  confirmLabel,
  busy,
  tone = "critical",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  tone?: "critical" | "caution";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--card-backdrop-color, rgba(15, 25, 50, 0.55))",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        aria-describedby="action-dialog-description"
        style={{
          width: "min(440px, 100%)",
          padding: 20,
          border: "1px solid var(--card-border-color)",
          borderRadius: 8,
          background: "var(--card-bg-color)",
          color: "var(--card-fg-color)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
        }}
      >
        <Text id="action-dialog-title" size={2} weight="semibold">
          {title}
        </Text>
        <Text
          id="action-dialog-description"
          size={1}
          muted
          style={{ display: "block", marginTop: 10, lineHeight: 1.7 }}
        >
          {description}
        </Text>
        <Flex justify="flex-end" gap={2} style={{ marginTop: 20 }}>
          <Button ref={cancelRef} text="キャンセル" mode="ghost" onClick={onClose} disabled={busy} />
          <Button
            text={busy ? "処理中…" : confirmLabel}
            tone={tone}
            onClick={onConfirm}
            disabled={busy}
          />
        </Flex>
      </div>
    </div>
  );
}
