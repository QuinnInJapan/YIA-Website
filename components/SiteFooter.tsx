import { stegaClean } from "next-sanity";
import { getSiteData } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
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
      {documents && documents.length > 0 && (
        <div className="site-footer__docs">
          <div className="site-footer__docs-title">公開資料 Documents</div>
          <div className="site-footer__docs-links">
            {documents.map((d, i) => (
              <span key={i}>
                {i > 0 && (
                  <span className="site-footer__docs-sep">&middot;</span>
                )}{" "}
                <a href={stegaClean(d.url)}>
                  {ja(d.label)}
                  {en(d.label) ? ` / ${en(d.label)}` : ""}
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
        &copy; {en(org.name)} ({org.abbreviation})
      </div>
    </footer>
  );
}
