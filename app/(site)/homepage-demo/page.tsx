import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { ja } from "@/lib/i18n";
import HomepageTemplate from "@/components/templates/HomepageTemplate";
import HomepageTemplateAbout from "@/components/templates/HomepageTemplateAbout";
import HomepageDemoSwitcher from "@/components/HomepageDemoSwitcher";

const VARIANTS: Record<string, { label: string; component: React.ComponentType }> = {
  a: { label: "案A: イベント", component: HomepageTemplate },
  b: { label: "案B: YIAについて", component: HomepageTemplateAbout },
};

const DEFAULT_VARIANT = "a";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  return {
    title: "HOME (デモ)",
    description: ja(data.site.org.description),
    openGraph: {
      title: `HOME デモ — ${ja(data.site.org.name)}`,
      description: ja(data.site.org.description),
    },
  };
}

export default async function HomepageDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const key = v && v in VARIANTS ? v : DEFAULT_VARIANT;
  const Variant = VARIANTS[key].component;

  const variantEntries = Object.entries(VARIANTS).map(([k, { label }]) => ({
    key: k,
    label,
  }));

  return (
    <>
      <Variant key={key} />
      <HomepageDemoSwitcher variants={variantEntries} current={key} />
    </>
  );
}
