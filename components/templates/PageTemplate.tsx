import type { Page } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import { renderSections } from "@/lib/section-renderer";
import PageHero from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import SidebarToc from "@/components/SidebarToc";
import PageSubtitle from "@/components/PageSubtitle";

interface PageTemplateProps {
  page: Page;
}

export default function PageTemplate({
  page,
}: PageTemplateProps) {
  const { groups, tocEntries } = renderSections(page.sections);

  // Add subtitle before sections if present
  const subtitleNode = ja(page.subtitle) ? (
    <div className="page-section">
      <PageSubtitle ja={ja(page.subtitle)} en={en(page.subtitle)} />
    </div>
  ) : null;

  const sectionHtml = (
    <>
      {subtitleNode}
      {groups}
    </>
  );

  const heroHtml = (
    <PageHero
      titleJa={ja(page.title)}
      titleEn={en(page.title)}
      description={page.description}
      images={page.images}
    />
  );

  const tocHtml =
    tocEntries.length >= 2 ? <SidebarToc entries={tocEntries} /> : null;

  return (
    <PageLayout
      heroHtml={heroHtml}
      tocHtml={tocHtml}
      sectionHtml={sectionHtml}
      mainClass={tocEntries.length >= 2 ? "ann-layout" : "layout-program"}
    />
  );
}
