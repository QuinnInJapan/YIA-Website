import { getSiteData } from "@/lib/data";

export default function SiteHeader() {
  const { site } = getSiteData();
  const { org } = site;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="/" className="site-header__identity">
          <div className="site-header__designation">{org.designation}</div>
          <div className="site-header__name-jp">{org.nameJa}</div>
          <div className="site-header__name-en">{org.nameEn}</div>
        </a>
      </div>
    </header>
  );
}
