import { getSiteData } from "@/lib/data";
import type { Document } from "@/lib/types";

interface SiteFooterProps {
  documents?: Document[];
  hideContact?: boolean;
}

export default function SiteFooter({
  documents,
  hideContact,
}: SiteFooterProps) {
  const { site } = getSiteData();
  const { org, contact } = site;

  return (
    <footer className="site-footer">
      {!hideContact && (
        <>
          <div className="site-footer__name">{org.nameJa}</div>
          <div className="site-footer__name-en">{org.nameEn}</div>
          <div>
            〒{contact.postalCode} {contact.addressJa}
          </div>
          <div>{contact.addressEn}</div>
          <div>
            TEL: {contact.tel} / FAX: {contact.fax}
          </div>
        </>
      )}
      {documents && documents.length > 0 && (
        <div className="site-footer__docs">
          <div className="site-footer__docs-title">公開資料 Documents</div>
          <div className="site-footer__docs-links">
            {documents.map((d, i) => (
              <span key={i}>
                {i > 0 && (
                  <span className="site-footer__docs-sep">&middot;</span>
                )}{" "}
                <a href={d.url}>
                  {d.label}
                  {d.labelEn ? ` / ${d.labelEn}` : ""}
                </a>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="site-footer__updated">
        最終更新日 Last Updated: {org.lastUpdated}
      </div>
      <div className="site-footer__copyright">
        &copy; {org.nameEn} ({org.abbreviation})
      </div>
    </footer>
  );
}
