interface SectionHeaderProps {
  text: string;
  textEn?: string;
  variant?: string;
  cat?: string;
  level?: number;
  id?: string;
}

export default function SectionHeader({
  text,
  textEn,
  variant = "navy",
  cat,
  level = 2,
  id,
}: SectionHeaderProps) {
  const cls = cat
    ? "section-header"
    : `section-header section-header--${variant}`;

  const props = {
    className: cls,
    id,
    ...(cat ? { "data-cat": cat } : {}),
  };

  const children = (
    <>
      {text}
      {textEn && <span className="section-header__en"> {textEn}</span>}
    </>
  );

  switch (level) {
    case 1: return <h1 {...props}>{children}</h1>;
    case 3: return <h3 {...props}>{children}</h3>;
    case 4: return <h4 {...props}>{children}</h4>;
    default: return <h2 {...props}>{children}</h2>;
  }
}
