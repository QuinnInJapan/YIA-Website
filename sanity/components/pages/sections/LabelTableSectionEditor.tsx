"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function LabelTableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const rows = (section.rows as { _key: string; [key: string]: unknown }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <KeyValueListEditor
        labelHeader="ラベル"
        valueHeader="値"
        fieldNames={{ label: "label", value: "value" }}
        placeholders={{
          labelJa: "例：開催日時",
          labelEn: "e.g., Date & Time",
          valueJa: "例：毎週月曜日 10:00〜12:00",
          valueEn: "e.g., Every Monday 10:00–12:00",
        }}
        addLabel="＋ 行を追加"
        items={rows}
        onChange={(items) =>
          onUpdateField(
            "rows",
            items.map((item) => ({ ...item, _type: "infoRow" })),
          )
        }
      />
    </>
  );
}
