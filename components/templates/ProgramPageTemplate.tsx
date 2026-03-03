import type { ProgramPage } from "@/lib/types";
import { renderSections } from "@/lib/section-renderer";
import PageHero from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import SidebarToc from "@/components/SidebarToc";
import PageSubtitle from "@/components/PageSubtitle";

interface ProgramPageTemplateProps {
  page: ProgramPage;
}

export default function ProgramPageTemplate({
  page,
}: ProgramPageTemplateProps) {
  const { groups, tocEntries } = renderSections(page.sections);

  // Add subtitle before sections if present
  const subtitleNode = page.subtitleJa ? (
    <div className="page-section">
      <PageSubtitle ja={page.subtitleJa} en={page.subtitleEn || ""} />
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
      titleJa={page.titleJa}
      titleEn={page.titleEn}
      descriptionJa={page.descriptionJa}
      descriptionEn={page.descriptionEn}
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
