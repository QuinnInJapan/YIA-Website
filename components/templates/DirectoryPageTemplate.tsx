import { getSiteData } from "@/lib/data";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import PageSubtitle from "@/components/PageSubtitle";
import DirectoryList from "@/components/DirectoryList";

export default async function DirectoryPageTemplate() {
  const { directoryPage: pg } = await getSiteData();

  const sectionHtml = (
    <div className="page-section">
      {pg.subtitle && <PageSubtitle ja={pg.subtitle} en="" />}
      <DirectoryList entries={pg.entries} />
    </div>
  );

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa={pg.titleJa} titleEn={pg.titleEn} />}
      sectionHtml={sectionHtml}
      mainClass="layout-directory"
    />
  );
}
