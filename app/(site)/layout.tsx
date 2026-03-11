import { draftMode } from "next/headers";
import NextTopLoader from "nextjs-toploader";
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
      <NextTopLoader color="#1e3a5f" height={3} showSpinner={false} />
      {isDraft && <DraftModeBanner />}
      <a href="#main" className="skip-link">
        本文へスキップ / Skip to content
      </a>
      <SiteHeader />
      <SiteNavWrapper />
      {children}
      {isDraft && <SanityLive />}
      {isDraft && <VisualEditingInFrame />}
    </>
  );
}
