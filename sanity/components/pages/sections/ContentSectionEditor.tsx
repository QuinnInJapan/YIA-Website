"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { BilingualTextarea } from "../../shared/BilingualTextarea";
import type { SectionItem } from "../types";

export function ContentSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <BilingualTextarea
        label="説明"
        value={section.description as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("description", val)}
      />
    </>
  );
}
