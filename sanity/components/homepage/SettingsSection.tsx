"use client";

import { TextArea } from "@sanity/ui";
import { i18nGet, i18nSet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import type { SiteSettingsData, SidebarData, DocumentLinkItem, UpdateFieldFn } from "./types";

// ── Labeled input helper ────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
          color: "var(--card-muted-fg-color)",
        }}
      >
        {label}
      </label>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        fontSize={1}
        padding={2}
        rows={1}
        style={{ resize: "vertical" }}
      />
    </div>
  );
}

function I18nField({
  label,
  arr,
  onChange,
}: {
  label: string;
  arr: { _key: string; value: string }[] | undefined;
  onChange: (next: { _key: string; value: string }[]) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
          color: "var(--card-muted-fg-color)",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextArea
            value={i18nGet(arr, "ja")}
            onChange={(e) => onChange(i18nSet(arr, "ja", e.currentTarget.value))}
            placeholder="日本語"
            fontSize={1}
            padding={2}
            rows={1}
            style={{ resize: "vertical" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextArea
            value={i18nGet(arr, "en")}
            onChange={(e) => onChange(i18nSet(arr, "en", e.currentTarget.value))}
            placeholder="English"
            fontSize={1}
            padding={2}
            rows={1}
            style={{ resize: "vertical" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── SettingsSection ─────────────────────────────────

export function SettingsSection({
  siteSettings,
  sidebar,
  updateField,
  onOpenFilePicker,
  onOpenDocumentDetail,
}: {
  siteSettings: SiteSettingsData;
  sidebar: SidebarData | null;
  updateField: UpdateFieldFn;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onOpenDocumentDetail?: (
    doc: DocumentLinkItem,
    onUpdate: (doc: DocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
}) {
  const org = siteSettings.org as Record<string, unknown> | undefined;
  const contact = siteSettings.contact as Record<string, unknown> | undefined;
  const documents = (sidebar?.documents as DocumentLinkItem[] | undefined) ?? [];

  function updateOrg(field: string, value: unknown) {
    updateField("siteSettings", "siteSettings", "org", { ...org, [field]: value });
  }

  function updateContact(field: string, value: unknown) {
    updateField("siteSettings", "siteSettings", "contact", { ...contact, [field]: value });
  }

  return (
    <SectionWrapper id="section-settings" title="サイト設定">
      {/* ── Organization ── */}
      <h4
        style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px", color: "var(--card-fg-color)" }}
      >
        団体情報
      </h4>

      <Field
        label="法人格"
        value={(org?.designation as string) ?? ""}
        onChange={(v) => updateOrg("designation", v)}
        placeholder="例：公益財団法人"
      />
      <I18nField
        label="名称"
        arr={org?.name as { _key: string; value: string }[] | undefined}
        onChange={(v) => updateOrg("name", v)}
      />
      <Field
        label="略称"
        value={(org?.abbreviation as string) ?? ""}
        onChange={(v) => updateOrg("abbreviation", v)}
        placeholder="例：YIA"
      />
      <I18nField
        label="説明"
        arr={org?.description as { _key: string; value: string }[] | undefined}
        onChange={(v) => updateOrg("description", v)}
      />

      {/* ── Contact ── */}
      <h4
        style={{
          fontSize: 13,
          fontWeight: 600,
          margin: "20px 0 12px",
          color: "var(--card-fg-color)",
        }}
      >
        連絡先
      </h4>

      <Field
        label="電話番号"
        value={(contact?.tel as string) ?? ""}
        onChange={(v) => updateContact("tel", v)}
      />
      <Field
        label="FAX"
        value={(contact?.fax as string) ?? ""}
        onChange={(v) => updateContact("fax", v)}
      />
      <Field
        label="メール"
        value={(contact?.email as string) ?? ""}
        onChange={(v) => updateContact("email", v)}
      />
      <Field
        label="ウェブサイト"
        value={(contact?.website as string) ?? ""}
        onChange={(v) => updateContact("website", v)}
      />
      <Field
        label="YouTube"
        value={(contact?.youtube as string) ?? ""}
        onChange={(v) => updateContact("youtube", v)}
      />
      <I18nField
        label="住所"
        arr={contact?.address as { _key: string; value: string }[] | undefined}
        onChange={(v) => updateContact("address", v)}
      />
      <Field
        label="郵便番号"
        value={(contact?.postalCode as string) ?? ""}
        onChange={(v) => updateContact("postalCode", v)}
      />

      {/* ── Other ── */}
      <h4
        style={{
          fontSize: 13,
          fontWeight: 600,
          margin: "20px 0 12px",
          color: "var(--card-fg-color)",
        }}
      >
        その他
      </h4>

      <I18nField
        label="業務時間"
        arr={siteSettings.businessHours as { _key: string; value: string }[] | undefined}
        onChange={(v) => updateField("siteSettings", "siteSettings", "businessHours", v)}
      />
      <Field
        label="著作権表示"
        value={(siteSettings.copyright as string) ?? ""}
        onChange={(v) => updateField("siteSettings", "siteSettings", "copyright", v)}
      />
      <Field
        label="Googleマップ埋め込みURL"
        value={(siteSettings.googleMapsEmbedUrl as string) ?? ""}
        onChange={(v) => updateField("siteSettings", "siteSettings", "googleMapsEmbedUrl", v)}
      />

      {/* ── Documents (footer) ── */}
      {sidebar && (
        <>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: "20px 0 12px",
              color: "var(--card-fg-color)",
            }}
          >
            公開資料（フッター）
          </h4>

          {documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {documents.map((doc, i) => {
                const label = i18nGet(doc.label, "ja") || "（無題）";
                const typeLabel = doc.type ?? "";

                return (
                  <button
                    key={doc._key}
                    type="button"
                    onClick={() => {
                      onOpenDocumentDetail?.(
                        doc,
                        (updated) => {
                          const next = [...documents];
                          next[i] = updated as DocumentLinkItem;
                          updateField("sidebar", "sidebar", "documents", next);
                        },
                        () => {
                          const next = documents.filter((d) => d._key !== doc._key);
                          updateField("sidebar", "sidebar", "documents", next);
                        },
                      );
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 4,
                      border: "1px solid var(--card-border-color)",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--card-fg-color)",
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {doc.file ? "\u{1F4CE}" : "\u{1F517}"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </div>
                      {typeLabel && (
                        <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)" }}>
                          {typeLabel}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenFilePicker?.((assetId, filename, ext) => {
                const newDoc: DocumentLinkItem = {
                  _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                  label: [{ _key: "ja", value: filename }],
                  file: { asset: { _ref: assetId } },
                  type: ext.toUpperCase(),
                };
                updateField("sidebar", "sidebar", "documents", [...documents, newDoc]);
              });
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 0",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
            }}
          >
            + ファイルを選択
          </button>
        </>
      )}
    </SectionWrapper>
  );
}
