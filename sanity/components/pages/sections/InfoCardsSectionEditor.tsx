"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function InfoCardsSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const items = (section.items as { _key: string; [key: string]: unknown }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <KeyValueListEditor
        label="項目"
        labelHeader="タイトル"
        valueHeader="文章"
        fieldNames={{ label: "term", value: "definition" }}
        placeholders={{
          labelJa: "例：在留資格",
          labelEn: "e.g., Residence Status",
          valueJa: "例：外国人が日本に滞在するための法的身分",
          valueEn: "e.g., Legal status required to stay in Japan",
        }}
        addLabel="＋ 項目を追加"
        items={items}
        onChange={(updated) =>
          onUpdateField(
            "items",
            updated.map((item) => ({ ...item, _type: "definition" })),
          )
        }
      />
    </>
  );
}
