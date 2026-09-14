import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";
import styles from "./layout.module.css";

// Refresh through the authenticated Sanity webhook, not on a timer.
export const revalidate = false;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#1e3a5f" height={3} showSpinner={false} />
      <a href="#main" className={styles.skipLink}>
        本文へスキップ / Skip to content
      </a>
      <SiteHeader />
      <SiteNavWrapper />
      {children}
      {/* Optional browser telemetry: page rendering never waits for collection. */}
      {process.env.VERCEL_ENV === "production" && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );
}
