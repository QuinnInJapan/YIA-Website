import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/lib/sanity/live";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";

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
      {(await draftMode()).isEnabled && <VisualEditing />}
    </>
  );
}
