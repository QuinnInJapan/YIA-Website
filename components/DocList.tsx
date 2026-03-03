import type { Document } from "@/lib/types";

interface DocListProps {
  docs: Document[];
  sidebar?: boolean;
}

export default function DocList({ docs, sidebar }: DocListProps) {
  return (
    <ul className={`doc-list${sidebar ? " doc-list--sidebar" : ""}`}>
      {docs.map((d, i) => (
        <li className="doc-list__item" key={i}>
          <a href={d.url}>
            <span className="doc-list__label">
              {d.label}
              {d.labelEn ? ` / ${d.labelEn}` : ""}
            </span>{" "}
            <span className="doc-list__type">({d.type || "PDF"})</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
