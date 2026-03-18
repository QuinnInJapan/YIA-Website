"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function InfoTableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const rows =
    (section.rows as {
      _key: string;
      label?: { _key: string; value: string }[] | null;
      value?: { _key: string; value: string }[] | null;
    }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <KeyValueListEditor
        label="行"
        labelHeader="ラベル"
        valueHeader="値"
        items={rows}
        onChange={(items) => onUpdateField("rows", items)}
      />

      <BilingualInput
        label="予約についての注意"
        value={section.appointmentNote as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("appointmentNote", val)}
      />
      <BilingualInput
        label="追加言語の注意"
        value={section.additionalLanguageNote as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("additionalLanguageNote", val)}
      />
      <BilingualInput
        label="その他の注意"
        value={section.otherNotes as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("otherNotes", val)}
      />
    </>
  );
}
