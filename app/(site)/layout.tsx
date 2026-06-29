import NextTopLoader from "nextjs-toploader";
import SiteHeader from "@/components/SiteHeader";
import SiteNavWrapper from "@/components/SiteNavWrapper";
import styles from "./layout.module.css";

export const revalidate = 60;

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
    </>
  );
}
