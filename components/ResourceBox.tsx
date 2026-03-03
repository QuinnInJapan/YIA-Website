interface ResourceBoxLink {
  lang: string;
  label: string;
  subtitle?: string;
  url?: string;
}

interface ResourceBoxProps {
  titleJa: string;
  titleEn?: string;
  links: ResourceBoxLink[];
  attribution?: string;
}

export default function ResourceBox({
  titleJa,
  titleEn,
  links,
  attribution,
}: ResourceBoxProps) {
  return (
    <div className="resource-box">
      <h3 className="resource-box__title">
        {titleJa}
        {titleEn ? ` ${titleEn}` : ""}
      </h3>
      <ul className="resource-box__links">
        {links.map((l, i) => (
          <li lang={l.lang} key={i}>
            <a href={l.url || "#"}>
              {l.label}
              {l.subtitle && (
                <span className="resource-box__subtitle"> {l.subtitle}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
      {attribution && (
        <p className="resource-box__attribution">{attribution}</p>
      )}
    </div>
  );
}
