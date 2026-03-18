import NextTopLoader from "nextjs-toploader";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#1e3a5f" height={3} showSpinner={false} />
      <a href="#main" className="skip-link">
        本文へスキップ / Skip to content
      </a>
      <SiteHeader />
      <SiteNavWrapper />
      {children}
    </>
  );
}
