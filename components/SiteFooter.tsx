import { stegaClean } from "next-sanity";
import { getSiteData } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { formatDateDot } from "@/lib/date-format";
import { fileUrl } from "@/lib/sanity/image";
import type { Document } from "@/lib/types";
import PdfLink from "./PdfLink";

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
                <PdfLink
                  href={fileUrl(d.file) || stegaClean(d.url) || ""}
                  title={ja(d.label) + (en(d.label) ? ` / ${en(d.label)}` : "")}
                >
                  {ja(d.label)}
                  {en(d.label) ? ` / ${en(d.label)}` : ""}
                </PdfLink>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="site-footer__updated">
        最終更新日 Last Updated: {formatDateDot(org.lastUpdated)}
      </div>
      <div className="site-footer__copyright">
        &copy; <span lang="en">{en(org.name)}</span> ({org.abbreviation})
      </div>
    </footer>
  );
}
