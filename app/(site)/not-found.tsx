import type { Metadata } from "next";
import Link from "next/link";
import { SolidHero } from "@/components/PageHero";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SolidHero titleJa="ページが見つかりません" titleEn="Page Not Found" narrow />
      <main className="not-found" id="main">
        <div className="not-found__inner">
          <p className="not-found__code" aria-hidden="true">
            404
          </p>
          <h2 className="not-found__heading">お探しのページを表示できませんでした</h2>
          <p className="not-found__message">
            このウェブサイトは最近リニューアルされ、ページのアドレスが変更された可能性があります。
            ホームページから、目的の情報をお探しください。
          </p>
          <p className="not-found__message not-found__message--en" lang="en">
            This website was recently redesigned, and the page address may have changed.
          </p>
          <Link className="not-found__home-link" href="/">
            <span>ホームページへ戻る</span>
            <span className="not-found__home-link-en" lang="en">
              Return to Home
            </span>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
