import SiteFooter from "./SiteFooter";
import type { Document } from "@/lib/types";

interface PageLayoutProps {
  heroHtml: React.ReactNode;
  tocHtml?: React.ReactNode;
  sectionHtml: React.ReactNode;
  mainClass?: string;
  footerOpts?: {
    documents?: Document[];
    hideContact?: boolean;
  };
}

export default function PageLayout({
  heroHtml,
  tocHtml,
  sectionHtml,
  mainClass = "ann-layout",
  footerOpts,
}: PageLayoutProps) {
  const hasToc = tocHtml != null && tocHtml !== false;
  const content = hasToc ? (
    <div className="ann-articles">{sectionHtml}</div>
  ) : (
    sectionHtml
  );

  return (
    <>
      {heroHtml}
      <main className={mainClass} id="main">
        {tocHtml !== undefined && tocHtml}
        {content}
      </main>
      <SiteFooter {...(footerOpts || {})} />
    </>
  );
}
