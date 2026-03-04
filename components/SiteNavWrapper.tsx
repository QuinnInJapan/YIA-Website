import { getSiteData, getEnrichedNavigation } from "@/lib/data";
import SiteNav from "./SiteNav";

export default async function SiteNavWrapper() {
  const { globalResources } = await getSiteData();
  const nav = await getEnrichedNavigation();

  const handbook = (globalResources.resourceBoxes || []).find(
    (rb) => rb.id === "nihongo-handbook"
  );
  const handbookData = handbook
    ? {
        titleJa: handbook.titleJa,
        links: handbook.links.filter((l) => l.url),
      }
    : undefined;

  return <SiteNav categories={nav.categories} handbook={handbookData} />;
}
