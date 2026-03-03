import { getSiteData } from "@/lib/data";
import { withBasePath } from "@/lib/basePath";

export default function SiteHeader() {
  const { site } = getSiteData();
  const { org } = site;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href={withBasePath("/")} className="site-header__identity">
          <div className="site-header__designation">{org.designation}</div>
          <div className="site-header__name-jp">{org.nameJa}</div>
          <div className="site-header__name-en">{org.nameEn}</div>
        </a>
      </div>
    </header>
  );
}
