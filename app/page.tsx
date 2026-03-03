import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import HomepageTemplate from "@/components/templates/HomepageTemplate";

export function generateMetadata(): Metadata {
  const data = getSiteData();
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
