import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSiteData,
  getProgramPage,
  getAllProgramSlugs,
} from "@/lib/data";
import ProgramPageTemplate from "@/components/templates/ProgramPageTemplate";
import AboutPageTemplate from "@/components/templates/AboutPageTemplate";
import MembershipPageTemplate from "@/components/templates/MembershipPageTemplate";
import DirectoryPageTemplate from "@/components/templates/DirectoryPageTemplate";
import AnnouncementsPageTemplate from "@/components/templates/AnnouncementsPageTemplate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const data = await getSiteData();
  const slugs: { slug: string }[] = [];

  // About page
  slugs.push({ slug: data.aboutPage.slug });
  // Membership page
  slugs.push({ slug: data.membershipPage.slug });
  // Directory page
  slugs.push({ slug: data.directoryPage.slug });
  // Announcements
  slugs.push({ slug: "announcements" });
  // All program pages
  for (const s of await getAllProgramSlugs()) {
    slugs.push({ slug: s });
  }

  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiteData();

  let title = "";
  let description = "";

  if (slug === data.aboutPage.slug) {
    title = data.aboutPage.titleJa;
    description = data.aboutPage.missionJa || "";
  } else if (slug === data.membershipPage.slug) {
    title = data.membershipPage.titleJa;
    description = data.membershipPage.descriptionJa || "";
  } else if (slug === data.directoryPage.slug) {
    title = data.directoryPage.titleJa;
    description = data.directoryPage.descriptionJa || "";
  } else if (slug === "announcements") {
    title = "お知らせ";
    description = "横須賀国際交流協会からのお知らせ一覧";
  } else {
    const pg = await getProgramPage(slug);
    if (pg) {
      title = pg.titleJa;
      description = pg.descriptionJa || "";
    }
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${data.site.org.nameJa}`,
      description,
    },
  };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getSiteData();

  if (slug === data.aboutPage.slug) {
    return <AboutPageTemplate />;
  }
  if (slug === data.membershipPage.slug) {
    return <MembershipPageTemplate />;
  }
  if (slug === data.directoryPage.slug) {
    return <DirectoryPageTemplate />;
  }
  if (slug === "announcements") {
    return <AnnouncementsPageTemplate />;
  }

  const pg = await getProgramPage(slug);
  if (pg) {
    return <ProgramPageTemplate page={pg} />;
  }

  notFound();
}
