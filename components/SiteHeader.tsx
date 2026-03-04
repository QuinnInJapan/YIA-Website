import Link from "next/link";
import { getSiteData } from "@/lib/data";
import { ja, en } from "@/lib/i18n";

export default async function SiteHeader() {
  const { site } = await getSiteData();
  const { org, contact } = site;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__identity">
          <div className="site-header__designation">{org.designation}</div>
          <div className="site-header__name-jp">{ja(org.name)}</div>
          <div className="site-header__name-en" lang="en">{en(org.name)}</div>
        </Link>
        <div className="site-header__contact">
          <div>
            TEL: <a href={`tel:${contact.tel}`}>{contact.tel}</a> / FAX: {contact.fax}
          </div>
          <div>
            E-mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
