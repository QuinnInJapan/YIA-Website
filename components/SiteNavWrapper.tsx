import { getEnrichedNavigation, getSiteData } from "@/lib/data";
import { fetchBlogPostCount } from "@/lib/sanity/queries";
import SiteNav from "./SiteNav";
import { ja, en } from "@/lib/i18n";

export default async function SiteNavWrapper() {
  const [nav, { site }, blogPostCount] = await Promise.all([
    getEnrichedNavigation(),
    getSiteData(),
    fetchBlogPostCount(),
  ]);

  return (
    <SiteNav
      categories={nav.categories}
      orgName={ja(site.org.name)}
      orgNameEn={en(site.org.name)}
      contact={{ tel: site.contact.tel, email: site.contact.email }}
      showBlog={(blogPostCount as number) > 0}
    />
  );
}
