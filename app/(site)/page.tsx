import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { ja } from "@/lib/i18n";
import { socialMetadata } from "@/lib/site-metadata";
import HomepageTemplateAbout from "@/components/templates/HomepageTemplateAbout";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  const description = ja(data.site.org.description);
  return {
    title: "HOME",
    description,
    ...socialMetadata({ title: "HOME", description, pathname: "/" }),
  };
}

export default function HomePage() {
  return <HomepageTemplateAbout />;
}
