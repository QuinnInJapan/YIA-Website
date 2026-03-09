import { draftMode } from "next/headers";
import { SanityLive } from "@/lib/sanity/live";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";
import VisualEditingInFrame from "@/components/VisualEditingInFrame";
import DraftModeBanner from "@/components/DraftModeBanner";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDraft = (await draftMode()).isEnabled;
  return (
    <>
      {isDraft && <DraftModeBanner />}
      <a href="#main" className="skip-link">
        本文へスキップ / Skip to content
      </a>
      <SiteHeader />
      <SiteNavWrapper />
      {children}
      <SanityLive />
      {isDraft && <VisualEditingInFrame />}
    </>
  );
}
