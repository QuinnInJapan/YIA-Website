"use client";

import { BilingualInput } from "../../shared/BilingualInput";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import type { SectionItem } from "../types";

export function DefinitionsSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  // definition items have term + definition fields, map to label + value for KeyValueListEditor
  const items =
    (section.items as {
      _key: string;
      term?: { _key: string; value: string }[] | null;
      definition?: { _key: string; value: string }[] | null;
    }[]) ?? [];

  const mapped = items.map((item) => ({
    _key: item._key,
    label: item.term,
    value: item.definition,
  }));

  function handleChange(
    updated: {
      _key: string;
      label?: { _key: string; value: string }[] | null;
      value?: { _key: string; value: string }[] | null;
    }[],
  ) {
    onUpdateField(
      "items",
      updated.map((item) => ({
        _key: item._key,
        _type: "definition",
        term: item.label,
        definition: item.value,
      })),
    );
  }

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <KeyValueListEditor
        label="用語と定義"
        labelHeader="用語"
        valueHeader="定義"
        items={mapped}
        onChange={handleChange}
      />
    </>
  );
}
