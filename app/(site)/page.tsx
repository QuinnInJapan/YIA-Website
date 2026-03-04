import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { ja } from "@/lib/i18n";
import HomepageTemplate from "@/components/templates/HomepageTemplate";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  return {
    title: "HOME",
    description: ja(data.site.org.description),
    openGraph: {
      title: `HOME — ${ja(data.site.org.name)}`,
      description: ja(data.site.org.description),
    },
  };
}

export default function HomePage() {
  return <HomepageTemplate />;
}
