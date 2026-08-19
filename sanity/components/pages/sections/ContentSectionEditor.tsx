"use client";

import type { PortableTextBlock } from "@portabletext/editor";
import { fs } from "@/sanity/lib/studioTokens";
import { BilingualInput } from "../../shared/BilingualInput";
import { SimpleBodyEditor } from "../../shared/SimpleBodyEditor";
import { i18nGetBody, i18nSetBody } from "../../shared/i18n";
import type { SectionItem } from "../types";

type I18nBlocks = { _key: string; value: PortableTextBlock[] }[];

export function ContentSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const body = (section.body ?? null) as I18nBlocks | null;

  return (
    <>
      <BilingualInput
        label="見出し（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: fs.label,
            fontWeight: 600,
            color: "var(--card-fg-color)",
            marginBottom: 6,
          }}
        >
          本文
        </div>
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: "var(--card-fg-color)",
              marginBottom: 3,
            }}
          >
            日本語
          </div>
          <SimpleBodyEditor
            initialValue={i18nGetBody(body, "ja")}
            onChange={(val) => onUpdateField("body", i18nSetBody(body, "ja", val))}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: "var(--card-fg-color)",
              marginBottom: 3,
            }}
          >
            英語（任意・運用検討中）
          </div>
          <SimpleBodyEditor
            initialValue={i18nGetBody(body, "en")}
            onChange={(val) => onUpdateField("body", i18nSetBody(body, "en", val))}
          />
        </div>
      </div>
    </>
  );
}
