import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";

interface ChecklistItem {
  label: I18nString;
  note?: I18nString;
}

interface ChecklistProps {
  items: ChecklistItem[];
}

export default function Checklist({ items }: ChecklistProps) {
  return (
    <ul className="checklist">
      {items.map((it, i) => (
        <li className="checklist__item" key={i}>
          <strong>{ja(it.label)}</strong>
          {ja(it.note) && (
            <span className="checklist__note"> — {ja(it.note)}</span>
          )}
          {en(it.label) && (
            <>
              <br />
              <span className="checklist__label-en" lang="en" translate="no">
                {en(it.label)}
                {en(it.note) ? ` — ${en(it.note)}` : ""}
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
