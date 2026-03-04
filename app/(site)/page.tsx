import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import HomepageTemplate from "@/components/templates/HomepageTemplate";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  return {
    title: "HOME",
    description: data.site.org.descriptionJa,
    openGraph: {
      title: `HOME — ${data.site.org.nameJa}`,
      description: data.site.org.descriptionJa,
    },
  };
}

export default function HomePage() {
  return <HomepageTemplate />;
}
