import { getEnrichedNavigation } from "@/lib/data";
import SiteNav from "./SiteNav";

export default async function SiteNavWrapper() {
  const nav = await getEnrichedNavigation();

  return <SiteNav categories={nav.categories} />;
}
