"use client";

import { useState } from "react";
import { Button, Flex, TextInput } from "@sanity/ui";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet } from "../../shared/i18n";
import type { DocumentLinkItem as SharedDocumentLinkItem } from "../../shared/DocumentDetailPanel";
import type { SectionItem } from "../types";

interface DocumentLinkItem {
  _key: string;
  _type: "documentLink";
  label?: { _key: string; value: string }[];
  file?: { asset: { _ref: string } };
  url?: string;
  type?: string;
  fileType?: string;
}

export function LinksSectionEditor({
  section,
  onUpdateField,
  onOpenFilePicker,
  onOpenDocumentDetail,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onOpenDocumentDetail?: (
    doc: SharedDocumentLinkItem,
    onUpdate: (doc: SharedDocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
}) {
  const items = (section.items as DocumentLinkItem[]) ?? [];
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [urlLabel, setUrlLabel] = useState("");
  const [urlValue, setUrlValue] = useState("");

  function handleRemove(key: string) {
    onUpdateField(
      "items",
      items.filter((d) => d._key !== key),
    );
  }

  function handleAddUrl() {
    if (!urlLabel.trim() || !urlValue.trim()) return;
    const newDoc: DocumentLinkItem = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      _type: "documentLink",
      label: [{ _key: "ja", value: urlLabel.trim() }],
      url: urlValue.trim(),
      type: urlValue.includes("youtube") ? "youtube" : "website",
    };
    onUpdateField("items", [...items, newDoc]);
    setUrlLabel("");
    setUrlValue("");
    setShowAddUrl(false);
  }

  function handleFilePick() {
    onOpenFilePicker?.((assetId, filename, ext) => {
      const newDoc: DocumentLinkItem = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "documentLink",
        label: [{ _key: "ja", value: filename }],
        file: { asset: { _ref: assetId } },
        type: "document",
        fileType: ext,
      };
      onUpdateField("items", [...items, newDoc]);
    });
  }

  const typeLabels: Record<string, string> = {
    document: "PDF",
    youtube: "YouTube",
    website: "Web",
  };

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          リンク一覧
        </div>

        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {items.map((doc) => {
              const label = i18nGet(doc.label, "ja") || "（無題）";
              const typeLabel = doc.type ? (typeLabels[doc.type] ?? doc.type) : "";
              const fileTypeLabel = doc.fileType ?? "";
              const subtitle = [typeLabel, fileTypeLabel].filter(Boolean).join(" · ");

              return (
                <button
                  key={doc._key}
                  type="button"
                  onClick={() => {
                    onOpenDocumentDetail?.(
                      doc,
                      (updated) => {
                        onUpdateField(
                          "items",
                          items.map((d) =>
                            d._key === doc._key ? (updated as DocumentLinkItem) : d,
                          ),
                        );
                      },
                      () => handleRemove(doc._key),
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--card-fg-color)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{doc.file ? "\u{1F4CE}" : "\u{1F517}"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {label}
                    </div>
                    {subtitle && (
                      <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)" }}>
                        {subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showAddUrl ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 12,
              border: "1px solid var(--card-border-color)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <TextInput
              fontSize={0}
              placeholder="ラベル（例：申込書）"
              value={urlLabel}
              onChange={(e) => setUrlLabel(e.currentTarget.value)}
            />
            <TextInput
              fontSize={0}
              placeholder="URL（https://...）"
              value={urlValue}
              onChange={(e) => setUrlValue(e.currentTarget.value)}
            />
            <Flex gap={2}>
              <Button
                text="追加"
                tone="primary"
                fontSize={0}
                padding={2}
                onClick={handleAddUrl}
                disabled={!urlLabel.trim() || !urlValue.trim()}
              />
              <Button
                text="キャンセル"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => {
                  setShowAddUrl(false);
                  setUrlLabel("");
                  setUrlValue("");
                }}
              />
            </Flex>
          </div>
        ) : (
          <Flex gap={2}>
            <Button
              text="+ URLを追加"
              mode="ghost"
              fontSize={0}
              padding={2}
              onClick={() => setShowAddUrl(true)}
            />
            <Button
              text="+ ファイルを選択"
              mode="ghost"
              fontSize={0}
              padding={2}
              onClick={handleFilePick}
            />
          </Flex>
        )}
      </div>
    </>
  );
}
