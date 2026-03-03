interface ResourceLinkProps {
  type: string;
  url: string;
  titleJa: string;
  titleEn?: string;
}

export default function ResourceLink({
  type,
  url,
  titleJa,
  titleEn,
}: ResourceLinkProps) {
  const icon = type === "youtube" ? "▶ " : "";
  return (
    <div className="resource-link">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {icon}
        {titleJa}
      </a>
      {titleEn && (
        <span className="resource-link__en" lang="en">
          {titleEn}
        </span>
      )}
    </div>
  );
}
