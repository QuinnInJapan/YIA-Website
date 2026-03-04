import { getSiteData } from "@/lib/data";
import { formatDateDot } from "@/lib/date-format";
import type { Document } from "@/lib/types";

interface SiteFooterProps {
  documents?: Document[];
}

export default async function SiteFooter({
  documents,
}: SiteFooterProps) {
  const { site } = await getSiteData();
  const { org } = site;

  return (
    <footer className="site-footer">
      <div className="site-footer__identity">
        <div className="site-footer__designation">{org.designation}</div>
        <div className="site-footer__name">{org.nameJa}</div>
        <div className="site-footer__name-en" lang="en">{org.nameEn}</div>
      </div>
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
        最終更新日 Last Updated: {formatDateDot(org.lastUpdated)}
      </div>
      <div className="site-footer__copyright">
        &copy; {org.nameEn} ({org.abbreviation})
      </div>
    </footer>
  );
}
