import type { TocEntry } from "@/lib/section-renderer";

interface SidebarTocProps {
  entries: TocEntry[];
}

export default function SidebarToc({ entries }: SidebarTocProps) {
  if (entries.length < 2) return null;

  return (
    <nav className="ann-toc" aria-label="目次">
      <div className="ann-toc__label">
        目次 <span>Contents</span>
      </div>
      {entries.map((e) => (
        <a href={`#${e.id}`} className="ann-toc__link" key={e.id}>
          {e.textJa}
          {e.textEn && (
            <span className="ann-toc__link-en">{e.textEn}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
