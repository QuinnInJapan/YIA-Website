interface ChecklistItem {
  labelJa: string;
  labelEn?: string;
  noteJa?: string;
  noteEn?: string;
}

interface ChecklistProps {
  items: ChecklistItem[];
}

export default function Checklist({ items }: ChecklistProps) {
  return (
    <ul className="checklist">
      {items.map((it, i) => (
        <li className="checklist__item" key={i}>
          <strong>{it.labelJa}</strong>
          {it.noteJa && (
            <span className="checklist__note"> — {it.noteJa}</span>
          )}
          {it.labelEn && (
            <>
              <br />
              <span className="checklist__label-en">
                {it.labelEn}
                {it.noteEn ? ` — ${it.noteEn}` : ""}
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
