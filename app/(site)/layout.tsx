import { draftMode } from "next/headers";
import { SanityLive } from "@/lib/sanity/live";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";
import VisualEditingInFrame from "@/components/VisualEditingInFrame";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main" className="skip-link">
        本文へスキップ / Skip to content
      </a>
      <SiteHeader />
      <SiteNavWrapper />
      {children}
      <SanityLive />
      {(await draftMode()).isEnabled && <VisualEditingInFrame />}
    </>
  );
}
