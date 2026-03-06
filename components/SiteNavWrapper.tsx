import { getEnrichedNavigation, getSiteData } from "@/lib/data";
import SiteNav from "./SiteNav";
import { ja, en } from "@/lib/i18n";

export default async function SiteNavWrapper() {
  const [nav, { site }] = await Promise.all([
    getEnrichedNavigation(),
    getSiteData(),
  ]);

  return (
    <SiteNav
      categories={nav.categories}
      orgName={ja(site.org.name)}
      orgNameEn={en(site.org.name)}
      contact={{ tel: site.contact.tel, email: site.contact.email }}
    />
  );
}
