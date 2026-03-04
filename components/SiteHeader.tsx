import Link from "next/link";
import { getSiteData } from "@/lib/data";

export default async function SiteHeader() {
  const { site } = await getSiteData();
  const { org } = site;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__identity">
          <div className="site-header__designation">{org.designation}</div>
          <div className="site-header__name-jp">{org.nameJa}</div>
          <div className="site-header__name-en" lang="en">{org.nameEn}</div>
        </Link>
      </div>
    </header>
  );
}
