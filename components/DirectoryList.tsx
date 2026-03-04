interface DirectoryEntry {
  nameJa: string;
  tel: string;
  url?: string;
}

interface DirectoryListProps {
  entries: DirectoryEntry[];
}

export default function DirectoryList({ entries }: DirectoryListProps) {
  return (
    <div className="directory-list">
      {entries.map((e, i) => (
        <div className="directory-entry" key={i}>
          <div className="directory-entry__name">
            {e.url ? (
              <a href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`${e.nameJa} (opens in new tab)`} className="external-link">
                {e.nameJa}
              </a>
            ) : (
              e.nameJa
            )}
          </div>
          <div className="directory-entry__phone">{e.tel}</div>
        </div>
      ))}
    </div>
  );
}
